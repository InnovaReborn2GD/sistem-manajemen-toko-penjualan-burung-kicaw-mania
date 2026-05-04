import { supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[GET /api/categories]', err);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req) {
  try {
    const authCheck = await requireAdmin(req);
    if (!authCheck?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { cat_name, cat_desc = null, habitat = null } = body;

    if (!cat_name) {
      return new Response(JSON.stringify({ error: 'cat_name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ cat_name, cat_desc, habitat }])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err.status === 403) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('[POST /api/categories]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}