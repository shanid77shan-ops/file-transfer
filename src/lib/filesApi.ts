import type { FileRecord } from '../types/file'
import { getSupabaseClient } from './supabaseClient'

export async function fetchFiles(): Promise<FileRecord[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load files: ${error.message}`)
  }

  return (data ?? []) as FileRecord[]
}

export async function createFileRecord(input: {
  name: string
  size: number
  mimeType: string
  storagePath: string
  publicUrl: string
}): Promise<FileRecord> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('files')
    .insert({
      name: input.name,
      size: input.size,
      mime_type: input.mimeType,
      storage_path: input.storagePath,
      public_url: input.publicUrl,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to save file metadata: ${error.message}`)
  }

  return data as FileRecord
}
