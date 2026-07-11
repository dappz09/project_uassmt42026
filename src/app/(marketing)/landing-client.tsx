'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Sun, Moon, Monitor, Link as LinkIcon, Cpu, FileText, ArrowRight, Zap, Check, Lock, Globe, Play, Hash, Code, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  type: string
  price: number
  interval: string
  features: string | null
}

export function LandingClient({ plans }: { plans: Plan[] }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-x-hidden relative overflow-hidden">
      <BackgroundAnimation />
      
      <Header setTheme={setTheme} theme={theme} mounted={mounted} />
      
      <main className="relative z-10">
        <HeroSection />
        <HowItWorksSection />
        <DetailedFeaturesSection />
        <PricingSection plans={plans} />
      </main>
      
      <Footer />
    </div>
  )
}

function BackgroundAnimation() {
  return (
    <>
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -80, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-300 dark:bg-purple-600 filter blur-[120px] opacity-50 dark:opacity-30"
      />
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -80, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-300 dark:bg-blue-600 filter blur-[120px] opacity-50 dark:opacity-30"
      />
    </>
  )
}

function Header({ setTheme, theme, mounted }: { setTheme: (theme: string) => void, theme: string | undefined, mounted: boolean }) {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          NoteTube AI
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
            <button onClick={() => setTheme('light')} className={`p-2 rounded-md transition-all ${mounted && theme === 'light' ? 'opacity-100 bg-white dark:bg-zinc-800 shadow-md' : 'opacity-50'}`}>
              <Sun className="w-5 h-5" />
            </button>
            <button onClick={() => setTheme('dark')} className={`p-2 rounded-md transition-all ${mounted && theme === 'dark' ? 'opacity-100 bg-white dark:bg-zinc-800 shadow-md' : 'opacity-50'}`}>
              <Moon className="w-5 h-5" />
            </button>
            <button onClick={() => setTheme('system')} className={`p-2 rounded-md transition-all ${mounted && theme === 'system' ? 'opacity-100 bg-white dark:bg-zinc-800 shadow-md' : 'opacity-50'}`}>
              <Monitor className="w-5 h-5" />
            </button>
          </div>
          
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity">
            Sign Up
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-6">
          <span className="text-lg">✨</span> AI-Powered YouTube Summarizer
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-purple-700 via-pink-600 to-blue-600 dark:from-white dark:via-purple-200 dark:to-purple-400 bg-clip-text text-transparent">
            Ubah Video YouTube Menjadi Catatan Terstruktur dalam Detik
          </span>
        </motion.h1>
        
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Jangan buang waktu menonton video 20 menit hanya untuk mencari satu informasi. Tempel link, dapatkan poin-poin pentingnya secara instan.
        </motion.p>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-purple-500/30">
            Mulai Gratis <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

function HowItWorksSection() {
  const features = [
    { icon: LinkIcon, title: '1. Tempel Link', description: 'Copy URL video YouTube apa saja dan tempelkan di dashboard.' },
    { icon: Cpu, title: '2. AI Memproses', description: 'AI kami membaca seluruh transkrip dan memfilter informasi utama.' },
    { icon: FileText, title: '3. Dapatkan Catatan', description: 'Terima rangkuman poin-poin yang rapi dan siap disimpan.' }
  ]

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-20 px-6 max-w-7xl mx-auto">
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
        Cara Kerja yang Sangat Mudah
      </motion.h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: index * 0.2 }} className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl hover:shadow-md hover:border-purple-500/50 hover:bg-white hover:dark:bg-white/10 transition-all duration-300 cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function DetailedFeaturesSection() {
  const details = [
    { icon: FileText, title: 'Catatan Terstruktur AI', desc: 'Tidak sekadar teks paragraf, AI merangkum ke dalam format bullet-points yang rapi, lengkap dengan penanda bagian penting.' },
    { icon: Zap, title: 'Super Cepat', desc: 'Didukung oleh model AI termutakhir (Gemini 1.5 Flash & Pro) untuk memberikan Anda ringkasan kurang dari 10 detik.' },
    { icon: Lock, title: 'Aman & Pribadi', desc: 'Data riwayat rangkuman Anda tersimpan dengan enkripsi yang aman dan tidak dapat diakses oleh pihak yang tidak berkepentingan.' },
    { icon: Globe, title: 'Dukungan Multibahasa', desc: 'Video dalam bahasa Inggris, Spanyol, atau lainnya? Kami akan merangkumnya langsung ke dalam bahasa Indonesia.' }
  ]

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" ref={ref} className="py-24 px-6 max-w-7xl mx-auto bg-gray-50/50 dark:bg-white/[0.02] rounded-3xl my-10 border border-gray-100 dark:border-white/5">
      <div className="text-center mb-16">
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Kenapa Menggunakan NoteTube AI?
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }} className="text-lg text-gray-600 dark:text-gray-400">
          Fitur canggih yang dirancang khusus untuk meningkatkan produktivitas belajar Anda.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {details.map((feat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 * idx }} className="flex gap-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            <div className="w-14 h-14 shrink-0 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <feat.icon size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function PricingSection({ plans }: { plans: Plan[] }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Gratis'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <section id="pricing" ref={ref} className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Pilih Paket Terbaik Anda
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }} className="text-lg text-gray-600 dark:text-gray-400">
          Mulai gratis, lalu upgrade saat produktivitas Anda mulai meningkat pesat.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, idx) => {
          const isPro = plan.price > 0
          let featuresList: string[] = []
          if (plan.features) {
            try {
              const parsed = JSON.parse(plan.features)
              featuresList = Array.isArray(parsed) ? parsed : plan.features.split('\n')
            } catch (e) {
              featuresList = plan.features.split('\n')
            }
          }

          return (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * idx }}
              className={`p-8 rounded-3xl flex flex-col relative ${
                isPro 
                  ? 'border-2 border-purple-500/50 bg-white dark:bg-zinc-900 shadow-[0_0_40px_rgba(168,85,247,0.15)] dark:shadow-[0_0_40px_rgba(168,85,247,0.1)]' 
                  : 'border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl'
              }`}
            >
              {isPro && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                  <Zap size={14} className="fill-current"/> Paling Populer
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{plan.type} Plan</p>
              
              <div className="mb-6 flex items-baseline flex-wrap gap-2">
                <span className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{formatCurrency(plan.price)}</span>
                {plan.price > 0 && <span className="text-gray-500 font-medium whitespace-nowrap">/ {plan.interval}</span>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {featuresList.length > 0 ? featuresList.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <Check size={18} className={`shrink-0 mt-0.5 ${isPro ? 'text-purple-500' : 'text-emerald-500'}`}/> 
                    <span>{feat}</span>
                  </li>
                )) : (
                  <li className="text-gray-400 italic text-sm">Belum ada rincian.</li>
                )}
              </ul>

              <Link 
                href="/register"
                className={`w-full py-4 rounded-xl font-semibold transition-all text-center ${
                  isPro 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30 hover:scale-[1.02]' 
                    : 'border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                Mulai Sekarang
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/10 mt-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-[80px] -z-10" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-16 px-6 max-w-7xl mx-auto text-left relative z-10">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4 group transition-opacity hover:opacity-80">
            <div className="bg-red-500 text-white p-1.5 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <Play size={20} strokeWidth={2.5} fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">NoteTube AI</span>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
            Platform AI terbaik untuk mengubah video YouTube berdurasi panjang menjadi catatan instan terstruktur. Hemat waktu, tingkatkan produktivitas.
          </p>
          
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              <Hash size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Code size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <MessageSquare size={18} />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="uppercase tracking-wider font-bold text-gray-900 dark:text-white mb-4 text-sm">Produk</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="#features" className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors">Fitur Utama</Link></li>
            <li><Link href="#pricing" className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors">Harga & Paket</Link></li>
            <li><Link href="/changelog" className="text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors flex items-center gap-2">Changelog <span className="text-[10px] bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded-md font-semibold">New</span></Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="uppercase tracking-wider font-bold text-gray-900 dark:text-white mb-4 text-sm">Perusahaan</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/about" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">Tentang Kami</Link></li>
            <li><Link href="/blog" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">Blog</Link></li>
            <li><Link href="/careers" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">Karir</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="uppercase tracking-wider font-bold text-gray-900 dark:text-white mb-4 text-sm">Legal</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/privacy" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Kebijakan Privasi</Link></li>
            <li><Link href="/terms" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Syarat Ketentuan</Link></li>
          </ul>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Berlangganan Newsletter</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dapatkan info fitur terbaru dan diskon eksklusif.</p>
          </div>
          <div className="flex w-full md:w-auto max-w-sm">
            <input 
              type="email" 
              placeholder="Masukkan email Anda..." 
              className="w-full px-4 py-2 text-sm rounded-l-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-r-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Kirim
            </button>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto py-6 text-center text-sm text-gray-400 dark:text-gray-500 flex flex-col md:flex-row justify-between items-center px-6 gap-4">
          <span>© {new Date().getFullYear()} NoteTube AI. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="flex items-center gap-1">Dibuat dengan <span className="text-red-500">❤️</span> untuk pelajar</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
