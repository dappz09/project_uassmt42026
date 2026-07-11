import { streamText } from 'ai'
import { openai, createOpenAI } from '@ai-sdk/openai'
import { YoutubeTranscript } from 'youtube-transcript'
import { auth } from '@/lib/auth'
import { checkUserLimit } from '@/lib/limits'
import { prisma } from '@/lib/prisma'

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
    
    const hasLimit = await checkUserLimit(session.user.id)
    if (!hasLimit) {
      return new Response('Limit habis', { status: 403 })
    }

    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return new Response('URL YouTube tidak valid', { status: 400 })
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

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
      .catch(() => null)

    if (!transcript || transcript.length === 0) {
      return new Response('Video tidak memiliki subtitle', { status: 400 })
    }

    const transcriptText = transcript.map(item => item.text).join(' ')

    const result = streamText({
      model,
      system: 'Kamu adalah asisten. Ubah transkrip YouTube ini menjadi catatan terstruktur dengan bullet point. Gunakan bahasa yang sama dengan transkrip.',
      prompt: transcriptText,
      onError: ({ error }) => {
        console.error('[streamText error]', error)
      },
      onFinish: async ({ text }) => {
        try {
          await prisma.note.create({
            data: {
              userId: session.user.id,
              title: `Rangkuman Video ${videoId}`,
              content: text,
              videoId: videoId,
              videoUrl: url,
            }
          })
        } catch (e) {
          console.error('Failed to save note:', e)
        }
      }
    })

    await prisma.usageRecord.create({
      data: { userId: session.user.id, action: 'summarize' },
    })

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('[UIMessageStream error]', error)
        // Kembalikan pesan error yang informatif ke client
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