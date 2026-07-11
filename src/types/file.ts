export type ItemType = 'file' | 'link' | 'text'

export interface FileRecord {
  id: string
  name: string
  size: number
  mime_type: string
  storage_path: string | null
  public_url: string
  item_type: ItemType
  text_content: string | null
  created_at: string
}

export interface UploadProgress {
  fileName: string
  percent: number
}

export interface UploadResult {
  path: string
  publicUrl: string
}

export interface ParsedPasteContent {
  itemType: 'link' | 'text'
  name: string
  publicUrl: string
  textContent: string | null
  mimeType: string
  size: number
}
