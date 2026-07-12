import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { HistoryClient } from './history-client'

export const metadata = {
  title: 'Riwayat Catatan - NoteTube',
}

export default async function HistoryPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Ambil semua catatan milik user ini, urutkan dari yang terbaru
  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      content: true,
      videoId: true,
      videoUrl: true,
      createdAt: true
    }
  })

  return (
    <div className="p-6">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Riwayat Catatan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lihat semua ringkasan YouTube yang pernah Anda buat sebelumnya.
          </p>
        </div>

        <HistoryClient notes={notes} />
      </div>
    </div>
  )
}
