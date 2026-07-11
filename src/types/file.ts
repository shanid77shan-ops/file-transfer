export interface FileRecord {
  id: string
  name: string
  size: number
  mime_type: string
  storage_path: string
  public_url: string
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
