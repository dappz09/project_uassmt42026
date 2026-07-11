import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// 1. Impor komponen Dialog Form
import { ProdukFormDialog } from "@/components/form/ProdukFormDialog"; 

export default function ProdukTemplatePage() {
  const dummyProduk = [
    { id: 1, nama: "Template Website Next.js", kategori: "Digital", harga: "Rp 250.000", status: "Aktif" },
    { id: 2, nama: "Langganan AI Pro 1 Bulan", kategori: "Subscription", harga: "Rp 150.000", status: "Aktif" },
    { id: 3, nama: "E-Book Master Laravel", kategori: "E-Book", harga: "Rp 99.000", status: "Draft" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Produk</h2>
          <p className="text-gray-500 text-sm">Kelola daftar produk, harga, dan ketersediaan.</p>
        </div>
        
        {/* 2. Gantikan tombol manual dengan komponen Dialog */}
        <ProdukFormDialog />
      </div>

      {/* ... (Sisa kode tabel dan paginasi tetap sama seperti sebelumnya) ... */}
      
      <div className="flex items-center gap-2 max-w-sm">
        <Input placeholder="Cari nama produk..." className="bg-white" />
        <Button variant="outline">Cari</Button>
      </div>

      <div className="border rounded-md bg-white">
        {/* ... (Tabel) ... */}
      </div>
    </div>
  );
}