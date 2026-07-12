import ytdl from '@distube/ytdl-core'
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'

export async function processYouTubeAudio(videoId: string, apiKey: string, onFinishCallback?: (text: string) => Promise<void>) {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`
    
    // Download audio info
    const info = await ytdl.getInfo(url)
    
    // Find the best audio-only format
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
    if (!format) {
      throw new Error('Tidak dapat menemukan format audio untuk video ini')
    }

    // Download audio as stream and convert to base64
    const audioStream = ytdl(url, { format })
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
