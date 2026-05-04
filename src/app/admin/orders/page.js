"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        // Mengambil data dari endpoint purchases (API sudah diatur untuk Admin)
        const res = await fetch('/api/purchases'); 
        const data = await res.json();
        
        if (data.success) {
          setOrders(data.purchases || []);
        } else {
          setError(data.error || "Gagal mengambil data pesanan.");
        }
      } catch (err) {
        console.error("Gagal memuat pesanan:", err);
        setError("Terjadi kesalahan jaringan.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Tombol Kembali & Header */}
        <div className="mb-8">
          <Link 
            href="/user" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 font-bold"
          >
            <ArrowLeft size={20} /> Kembali ke Katalog
          </Link>
          
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Admin Panel</p>
            <h1 className="mt-2 text-4xl font-black text-slate-900 tracking-tight">Pesanan Masuk</h1>
            <p className="mt-2 text-slate-600 font-medium">Pantau seluruh transaksi pembelian user secara real-time.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3 shadow-sm">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Tabel Pesanan */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">ID & Pembeli</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Rincian Item</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Tanggal Transaksi</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Total Harga</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.length > 0 ? orders.map((order) => {
                  // Memastikan array item aman untuk diakses
                  const items = order.purchase_items || [];
                  const firstItem = items[0];
                  const extraItemsCount = items.length > 1 ? items.length - 1 : 0;

                  return (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                      
                      {/* Kolom Pembeli */}
                      <td className="p-6 align-top">
                        <p className="font-bold text-slate-900">{order.profiles?.username || "User Kicaw"}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold tracking-widest mt-1 uppercase">
                          #{order.id.substring(0, 8)}
                        </p>
                      </td>

                      {/* Kolom Item (Burung) */}
                      <td className="p-6 align-top">
                        <div className="flex items-start gap-3">
                          {firstItem?.image_url && (
                            <img 
                              src={firstItem.image_url} 
                              alt={firstItem.bird_name} 
                              className="w-10 h-10 object-cover rounded-lg shadow-sm border border-slate-100"
                            />
                          )}
                          <div>
                            <p className="font-bold text-slate-800 text-sm">
                              {firstItem?.bird_name || "Produk Tidak Diketahui"} 
                              <span className="text-slate-400 font-medium ml-1">x{firstItem?.quantity || 1}</span>
                            </p>
                            
                            {/* Menampilkan jumlah item lainnya jika lebih dari 1 macam burung */}
                            {extraItemsCount > 0 && (
                              <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded-md">
                                + {extraItemsCount} jenis lainnya
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kolom Tanggal */}
                      <td className="p-6 align-top">
                        <p className="text-sm font-semibold text-slate-600">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(order.created_at).toLocaleTimeString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} WIB
                        </p>
                      </td>

                      {/* Kolom Total */}
                      <td className="p-6 align-top">
                        <p className="font-black text-blue-700 text-lg">
                          Rp {order.total_price?.toLocaleString('id-ID') || 0}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          Via {order.payment_method?.replace(/_/g, ' ') || 'Sistem'}
                        </p>
                      </td>

                      {/* Kolom Status */}
                      <td className="p-6 align-top text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                          order.payment_status === 'success' || order.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {order.payment_status === 'success' || order.payment_status === 'paid' ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {order.payment_status || 'Pending'}
                        </span>
                      </td>

                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="p-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-slate-50 p-4 rounded-full">
                          <FileText size={48} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-slate-500 font-bold">Belum ada pesanan masuk.</p>
                          <p className="text-sm text-slate-400 mt-1">Transaksi dari pengguna akan muncul di sini.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}