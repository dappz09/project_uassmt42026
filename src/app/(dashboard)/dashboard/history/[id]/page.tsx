import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Calendar } from 'lucide-react'
import { RequirePermission } from '@/components/auth/require-permission'
import { CopyButton } from './copy-button'

export const metadata = {
  title: 'Detail Catatan - NoteTube',
}

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const note = await prisma.note.findUnique({
    where: {
      id: id,
    }
  })

  if (!note || note.userId !== session.user.id) {
    notFound()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full h-full">
      <RequirePermission action="show" resource="notes">
        <div className="mb-6">
          <Link 
            href="/dashboard/history"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Kembali ke Riwayat
          </Link>
        </div>

        <div className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white pr-12 relative">
              {note.title}
              {/* Copy Title Button Option could go here if needed */}
            </h1>
            
            <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                <Calendar size={14} />
                {new Date(note.createdAt).toLocaleDateString('id-ID', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </div>
              
              {note.videoUrl && (
                <a 
                  href={note.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-full transition-colors"
                >
                  <Play size={14} className="fill-current" />
                  Buka Video Asli
                </a>
              )}
            </div>
          </div>

          {note.videoId && (
            <div className="w-full aspect-video mb-8 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${note.videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}

          <div className="prose prose-purple dark:prose-invert max-w-none">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">
              Isi Catatan:
            </h3>
            <div className="relative whitespace-pre-wrap p-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-white/5">
              <CopyButton text={note.content} />
              {note.content}
            </div>
          </div>
        </div>
      </RequirePermission>
    </div>
  )
}
