import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { auth } from '@/lib/auth'
import { getRemainingLimit, consumeLimit } from '@/lib/limits'
import { prisma } from '@/lib/prisma'
import { processYouTubeAudio } from '@/lib/gemini-audio'
import { getVideoMetadata, fetchTranscript } from '@/lib/youtube-metadata'
import { hasRapidAPI } from '@/lib/transcript-api'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages } = await req.json()
    const lastMessage = messages?.[messages.length - 1]
    const url = (
      lastMessage?.parts?.find((p: any) => p.type === 'text')?.text ||
      lastMessage?.content ||
      ''
    ).trim()

    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return new Response('URL YouTube tidak valid', { status: 400 })
    }

    // ============================================================
    // STEP 0: Cek cache — jika video sudah pernah dirangkum, langsung pakai
    // Hemat RapidAPI call + AI token
    // ============================================================
    const cached = await prisma.videoSummary.findUnique({ where: { videoId } })
    if (cached) {
      // Simpan ke Note user (agar muncul di riwayat)
      await prisma.note.create({
        data: {
          userId: session.user.id,
          title: cached.title,
          content: cached.summaryText,
          videoId,
          videoUrl: url,
        }
      }).catch(() => {}) // Ignore duplicate note error

      // Return cached summary sebagai UI Message Stream (format SSE yang sama dengan streamText)
      const encoder = new TextEncoder()
      const sseStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start-step' })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-start', id: '0' })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', id: '0', delta: cached.summaryText })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-end', id: '0' })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish-step' })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`))
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        }
      })

      return new Response(sseStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Vercel-AI-UI-Message-Stream': 'v1',
          'X-Accel-Buffering': 'no'
        },
      })
    }

    // ============================================================
    // STEP 1: Dapatkan metadata video (RapidAPI → oEmbed)
    // ============================================================
    let durationSeconds = 0
    let videoTitle = `Rangkuman Video ${videoId}`
    try {
      const metadata = await getVideoMetadata(videoId)
      durationSeconds = metadata.durationSeconds
      videoTitle = metadata.title || videoTitle
    } catch (error: any) {
      const msg = error?.message || ''
      if (isBotDetectionError(msg)) {
        return new Response(
          'YouTube mendeteksi server ini sebagai bot. ' +
          'Solusi: Set RAPIDAPI_KEY di environment variables (daftar gratis di RapidAPI.com, cari "YouTube Transcript API"). ' +
          'Detail: ' + msg,
          { status: 400 }
        )
      }
      return new Response(
        msg || 'Gagal mendapatkan metadata video. Pastikan video publik.',
        { status: 400 }
      )
    }
    const durationMinutes = durationSeconds / 60
    const multiplier = durationSeconds > 0
      ? Math.max(1, Math.ceil(durationMinutes / 60))
      : 1

    // ============================================================
    // STEP 2: Dapatkan transcript (RapidAPI → youtube-transcript + proxy)
    // ============================================================
    let transcript: Array<{ text: string }> | null = null
    try {
      transcript = await fetchTranscript(videoId)
    } catch (error: any) {
      const msg = error?.message || ''
      if (isBotDetectionError(msg)) {
        return new Response(
          'YouTube mendeteksi server ini sebagai bot saat mengambil transcript. ' +
          'Solusi: Set RAPIDAPI_KEY di environment variables (daftar gratis di RapidAPI.com).',
          { status: 400 }
        )
      }
      // Log tapi jangan crash — transcript bisa null (video tanpa subtitle)
      console.error('Transcript fetch error:', msg)
    }

    const hasSubtitle = transcript && transcript.length > 0

    // Jika tidak ada subtitle:
    // - Dengan RapidAPI → video ini tidak punya subtitle di RapidAPI, tolak dengan pesan jelas
    // - Tanpa RapidAPI → audio fallback (hanya jika proxy dikonfigurasi)
    if (!hasSubtitle) {
      if (hasRapidAPI()) {
        return new Response(
          'Video ini tidak memiliki subtitle/closed caption. ' +
          'Saat ini hanya video dengan subtitle yang bisa dirangkum. ' +
          'Coba video lain yang memiliki subtitle (CC).',
          { status: 400 }
        )
      }
      if (!process.env.YOUTUBE_PROXY_URL) {
        return new Response(
          'Video ini tidak memiliki subtitle, dan server tidak dapat mengunduh audio karena YouTube mendeteksi bot. ' +
          'Solusi: Set RAPIDAPI_KEY atau YOUTUBE_PROXY_URL di environment variables.',
          { status: 400 }
        )
      }
    }

    // ============================================================
    // STEP 3: Kalkulasi biaya & cek limit
    // ============================================================
    const cost = hasSubtitle ? (1 * multiplier) : (5 * multiplier)

    const remainingLimit = await getRemainingLimit(session.user.id)
    if (remainingLimit !== 'unlimited' && remainingLimit < cost) {
      return new Response(
        `Proses ini membutuhkan ${cost} Token (Durasi: ${durationSeconds > 0 ? Math.ceil(durationMinutes) : '?'} menit, Subtitle: ${hasSubtitle ? 'Ada' : 'TIDAK Ada'}). Sisa Token Anda: ${remainingLimit}.`,
        { status: 403 }
      )
    }

    // ============================================================
    // STEP 4: Dapatkan AI Model dari plan user
    // ============================================================
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    })

    const planType = (user?.subscription?.status === 'active' && user?.subscription?.plan)
      ? user.subscription.plan
      : 'Free'

    const activePlan = await prisma.plan.findFirst({
      where: { type: planType, isActive: true },
      include: { aiModel: true }
    })

    if (!activePlan || !activePlan.aiModel) {
      return new Response('Paket ini belum memiliki konfigurasi Model AI. Hubungi admin.', { status: 400 })
    }

    const { provider, apiKey, name: modelName } = activePlan.aiModel

    let baseURL: string | undefined = undefined
    let compatibility: 'strict' | 'compatible' = 'strict'

    if (provider.toLowerCase() === 'openrouter') {
      baseURL = 'https://openrouter.ai/api/v1'
      compatibility = 'compatible'
    } else if (provider.toLowerCase() === 'groq') {
      baseURL = 'https://api.groq.com/openai/v1'
      compatibility = 'compatible'
    } else if (provider.toLowerCase() === 'google') {
      baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/'
      compatibility = 'compatible'
    } else if (provider.toLowerCase() !== 'openai') {
      compatibility = 'compatible'
    }

    const customOpenAI = createOpenAI({ apiKey, baseURL })
    const useChat = provider.toLowerCase() !== 'openai'
    const model = useChat
      ? customOpenAI.chat(modelName)
      : customOpenAI(modelName)

    // ============================================================
    // STEP 5A: Audio fallback (tanpa subtitle) — butuh proxy
    // ============================================================
    if (!hasSubtitle) {
      const googleModel = await prisma.aiModel.findFirst({
        where: {
          provider: { contains: 'google', mode: 'insensitive' },
          isActive: true
        }
      })
      if (!googleModel) {
        return new Response('Video tidak memiliki subtitle dan Admin belum mengonfigurasi API Google Gemini.', { status: 400 })
      }

      try {
        const audioResult = await processYouTubeAudio(videoId, googleModel.apiKey, async (text) => {
          try {
            await prisma.note.create({
              data: {
                userId: session.user.id,
                title: audioResult.title,
                content: text,
                videoId,
                videoUrl: url,
              }
            })
            await consumeLimit(session.user.id, cost, 'summarize_audio')
          } catch (e) {
            console.error('Failed to save note:', e)
          }
        })

        return audioResult.stream.toUIMessageStreamResponse({
          onError: (error) => {
            console.error('[UIMessageStream error]', error)
            return error instanceof Error ? error.message : String(error)
          }
        })
      } catch (audioError: any) {
        const msg = audioError?.message || ''
        if (isBotDetectionError(msg)) {
          return new Response(
            'YouTube mendeteksi server ini sebagai bot saat mengunduh audio. ' +
            'Solusi: Set YOUTUBE_PROXY_URL di environment variables untuk bypass.',
            { status: 400 }
          )
        }
        return new Response(msg || 'Gagal memproses audio video', { status: 500 })
      }
    }

    // ============================================================
    // STEP 5B: Text transcript (ada subtitle) — normal process
    // ============================================================
    const transcriptText = transcript!.map((item: { text: string }) => item.text).join(' ')

    const result = streamText({
      model,
      system: 'Kamu adalah asisten ahli pembuat rangkuman. Tugasmu adalah mengubah transkrip YouTube ini menjadi catatan terstruktur dengan bullet point. PENTING: Hasil catatan dan rangkuman HARUS selalu menggunakan Bahasa Indonesia yang baik dan mudah dipahami, tidak peduli apapun bahasa asli dari transkrip tersebut (misalnya Inggris, Jepang, dll).',
      prompt: transcriptText,
      onError: ({ error }) => {
        console.error('[streamText error]', error)
      },
      onFinish: async ({ text }) => {
        try {
          await prisma.note.create({
            data: {
              userId: session.user.id,
              title: videoTitle,
              content: text,
              videoId,
              videoUrl: url,
            }
          })
          // Simpan ke cache VideoSummary (global, per videoId)
          await prisma.videoSummary.upsert({
            where: { videoId },
            update: {
              summaryText: text,
              transcriptText,
              title: videoTitle,
              durationSeconds,
            },
            create: {
              videoId,
              title: videoTitle,
              summaryText: text,
              transcriptText,
              durationSeconds,
            }
          }).catch(() => {}) // Ignore upsert error
          await consumeLimit(session.user.id, cost, 'summarize_text')
        } catch (e) {
          console.error('Failed to save note:', e)
        }
      }
    })

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('[UIMessageStream error]', error)
        return error instanceof Error ? error.message : String(error)
      }
    })
  } catch (error: any) {
    console.error('Summarize error:', error)
    const msg = error?.message || 'Internal server error'
    if (isBotDetectionError(msg)) {
      return new Response(
        'YouTube mendeteksi server ini sebagai bot. Set RAPIDAPI_KEY di environment variables untuk bypass. Daftar gratis di RapidAPI.com.',
        { status: 400 }
      )
    }
    return new Response(msg, { status: 500 })
  }
}

function isBotDetectionError(msg: string): boolean {
  const botSignals = [
    'sign in to confirm',
    'not a bot',
    'bot detection',
    'captcha',
    '429',
    'video unavailable',
    'age-restricted',
    'private video',
    'members-only',
  ]
  const lower = msg.toLowerCase()
  return botSignals.some(s => lower.includes(s))
}

function extractYouTubeId(url: string): string | null {
  const cleanUrl = url.trim()
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?\s#]+)/,
  ]
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern)
    if (match) return match[1]
  }
  return null
}