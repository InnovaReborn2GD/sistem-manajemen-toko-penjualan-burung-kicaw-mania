"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, ArrowUpDown, MapPin, CreditCard, 
  RefreshCw, Eye, X, Package, Calendar, ChevronLeft, ChevronRight 
} from "lucide-react";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // State untuk loading saat mengubah status
  const [updatingId, setUpdatingId] = useState(null);

  // State untuk Fitur Search, Filter, Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // Default terbaru

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Mencegah scroll pada body saat modal terbuka
  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showDetailModal]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders'); 
      const data = await res.json();
      if (data.success) {
        setOrders(data.purchases || []);
      } else {
        setError(data.error || "Gagal mengambil data pesanan.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      setUpdatingId(orderId); 
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, payment_status: newStatus }));
        }
      }
    } catch (err) {
      alert("Gagal memperbarui status.");
    } finally {
      setUpdatingId(null);
    }
  }

  // --- LOGIKA FILTERING & SORTING ---
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Filtering (Search)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((o) => 
        o.id.toLowerCase().includes(lowerSearch) || 
        (o.profiles?.username || "").toLowerCase().includes(lowerSearch) ||
        o.purchase_items?.some(item => (item.bird_name || "").toLowerCase().includes(lowerSearch))
      );
    }

    // 2. Filtering (Status)
    if (statusFilter !== "all") {
      result = result.filter((o) => {
        const status = (o.payment_status || "pending").toLowerCase();
        if (statusFilter === "success") return ["success", "paid", "telah diterima", "selesai"].includes(status);
        if (statusFilter === "pending") return ["pending", "belum dibayar"].includes(status);
        if (statusFilter === "diproses") return ["diproses", "dikirim"].includes(status);
        return true;
      });
    }

    // 3. Sorting (Pengurutan)
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "highest") return b.total_price - a.total_price;
      if (sortBy === "lowest") return a.total_price - b.total_price;
      return 0;
    });

    return result;
  }, [orders, searchTerm, statusFilter, sortBy]);

  // --- LOGIKA DATA PAGINATION ---
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen relative overflow-x-hidden">
      
      {/* --- MODAL DETAIL PESANAN --- */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col border border-slate-100">
            {/* Header Modal */}
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Rincian Transaksi</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">ID: #{selectedOrder.id.substring(0, 12)}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"><Calendar size={12}/> {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Nama Pembeli</p>
                  <p className="font-extrabold text-slate-800 text-lg">{selectedOrder.profiles?.username || "N/A"}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Metode Pembayaran</p>
                  <p className="font-extrabold text-slate-800 text-lg uppercase tracking-tight">{selectedOrder.payment_method?.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex gap-5">
                <div className="bg-blue-500 p-3 rounded-2xl h-fit text-white shadow-lg shadow-blue-200">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1 tracking-widest">Alamat Pengiriman Lengkap</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedOrder.address || "Alamat belum diatur."}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 px-1 flex items-center gap-2 tracking-widest">
                  <Package size={14} /> Daftar Produk ({selectedOrder.purchase_items?.length})
                </p>
                <div className="space-y-4">
                  {selectedOrder.purchase_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-5 p-5 border border-slate-100 rounded-3xl bg-white hover:border-blue-200 transition-colors shadow-sm">
                      <img src={item.image_url} className="w-20 h-20 object-cover rounded-2xl shadow-sm border border-slate-50" alt={item.bird_name} />
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-base">{item.bird_name}</p>
                        <p className="text-xs font-bold text-slate-400 mb-2">{item.bird_species}</p>
                        <p className="text-xs font-black text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-lg">Rp {item.price_at_purchase?.toLocaleString('id-ID')} x {item.quantity}</p>
                      </div>
                      <div className="text-right font-black text-slate-900 text-lg">
                        Rp {item.subtotal?.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pembayaran</p>
                <p className="text-3xl font-black text-blue-700">Rp {selectedOrder.total_price?.toLocaleString('id-ID')}</p>
              </div>
              <div className="px-6 py-3 bg-white border border-slate-200 shadow-sm rounded-2xl text-xs font-black uppercase text-slate-700 tracking-widest">
                {selectedOrder.payment_status}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/user" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 font-bold text-sm">
            <ArrowLeft size={18} /> Kembali ke Katalog
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pesanan Masuk</h1>
          <p className="mt-2 text-slate-600 font-medium">Kelola dan ubah status transaksi penjualan burung.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3 shadow-sm">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* CONTROLS (Search, Filter, Sort, Row Count) */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Username, ID, atau Burung..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Filter Status */}
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="diproses">Proses</option>
              <option value="success">Selesai</option>
            </select>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={sortBy} 
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="highest">Termahal</option>
                <option value="lowest">Termurah</option>
              </select>
            </div>

            {/* Row Count */}
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
               <span className="text-xs font-bold text-slate-400 uppercase">Baris:</span>
               <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
               >
                 <option value={5}>5</option>
                 <option value={10}>10</option>
                 <option value={20}>20</option>
                 <option value={50}>50</option>
               </select>
            </div>
          </div>
        </div>

        {/* TABEL */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400">
                  <th className="p-6 text-[11px] font-black uppercase tracking-widest">Pembeli & ID Pesanan</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-widest text-center">Rincian Item</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-widest w-64">Pengiriman & Pembayaran</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-widest">Tanggal & Total</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-widest text-right">Ubah Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedOrders.length > 0 ? paginatedOrders.map((order) => {
                  const items = order.purchase_items || [];
                  const firstItem = items[0];
                  const extraItemsCount = items.length > 1 ? items.length - 1 : 0;
                  
                  const isSelesai = ["success", "paid", "telah diterima", "selesai"].includes(order.payment_status?.toLowerCase());
                  const isProcessing = ["diproses", "dikirim"].includes(order.payment_status?.toLowerCase());

                  return (
                    <tr key={order.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-6 align-top">
                        <div className="flex items-center gap-3 group">
                          <button 
                            onClick={() => openDetail(order)}
                            className="p-2.5 bg-white hover:bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all active:scale-95"
                            title="Cek Detail"
                          >
                            <Eye size={18} />
                          </button>
                          <div>
                            <p className="font-extrabold text-slate-900 text-base">{order.profiles?.username || "User"}</p>
                            <p className="text-[10px] text-blue-500 font-mono font-bold tracking-widest mt-1 uppercase bg-blue-50 inline-block px-2 py-0.5 rounded">
                              #{order.id.substring(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-6 align-top">
                        <div className="flex items-start gap-3">
                          {firstItem?.image_url && (
                            <img src={firstItem.image_url} alt={firstItem.bird_name} className="w-12 h-12 object-cover rounded-xl shadow-sm border border-slate-100" />
                          )}
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{firstItem?.bird_name || "Produk"} <span className="text-slate-400 font-medium ml-1">x{firstItem?.quantity || 1}</span></p>
                            {extraItemsCount > 0 && <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mt-1.5 bg-emerald-50 inline-block px-2 py-0.5 rounded-md">+ {extraItemsCount} lainnya</p>}
                          </div>
                        </div>
                      </td>

                      <td className="p-6 align-top text-center">
                        <div className="space-y-3">
                          <div className="flex gap-2 text-xs">
                            <MapPin size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="font-semibold text-slate-600 leading-relaxed line-clamp-2">{order.address || "No Address"}</p>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <CreditCard size={16} className="text-blue-400 flex-shrink-0" />
                            <p className="font-bold text-slate-700 uppercase tracking-wide">{order.payment_method?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-6 align-top">
                        <p className="font-black text-blue-700 text-lg">Rp {order.total_price?.toLocaleString('id-ID')}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                      </td>

                      <td className="p-6 align-top text-right">
                        {isSelesai ? (
                          <div className="inline-flex items-center justify-center gap-2 w-44 py-2.5 bg-[#f0fff4] text-[#22c55e] border border-[#dcfce7] rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                            <CheckCircle2 size={16} /> SELESAI
                          </div>
                        ) : (
                          <div className="relative inline-block w-44">
                            {updatingId === order.id ? (
                              <div className="flex items-center justify-center p-2"><RefreshCw size={18} className="animate-spin text-blue-600" /></div>
                            ) : (
                              <select
                                value={order.payment_status || "pending"}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`w-full appearance-none cursor-pointer outline-none pl-4 pr-10 py-2.5 rounded-full text-xs font-black shadow-sm border transition-all text-center uppercase tracking-widest ${
                                  isProcessing ? "bg-[#eff6ff] text-[#2563eb] border-[#dbeafe]" : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="diproses">Diproses</option>
                                <option value="dikirim">Dikirim</option>
                                <option value="dibatalkan">Batal</option>
                              </select>
                            )}
                            <ArrowUpDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 opacity-60" />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="p-24 text-center">
                      <p className="text-slate-600 text-lg font-bold">Pesanan Tidak Ditemukan</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- FOOTER PAGINATION --- */}
          {filteredAndSortedOrders.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Halaman <span className="text-slate-700">{currentPage}</span> dari <span className="text-slate-700">{totalPages}</span>
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${
                            currentPage === pageNum 
                            ? "bg-blue-600 border-blue-600 text-white shadow-lg" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}