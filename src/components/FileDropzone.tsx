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
          'relative flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:min-h-52',
          isDragActive && !isDragReject
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50',
          isDragReject ? 'border-red-400 bg-red-50' : '',
          isUploading ? 'pointer-events-none opacity-80' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input {...getInputProps()} />

        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          )}
        </div>

        <p className="text-base font-medium text-slate-900 sm:text-lg">
          {isDragActive ? 'Drop your file here' : 'Drag & drop a file here'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          or tap to browse from your device
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Images, audio, documents, and more
        </p>
      </div>

      {uploadState.status === 'uploading' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-800">
              Uploading {uploadState.fileName}
            </span>
            <span className="shrink-0 text-slate-500">{uploadState.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-medium">{uploadState.fileName}</span> uploaded
            successfully.
          </p>
        </div>
      )}

      {uploadState.status === 'error' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{uploadState.message}</p>
        </div>
      )}
    </section>
  )
}
