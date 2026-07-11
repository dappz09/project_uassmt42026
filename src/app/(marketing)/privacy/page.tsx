import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-20 md:py-32">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>

        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Kebijakan Privasi</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-purple dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Di NoteTube AI, privasi pengguna adalah salah satu prioritas utama kami. Kebijakan Privasi ini mengatur bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Informasi yang Kami Kumpulkan</h2>
          <p>
            Kami hanya mengumpulkan informasi yang diperlukan untuk memberikan layanan terbaik kepada Anda, termasuk alamat email saat pendaftaran dan riwayat tautan YouTube yang Anda minta untuk dirangkum.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Penggunaan Data</h2>
          <p>
            Data yang dikumpulkan semata-mata digunakan untuk memproses rangkuman AI, meningkatkan kualitas model AI kami, serta memberikan dukungan pelanggan. Kami <strong>tidak pernah</strong> menjual data Anda kepada pihak ketiga.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Keamanan</h2>
          <p>
            Kami menerapkan berbagai standar keamanan industri untuk mengenkripsi dan melindungi data sensitif Anda. Semua komunikasi data menggunakan protokol enkripsi yang aman (SSL/TLS).
          </p>

          <p className="mt-12 text-sm italic">
            Ini adalah dokumen draf/contoh Kebijakan Privasi. Jika Anda ingin mengganti teks ini, hubungi Administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
