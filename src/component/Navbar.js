"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClientComponent } from "@/lib/supabase";
import { User, Bird, LayoutDashboard, ShoppingBag, History } from "lucide-react";

export default function Navbar() {
  const [profile, setProfile] = useState(null);
  const pathname = usePathname();
  const supabase = createClientComponent();

  useEffect(() => {
    async function getProfile() {
      // Mengambil sesi user aktif
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Mengambil data detail dari tabel profiles berdasarkan ID user
        const { data } = await supabase
          .from("profiles")
          .select("username, role")
          .eq("id", user.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    }
    getProfile();
  }, [supabase, pathname]); // Re-fetch data setiap kali pindah halaman

  // Link Navigasi Default
  const navLinks = [
    { name: "Katalog", href: "/user", icon: Bird },
    { name: "Riwayat", href: "/riwayat", icon: History },
  ];

  // Tambahkan Menu Dashboard jika user adalah Admin
  if (profile?.role === "admin") {
    navLinks.unshift({ name: "Dashboard", href: "/admin/orders", icon: LayoutDashboard });
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Kicaw Mania */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Bird className="text-white" size={20} />
            </div>
            <span className="text-lg font-black tracking-tighter text-gray-900">
              KICAW<span className="text-blue-600">MANIA</span>
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Profile Section */}
          <div className="flex items-center gap-4">
            {profile ? (
              <Link 
                href="/profile" 
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-2xl border border-gray-100 transition shadow-sm"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Profil</p>
                  <p className="text-xs font-bold text-gray-800">{profile.username}</p>
                </div>
                {/* Ikon Lingkaran dengan Inisial Nama */}
                <div className="w-9 h-9 bg-blue-600 rounded-full flex justify-center items-center text-white font-black text-sm shadow-md shadow-blue-100">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (
              <Link 
                href="/auth/login" 
                className="text-sm font-bold text-white bg-blue-600 px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
              >
                Masuk
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}