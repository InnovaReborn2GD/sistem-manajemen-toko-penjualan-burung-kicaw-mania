"use client"
import { useState, useRef } from 'react';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminBirds() {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  function handleImageChange(file) {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageChange(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch('/api/birds', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatus({ type: 'success', message: 'Burung berhasil ditambahkan!' });
        formRef.current?.reset();
        setPreview(null);
      } else {
        setStatus({ type: 'error', message: json.error || 'Gagal menyimpan data.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
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
            {preview && (
              <div className="mb-4">
                <img src={preview} alt="Preview" className="w-full max-h-64 object-cover rounded-2xl border-2 border-blue-300" />
                <button type="button" onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="mt-2 text-sm text-red-500 hover:text-red-700 font-semibold">Hapus Preview</button>
              </div>
            )}
            <input
              ref={fileInputRef}
              name="image_file"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleImageChange(e.target.files[0])}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed p-6 rounded-xl cursor-pointer transition text-center ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              required
            />
            <p className="text-xs text-gray-500 text-center">Drag & drop gambar di sini atau klik untuk memilih</p>
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