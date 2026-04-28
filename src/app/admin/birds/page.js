'use client'

import { addBird } from '@/lib/action';
import { useState, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminBirds() {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData(event.currentTarget);
    const result = await addBird(formData);

    if (result?.success) {
      setStatus({ type: 'success', message: 'Burung berhasil ditambahkan!' });
      formRef.current?.reset(); 
    } else {
      setStatus({ type: 'error', message: result?.error || 'Gagal menyimpan data.' });
    }
    setLoading(false);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      
      {/* TOMBOL KEMBALI KE HALAMAN USER */}
      <div className="mb-6">
        <Link 
          href="/user" // <--- Ganti ke "/" untuk kembali ke halaman utama (user page)
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Kembali
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-8">Tambah Burung Baru</h1>

      {/* Sisa kode form tetap sama seperti sebelumnya... */}
      {status.message && (
        <div className={`p-4 mb-6 rounded-2xl text-white flex items-center gap-3 shadow-lg ${
          status.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {status.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <span className="font-semibold">{status.message}</span>
        </div>
      )}

      <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Nama Burung</label>
            <input name="name" type="text" placeholder="Contoh: Murai Batu" className="border-2 p-3 rounded-xl focus:border-blue-500 outline-none" required />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Spesies</label>
            <input name="species" type="text" placeholder="Contoh: Copsychus malabaricus" className="border-2 p-3 rounded-xl focus:border-blue-500 outline-none" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Harga (Rp)</label>
            <input name="price" type="number" placeholder="0" className="border-2 p-3 rounded-xl focus:border-blue-500 outline-none" required />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600">Stok</label>
            <input name="stock" type="number" placeholder="0" className="border-2 p-3 rounded-xl focus:border-blue-500 outline-none" required />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-600">Foto Burung</label>
            <input name="image_file" type="file" accept="image/*" className="border-2 border-dashed p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition" required />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`md:col-span-2 flex justify-center items-center gap-2 text-white font-extrabold py-4 rounded-2xl transition shadow-lg ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {loading ? (
              <><Loader2 className="animate-spin" /> Menyimpan...</>
            ) : 'Konfirmasi & Tambah Burung'}
          </button>
        </form>
      </section>
    </div>
  );
}