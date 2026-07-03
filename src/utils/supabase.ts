import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const fallbackAuth = {
  getSession: async () => ({ data: { session: null } }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signInWithPassword: async () => ({ error: { message: 'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to a .env file.' } }),
  signUp: async () => ({ data: null, error: { message: 'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to a .env file.' } } ),
  signOut: async () => ({ error: { message: 'Supabase is not configured.' } }),
  updateUser: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : { auth: fallbackAuth };
