import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createFileRecord } from '../lib/filesApi'
import { uploadFileWithProgress } from '../lib/uploadFile'

interface FileDropzoneProps {
  onUploadComplete: () => void
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; percent: number }
  | { status: 'success'; fileName: string }
  | { status: 'error'; message: string }

export function FileDropzone({ onUploadComplete }: FileDropzoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploadState({ status: 'uploading', fileName: file.name, percent: 0 })

      try {
        const { path, publicUrl } = await uploadFileWithProgress(file, (percent) => {
          setUploadState({ status: 'uploading', fileName: file.name, percent })
        })

        await createFileRecord({
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          storagePath: path,
          publicUrl,
        })

        setUploadState({ status: 'success', fileName: file.name })
        onUploadComplete()

        window.setTimeout(() => {
          setUploadState({ status: 'idle' })
        }, 2500)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Upload failed. Please try again.'
        setUploadState({ status: 'error', message })
      }
    },
    [onUploadComplete],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: false,
    disabled: uploadState.status === 'uploading',
  })

  const isUploading = uploadState.status === 'uploading'

  return (
    <section className="w-full">
      <div
        {...getRootProps()}
        className={[
          'relative flex min-h-[11rem] cursor-pointer touch-manipulation select-none flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors active:scale-[0.99] sm:min-h-52 sm:px-6 sm:py-8 lg:min-h-56',
          isDragActive && !isDragReject
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50 active:border-indigo-400 active:bg-indigo-50/50',
          isDragReject ? 'border-red-400 bg-red-50' : '',
          isUploading ? 'pointer-events-none opacity-80' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input {...getInputProps()} />

        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 sm:h-12 sm:w-12">
          {isUploading ? (
            <Loader2 className="h-7 w-7 animate-spin sm:h-6 sm:w-6" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-7 w-7 sm:h-6 sm:w-6" aria-hidden="true" />
          )}
        </div>

        <p className="text-base font-medium text-slate-900 sm:hidden">
          {isDragActive ? 'Drop your file here' : 'Tap to upload a file'}
        </p>
        <p className="hidden text-base font-medium text-slate-900 sm:block sm:text-lg">
          {isDragActive ? 'Drop your file here' : 'Drag & drop a file here'}
        </p>
        <p className="mt-1 text-sm text-slate-500 sm:hidden">
          Choose from photos, files, or documents
        </p>
        <p className="mt-1 hidden text-sm text-slate-500 sm:block">
          or click to browse from your device
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Images, audio, documents, and more
        </p>
      </div>

      {uploadState.status === 'uploading' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm sm:gap-3">
            <span className="min-w-0 truncate font-medium text-slate-800">
              Uploading {uploadState.fileName}
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {uploadState.percent}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 sm:h-2">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-200"
              style={{ width: `${uploadState.percent}%` }}
              role="progressbar"
              aria-valuenow={uploadState.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {uploadState.status === 'success' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:p-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 break-words">
            <span className="font-medium">{uploadState.fileName}</span> uploaded
            successfully.
          </p>
        </div>
      )}

      {uploadState.status === 'error' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 break-words">{uploadState.message}</p>
        </div>
      )}
    </section>
  )
}
