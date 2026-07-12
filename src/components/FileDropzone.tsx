import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createFileRecord } from '../lib/filesApi'
import { formatFileSize } from '../lib/fileUtils'
import { isLargeFileUpload, uploadFileWithProgress } from '../lib/uploadFile'

interface FileDropzoneProps {
  onUploadComplete: () => void
}

type UploadState =
  | { status: 'idle' }
  | {
      status: 'uploading'
      fileName: string
      percent: number
      fileSize: number
      resumable: boolean
      currentIndex: number
      totalCount: number
    }
  | { status: 'success'; count: number; fileNames: string[] }
  | {
      status: 'partial'
      successCount: number
      failures: Array<{ fileName: string; message: string }>
    }
  | { status: 'error'; message: string }

export function FileDropzone({ onUploadComplete }: FileDropzoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const totalCount = acceptedFiles.length
      const uploadedNames: string[] = []
      const failures: Array<{ fileName: string; message: string }> = []

      for (let index = 0; index < acceptedFiles.length; index++) {
        const file = acceptedFiles[index]

        setUploadState({
          status: 'uploading',
          fileName: file.name,
          percent: 0,
          fileSize: file.size,
          resumable: isLargeFileUpload(file),
          currentIndex: index + 1,
          totalCount,
        })

        try {
          const { path, publicUrl } = await uploadFileWithProgress(file, (percent) => {
            setUploadState({
              status: 'uploading',
              fileName: file.name,
              percent,
              fileSize: file.size,
              resumable: isLargeFileUpload(file),
              currentIndex: index + 1,
              totalCount,
            })
          })

          await createFileRecord({
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            storagePath: path,
            publicUrl,
          })

          uploadedNames.push(file.name)
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Upload failed. Please try again.'
          failures.push({ fileName: file.name, message })
        }
      }

      if (uploadedNames.length > 0) {
        onUploadComplete()
      }

      if (failures.length === 0) {
        setUploadState({
          status: 'success',
          count: uploadedNames.length,
          fileNames: uploadedNames,
        })
      } else if (uploadedNames.length > 0) {
        setUploadState({
          status: 'partial',
          successCount: uploadedNames.length,
          failures,
        })
      } else {
        setUploadState({
          status: 'error',
          message: failures[0]?.message ?? 'Upload failed. Please try again.',
        })
      }

      window.setTimeout(() => {
        setUploadState({ status: 'idle' })
      }, failures.length > 0 ? 5000 : 2500)
    },
    [onUploadComplete],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: true,
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
          {isDragActive ? 'Drop your files here' : 'Tap to upload files'}
        </p>
        <p className="hidden text-base font-medium text-slate-900 sm:block sm:text-lg">
          {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
        </p>
        <p className="mt-1 text-sm text-slate-500 sm:hidden">
          Select multiple photos or files at once
        </p>
        <p className="mt-1 hidden text-sm text-slate-500 sm:block">
          or click to browse — select multiple files at once
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Photos, videos, audio, and documents — large files supported
        </p>
      </div>

      {uploadState.status === 'uploading' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="mb-2 flex items-start justify-between gap-2 sm:items-center sm:gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                Uploading {uploadState.currentIndex} of {uploadState.totalCount}:{' '}
                {uploadState.fileName}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatFileSize(Math.round((uploadState.percent / 100) * uploadState.fileSize))}
                {' / '}
                {formatFileSize(uploadState.fileSize)}
                {uploadState.resumable ? ' · Resumable upload' : ''}
              </p>
            </div>
            <span className="shrink-0 tabular-nums text-sm text-slate-500">
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
            {uploadState.count === 1 ? (
              <>
                <span className="font-medium">{uploadState.fileNames[0]}</span> uploaded
                successfully.
              </>
            ) : (
              <>
                <span className="font-medium">{uploadState.count} files</span> uploaded
                successfully.
              </>
            )}
          </p>
        </div>
      )}

      {uploadState.status === 'partial' && (
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 break-words">
              <span className="font-medium">{uploadState.successCount} files</span> uploaded.{' '}
              {uploadState.failures.length} failed.
            </p>
          </div>
          <ul className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:p-4">
            {uploadState.failures.map((failure) => (
              <li key={failure.fileName} className="break-words">
                <span className="font-medium">{failure.fileName}:</span> {failure.message}
              </li>
            ))}
          </ul>
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
