import { Innertube, UniversalCache } from 'youtubei.js'
import { getProxiedFetch, withProxiedFetch, hasProxy } from '@/lib/proxy'
import { fetchTranscriptViaRapidAPI, fetchVideoInfoViaRapidAPI, hasRapidAPI } from '@/lib/transcript-api'

export interface VideoMetadata {
  videoId: string
  title: string
  durationSeconds: number
  author?: string
  thumbnail?: string
}

/**
 * STRATEGY:
 * 
 * Jika RAPIDAPI_KEY diset → HANYA gunakan RapidAPI + oEmbed.
 *   TIDAK PERNAH akses YouTube langsung → tidak mungkin kena bot detection.
 * 
 * Jika RAPIDAPI_KEY kosong → gunakan semua metode (development only).
 */
export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const errors: string[] = []

  // ── PRODUCTION PATH: RapidAPI first, oEmbed fallback ──
  if (hasRapidAPI()) {
    // Strategy 1: RapidAPI /get-video-info → 100% bypass YouTube
    try {
      const info = await fetchVideoInfoViaRapidAPI(videoId)
      if (info && info.title) {
        return {
          videoId,
          title: info.title,
          durationSeconds: info.lengthSeconds || 0,
          author: info.author,
          thumbnail: info.thumbnail,
        }
      }
    } catch (e) {
      errors.push(`RapidAPI: ${(e as Error).message}`)
    }

    // Strategy 2: oEmbed → dapat title & author (tidak kena block)
    try {
      const oembedData = await fetchOEmbed(videoId)
      if (oembedData) {
        return {
          videoId,
          title: oembedData.title,
          author: oembedData.author_name,
          thumbnail: oembedData.thumbnail_url,
          durationSeconds: 0, // oEmbed tidak punya durasi
        }
      }
    } catch (e) {
      errors.push(`oEmbed: ${(e as Error).message}`)
    }

    // JANGAN fallback ke Innertube — pasti kena bot detection dari IP Railway
    throw new Error(
      `Gagal mendapatkan metadata via RapidAPI & oEmbed. ` +
      `Pastikan RAPIDAPI_KEY dan RAPIDAPI_HOST benar. ` +
      `Detail: ${errors.join('; ')}`
    )
  }

  // ── DEVELOPMENT PATH: tanpa RapidAPI ──
  // oEmbed first (paling aman)
  try {
    const oembedData = await fetchOEmbed(videoId)
    if (oembedData) {
      let durationSeconds = 0
      try {
        durationSeconds = await fetchDurationViaInnertube(videoId)
      } catch {
        // OK, durasi boleh 0 di development
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

  // Innertube (mungkin kena block di datacenter IP)
  try {
    return await fetchMetadataViaInnertube(videoId)
  } catch (e) {
    errors.push(`Innertube: ${(e as Error).message}`)
  }

  throw new Error(
    `Gagal mendapatkan metadata. RAPIDAPI_KEY belum diset — wajib untuk production. ` +
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
    throw new Error('Video unavailable atau metadata tidak lengkap')
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
 * Fetch transcript:
 * Jika RAPIDAPI_KEY diset → HANYA RapidAPI (tidak akses YouTube)
 * Jika tidak → youtube-transcript npm + proxy
 */
export async function fetchTranscript(videoId: string): Promise<Array<{ text: string }> | null> {
  // ── PRODUCTION PATH ──
  if (hasRapidAPI()) {
    try {
      const rapidResult = await fetchTranscriptViaRapidAPI(videoId)
      if (rapidResult && rapidResult.length > 0) {
        return rapidResult
      }
    } catch (e) {
      console.error('RapidAPI transcript failed:', (e as Error).message)
    }
    // JANGAN fallback ke youtube-transcript — akan kena bot detection
    return null
  }

  // ── DEVELOPMENT PATH ──
  const { YoutubeTranscript } = await import('youtube-transcript')
  return withProxiedFetch(() =>
    YoutubeTranscript.fetchTranscript(videoId)
  ).catch(() => null)
}