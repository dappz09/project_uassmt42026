import { Innertube, UniversalCache } from 'youtubei.js'
import { getProxiedFetch, withProxiedFetch, hasProxy } from '@/lib/proxy'

export interface VideoMetadata {
  videoId: string
  title: string
  durationSeconds: number
  author?: string
  thumbnail?: string
}

/**
 * Ambil metadata video YouTube dengan multiple fallback strategies.
 * Strategy 1: oEmbed (ringan, jarang diblokir, tapi tidak ada durasi)
 * Strategy 2: youtubei.js dengan proxy (jika dikonfigurasi)
 * Strategy 3: youtubei.js tanpa proxy (mungkin gagal di datacenter IP)
 */
export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const errors: string[] = []

  // Strategy 1: oEmbed — dapat title & author, TIDAK ada durasi
  try {
    const oembedData = await fetchOEmbed(videoId)
    if (oembedData) {
      // Coba dapat durasi dari youtubei.js dengan proxy
      let durationSeconds = 0
      try {
        durationSeconds = await fetchDurationViaInnertube(videoId)
      } catch (e) {
        errors.push(`Innertube duration: ${(e as Error).message}`)
      }

      return {
        videoId,
        title: oembedData.title,
        author: oembedData.author_name,
        thumbnail: oembedData.thumbnail_url,
        durationSeconds,
      }
    }
  } catch (e) {
    errors.push(`oEmbed: ${(e as Error).message}`)
  }

  // Strategy 2 & 3: youtubei.js (dengan atau tanpa proxy)
  try {
    return await fetchMetadataViaInnertube(videoId)
  } catch (e) {
    errors.push(`Innertube: ${(e as Error).message}`)
  }

  throw new Error(
    `Gagal mendapatkan metadata video. ` +
    `Kemungkinan IP server diblokir YouTube (429/bot detection). ` +
    `Konfigurasi YOUTUBE_PROXY_URL di environment variables. ` +
    `Detail: ${errors.join('; ')}`
  )
}

async function fetchOEmbed(videoId: string): Promise<{
  title: string
  author_name: string
  thumbnail_url: string
} | null> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

  const fetchFn = hasProxy() ? getProxiedFetch() : globalThis.fetch
  const res = await fetchFn(oembedUrl)

  if (!res.ok) {
    throw new Error(`oEmbed returned ${res.status}`)
  }

  const data = await res.json()
  if (!data?.title) return null

  return {
    title: data.title,
    author_name: data.author_name || '',
    thumbnail_url: data.thumbnail_url || '',
  }
}

async function fetchDurationViaInnertube(videoId: string): Promise<number> {
  const yt = await createInnertube()
  const info = await yt.getBasicInfo(videoId)
  return info.basic_info.duration || 0
}

async function fetchMetadataViaInnertube(videoId: string): Promise<VideoMetadata> {
  const yt = await createInnertube()
  const info = await yt.getBasicInfo(videoId)

  const duration = info.basic_info.duration || 0
  const title = info.basic_info.title || `Video ${videoId}`

  if (!duration) {
    // Jika duration 0, kemungkinan video unavailable / diblokir
    throw new Error('Video unavailable atau metadata tidak lengkap (kemungkinan IP diblokir)')
  }

  return {
    videoId,
    title,
    durationSeconds: duration,
    author: info.basic_info.author,
  }
}

async function createInnertube(): Promise<Innertube> {
  return Innertube.create({
    cache: new UniversalCache(false),
    ...(hasProxy() ? { fetch: getProxiedFetch() } : {}),
  })
}

/**
 * Fetch transcript dengan proxy support dan fallback.
 */
export async function fetchTranscript(videoId: string): Promise<Array<{ text: string }> | null> {
  const { YoutubeTranscript } = await import('youtube-transcript')

  return withProxiedFetch(() =>
    YoutubeTranscript.fetchTranscript(videoId)
  ).catch(() => null)
}