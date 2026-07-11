import { createBaseService } from './base.service';
import { SupabaseClient } from '@supabase/supabase-js';

// Struktur tabel roletasks di database kamu
export interface RoleTask {
  id: string;
  role_id: string;
  task_name: string; // Contoh: 'view-aplikasi', 'create-users'
}

export const roleTaskService = {
  // 1. Warisi CRUD bawaan (Sangat berguna untuk halaman Admin Panel 
  // saat kamu ingin menambahkan/menghapus permission secara dinamis)
  ...createBaseService<RoleTask>('roletasks'),

  // 2. FUNGSI INTI: Mengambil daftar semua permission (tasks) milik satu user
  async getUserPermissions(supabase: SupabaseClient, userId: string): Promise<string[]> {
    // Asumsi relasi: user_roles -> roles -> roletasks
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          roletasks (
            task_name
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    // Mengolah JSON bersarang dari Supabase menjadi Array of Strings yang rapi
    // Menggunakan Set agar tidak ada task_name yang duplikat
    const permissions = new Set<string>();
    
    data?.forEach((ur: any) => {
      // Optional chaining (?.) melindungi kita dari error jika role/task kosong
      ur.roles?.roletasks?.forEach((rt: any) => {
        if (rt.task_name) permissions.add(rt.task_name);
      });
    });

    return Array.from(permissions);
  },

  // 3. FUNGSI CEK SPESIFIK: Mengembalikan boolean (true/false)
  async hasPermission(supabase: SupabaseClient, userId: string, requiredTask: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(supabase, userId);
    return permissions.includes(requiredTask);
  },

  // 4. FUNGSI CEK MULTIPEL: Mengecek apakah user punya SALAH SATU dari banyak task
  async hasAnyPermission(supabase: SupabaseClient, userId: string, requiredTasks: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(supabase, userId);
    return requiredTasks.some(task => permissions.includes(task));
  }
};