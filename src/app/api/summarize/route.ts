import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { auth } from '@/lib/auth'
import { getRemainingLimit, consumeLimit } from '@/lib/limits'
import { prisma } from '@/lib/prisma'
import { processYouTubeAudio } from '@/lib/gemini-audio'
import { getVideoMetadata, fetchTranscript } from '@/lib/youtube-metadata'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages } = await req.json()
    const lastMessage = messages?.[messages.length - 1]
    // SDK v7 mengirim parts[], SDK v3 mengirim content string
    const url = (
      lastMessage?.parts?.find((p: any) => p.type === 'text')?.text ||
      lastMessage?.content ||
      ''
    ).trim()

    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return new Response('URL YouTube tidak valid', { status: 400 })
    }

    // 1. Dapatkan metadata video (multi-strategy: oEmbed → Innertube)
    let durationSeconds = 0
    let videoTitle = `Rangkuman Video ${videoId}`
    try {
      const metadata = await getVideoMetadata(videoId)
      durationSeconds = metadata.durationSeconds
      videoTitle = metadata.title || videoTitle
    } catch (error: any) {
      console.error('Metadata fetch error:', error)
      return new Response(
        error?.message ||
        'Gagal mendapatkan metadata video YouTube. Pastikan video publik. ' +
        'Jika masalah berkelanjutan di server hosting, kemungkinan IP diblokir YouTube (429/bot detection). ' +
        'Konfigurasi YOUTUBE_PROXY_URL di environment variables.',
        { status: 400 }
      )
    }
    const durationMinutes = durationSeconds / 60
    // Jika durasi 0 (oEmbed berhasil tapi Innertube gagal), gunakan multiplier minimum
    const multiplier = durationSeconds > 0
      ? Math.max(1, Math.ceil(durationMinutes / 60))
      : 1

    // 2. Cek ketersediaan Subtitle (lewati proxy untuk bypass IP block)
    const transcript = await fetchTranscript(videoId)
    const hasSubtitle = transcript && transcript.length > 0

    // 3. Kalkulasi Biaya (Cost) Token
    const cost = hasSubtitle ? (1 * multiplier) : (5 * multiplier)

    // 4. Pengecekan Limit (Token)
    const remainingLimit = await getRemainingLimit(session.user.id)
    if (remainingLimit !== 'unlimited' && remainingLimit < cost) {
      return new Response(`Proses ini membutuhkan ${cost} Token (Durasi: ${durationSeconds > 0 ? Math.ceil(durationMinutes) : '?'} menit, Subtitle: ${hasSubtitle ? 'Ada' : 'TIDAK Ada'}). Sisa Token Anda: ${remainingLimit}.`, { status: 403 })
    }

    // Ambil plan pengguna aktif untuk membaca AiModel yang dipakai
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

    // Konfigurasi baseURL berdasarkan provider (OpenRouter, Groq, dll.)
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
      // Fallback untuk provider lain yang mungkin kompatibel dengan OpenAI
      compatibility = 'compatible'
    }

    const customOpenAI = createOpenAI({ apiKey, baseURL })

    // OpenRouter/Groq hanya mendukung Chat Completions API, bukan Responses API
    const useChat = provider.toLowerCase() !== 'openai'
    const model = useChat
      ? customOpenAI.chat(modelName)
      : customOpenAI(modelName)

    if (!hasSubtitle) {
      // FALLBACK: Ekstraksi Audio Gemini 2.5
      // Cari API Key Google di database
      const googleModel = await prisma.aiModel.findFirst({
        where: {
          provider: {
            contains: 'google',
            mode: 'insensitive'
          },
          isActive: true
        }
      })
      if (!googleModel) {
        return new Response('Video tidak memiliki subtitle dan Admin belum mengonfigurasi API Google Gemini untuk pendengaran otomatis.', { status: 400 })
      }

      const audioResult = await processYouTubeAudio(videoId, googleModel.apiKey, async (text) => {
        try {
          await prisma.note.create({
            data: {
              userId: session.user.id,
              title: audioResult.title,
              content: text,
              videoId: videoId,
              videoUrl: url,
            }
          })
          // Potong limit
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
    }

    // NORMAL PROCESS: Proses Teks Transcript (Seperti biasa)

    const transcriptText = transcript.map((item: { text: string }) => item.text).join(' ')

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
              videoId: videoId,
              videoUrl: url,
            }
          })
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
    return new Response(error?.message || 'Internal server error', { status: 500 })
  }
}

function extractYouTubeId(url: string): string | null {
  const cleanUrl = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?\s#]+)/,
  ]
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern)
    if (match) return match[1]
  }
  return null
}