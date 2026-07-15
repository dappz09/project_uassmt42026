/**
 * RapidAPI YouTube Transcript API client.
 *
 * Provider populer di RapidAPI:
 * - "youtube-transcript-api" by joshibharat (endpoint: youtube-transcript-api.p.rapidapi.com)
 * - "youtube-transcript1" by codetabs
 *
 * Strategi: Jika RAPIDAPI_KEY di-set, gunakan RapidAPI (production, no IP block).
 * Jika tidak, fallback ke youtube-transcript npm package (development only).
 */

export interface TranscriptItem {
  text: string
  start?: number
  duration?: number
}

export interface TranscriptResult {
  transcript: TranscriptItem[] | null
  source: 'rapidapi' | 'youtube-transcript' | 'none'
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'youtube-transcript-api.p.rapidapi.com'

export function hasRapidAPI(): boolean {
  return !!RAPIDAPI_KEY
}

/**
 * Fetch transcript via RapidAPI — bypass IP block completely.
 * Request datang dari server RapidAPI, bukan IP hosting kita.
 */
export async function fetchTranscriptViaRapidAPI(videoId: string): Promise<TranscriptItem[] | null> {
  if (!RAPIDAPI_KEY) return null

  const url = `https://${RAPIDAPI_HOST}/youtube/transcript?video_id=${videoId}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  })

  if (!res.ok) {
    if (res.status === 404) return null
    const body = await res.text().catch(() => '')
    throw new Error(`RapidAPI transcript error ${res.status}: ${body}`)
  }

  const data = await res.json()

  // Format response bervariasi tergantung provider, normalisasi
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      text: item.text || '',
      start: item.start,
      duration: item.duration,
    }))
  }

  // Beberapa provider membungkus dalam { transcript: [...] }
  if (data?.transcript && Array.isArray(data.transcript)) {
    return data.transcript.map((item: any) => ({
      text: item.text || '',
      start: item.start,
      duration: item.duration,
    }))
  }

  // Beberapa provider return string plain
  if (typeof data === 'string') {
    return [{ text: data }]
  }

  return null
}