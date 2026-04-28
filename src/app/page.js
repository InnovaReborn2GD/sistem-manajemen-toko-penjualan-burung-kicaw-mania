export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-10">
      <h1 className="text-5xl font-extrabold text-blue-900 mb-4">Selamat Datang di Kicaw Mania</h1>
      <p className="text-gray-600 text-lg mb-8 max-w-2xl">
        Temukan berbagai jenis burung kicau berkualitas dengan sistem manajemen transparan dan terpercaya.
      </p>
      <div className="space-x-4">
        <a href="/user" className="bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-800 transition">
          Mulai Belanja
        </a>
        <a href="/auth/signup" className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition">
          Daftar Akun
        </a>
      </div>
    </div>
  );
}