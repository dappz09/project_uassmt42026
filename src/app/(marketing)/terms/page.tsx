import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-20 md:py-32">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>

        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Syarat & Ketentuan</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-purple dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <p>
            Harap baca Syarat dan Ketentuan berikut secara saksama sebelum menggunakan layanan NoteTube AI.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Penerimaan Syarat</h2>
          <p>
            Dengan mendaftar dan menggunakan NoteTube AI, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan ini.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Akun dan Keamanan</h2>
          <p>
            Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi dan kredensial akun Anda. NoteTube AI tidak bertanggung jawab atas kerugian yang diakibatkan oleh kelalaian pengguna.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Batasan Layanan</h2>
          <p>
            Layanan AI (termasuk peringkasan video) disediakan 'sebagaimana adanya'. Kualitas dan akurasi ringkasan sangat bergantung pada ketersediaan transkrip YouTube. Kami berhak membatasi penggunaan berdasarkan paket berlangganan Anda.
          </p>

          <p className="mt-12 text-sm italic">
            Ini adalah dokumen draf/contoh Syarat & Ketentuan. Jika Anda ingin mengganti teks ini, hubungi Administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
