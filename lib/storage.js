// lib/storage.js
// Supabase Storage client using service role key (server-side only)
// Never import this in client-side code

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[storage] Missing Supabase env vars');
}

// Service role client — bypasses RLS, server-side only
export const supabaseAdmin = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

export const BUCKET = 'forge-docs';

// Upload a file buffer to Supabase Storage
// Returns the storage path (not a public URL)
export async function uploadFile({ buffer, path, contentType }) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return data.path;
}

// Generate a signed URL for a stored file (expires in seconds)
export async function getSignedUrl(path, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

// Delete a file from storage
export async function deleteFile(path) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
  return true;
}