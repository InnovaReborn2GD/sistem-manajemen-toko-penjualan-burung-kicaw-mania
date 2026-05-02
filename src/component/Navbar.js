// src/component/Navbar.js
'use client'
import { createClientComponent } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [supabase, setSupabase] = useState(null)

  useEffect(() => {
    const sb = createClientComponent()
    setSupabase(sb)

    const getInitialAuth = async () => {
      const { data: { session } } = await sb.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      }
    }
    getInitialAuth()

    const { data: authListener } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        window.location.href = '/auth/login'
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">Kicau Mania</Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/user">Katalog</Link>
              {profile?.role === 'admin' && <Link href="/admin/birds">Admin</Link>}
              <button onClick={() => supabase?.auth.signOut()} className="bg-red-500 px-3 py-1 rounded">Logout</button>
            </>
          ) : (
            <Link href="/auth/login" className="bg-white text-blue-600 px-4 py-2 rounded">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}