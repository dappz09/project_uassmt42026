/**
 * RapidAPI YouTube Transcript API client.
 * 
 * API Docs (youtube-transcript-api by codetabs):
 * Endpoints:
 *   /download-json/{videoId}  → transcript JSON array
 *   /download-all/{videoId}   → all languages
 *   /language-list/{videoId}  → available languages
 *   /get-video-info/{videoId} → metadata (title, author, lengthSeconds, etc.)
 *
 * Response format for /download-json/{videoId}:
 *   [{ "start": "0.519", "dur": "1.311", "text": "subtitle text" }, ...]
 *
 * Response format for /get-video-info/{videoId}:
 *   { "title": "...", "author": "...", "lengthSeconds": "123", ... }
 */

export interface TranscriptItem {
  text: string
  start?: number
  duration?: number
}

export interface RapidAPIVideoInfo {
  title: string
  author?: string
  lengthSeconds?: number
  thumbnail?: string
  description?: string
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'youtube-transcript-api.p.rapidapi.com'

export function hasRapidAPI(): boolean {
  return !!RAPIDAPI_KEY
}

/** Build base URL for RapidAPI requests */
function baseUrl(): string {
  return `https://${RAPIDAPI_HOST}`
}

/** Common headers for RapidAPI */
function headers(): Record<string, string> {
  return {
    'X-RapidAPI-Key': RAPIDAPI_KEY!,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
  }
}

/**
 * Fetch video metadata via RapidAPI /get-video-info/{videoId}
 * This completely bypasses YouTube — no IP block possible.
 */
export async function fetchVideoInfoViaRapidAPI(videoId: string): Promise<RapidAPIVideoInfo | null> {
  if (!RAPIDAPI_KEY) return null

  const url = `${baseUrl()}/get-video-info/${videoId}`

  const res = await fetch(url, {
    method: 'GET',
    headers: headers(),
  })

  if (!res.ok) {
    if (res.status === 404) return null
    if (res.status === 403) return null // private/restricted video
    const body = await res.text().catch(() => '')
    throw new Error(`RapidAPI video-info error ${res.status}: ${body}`)
  }

  const data = await res.json()

  // Handle response_mode=url — need to fetch the actual data
  const actualData = await resolveResponseMode(data)

  return {
    title: actualData.title || '',
    author: actualData.author || actualData.ownerChannelName || '',
    lengthSeconds: parseInt(actualData.lengthSeconds || '0', 10) || 0,
    thumbnail: actualData.thumbnail?.[0]?.url || '',
    description: actualData.description || '',
  }
}

/**
 * Fetch transcript via RapidAPI /download-json/{videoId}
 * Strategy: try English first, then all languages.
 */
export async function fetchTranscriptViaRapidAPI(videoId: string): Promise<TranscriptItem[] | null> {
  if (!RAPIDAPI_KEY) return null

  // Try English transcript first
  try {
    const enResult = await fetchTranscriptByLanguage(videoId, 'en')
    if (enResult && enResult.length > 0) return enResult
  } catch {
    // English not available, try all
  }

  // Fallback: download all languages, pick first available
  try {
    const allResult = await fetchAllTranscripts(videoId)
    if (allResult && allResult.length > 0) return allResult
  } catch {
    // No transcripts available at all
  }

  return null
}

/**
 * Fetch transcript for a specific language via /download-json/{videoId}?language=xx
 */
async function fetchTranscriptByLanguage(videoId: string, lang: string): Promise<TranscriptItem[] | null> {
  const url = `${baseUrl()}/download-json/${videoId}?language=${lang}`

  const res = await fetch(url, {
    method: 'GET',
    headers: headers(),
  })

  if (!res.ok) {
    if (res.status === 404) return null
    if (res.status === 403) return null
    const body = await res.text().catch(() => '')
    throw new Error(`RapidAPI transcript error ${res.status}: ${body}`)
  }

  const data = await res.json()

  // Handle response_mode=url
  const actualData = await resolveResponseMode(data)

  return normalizeTranscript(actualData)
}

/**
 * Fetch all available transcripts via /download-all/{videoId}
 * Returns the first available language's transcript.
 */
async function fetchAllTranscripts(videoId: string): Promise<TranscriptItem[] | null> {
  const url = `${baseUrl()}/download-all/${videoId}`

  const res = await fetch(url, {
    method: 'GET',
    headers: headers(),
  })

  if (!res.ok) {
    if (res.status === 404) return null
    if (res.status === 403) return null
    return null
  }

  const data = await res.json()

  // Handle response_mode=url
  const actualData = await resolveResponseMode(data)

  if (!Array.isArray(actualData) || actualData.length === 0) return null

  // Pick first language that has subtitles, prefer English
  let englishSub = null
  let firstSub = null

  for (const langEntry of actualData) {
    if (langEntry.subtitle && Array.isArray(langEntry.subtitle) && langEntry.subtitle.length > 0) {
      if (!firstSub) firstSub = langEntry.subtitle
      if (langEntry.languageCode === 'en') englishSub = langEntry.subtitle
    }
  }

  const chosen = englishSub || firstSub
  if (!chosen) return null

  return normalizeTranscript(chosen)
}

/**
 * Normalize transcript data from various RapidAPI response formats.
 */
function normalizeTranscript(data: any): TranscriptItem[] | null {
  if (!data) return null

  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      text: item.text || '',
      start: typeof item.start === 'string' ? parseFloat(item.start) : item.start,
      duration: typeof item.dur === 'string' ? parseFloat(item.dur) : (item.duration || item.dur),
    }))
  }

  return null
}

/**
 * Handle RapidAPI's response_mode=url feature.
 * If the response contains a URL instead of data, fetch the actual data.
 */
async function resolveResponseMode(data: any): Promise<any> {
  if (data && typeof data === 'object' && data.url && data.status === 'processed') {
    const urlRes = await fetch(data.url)
    if (urlRes.ok) {
      return await urlRes.json()
    }
  }
  return data
}