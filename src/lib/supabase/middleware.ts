import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Buat respons bawaan yang mengizinkan request berlanjut
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Inisialisasi Supabase Client khusus untuk Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Memperbarui cookie di request asli
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          // Memperbarui cookie di respons yang akan dikirim ke browser
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Ambil data user saat ini untuk mengecek status login
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;

  // 4. LOGIKA ROUTING (SATPAM HALAMAN)
  // Daftar halaman yang tidak boleh diakses jika belum login
  const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/admin');
  
  // Daftar halaman yang khusus untuk tamu (sudah login tidak boleh ke sini lagi)
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register');

  if (isProtectedRoute && !user) {
    // Jika belum login tapi mencoba masuk dashboard, tendang ke login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    // Jika sudah login tapi mencoba buka halaman login, tendang ke dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 5. Kembalikan respons (beserta cookie yang mungkin sudah diperbarui)
  return supabaseResponse
}