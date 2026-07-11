import { SupabaseClient } from '@supabase/supabase-js';

// Tipe standar untuk balasan data berhalaman
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total_data: number;
    total_pages: number;
    current_page: number;
    limit: number;
  };
}

// Blueprint utama untuk semua tabel (Generic Type)
export function createBaseService<T>(tableName: string) {
  return {
    // -----------------------------------------------------------
    // READ: Mengambil semua data tanpa batasan
    // -----------------------------------------------------------
    async getAll(supabase: SupabaseClient) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: false });

      if (error) throw new Error(error.message);
      return data as T[];
    },

    // -----------------------------------------------------------
    // READ: Mengambil data dengan batasan halaman (Paginasi)
    // -----------------------------------------------------------
    async getPaginated(
      supabase: SupabaseClient, 
      page: number = 1, 
      limit: number = 10
    ): Promise<PaginatedResult<T>> {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // count: 'exact' digunakan untuk mendapatkan total baris di tabel
      const { data, count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' }) 
        .range(from, to)
        .order('id', { ascending: false });

      if (error) throw new Error(error.message);

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: data as T[],
        meta: {
          total_data: count || 0,
          total_pages: totalPages,
          current_page: page,
          limit: limit
        }
      };
    },

    // -----------------------------------------------------------
    // READ: Mengambil satu data berdasarkan ID
    // -----------------------------------------------------------
    async getById(supabase: SupabaseClient, id: string | number) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as T;
    },

    // -----------------------------------------------------------
    // CREATE: Menambah data baru
    // -----------------------------------------------------------
    async create(supabase: SupabaseClient, payload: Partial<T>) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(payload as any) // 'as any' mengabaikan pengecekan internal Supabase RejectExcessProperties
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as T;
    },

    // -----------------------------------------------------------
    // UPDATE: Mengubah data
    // -----------------------------------------------------------
    async update(supabase: SupabaseClient, id: string | number, payload: Partial<T>) {
      const { data, error } = await supabase
        .from(tableName)
        .update(payload as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as T;
    },

    // -----------------------------------------------------------
    // DELETE: Menghapus data secara permanen
    // -----------------------------------------------------------
    async delete(supabase: SupabaseClient, id: string | number) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return true;
    }
  };
}