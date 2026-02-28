import { createClient } from '@supabase/supabase-js';

// These will be filled by the user in .env or during deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for the centralized LifeOS data storage
export const SYNC_TABLE = 'lifeos_sync';
