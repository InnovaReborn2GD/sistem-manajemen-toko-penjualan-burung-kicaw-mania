"use client";

import { createClientComponent } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  X,
  History,
  Archive,
  Minus,
} from "lucide-react";

export default function KatalogPage() {
  const [birds, setBirds] = useState([]);
  const [birdCategories, setBirdCategories] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBirdId, setSelectedBirdId] = useState(null);
  const [selectedBirdName, setSelectedBirdName] = useState(null);

  // State untuk item yang dibeli
  const [cartItems, setCartItems] = useState([]);

  const router = useRouter();
  const supabase = useMemo(() => createClientComponent(), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [birdsResponse, categoriesResponse, relationsResponse] = await Promise.all([
          supabase.from("birds").select("*").is('deleted_at', null),
          fetch('/api/categories').then((res) => res.json()),
          fetch('/api/bird-categories').then((res) => res.json()),
        ]);

        const { data: birdsData, error: birdsError } = birdsResponse;

        if (birdsError) throw birdsError;

        setBirds(birdsData || []);

        const categoriesById = Array.isArray(categoriesResponse)
          ? categoriesResponse.reduce((acc, category) => {
              acc[category.id_categories] = category;
              return acc;
            }, {})
          : {};

        const groupedCategories = Array.isArray(relationsResponse)
          ? relationsResponse.reduce((acc, relation) => {
              if (!acc[relation.bird_id]) acc[relation.bird_id] = [];
              const category = categoriesById[relation.kategori_id];
              if (category) acc[relation.bird_id].push(category);
              return acc;
            }, {})
          : {};

        setBirdCategories(groupedCategories);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Gagal memuat profil:", profileError.message);
          } else {
            setProfile(profileData);
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

  const isAdmin = profile?.role?.toLowerCase() === "admin";

  // Fungsi Update Kuantitas Keranjang
  function updateCartQuantity(id, delta, stock) {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + delta;
          if (newQuantity < 1) return item;
          if (newQuantity > stock) {
            alert("Jumlah pembelian melebihi stok yang tersedia.");
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }

  function openDeleteModal(id, name) {
    setSelectedBirdId(id);
    setSelectedBirdName(name);
    setShowDeleteModal(true);
  }

  async function confirmSoftDelete() {
    setDeletingId(selectedBirdId);
    try {
      const res = await fetch("/api/birds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedBirdId, mode: "soft" }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setBirds((prev) => prev.filter((b) => b.id !== selectedBirdId));
        setShowDeleteModal(false);
      } else {
        alert(json.error || "Gagal mengarsipkan data.");
      }
    } catch (err) {
      alert(err.message || "Gagal mengarsipkan data.");
    } finally {
      setDeletingId(null);
    }
  }

  async function confirmHardDelete() {
    setDeletingId(selectedBirdId);
    try {
      const res = await fetch("/api/birds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedBirdId, mode: "hard" }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setBirds((prev) => prev.filter((b) => b.id !== selectedBirdId));
        setShowDeleteModal(false);
      } else {
        alert(json.error || "Gagal menghapus data.");
      }
    } catch (err) {
      alert(err.message || "Gagal menghapus data.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleAddToCart(bird) {
    const existingItem = cartItems.find((item) => item.id === bird.id);

    if (existingItem && existingItem.quantity >= bird.stock) {
      alert("Jumlah pembelian tidak boleh melebihi stok.");
      return;
    }

    if (existingItem) {
      updateCartQuantity(bird.id, 1, bird.stock);
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          id: bird.id,
          name: bird.name,
          species: bird.species,
          price: bird.price,
          stock: bird.stock,
          image_url: bird.image_url,
          quantity: 1,
        },
      ]);
    }
  }

  function handleRemoveFromCart(id) {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleContinuePayment() {
    if (cartItems.length === 0) {
      alert("Belum ada item yang dipilih.");
      return;
    }

    localStorage.setItem("checkoutItems", JSON.stringify(cartItems));
    router.push("/pembayaran");
  }

  const totalHarga = cartItems.reduce((total, item) => {
    return total + Number(item.price || 0) * item.quantity;
  }, 0);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );

  return (
    <div className="flex bg-gray-50 min-h-screen relative overflow-x-hidden">
      {/* MODAL KONFIRMASI HAPUS */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Arsipkan atau Hapus Burung?</h3>
              <p className="text-gray-500 mb-8 text-sm">
                Pilih tindakan untuk <strong>{selectedBirdName}</strong>:
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2 text-left">
                <li>• <strong>Arsipkan</strong>: menyembunyikan produk dari daftar.</li>
                <li>• <strong>Hapus Permanen</strong>: menghapus data sepenuhnya.</li>
              </ul>
              <div className="flex flex-col gap-3 w-full">
                <div className="flex gap-2">
                  <button onClick={confirmSoftDelete} disabled={deletingId === selectedBirdId} className="flex-1 py-3 bg-yellow-500 text-white font-bold rounded-2xl flex justify-center items-center gap-2 disabled:opacity-50">
                    {deletingId === selectedBirdId ? <Loader2 className="animate-spin" size={18} /> : "Arsipkan"}
                  </button>
                  <button onClick={confirmHardDelete} disabled={deletingId === selectedBirdId} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl flex justify-center items-center gap-2 disabled:opacity-50">
                    {deletingId === selectedBirdId ? <Loader2 className="animate-spin" size={18} /> : "Hapus"}
                  </button>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Konten Utama (Header + Grid Katalog) */}
      <div className={`flex-1 p-8 transition-all duration-500 ${cartItems.length > 0 && !isAdmin ? "mr-[340px]" : ""}`}>
        {/* Header & Navigasi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Katalog Kicaw</h1>
            {profile && (
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isAdmin ? "bg-red-500 text-white" : "bg-blue-600 text-white"}`}>
                  {profile.role || "user"}
                </span>
                <span className="text-xs text-gray-400 font-medium italic">ID: {profile.id.substring(0, 8)}...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link 
              href={isAdmin ? "/admin/orders" : "/riwayat"} 
              className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-3 rounded-2xl hover:bg-gray-50 transition shadow-sm font-bold text-sm"
            >
              <History size={18} /> 
              {isAdmin ? "Pesanan Masuk" : "Riwayat Saya"}
            </Link>

            {isAdmin && (
              <>
                <Link href="/admin/categories" className="bg-blue-50 text-blue-700 px-5 py-3 rounded-2xl hover:bg-blue-100 transition font-bold text-sm border border-blue-100">
                  Kelola Kategori
                </Link>
                <Link href="/admin/birds/archived" className="bg-gray-800 text-white px-5 py-3 rounded-2xl hover:bg-gray-900 transition font-bold text-sm flex items-center gap-2">
                  <Archive size={18} /> Arsip
                </Link>
                <Link href="/admin/birds" className="bg-green-600 text-white px-6 py-3 rounded-2xl hover:bg-green-700 transition font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95">
                  <Plus size={20} /> Tambah Burung
                </Link>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">Gagal memuat data: {error}</p>
          </div>
        )}

        {/* Grid Katalog */}
        <div className={`grid gap-8 ${cartItems.length > 0 && !isAdmin ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
          {birds.length > 0 ? (
            birds.map((bird) => (
              <div key={bird.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group">
                {/* Gambar Burung */}
                <div className="relative h-52 w-full overflow-hidden">
                  <img
                    src={bird.image_url || "https://via.placeholder.com/300x200?text=No+Image"}
                    alt={bird.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Konten Kartu */}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{bird.name}</h3>
                    <p className="text-gray-400 text-xs italic mb-4">{bird.species}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {Array.isArray(birdCategories[bird.id]) && birdCategories[bird.id].length > 0 ? (
                        birdCategories[bird.id].map((category) => (
                          <span key={category.id_categories} className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-blue-100">
                            {category.cat_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-300 italic">Tanpa kategori</span>
                      )}
                    </div>

                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Harga</p>
                        <p className="text-blue-700 font-black text-xl">Rp {bird.price?.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Stok</p>
                        <p className={`font-bold text-sm ${bird.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                          {bird.stock} ekor
                        </p>
                      </div>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/birds/edit/${bird.id}`}
                        className="flex-[3] bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                      >
                        <Edit size={16} /> Edit
                      </Link>
                      <button
                        onClick={() => openDeleteModal(bird.id, bird.name)}
                        className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 py-3 rounded-xl flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(bird)}
                      disabled={bird.stock <= 0}
                      className={`w-full py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm ${
                        bird.stock > 0 ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {bird.stock > 0 ? "Beli Sekarang" : "Stok Habis"}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium italic">Belum ada burung yang tersedia di katalog saat ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Side Cart (Keranjang Samping) */}
      {cartItems.length > 0 && !isAdmin && (
        <div className="fixed right-0 top-0 h-screen w-[340px] bg-white shadow-2xl border-l border-gray-100 z-40 flex flex-col animate-in slide-in-from-right duration-500">
          
          {/* Header Keranjang */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-900 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart size={18} />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Keranjang</h2>
            </div>
            <button onClick={() => setCartItems([])} className="p-1.5 hover:bg-white/20 rounded-full transition">
              <X size={18} />
            </button>
          </div>

          {/* List Item Keranjang */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm group transition-all hover:border-blue-200">
                <div className="h-16 w-16 flex-shrink-0">
                  <img
                    src={item.image_url || "https://via.placeholder.com/100x100"}
                    alt={item.name}
                    className="h-full w-full object-cover rounded-lg shadow-sm"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                  <p className="text-blue-700 font-black text-xs mb-2">Rp {item.price?.toLocaleString("id-ID")}</p>
                  
                  <div className="flex items-center justify-between">
                    {/* Controls + & - */}
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 shadow-sm">
                      <button 
                        onClick={() => updateCartQuantity(item.id, -1, item.stock)}
                        className="p-1 hover:text-blue-600 transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-gray-700">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, 1, item.stock)}
                        className="p-1 hover:text-blue-600 transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Keranjang */}
          <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Total Bayar</p>
                <p className="text-xl font-black text-blue-900">Rp {totalHarga.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <button
              onClick={handleContinuePayment}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-green-100 transition-all active:scale-95"
            >
              Bayar Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}