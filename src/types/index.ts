import { User } from '@supabase/supabase-js';

export interface ActionResponse<T = any> {
  success: boolean;
  message: string;
  data?: T; // Opsional: Berisi data user atau data hasil query
}

export interface LoginData {
  user: User;
  token: string;
  tasks: string[];
}

export interface ProfileData {
  id: string;
  email: string;
  tasks: string[]; // Daftar permission (view-produk, dll)
  // Tambahkan properti lain di sini jika kamu punya tabel khusus 'profiles'
  // misalnya: nama_lengkap, avatar_url, dll.
}