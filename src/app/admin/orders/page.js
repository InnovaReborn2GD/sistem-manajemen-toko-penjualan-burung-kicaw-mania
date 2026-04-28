import { supabase } from '@/lib/supabase';

export default async function AdminOrders() {
  const { data: orders } = await supabase
    .from('transactions')
    .select(`id, created_at, profiles:user_id(username), birds:bird_id(name, price)`)
    .order('created_at', { ascending: false });

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Laporan Penjualan (Join Data)</h1>
      <table className="w-full border">
        <thead><tr className="bg-gray-100"><th>ID</th><th>Pembeli</th><th>Burung</th><th>Harga</th></tr></thead>
        <tbody>
          {orders?.map(o => (
            <tr key={o.id} className="text-center">
              <td>TX-{o.id}</td>
              <td>{o.profiles?.username}</td>
              <td>{o.birds?.name}</td>
              <td>Rp {o.birds?.price.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}