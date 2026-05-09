/// <reference types="vite/client" />
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  'https://ouybonjvaodvuifrsone.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_y32zbEDXhC0XrCka9137yw_XnWjN79Q';

let instance: SupabaseClient | null = null;

export const createClient = (): SupabaseClient => {
  if (!instance) {
    instance = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }
  return instance;
};
