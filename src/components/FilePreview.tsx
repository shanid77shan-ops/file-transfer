import { ExternalLink } from 'lucide-react'
import {
  isAudioItem,
  isImageItem,
  isPdfItem,
  isVideoItem,
} from '../lib/pasteUtils'
import { getFileIcon, getPreviewTier } from '../lib/fileUtils'
import type { FileRecord } from '../types/file'

interface FilePreviewProps {
  file: FileRecord
}

const textPaddingClass = {
  compact: 'px-2 py-1.5',
  medium: 'px-2 py-2',
  expanded: 'px-2 py-2 max-h-52 overflow-y-auto',
} as const

const linkPaddingClass = {
  compact: 'px-2 py-1.5',
  medium: 'px-2 py-2',
  expanded: 'px-2 py-2.5',
} as const

const mediaMaxHeightClass = {
  compact: 'max-h-24',
  medium: 'max-h-32',
  expanded: 'max-h-44',
} as const

const pdfHeightClass = {
  compact: 'h-24',
  medium: 'h-32',
  expanded: 'h-44',
} as const

const iconHeightClass = {
  compact: 'h-12',
  medium: 'h-16',
  expanded: 'h-16',
} as const

export function FilePreview({ file }: FilePreviewProps) {
  const itemType = file.item_type ?? 'file'
  const tier = getPreviewTier(file)

  if (itemType === 'text' && file.text_content) {
    return (
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <p
          className={`whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 ${textPaddingClass[tier]}`}
        >
          {file.text_content}
        </p>
      </div>
    )
  }

  if (itemType === 'link') {
    return (
      <div
        className={`mt-2 overflow-hidden rounded-lg border border-violet-200 bg-violet-50/50 ${linkPaddingClass[tier]}`}
      >
        <a
          href={file.public_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-1.5 text-xs text-violet-700 underline-offset-2 hover:underline"
        >
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="break-all">{file.public_url}</span>
        </a>
      </div>
    )
  }

  if (isImageItem(file.mime_type, itemType)) {
    return (
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <img
          src={file.public_url}
          alt={file.name}
          loading="lazy"
          className={`w-full object-contain ${mediaMaxHeightClass[tier]}`}
        />
      </div>
    )
  }

  if (isVideoItem(file.mime_type, itemType)) {
    return (
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-black">
        <video
          src={file.public_url}
          controls
          preload="metadata"
          className={`w-full object-contain ${mediaMaxHeightClass[tier]}`}
        >
          Your browser does not support video preview.
        </video>
      </div>
    )
  }

  if (isAudioItem(file.mime_type, itemType)) {
    return (
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
        <audio src={file.public_url} controls preload="metadata" className="h-8 w-full">
          Your browser does not support audio preview.
        </audio>
      </div>
    )
  }

  if (isPdfItem(file.mime_type, itemType)) {
    return (
      <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <iframe
          src={file.public_url}
          title={file.name}
          className={`w-full ${pdfHeightClass[tier]}`}
        />
      </div>
    )
  }

  const Icon = getFileIcon(file.mime_type)

  return (
    <div
      className={`mt-2 flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 ${iconHeightClass[tier]}`}
    >
      <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
    </div>
  )
}
