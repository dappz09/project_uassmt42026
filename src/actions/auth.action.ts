"use server";

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, message: 'Email dan password wajib diisi!' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, message: 'Email atau password salah.' };
        default:
          return { success: false, message: 'Terjadi kesalahan sistem saat login.' };
      }
    }
    // This will throw the NEXT_REDIRECT error so Next.js can handle it
    throw error;
  }
}

export async function logoutAction() {
  const { signOut } = await import('@/lib/auth');
  await signOut({ redirectTo: '/login' });
}

export async function registerAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { success: false, message: 'Nama, email, dan password wajib diisi!' };
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Gagal membuat akun.' };
    }

    return { success: true, message: 'Akun berhasil dibuat! Silakan login.' };
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan. Silakan coba lagi.' };
  }
}
