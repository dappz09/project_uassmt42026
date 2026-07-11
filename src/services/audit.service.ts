import { SupabaseClient } from '@supabase/supabase-js';

// Tipe data untuk payload log
export interface AuditLogPayload {
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  table_name: string;
  record_id: string;
  old_data?: any;
  new_data?: any;
}

export const auditService = {
  // Fungsi pencatat log
  async logActivity(supabase: SupabaseClient, payload: AuditLogPayload) {
    const { error } = await supabase.from('audit_logs').insert(payload);
    
    if (error) {
      // Praktik Profesional: Kita menggunakan console.error saja, 
      // JANGAN gunakan throw new Error(). 
      // Kenapa? Agar jika sistem log gagal, aplikasi/transaksi utamanya tidak ikut gagal/crash.
      console.error("⚠️ Sistem Gagal Mencatat Audit Log:", error.message);
    }
  }
};