import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

interface LogActivityParams {
  userId?: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'SETTINGS' | string
  resource: string
  details?: Record<string, any>
  req?: Request
}

export async function logActivity({ userId, action, resource, details, req }: LogActivityParams) {
  try {
    let ipAddress = 'unknown'
    let userAgent = 'unknown'

    // Coba ambil dari request header (baik lewat object Request atau function headers() next/headers)
    try {
      const headersList = headers()
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) {
      // Fallback jika headers() dipanggil di luar konteks Next.js App Router
      if (req) {
        ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        userAgent = req.headers.get('user-agent') || 'unknown'
      }
    }

    // Bersihkan IP address jika ada koma (multiple proxies)
    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim()
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    // Kami menelan error (swallow error) agar kegagalan log tidak merusak fungsi utama (seperti gagal login/simpan)
    console.error('Failed to write audit log:', error)
  }
}
