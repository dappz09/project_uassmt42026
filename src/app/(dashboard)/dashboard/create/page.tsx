'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Sparkles, Copy, Check } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CreateNotePage() {
  const [url, setUrl] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/summarize' }),
    []
  )

  const { messages, status, sendMessage, error } = useChat({ transport })
  const router = useRouter()

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('limit') || msg.includes('403')) {
        toast.error('Batas Kuota Tercapai!', {
          description: 'Kuota ringkasan video Anda bulan ini sudah habis.',
          action: {
            label: 'Upgrade Pro',
            onClick: () => router.push('/dashboard/pricing')
          },
          duration: 8000,
        })
      } else {
        toast.error('Gagal meringkas video', {
          description: error.message
        })
      }
    }
  }, [error, router])

  const getYoutubeVideoId = (link: string) => {
    if (!link) return null
    const clean = link.trim()
    const match = clean.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?\s#\/]+)/
    )
    return match ? match[1] : null
  }

  const videoId = getYoutubeVideoId(url)

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoId || isLoading) return
    sendMessage({ text: url })
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Teks berhasil disalin!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Hanya tampilkan pesan dari assistant (bukan pesan user yang berisi URL)
  const assistantMessages = messages.filter(m => m.role === 'assistant')

  return (
    <div className="p-6 w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex flex-col"
      >
        <div className="w-full p-8 rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-2xl backdrop-blur-xl mb-6">
          <div className="mb-8 flex flex-col">
            <h1 className="text-2xl font-semibold mb-3 flex items-center gap-3 text-gray-900 dark:text-white">
              <Play className="w-8 h-8 text-red-500 fill-current" />
              YouTube to Notes
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Ubah video YouTube menjadi catatan terstruktur dalam hitungan detik</p>
          </div>

          {videoId && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full aspect-video mb-6 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10"
            >
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </motion.div>
          )}

          <form onSubmit={handleSummarize} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Paste URL YouTube di sini..."
              className="w-full px-5 py-4 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-lg"
            />
            <button
              type="submit"
              disabled={isLoading || !videoId}
              className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-lg transition shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Ringkas Video
                </>
              )}
            </button>
          </form>
        </div>

        {(assistantMessages.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl flex-1"
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Catatan Video</h2>
            <div className="prose dark:prose-invert max-w-none relative">
              {assistantMessages.map(m => {
                const fullText = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
                return (
                  <div key={m.id} className="relative mt-4 group">
                    <button
                      onClick={() => handleCopy(fullText, m.id)}
                      className="absolute top-2 right-2 p-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 transition-colors z-10"
                      title="Salin Teks"
                    >
                      {copiedId === m.id ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="whitespace-pre-wrap p-5 pt-8 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-transparent rounded-lg text-gray-800 dark:text-zinc-300 leading-relaxed min-h-[60px]">
                      {fullText}
                    </div>
                  </div>
                )
              })}
              {isLoading && assistantMessages.length === 0 && (
                <div className="mt-4 p-4 text-gray-500 dark:text-zinc-400 italic">
                  Sedang menganalisis video...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
