'use server'

import { supabase } from './supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * CREATE: TAMBAH BURUNG
 */
export async function addBird(formData) {
  const name = formData.get('name');
  const species = formData.get('species');
  const price = parseFloat(formData.get('price'));
  const stock = parseInt(formData.get('stock'));
  const imageFile = formData.get('image_file'); 

  try {
    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bird-images').upload(fileName, imageFile);
      if (uploadError) throw new Error("Gagal upload: " + uploadError.message);
      const { data: publicUrlData } = supabase.storage.from('bird-images').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('birds').insert([
      { name, species, price, stock, image_url: imageUrl, is_hidden: false }
    ]);
    if (error) throw error;
    revalidatePath('/admin/birds');
    revalidatePath('/');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

/**
 * UPDATE: EDIT DATA BURUNG
 */
export async function updateBird(id, formData) {
  const name = formData.get('name');
  const species = formData.get('species');
  const price = parseFloat(formData.get('price'));
  const stock = parseInt(formData.get('stock'));
  const imageFile = formData.get('image_file');
  const oldImageUrl = formData.get('old_image_url');
  const isHidden = formData.get('is_hidden') === 'on'; // Checkbox mengembalikan 'on' jika dicentang

  try {
    let imageUrl = oldImageUrl;
    if (imageFile && imageFile.size > 0) {
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      await supabase.storage.from('bird-images').upload(fileName, imageFile);
      const { data } = supabase.storage.from('bird-images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from('birds')
      .update({ name, species, price, stock, image_url: imageUrl, is_hidden: isHidden })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/admin/birds');
    revalidatePath('/');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

/**
 * DELETE: HAPUS BURUNG
 */
export async function deleteBird(id) {
  try {
    const { error } = await supabase.from('birds').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/birds');
    revalidatePath('/');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}

/**
 * TOGGLE HIDE: SEMBUNYIKAN/TAMPILKAN CEPAT
 */
export async function toggleHideBird(id, currentStatus) {
  try {
    const { error } = await supabase.from('birds')
      .update({ is_hidden: !currentStatus })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/birds');
    revalidatePath('/');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
  
}