import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export function createServerClient(useServiceRole = false) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const key = useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : supabaseAnonKey

  return createClient(supabaseUrl, key)
}