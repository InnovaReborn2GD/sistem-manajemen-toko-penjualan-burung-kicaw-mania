"use client"

import { useEffect, useMemo, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { Plus, PencilLine, Trash2, X, Save } from 'lucide-react';

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
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          setProfile(profileData || null);
        }
        await fetchCategories();
      } finally {
        setLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!profile || profile.role !== 'admin') {
      setError('Hanya admin yang dapat mengelola kategori.');
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

      const response = await fetch(
        editingCategory ? `/api/categories/${editingCategory.id_categories}` : '/api/categories',
        {
          method: editingCategory ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan kategori');
      }

      setMessage(editingCategory ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil ditambahkan.');
      closeForm();
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    if (!confirm(`Hapus kategori "${category.cat_name}"?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`/api/categories/${category.id_categories}`, {
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
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Panel</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Manajemen Kategori</h1>
            <p className="mt-2 text-sm text-slate-600">Kelola kategori burung dari satu halaman khusus admin.</p>
          </div>

          {profile?.role === 'admin' && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={18} />
              Tambah
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Memuat kategori...</div>
        ) : profile?.role !== 'admin' ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            Hanya admin yang dapat mengelola kategori.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            {(message || error) && (
              <div className={`border-b px-5 py-4 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {error || message}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-5 py-4">No</th>
                    <th className="px-5 py-4">Nama Kategori</th>
                    <th className="px-5 py-4">Deskripsi</th>
                    <th className="px-5 py-4">Habitat</th>
                    <th className="px-5 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                        Belum ada kategori.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category, index) => (
                      <tr key={category.id_categories} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-sm font-medium text-slate-500">{index + 1}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">{category.cat_name}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{category.cat_desc || '-'}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{category.habitat || '-'}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(category)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                            >
                              <PencilLine size={16} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50"
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

        {showForm && profile?.role === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Isi data kategori yang akan dipakai pada data burung.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Nama Kategori</label>
                  <input
                    value={form.cat_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, cat_name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Contoh: Burung Hias"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Deskripsi</label>
                  <textarea
                    value={form.cat_desc}
                    onChange={(e) => setForm((prev) => ({ ...prev, cat_desc: e.target.value }))}
                    className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Penjelasan singkat kategori"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Habitat</label>
                  <input
                    value={form.habitat}
                    onChange={(e) => setForm((prev) => ({ ...prev, habitat: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Contoh: Hutan hujan tropis"
                  />
                </div>

                {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    {saving ? 'Menyimpan...' : 'Simpan'}
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