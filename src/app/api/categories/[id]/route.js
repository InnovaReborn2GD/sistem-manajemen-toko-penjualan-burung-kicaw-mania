import { supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id_categories', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const authCheck = await requireAdmin(req);
    if (!authCheck?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { data, error } = await supabase
      .from('categories')
      .update(body)
      .eq('id_categories', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err.status === 403) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('[PUT /api/categories/[id]]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const categoryId = Number(id);
    if (!Number.isInteger(categoryId)) {
      return new Response(JSON.stringify({ error: 'Invalid category id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authCheck = await requireAdmin(req);
    if (!authCheck?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: relationError } = await supabase
      .from('bird_categories')
      .delete()
      .eq('kategori_id', categoryId);
    if (relationError) throw relationError;

    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id_categories', categoryId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err.status === 403) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('[DELETE /api/categories/[id]]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}