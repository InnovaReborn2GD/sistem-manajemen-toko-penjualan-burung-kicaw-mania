import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/lib/action';

export default async function Profile() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
  const { data: history } = await supabase.from('transactions').select('id, created_at, birds:bird_id(name, price)').eq('user_id', user?.id);

  if (!user) {
    return <div className="p-10">Silakan login terlebih dahulu.</div>;
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-4">Profil Pengguna</h1>
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}&background=random`}
            alt="Avatar"
            className="w-16 h-16 rounded-full"
          />
          <div>
            <p className="text-lg font-semibold">{profile?.username}</p>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">Role: {profile?.role}</p>
          </div>
        </div>

        <form action={updateProfile} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              name="username"
              defaultValue={profile?.username}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Avatar URL (opsional)</label>
            <input
              type="url"
              name="avatar_url"
              defaultValue={profile?.avatar_url}
              placeholder="https://example.com/avatar.jpg"
              className="w-full p-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Update Profil
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Riwayat Belanja</h2>
        {history?.length > 0 ? (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="border-b p-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{h.birds.name}</span>
                  <span className="text-gray-500 ml-2">Rp {h.birds.price.toLocaleString()}</span>
                </div>
                <a href={`/struk/${h.id}`} className="text-blue-500 hover:underline">Lihat Struk</a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Belum ada riwayat belanja.</p>
        )}
      </div>
    </div>
  );
}