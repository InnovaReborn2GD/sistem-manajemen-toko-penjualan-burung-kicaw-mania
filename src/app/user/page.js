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
} from "lucide-react";

export default function KatalogPage() {
  const [birds, setBirds] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk item yang dibeli
  const [cartItems, setCartItems] = useState([]);

  const router = useRouter();
  const supabase = useMemo(() => createClientComponent(), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: birdsData, error: birdsError } = await supabase
          .from("birds")
          .select("*");

        if (birdsError) throw birdsError;

        setBirds(birdsData || []);

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
            console.log("Profil berhasil dimuat:", profileData);
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

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Hapus burung ini? Data akan terhapus permanen.",
    );

    if (!confirmDelete) return;

    setDeletingId(id);

    try {
      const res = await fetch("/api/birds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setBirds((prev) => prev.filter((b) => b.id !== id));
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
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === bird.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
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
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                  isAdmin
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {profile.role || "user"}
              </span>

              <span className="text-xs text-gray-400">
                | ID: {profile.id.substring(0, 8)}...
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/riwayat"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            <History size={20} />
            <span className="font-semibold">Riwayat Pembelian</span>
          </Link>

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
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3">
          <AlertCircle size={20} />
          <p>Gagal memuat data: {error}</p>
        </div>
      )}

      {/* Grid Katalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {birds.length > 0 ? (
          birds.map((bird) => (
            <div
              key={bird.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all duration-300"
            >
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
                    onClick={() => handleDelete(bird.id)}
                    disabled={deletingId === bird.id}
                    className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition disabled:opacity-50"
                    title="Hapus Burung"
                  >
                    {deletingId === bird.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              )}

              <div className="overflow-hidden rounded-xl mb-4">
                <img
                  src={
                    bird.image_url ||
                    "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  alt={bird.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {bird.name}
              </h3>

              <p className="text-gray-500 text-sm italic mb-3">
                {bird.species}
              </p>

              <div className="flex justify-between items-end mt-2">
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold">
                    Harga
                  </p>

                  <p className="text-blue-700 font-extrabold text-xl">
                    Rp {bird.price?.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-gray-400 text-xs uppercase font-semibold">
                    Stok
                  </p>

                  <p
                    className={`font-bold ${
                      bird.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {bird.stock} ekor
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(bird)}
                disabled={bird.stock <= 0}
                className={`w-full mt-5 py-3 rounded-xl font-bold transition-all shadow-md ${
                  bird.stock > 0
                    ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {bird.stock > 0 ? "Beli Sekarang" : "Stok Habis"}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-lg">
              Belum ada burung yang tersedia di katalog.
            </p>
          </div>
        )}
      </div>

      {/* Card item yang ditambahkan */}
      {cartItems.length > 0 && (
        <div className="mt-12 bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 text-blue-700 p-3 rounded-full">
              <ShoppingCart size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Item yang Ditambahkan
              </h2>
              <p className="text-sm text-gray-500">
                Periksa item sebelum lanjut ke pembayaran.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={
                      item.image_url ||
                      "https://via.placeholder.com/100x100?text=No+Image"
                    }
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-xl"
                  />

                  <div>
                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500 italic">
                      {item.species}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Jumlah: {item.quantity} ekor
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5">
                  <p className="font-bold text-blue-700 text-lg">
                    Rp{" "}
                    {(Number(item.price || 0) * item.quantity).toLocaleString(
                      "id-ID",
                    )}
                  </p>

                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition"
                    title="Hapus item"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-gray-500 text-sm">Total Harga</p>
              <p className="text-2xl font-extrabold text-blue-800">
                Rp {totalHarga.toLocaleString("id-ID")}
              </p>
            </div>

            <button
              onClick={handleContinuePayment}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-md active:scale-95"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
