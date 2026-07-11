import {
  AlertCircle,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { deleteItem, fetchFiles } from '../lib/filesApi'
import { downloadFile } from '../lib/downloadFile'
import {
  formatFileSize,
  formatUploadDate,
  getFileIcon,
} from '../lib/fileUtils'
import { getCopyValue } from '../lib/pasteUtils'
import type { FileRecord } from '../types/file'
import { FilePreview } from './FilePreview'

interface FileGalleryProps {
  refreshKey: number
}

function getItemLabel(file: FileRecord): string {
  if (file.item_type === 'link') return 'Link'
  if (file.item_type === 'text') return 'Text'
  return formatFileSize(file.size)
}

export function FileGallery({ refreshKey }: FileGalleryProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchFiles()
      setFiles(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load files.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFiles()
  }, [loadFiles, refreshKey])

  const handleCopy = async (file: FileRecord) => {
    try {
      await navigator.clipboard.writeText(getCopyValue(file))
      setCopiedId(file.id)
      window.setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setError('Could not copy. Your browser may have blocked clipboard access.')
    }
  }

  const handleDownload = async (file: FileRecord) => {
    setDownloadingId(file.id)
    setError(null)

    try {
      await downloadFile(file.public_url, file.name)
    } catch {
      setError(`Could not download "${file.name}". Please try again.`)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleOpenLink = (file: FileRecord) => {
    window.open(file.public_url, '_blank', 'noopener,noreferrer')
  }

  const handleDelete = async (file: FileRecord) => {
    const confirmed = window.confirm(`Delete "${file.name}"? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(file.id)
    setError(null)

    try {
      await deleteItem(file)
      await loadFiles()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not delete this item.'
      setError(message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Your items
          </h2>
          <p className="text-sm text-slate-500">
            Files, links, and text — with previews
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadFiles()}
          disabled={loading}
          aria-label="Refresh list"
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-h-0 sm:px-3 sm:py-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      {loading && files.length === 0 && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-12 text-sm text-slate-500 sm:px-6 sm:py-16">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          Loading...
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 break-words">{error}</p>
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center sm:px-6 sm:py-16">
          <p className="text-sm text-slate-500">
            Nothing here yet. Upload a file or paste a link above.
          </p>
        </div>
      )}

      {files.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => {
            const isFile = (file.item_type ?? 'file') === 'file'
            const isLink = file.item_type === 'link'
            const Icon =
              file.item_type === 'link'
                ? Link2
                : file.item_type === 'text'
                  ? FileText
                  : getFileIcon(file.mime_type)

            return (
              <li
                key={file.id}
                className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate font-medium text-slate-900"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                      <span>{getItemLabel(file)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatUploadDate(file.created_at)}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(file)}
                    disabled={deletingId === file.id}
                    aria-label={`Delete ${file.name}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <FilePreview file={file} />

                <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
                  {isLink ? (
                    <button
                      type="button"
                      onClick={() => handleOpenLink(file)}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-2 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:gap-2 sm:px-3"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">Open</span>
                    </button>
                  ) : isFile ? (
                    <button
                      type="button"
                      onClick={() => void handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-2 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-70 sm:gap-2 sm:px-3"
                    >
                      {downloadingId === file.id ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                      <span className="truncate">
                        {downloadingId === file.id ? 'Saving...' : 'Download'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleCopy(file)}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-2 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:gap-2 sm:px-3"
                    >
                      <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">Copy Text</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleCopy(file)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 sm:gap-2 sm:px-3"
                  >
                    <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {copiedId === file.id ? 'Copied!' : isLink ? 'Copy URL' : 'Copy'}
                    </span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
