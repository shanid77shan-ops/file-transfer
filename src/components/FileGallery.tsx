import {
  AlertCircle,
  Copy,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { fetchFiles } from '../lib/filesApi'
import { downloadFile } from '../lib/downloadFile'
import {
  formatFileSize,
  formatUploadDate,
  getFileIcon,
} from '../lib/fileUtils'
import type { FileRecord } from '../types/file'

interface FileGalleryProps {
  refreshKey: number
}

export function FileGallery({ refreshKey }: FileGalleryProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

  const handleCopyLink = async (file: FileRecord) => {
    try {
      await navigator.clipboard.writeText(file.public_url)
      setCopiedId(file.id)
      window.setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setError('Could not copy link. Your browser may have blocked clipboard access.')
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

  return (
    <section className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Your files
          </h2>
          <p className="text-sm text-slate-500">
            Download or share links from any device
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadFiles()}
          disabled={loading}
          aria-label="Refresh file list"
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
          Loading files...
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
            No files yet. Upload your first file above.
          </p>
        </div>
      )}

      {files.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {files.map((file) => {
            const Icon = getFileIcon(file.mime_type)

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
                      <span>{formatFileSize(file.size)}</span>
                      <span className="hidden sm:inline" aria-hidden="true">
                        ·
                      </span>
                      <span className="block w-full sm:inline sm:w-auto">
                        {formatUploadDate(file.created_at)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
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

                  <button
                    type="button"
                    onClick={() => void handleCopyLink(file)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 sm:gap-2 sm:px-3"
                  >
                    <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {copiedId === file.id ? 'Copied!' : 'Copy Link'}
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
