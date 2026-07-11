import { ExternalLink, FileText, Link2 } from 'lucide-react'
import {
  isAudioItem,
  isImageItem,
  isPdfItem,
  isVideoItem,
} from '../lib/pasteUtils'
import { getFileIcon } from '../lib/fileUtils'
import type { FileRecord } from '../types/file'

interface FilePreviewProps {
  file: FileRecord
}

export function FilePreview({ file }: FilePreviewProps) {
  const itemType = file.item_type ?? 'file'

  if (itemType === 'text' && file.text_content) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="text-xs font-medium text-slate-600">Text preview</span>
        </div>
        <p className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words px-3 py-3 text-sm leading-relaxed text-slate-700">
          {file.text_content}
        </p>
      </div>
    )
  }

  if (itemType === 'link') {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-violet-200 bg-violet-50/50">
        <div className="flex items-center gap-2 border-b border-violet-100 px-3 py-2">
          <Link2 className="h-4 w-4 text-violet-600" aria-hidden="true" />
          <span className="text-xs font-medium text-violet-700">Link preview</span>
        </div>
        <a
          href={file.public_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 px-3 py-3 text-sm text-violet-700 underline-offset-2 hover:underline"
        >
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="break-all">{file.public_url}</span>
        </a>
      </div>
    )
  }

  if (isImageItem(file.mime_type, itemType)) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <img
          src={file.public_url}
          alt={file.name}
          loading="lazy"
          className="max-h-48 w-full object-contain sm:max-h-56"
        />
      </div>
    )
  }

  if (isVideoItem(file.mime_type, itemType)) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-black">
        <video
          src={file.public_url}
          controls
          preload="metadata"
          className="max-h-48 w-full object-contain sm:max-h-56"
        >
          Your browser does not support video preview.
        </video>
      </div>
    )
  }

  if (isAudioItem(file.mime_type, itemType)) {
    return (
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <audio src={file.public_url} controls preload="metadata" className="w-full">
          Your browser does not support audio preview.
        </audio>
      </div>
    )
  }

  if (isPdfItem(file.mime_type, itemType)) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <iframe
          src={file.public_url}
          title={file.name}
          className="h-48 w-full sm:h-56"
        />
      </div>
    )
  }

  const Icon = getFileIcon(file.mime_type)

  return (
    <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 sm:h-28">
      <div className="text-center">
        <Icon className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
        <p className="mt-1 text-xs text-slate-500">No preview available</p>
      </div>
    </div>
  )
}
