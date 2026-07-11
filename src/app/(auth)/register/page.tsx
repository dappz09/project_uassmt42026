'use client'


import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import { X } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const toastId = toast.loading('Sedang membuat akun...')
    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: formData, // the new API handles FormData
      })
      
      const json = await response.json().catch(() => null)
      
      if (response.ok && json?.success) {
        toast.success(json.message || 'Akun berhasil dibuat!', { id: toastId })
        router.push('/login')
      } else {
        toast.error(json?.message || 'Gagal membuat akun', { id: toastId })
      }
    } catch (error) {
      toast.error('Terjadi kesalahan koneksi', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-white dark:bg-zinc-950">
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -80, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-300 dark:bg-purple-600 filter blur-[120px] opacity-50 dark:opacity-40"
      />
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -80, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-300 dark:bg-blue-600 filter blur-[120px] opacity-50 dark:opacity-40"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-xl backdrop-blur-xl relative z-10"
      >
        <Link
          href="/"
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </Link>
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buat Akun Baru</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Mulai ringkas video YouTube secara gratis.</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-white">Nama Lengkap</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-white">Email</label>
            <input
              type="email"
              name="email"
              placeholder="nama@email.com"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-white">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-purple-600 dark:text-purple-400 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}