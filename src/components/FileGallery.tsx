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
import { deleteItem, fetchFiles, updateItemName } from '../lib/filesApi'
import { downloadFile } from '../lib/downloadFile'
import {
  formatFileSize,
  formatUploadDate,
  getFileIcon,
} from '../lib/fileUtils'
import { getCopyValue } from '../lib/pasteUtils'
import type { FileRecord } from '../types/file'
import { EditableItemName } from './EditableItemName'
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
  const [renamingId, setRenamingId] = useState<string | null>(null)

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

  const handleRename = async (file: FileRecord, name: string) => {
    setRenamingId(file.id)
    setError(null)

    try {
      const updated = await updateItemName(file.id, name)
      setFiles((current) =>
        current.map((item) => (item.id === file.id ? updated : item)),
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not rename this item.'
      setError(message)
      throw err
    } finally {
      setRenamingId(null)
    }
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
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
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
                className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(file)}
                    disabled={deletingId === file.id}
                    aria-label={`Delete ${file.name}`}
                    className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <div className="mt-1.5">
                  <EditableItemName
                    name={file.name}
                    saving={renamingId === file.id}
                    onSave={(name) => handleRename(file, name)}
                  />
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {getItemLabel(file)} · {formatUploadDate(file.created_at)}
                  </p>
                </div>

                <FilePreview file={file} />

                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {isLink ? (
                    <button
                      type="button"
                      onClick={() => handleOpenLink(file)}
                      className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md bg-indigo-600 px-1.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Open</span>
                    </button>
                  ) : isFile ? (
                    <button
                      type="button"
                      onClick={() => void handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md bg-indigo-600 px-1.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {downloadingId === file.id ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                      ) : (
                        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span className="truncate">
                        {downloadingId === file.id ? '...' : 'Save'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleCopy(file)}
                      className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md bg-indigo-600 px-1.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800"
                    >
                      <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Copy</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleCopy(file)}
                    className="inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
                  >
                    <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {copiedId === file.id ? 'OK' : isLink ? 'URL' : 'Copy'}
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
