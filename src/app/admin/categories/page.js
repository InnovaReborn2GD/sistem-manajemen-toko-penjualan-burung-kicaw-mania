"use client"

import { useEffect, useMemo, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { Plus, PencilLine, Trash2, X, Save, ArrowLeft, Loader2, Tag } from 'lucide-react';
import Link from 'next/link';

const emptyForm = { cat_name: '', cat_desc: '', habitat: '' };

export default function AdminCategoriesPage() {
  const supabase = useMemo(() => createClientComponent(), []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          setProfile(profileData || null);
        }
        await fetchCategories();
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [supabase]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setCategories([]);
    }
  }

  function openCreateForm() {
    setEditingCategory(null);
    setForm(emptyForm);
    setError('');
    setMessage('');
    setShowForm(true);
  }

  function openEditForm(category) {
    setEditingCategory(category);
    setForm({
      cat_name: category.cat_name || '',
      cat_desc: category.cat_desc || '',
      habitat: category.habitat || '',
    });
    setError('');
    setMessage('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCategory(null);
    setForm(emptyForm);
    setError('');
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!profile || profile.role !== 'admin') {
      setError('Hanya admin yang dapat mengelola kategori.');
      return;
    }

    if (!form.cat_name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }

    // PROTEKSI EKSTRA: Jika sedang mode edit, pastikan ID-nya benar-benar ada dan berupa angka
    if (editingCategory && (!editingCategory.id_categories || isNaN(editingCategory.id_categories))) {
        setError('Error: ID Kategori tidak valid untuk diupdate.');
        return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const payload = {
        cat_name: form.cat_name.trim(),
        cat_desc: form.cat_desc.trim(),
        habitat: form.habitat.trim(),
      };

      const targetId = editingCategory?.id_categories || editingCategory?.id;
      const url = editingCategory 
        ? `/api/categories/${targetId}` 
        : '/api/categories';

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan kategori');
      }

      setMessage(editingCategory ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil ditambahkan.');
      
      await fetchCategories();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

async function handleDelete(category) {
    // 1. AMBIL ID DINAMIS: Mendukung kolom bernama 'id_categories' maupun 'id'
    const targetId = category?.id_categories || category?.id;

    // 2. PROTEKSI EKSTRA: Validasi ketat menggunakan targetId
    if (!targetId || isNaN(targetId)) {
      setError("Error: ID Kategori tidak valid untuk dihapus.");
      
      // Console log ini akan membantu Anda melihat isi data asli jika error lagi
      console.log("Data Kategori yang diklik:", category); 
      return;
    }

    if (!confirm(`Hapus kategori "${category.cat_name}"? Tindakan ini akan menghapus semua relasi kategori pada burung.`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // 3. GUNAKAN targetId PADA URL
      const response = await fetch(`/api/categories/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghapus kategori');
      }

      setMessage('Kategori berhasil dihapus.');
      await fetchCategories();
    } catch (err) {
      setError(err.message);
      // Bersihkan error message setelah beberapa detik agar tabel tidak terdorong
      setTimeout(() => setError(''), 4000); 
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header Section */}
        <div className="mb-8">
          <Link 
            href="/user" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 font-bold"
          >
            <ArrowLeft size={20} /> Kembali ke Katalog
          </Link>
          
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Admin Panel</p>
              <h1 className="mt-2 text-4xl font-black text-slate-900 tracking-tight">Kelola Kategori</h1>
              <p className="mt-2 text-slate-600 font-medium">Atur klasifikasi burung untuk mempermudah pencarian user.</p>
            </div>

            {profile?.role === 'admin' && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
              >
                <Plus size={20} />
                Tambah Kategori
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : profile?.role !== 'admin' ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm flex items-center gap-3">
            <Tag className="text-amber-600" />
            Hanya admin yang dapat mengelola kategori.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            {(message || error) && (
              <div className={`border-b px-6 py-4 text-sm font-bold ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {error || message}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-5">No</th>
                    <th className="px-6 py-5">Nama Kategori</th>
                    <th className="px-6 py-5">Deskripsi</th>
                    <th className="px-6 py-5">Habitat</th>
                    <th className="px-6 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                        Belum ada kategori yang tersedia.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category, index) => (
                      <tr key={category.id_categories} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-5 text-sm font-bold text-slate-400">{index + 1}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                              <Tag size={16} />
                            </div>
                            <span className="font-bold text-slate-900">{category.cat_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600 font-medium">{category.cat_desc || '-'}</td>
                        <td className="px-6 py-5 text-sm text-slate-600 font-medium italic">{category.habitat || '-'}</td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(category)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white hover:shadow-sm"
                            >
                              <PencilLine size={16} className="text-yellow-500" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Form */}
        {showForm && profile?.role === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in duration-200">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Kelola identitas kategori untuk inventaris burung.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Nama Kategori</label>
                  <input
                    value={form.cat_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, cat_name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="Contoh: Burung Hias"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Deskripsi</label>
                  <textarea
                    value={form.cat_desc}
                    onChange={(e) => setForm((prev) => ({ ...prev, cat_desc: e.target.value }))}
                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:bg-white resize-none"
                    placeholder="Penjelasan singkat mengenai kategori ini..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Habitat Utama</label>
                  <input
                    value={form.habitat}
                    onChange={(e) => setForm((prev) => ({ ...prev, habitat: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="Contoh: Hutan Hujan Tropis"
                  />
                </div>

                {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-2xl px-6 py-4 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-50 active:scale-95"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}