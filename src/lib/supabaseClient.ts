import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export function getMissingEnvVars(): string[] {
  const missing: string[] = []
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  return missing
}

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      `Missing environment variables: ${getMissingEnvVars().join(', ')}`,
    )
  }

  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!)
  }

  return client
}

export function getSupabaseConfig() {
  return {
    url: supabaseUrl ?? '',
    anonKey: supabaseAnonKey ?? '',
  }
}
