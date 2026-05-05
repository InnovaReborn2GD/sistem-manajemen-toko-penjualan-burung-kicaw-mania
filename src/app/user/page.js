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
  Tag, // Tambahkan icon Tag untuk mempercantik kategori (opsional)
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

  // --- STATE KERANJANG & NOTIFIKASI ---
  const [pendingCount, setPendingCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const router = useRouter();
  const supabase = useMemo(() => createClientComponent(), []);

  // 1. Ambil data keranjang dari LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("activeCartKicau");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCartItems(parsed);
      } catch (e) {
        console.error("Gagal memuat keranjang:", e);
      }
    }
    setIsInitialLoad(false);
  }, []);

  // 2. Simpan keranjang ke LocalStorage
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem("activeCartKicau", JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialLoad]);

  // 3. Lock Scroll Latar Belakang
  useEffect(() => {
    if (isCartOpen || showDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen, showDeleteModal]);

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
          ? categoriesResponse.reduce((acc, cat) => ({ ...acc, [cat.id_categories]: cat }), {})
          : {};

        const groupedCategories = Array.isArray(relationsResponse)
          ? relationsResponse.reduce((acc, rel) => {
              if (!acc[rel.bird_id]) acc[rel.bird_id] = [];
              const cat = categoriesById[rel.kategori_id];
              if (cat) acc[rel.bird_id].push(cat);
              return acc;
            }, {})
          : {};

        setBirdCategories(groupedCategories);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
          if (profileData) {
            setProfile(profileData);
            if (profileData.role?.toLowerCase() === "admin") fetchPendingCount();
          }
        }
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    fetchData();
  }, [supabase]);

  const fetchPendingCount = async () => {
    const { count } = await supabase.from("purchases").select("*", { count: "exact", head: true }).eq("payment_status", "pending");
    setPendingCount(count || 0);
  };

  const isAdmin = profile?.role?.toLowerCase() === "admin";

  // --- FUNGSI PENGHAPUSAN ---
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
      }
    } catch (err) { alert(err.message); } finally { setDeletingId(null); }
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
      }
    } catch (err) { alert(err.message); } finally { setDeletingId(null); }
  }

  // --- FUNGSI KERANJANG ---
  function updateCartQuantity(bird, delta) {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === bird.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + delta;
        if (newQuantity < 1) return prev.filter((item) => item.id !== bird.id);
        if (newQuantity > bird.stock) {
          alert("Stok tidak mencukupi");
          return prev;
        }
        return prev.map((item) => item.id === bird.id ? { ...item, quantity: newQuantity } : item);
      }
      return delta > 0 ? [...prev, { ...bird, quantity: 1 }] : prev;
    });
  }

  function handleContinuePayment() {
    localStorage.setItem("checkoutItems", JSON.stringify(cartItems));
    router.push("/pembayaran");
  }

  const totalHarga = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="bg-gray-50 min-h-screen relative overflow-x-hidden">
      
      {/* DRAWER OVERLAY */}
      {isCartOpen && <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />}

      {/* MODAL KONFIRMASI HAPUS */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-4"><AlertCircle size={32} /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Arsipkan atau Hapus Burung?</h3>
              <p className="text-gray-500 mb-8 text-sm">Pilih tindakan untuk <strong>{selectedBirdName}</strong>:</p>
              <div className="flex flex-col gap-3 w-full">
                <div className="flex gap-2">
                  <button onClick={confirmSoftDelete} disabled={deletingId !== null} className="flex-1 py-3 bg-yellow-500 text-white font-bold rounded-2xl flex justify-center items-center gap-2">
                    {deletingId === selectedBirdId ? <Loader2 className="animate-spin" size={18} /> : "Arsipkan"}
                  </button>
                  <button onClick={confirmHardDelete} disabled={deletingId !== null} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl flex justify-center items-center gap-2">
                    {deletingId === selectedBirdId ? <Loader2 className="animate-spin" size={18} /> : "Hapus"}
                  </button>
                </div>
                <button onClick={() => setShowDeleteModal(false)} disabled={deletingId !== null} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">Katalog Kicaw</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isAdmin ? "bg-red-500" : "bg-blue-600"} text-white`}>
                {profile?.role || "user"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link href={isAdmin ? "/admin/orders" : "/riwayat"} className="relative flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-3 rounded-2xl hover:bg-gray-50 transition shadow-sm font-bold text-sm">
              <History size={18} />
              {isAdmin ? "Pesanan Masuk" : "Riwayat Saya"}
              {isAdmin && pendingCount > 0 && <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white">{pendingCount}</span>}
            </Link>

            {!isAdmin && (
              <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl hover:bg-blue-700 transition shadow-lg font-bold text-sm">
                <ShoppingCart size={18} /> Keranjang
                {cartItems.length > 0 && <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white animate-bounce">{cartItems.length}</span>}
              </button>
            )}

            {isAdmin && (
              <>
                <Link href="/admin/categories" className="bg-blue-50 text-blue-700 px-5 py-3 rounded-2xl transition font-bold text-sm border border-blue-100">Kelola Kategori</Link>
                <Link href="/admin/birds/archived" className="bg-gray-800 text-white px-5 py-3 rounded-2xl transition font-bold text-sm flex items-center gap-2"><Archive size={18} /> Arsip</Link>
                <Link href="/admin/birds" className="bg-green-600 text-white px-6 py-3 rounded-2xl transition font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95"><Plus size={20} /> Tambah Burung</Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {birds.map((bird) => {
            const itemInCart = cartItems.find(item => item.id === bird.id);
            // MENGAMBIL KATEGORI UNTUK BURUNG INI
            const bCats = birdCategories[bird.id] || [];

            return (
              <div key={bird.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                <div className="relative h-52 w-full overflow-hidden">
                  <img src={bird.image_url || "https://via.placeholder.com/300x200"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={bird.name} />
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{bird.name}</h3>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs italic mb-2">{bird.species}</p>
                    
                    {/* --- TAMPILAN BADGE KATEGORI --- */}
                    {bCats.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {bCats.map((cat, idx) => (
                          <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-bold uppercase tracking-wider border border-indigo-100">
                            <Tag size={10} />
                            {cat.cat_name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-end mb-6 mt-auto">
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase">Harga</p><p className="text-blue-700 font-black text-xl">Rp {bird.price?.toLocaleString("id-ID")}</p></div>
                      <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase">Stok</p><p className={`font-bold text-sm ${bird.stock > 0 ? "text-green-600" : "text-red-600"}`}>{bird.stock} ekor</p></div>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="flex gap-2">
                      <Link href={`/admin/birds/edit/${bird.id}`} className="flex-1 bg-yellow-400 text-white py-3 rounded-xl flex justify-center font-bold transition hover:bg-yellow-500"><Edit size={18} /></Link>
                      <button onClick={() => {setSelectedBirdId(bird.id); setSelectedBirdName(bird.name); setShowDeleteModal(true);}} className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl flex justify-center transition hover:bg-red-200"><Trash2 size={18} /></button>
                    </div>
                  ) : (
                    <div className="h-14">
                      {itemInCart ? (
                        <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-600 rounded-xl p-1 h-full animate-in zoom-in-95 duration-200">
                          <button onClick={() => updateCartQuantity(bird, -1)} className="w-10 h-10 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 transition"><Minus size={18} /></button>
                          <span className="font-black text-blue-900 text-lg">{itemInCart.quantity}</span>
                          <button onClick={() => updateCartQuantity(bird, 1)} className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"><Plus size={18} /></button>
                        </div>
                      ) : (
                        <button onClick={() => updateCartQuantity(bird, 1)} disabled={bird.stock <= 0} className={`w-full h-full rounded-xl font-bold transition-all shadow-md active:scale-95 ${bird.stock > 0 ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400"}`}>
                          {bird.stock > 0 ? "Beli Sekarang" : "Habis"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DRAWER KERANJANG */}
      <div className={`fixed right-0 top-0 h-screen w-[380px] bg-white shadow-2xl z-[70] flex flex-col transition-transform duration-500 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 border-b flex items-center justify-between bg-blue-900 text-white">
          <div className="flex items-center gap-3"><ShoppingCart size={22} /><h2 className="text-xl font-black tracking-tight">Keranjang Anda</h2></div>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/20 rounded-full"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400"><ShoppingCart size={64} className="mb-4 opacity-20" /><p className="font-bold italic">Keranjang masih kosong</p></div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                <img src={item.image_url} className="h-20 w-20 object-cover rounded-xl shadow-sm" alt="" />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                  <p className="text-blue-600 font-black text-xs">Rp {item.price.toLocaleString("id-ID")} x {item.quantity}</p>
                  <p className="text-gray-900 font-bold text-sm mt-1">Total: Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                </div>
                <button onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t bg-white shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between mb-6"><span className="text-gray-400 font-bold uppercase text-xs">Total Pembayaran</span><span className="text-2xl font-black text-blue-900">Rp {totalHarga.toLocaleString("id-ID")}</span></div>
            <button onClick={handleContinuePayment} className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95">PROSES PEMBAYARAN</button>
          </div>
        )}
      </div>
    </div>
  );
}