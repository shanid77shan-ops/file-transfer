import type { ParsedPasteContent } from '../types/file'

const URL_PATTERN = /^(https?:\/\/[^\s]+)$/i

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`
  return `https://${trimmed}`
}

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(normalizeUrl(value))
  } catch {
    return null
  }
}

function buildDisplayName(value: string, maxLength = 48): string {
  const singleLine = value.split('\n')[0]?.trim() ?? value
  if (singleLine.length <= maxLength) return singleLine
  return `${singleLine.slice(0, maxLength)}…`
}

export function parsePastedContent(raw: string): ParsedPasteContent {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('Paste a link or some text before saving.')
  }

  const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean)
  const firstLine = lines[0] ?? trimmed

  const isSingleLineUrl =
    lines.length === 1 &&
    (URL_PATTERN.test(firstLine) || tryParseUrl(firstLine) !== null)

  if (isSingleLineUrl) {
    const url = normalizeUrl(firstLine)
    const parsed = tryParseUrl(firstLine)
    const name = parsed?.hostname.replace(/^www\./, '') || buildDisplayName(firstLine)

    return {
      itemType: 'link',
      name,
      publicUrl: url,
      textContent: null,
      mimeType: 'text/uri-list',
      size: new Blob([url]).size,
    }
  }

  return {
    itemType: 'text',
    name: buildDisplayName(trimmed),
    publicUrl: '#text',
    textContent: trimmed,
    mimeType: 'text/plain',
    size: new Blob([trimmed]).size,
  }
}

export function getCopyValue(item: {
  item_type: string
  public_url: string
  text_content: string | null
}): string {
  if (item.item_type === 'text' && item.text_content) {
    return item.text_content
  }
  return item.public_url
}

export function isImageItem(mimeType: string, itemType: string): boolean {
  return itemType === 'file' && mimeType.startsWith('image/')
}

export function isVideoItem(mimeType: string, itemType: string): boolean {
  return itemType === 'file' && mimeType.startsWith('video/')
}

export function isAudioItem(mimeType: string, itemType: string): boolean {
  return itemType === 'file' && mimeType.startsWith('audio/')
}

export function isPdfItem(mimeType: string, itemType: string): boolean {
  return itemType === 'file' && mimeType.includes('pdf')
}
