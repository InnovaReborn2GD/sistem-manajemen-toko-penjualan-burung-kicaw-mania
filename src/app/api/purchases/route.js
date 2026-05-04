import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function createSupabaseRouteClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = await createSupabaseRouteClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User belum login.',
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id,
        address,
        payment_method,
        payment_status,
        total_price,
        created_at,
        purchase_items (
          id,
          bird_id,
          bird_name,
          bird_species,
          image_url,
          price_at_purchase,
          quantity,
          subtotal
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch purchases error:', error);

      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Gagal mengambil riwayat pembelian.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      purchases: data || [],
    });
  } catch (err) {
    console.error('Purchases API fatal error:', err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Terjadi kesalahan server.',
      },
      { status: 500 }
    );
  }
}