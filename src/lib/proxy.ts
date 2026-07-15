import { ProxyAgent, fetch as undiciFetch } from 'undici'
import { HttpsProxyAgent } from 'https-proxy-agent'

const PROXY_URL = process.env.YOUTUBE_PROXY_URL

let _dispatcher: ProxyAgent | null = null
let _httpsAgent: HttpsProxyAgent<string> | null = null

export function hasProxy(): boolean {
  return !!PROXY_URL
}

export function getProxyUrl(): string | null {
  return PROXY_URL ?? null
}

/**
 * undici ProxyAgent — untuk library berbasis fetch (youtubei.js, youtube-transcript)
 */
export function getProxyDispatcher(): ProxyAgent | null {
  if (!PROXY_URL) return null
  if (!_dispatcher) {
    _dispatcher = new ProxyAgent(PROXY_URL)
  }
  return _dispatcher
}

/**
 * https-proxy-agent — untuk library berbasis http/https (ytdl-core)
 */
export function getHttpsProxyAgent(): HttpsProxyAgent<string> | null {
  if (!PROXY_URL) return null
  if (!_httpsAgent) {
    _httpsAgent = new HttpsProxyAgent(PROXY_URL)
  }
  return _httpsAgent
}

/**
 * Return fetch function yang melewati proxy.
 * Jika tidak ada proxy configured, return globalThis.fetch.
 */
export function getProxiedFetch(): typeof globalThis.fetch {
  const dispatcher = getProxyDispatcher()
  if (!dispatcher) return globalThis.fetch

  return (async (input: any, init?: any) => {
    return undiciFetch(input, { ...init, dispatcher }) as unknown as Promise<Response>
  }) as typeof globalThis.fetch
}

/**
 * Sementara override globalThis.fetch dengan versi proxied.
 * Berguna untuk library yang memakai globalThis.fetch secara internal (youtube-transcript).
 */
export async function withProxiedFetch<T>(fn: () => Promise<T>): Promise<T> {
  const dispatcher = getProxyDispatcher()
  if (!dispatcher) return fn()

  const original = globalThis.fetch
  globalThis.fetch = getProxiedFetch()
  try {
    return await fn()
  } finally {
    globalThis.fetch = original
  }
}