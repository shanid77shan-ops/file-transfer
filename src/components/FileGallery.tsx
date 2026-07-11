import {
  AlertCircle,
  Copy,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { fetchFiles } from '../lib/filesApi'
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

  const handleDownload = (file: FileRecord) => {
    const anchor = document.createElement('a')
    anchor.href = file.public_url
    anchor.download = file.name
    anchor.rel = 'noopener noreferrer'
    anchor.target = '_blank'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
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
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      {loading && files.length === 0 && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          Loading files...
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && files.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-slate-500">
            No files yet. Upload your first file above.
          </p>
        </div>
      )}

      {files.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.mime_type)

            return (
              <li
                key={file.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatFileSize(file.size)} · {formatUploadDate(file.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCopyLink(file)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    {copiedId === file.id ? 'Copied!' : 'Copy Link'}
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
