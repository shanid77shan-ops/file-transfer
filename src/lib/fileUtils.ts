import type { LucideIcon } from 'lucide-react'
import { File, FileAudio, FileImage, FileText, FileVideo } from 'lucide-react'
import type { FileRecord } from '../types/file'

export type PreviewTier = 'compact' | 'medium' | 'expanded'

export function getPreviewTier(file: FileRecord): PreviewTier {
  const itemType = file.item_type ?? 'file'

  if (itemType === 'text' && file.text_content) {
    const content = file.text_content
    const lineCount = content.split('\n').length
    if (content.length <= 50 && lineCount <= 2) return 'compact'
    if (content.length <= 180 && lineCount <= 6) return 'medium'
    return 'expanded'
  }

  if (itemType === 'link') {
    const length = file.public_url.length
    if (length <= 40) return 'compact'
    if (length <= 85) return 'medium'
    return 'expanded'
  }

  if (itemType === 'file') {
    if (file.mime_type.startsWith('audio/')) return 'compact'
    if (
      file.mime_type.startsWith('image/') ||
      file.mime_type.startsWith('video/') ||
      file.mime_type.includes('pdf')
    ) {
      return 'medium'
    }
  }

  return 'compact'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** exponent

  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function formatUploadDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate))
}

export function getFileIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.startsWith('audio/')) return FileAudio
  if (mimeType.startsWith('video/')) return FileVideo
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet')
  ) {
    return FileText
  }
  return File
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function buildStoragePath(fileName: string): string {
  return `${Date.now()}-${sanitizeFileName(fileName)}`
}
