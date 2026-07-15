import ytdl from '@distube/ytdl-core'
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { getProxyDispatcher } from '@/lib/proxy'

export async function processYouTubeAudio(videoId: string, apiKey: string, onFinishCallback?: (text: string) => Promise<void>) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`

    const dispatcher = getProxyDispatcher()
    const cookie = process.env.YOUTUBE_COOKIE

    const requestOptions: any = {}
    if (dispatcher) requestOptions.dispatcher = dispatcher
    if (cookie) {
      requestOptions.headers = {
        cookie,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      }
    }

    // Download audio info
    const info = await ytdl.getInfo(url, { requestOptions })

    // Find the best audio-only format
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
    if (!format) {
      throw new Error('Tidak dapat menemukan format audio untuk video ini')
    }

    // Download audio as stream and convert to base64
    const audioStream = ytdl(url, { format, requestOptions })
    const chunks: Buffer[] = []
    
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk))
    }
    
    const audioBuffer = Buffer.concat(chunks)
    const base64Audio = audioBuffer.toString('base64')
    
    // Konfigurasi Gemini provider dengan API Key dinamis
    const geminiProvider = google.bind({ apiKey })

    // Memanggil Gemini 2.5 Flash
    // Di Vercel AI SDK, kita bisa memberikan mimetype dan data base64 ke file part
    const result = streamText({
      model: geminiProvider('gemini-2.5-flash'),
      system: 'Kamu adalah asisten ahli pembuat rangkuman. Tugasmu adalah mendengarkan audio ini dan mengubahnya menjadi catatan terstruktur dengan bullet point. PENTING: Hasil catatan dan rangkuman HARUS selalu menggunakan Bahasa Indonesia yang baik dan mudah dipahami, tidak peduli apapun bahasa asli dari audio tersebut (misalnya Inggris, Jepang, dll).',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Tolong dengarkan dan buatkan rangkuman dari audio ini:'
            },
            {
              type: 'file',
              data: base64Audio,
              mediaType: format.mimeType?.split(';')[0] || 'audio/mp4'
            }
          ]
        }
      ],
      onFinish: async ({ text }) => {
        if (onFinishCallback) {
          await onFinishCallback(text)
        }
      }
    })

    return { stream: result, title: info.videoDetails.title }

  } catch (error: any) {
    console.error('Audio processing error:', error)
    throw new Error(error.message || 'Gagal memproses audio video')
  }
}