import type { FileRecord, ItemType } from '../types/file'
import { getSupabaseClient } from './supabaseClient'
import { BUCKET_NAME } from './uploadFile'

export async function fetchFiles(): Promise<FileRecord[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load files: ${error.message}`)
  }

  return (data ?? []).map(normalizeFileRecord)
}

function normalizeFileRecord(record: FileRecord): FileRecord {
  return {
    ...record,
    item_type: record.item_type ?? 'file',
    text_content: record.text_content ?? null,
    storage_path: record.storage_path ?? null,
  }
}

export async function createFileRecord(input: {
  name: string
  size: number
  mimeType: string
  storagePath: string | null
  publicUrl: string
  itemType?: ItemType
  textContent?: string | null
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
      item_type: input.itemType ?? 'file',
      text_content: input.textContent ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to save file metadata: ${error.message}`)
  }

  return normalizeFileRecord(data as FileRecord)
}

export async function createPasteRecord(input: {
  name: string
  size: number
  mimeType: string
  publicUrl: string
  itemType: 'link' | 'text'
  textContent: string | null
}): Promise<FileRecord> {
  const storagePath =
    input.itemType === 'link'
      ? `link/${Date.now()}`
      : `text/${Date.now()}`

  return createFileRecord({
    name: input.name,
    size: input.size,
    mimeType: input.mimeType,
    storagePath,
    publicUrl: input.publicUrl,
    itemType: input.itemType,
    textContent: input.textContent,
  })
}

export async function updateItemName(id: string, name: string): Promise<FileRecord> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('files')
    .update({ name })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to rename item: ${error.message}`)
  }

  if (!data) {
    throw new Error(
      'Rename failed — permission denied. Run migration 005_add_update_policies.sql in Supabase.',
    )
  }

  return normalizeFileRecord(data as FileRecord)
}

export async function deleteItem(file: FileRecord): Promise<void> {
  const supabase = getSupabaseClient()
  const itemType = file.item_type ?? 'file'

  const { data, error } = await supabase
    .from('files')
    .delete()
    .eq('id', file.id)
    .select('id')

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`)
  }

  if (!data || data.length === 0) {
    throw new Error(
      'Delete failed — permission denied. Ask the app owner to enable delete policies in Supabase.',
    )
  }

  if (itemType === 'file' && file.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([file.storage_path])

    if (storageError) {
      console.warn('Storage cleanup failed:', storageError.message)
    }
  }
}
