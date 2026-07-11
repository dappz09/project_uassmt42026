"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProdukFormDialog() {
  // State untuk mengontrol buka/tutup modal
  const [open, setOpen] = useState(false);

  // Fungsi simulasi submit (hanya untuk template UI)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form disubmit!");
    // Tutup modal setelah submit
    setOpen(false); 
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Tombol Pemicu Modal */}
      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setOpen(true)}>
        + Tambah Produk
      </Button>

      {/* Isi Modal */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
          <DialogDescription>
            Masukkan detail produk di sini. Klik simpan saat sudah selesai.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Input Nama Produk */}
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Produk</Label>
            <Input id="nama" placeholder="Contoh: Template Website Next.js" required />
          </div>

          {/* Input Kategori (Select) */}
          <div className="space-y-2">
            <Label htmlFor="kategori">Kategori</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="digital">Produk Digital</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="ebook">E-Book</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Input Harga */}
          <div className="space-y-2">
            <Label htmlFor="harga">Harga (Rp)</Label>
            <Input id="harga" type="number" placeholder="Contoh: 150000" required />
          </div>

          {/* Input Deskripsi (Textarea) */}
          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi Singkat (Opsional)</Label>
            <Textarea 
              id="deskripsi" 
              placeholder="Jelaskan secara singkat tentang produk ini..." 
              className="resize-none"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Produk</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}