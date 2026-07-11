import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

export function ComingSoonPage({ title, description }: { title: string, description: string }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-purple-500/20 to-transparent blur-[100px] -z-10 rounded-full" />
      
      <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-8 mx-auto shadow-xl shadow-purple-500/20">
        <Clock size={40} />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
        {title} Segera Hadir
      </h1>
      
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-10">
        {description}
      </p>
      
      <Link 
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:scale-105 transition-transform"
      >
        <ArrowLeft size={18} /> Kembali ke Beranda
      </Link>
    </div>
  )
}
