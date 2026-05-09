import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ouybonjvaodvuifrsone.supabase.co';

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_y32zbEDXhC0XrCka9137yw_XnWjN79Q';

let instance: SupabaseClient | null = null;

export const createClient = (): SupabaseClient => {
  if (!instance) {
    instance = createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return instance;
};
