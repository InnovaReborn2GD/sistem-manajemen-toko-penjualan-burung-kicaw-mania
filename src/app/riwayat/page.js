'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Loader2,
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

export default function RiwayatPage() {
  const router = useRouter();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRiwayat() {
      try {
        setLoading(true);

        const res = await fetch('/api/purchases');
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Gagal memuat riwayat pembelian.');
        }

        setPurchases(json.purchases || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRiwayat();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="flex items-center gap-3 text-blue-700 font-bold">
          <Loader2 className="animate-spin" size={28} />
          Memuat riwayat pembelian...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/user')}
          className="flex items-center gap-2 text-blue-700 font-semibold mb-6 hover:underline"
        >
          <ArrowLeft size={18} />
          Kembali ke Katalog
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 text-blue-700 p-3 rounded-full">
            <Receipt size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-blue-900">
              Riwayat Pembelian
            </h1>
            <p className="text-gray-500">
              Daftar transaksi pembelian burung yang sudah tersimpan di database.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {purchases.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={56} />
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              Belum Ada Riwayat Pembelian
            </h2>
            <p className="text-gray-500">
              Riwayat akan muncul setelah Anda menyelesaikan pembayaran.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-white rounded-3xl shadow-md border border-gray-100 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                        <CheckCircle size={14} />
                        Pembayaran Telah Diterima
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">
                      Tanggal:{' '}
                      {new Date(purchase.created_at).toLocaleDateString(
                        'id-ID',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      ID Transaksi: {purchase.id}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-gray-500 text-sm">Total Pembayaran</p>
                    <p className="text-2xl font-extrabold text-blue-800">
                      Rp {Number(purchase.total_price || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {purchase.purchase_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            item.image_url ||
                            'https://via.placeholder.com/100x100?text=No+Image'
                          }
                          alt={item.bird_name}
                          className="w-20 h-20 rounded-xl object-cover"
                        />

                        <div>
                          <h3 className="font-bold text-gray-800">
                            {item.bird_name}
                          </h3>
                          <p className="text-sm text-gray-500 italic">
                            {item.bird_species}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Jumlah: {item.quantity} ekor
                          </p>
                        </div>
                      </div>

                      <p className="font-bold text-blue-700 text-lg">
                        Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-blue-800 font-bold mb-2">
                      <MapPin size={18} />
                      Alamat Pengantaran
                    </div>
                    <p className="text-gray-700">{purchase.address}</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-gray-800 font-bold mb-2">
                      <CreditCard size={18} />
                      Metode Pembayaran
                    </div>
                    <p className="text-gray-700">{purchase.payment_method}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}