'use client';

import { createClientComponent } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';

export default function KatalogPage() {
  const [birds, setBirds] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClientComponent();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Ambil data burung untuk katalog
        const { data: birdsData, error: birdsError } = await supabase
          .from('birds')
          .select('*');
        
        if (birdsError) throw birdsError;
        setBirds(birdsData || []);

        // 2. Cek status autentikasi user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 3. Ambil data profil menggunakan maybeSingle() untuk menghindari error 406
          // Ini memastikan jika data profil belum dibuat, aplikasi tidak crash
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(); 
          
          if (profileError) {
            console.error('Gagal memuat profil:', profileError.message);
          } else {
            setProfile(profileData);
            console.log('Profil berhasil dimuat:', profileData);
          }
        }
      } catch (err) {
        console.error("Terjadi kesalahan:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Logika deteksi admin yang aman dari perbedaan huruf besar/kecil
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header & Tombol Tambah Admin */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Katalog Burung</h1>
          {profile && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${isAdmin ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {profile.role || 'user'}
              </span>
              <span className="text-xs text-gray-400">| ID: {profile.id.substring(0, 8)}...</span>
            </div>
          )}
        </div>
        
        {isAdmin && (
          <Link 
            href="/admin/birds" 
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition shadow-lg transform hover:scale-105"
          >
            <Plus size={20} /> 
            <span className="font-semibold">Tambah Burung</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>Gagal memuat data: {error}</p>
        </div>
      )}

      {/* Grid Katalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {birds.length > 0 ? birds.map((bird) => (
          <div key={bird.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all duration-300">
            
            {/* Fitur Edit & Hapus untuk Admin */}
            {isAdmin && (
              <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Link 
                  href={`/admin/birds/edit/${bird.id}`}
                  className="bg-yellow-500 text-white p-2 rounded-full shadow-lg hover:bg-yellow-600 hover:scale-110 transition"
                  title="Edit Burung"
                >
                  <Edit size={16} />
                </Link>
                <button 
                  className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition"
                  title="Hapus Burung"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="overflow-hidden rounded-xl mb-4">
              <img 
                src={bird.image_url || 'https://via.placeholder.com/300x200?text=No+Image'} 
                alt={bird.name} 
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-1">{bird.name}</h3>
            <p className="text-gray-500 text-sm italic mb-3">{bird.species}</p>
            
            <div className="flex justify-between items-end mt-2">
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold">Harga</p>
                <p className="text-blue-700 font-extrabold text-xl">
                  Rp {bird.price?.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs uppercase font-semibold">Stok</p>
                <p className={`font-bold ${bird.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {bird.stock} ekor
                </p>
              </div>
            </div>

            <button 
              disabled={bird.stock <= 0}
              className={`w-full mt-5 py-3 rounded-xl font-bold transition-all shadow-md ${
                bird.stock > 0 
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {bird.stock > 0 ? 'Beli Sekarang' : 'Stok Habis'}
            </button>
          </div>
        )) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-lg">Belum ada burung yang tersedia di katalog.</p>
          </div>
        )}
      </div>
    </div>
  );
}