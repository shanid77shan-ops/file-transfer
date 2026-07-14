import type { UploadResult } from '../types/file'
import { buildStoragePath, formatFileSize } from './fileUtils'
import { getSupabaseConfig } from './supabaseClient'

export const BUCKET_NAME = 'shared-files'

/** Supabase TUS requires exactly 6MB chunks. */
const TUS_CHUNK_SIZE = 6 * 1024 * 1024

/** Files below this size use a single request; larger files use resumable TUS. */
const RESUMABLE_THRESHOLD = TUS_CHUNK_SIZE

/** Fallback to standard upload for files up to this size when TUS fails. */
const XHR_FALLBACK_MAX = 50 * 1024 * 1024

function getMaxUploadBytes(): number | null {
  const raw = import.meta.env.VITE_MAX_UPLOAD_MB
  if (!raw) return null

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return parsed * 1024 * 1024
}

function getProjectId(supabaseUrl: string): string {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
  if (!match?.[1]) {
    throw new Error('Invalid VITE_SUPABASE_URL format.')
  }
  return match[1]
}

function buildPublicUrl(supabaseUrl: string, path: string): string {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${encodedPath}`
}

function getUploadErrorMessage(error: unknown, file: File): string {
  const tusError = error as {
    message?: string
    originalResponse?: { getStatus?: () => number; getBody?: () => string }
  }

  const status = tusError.originalResponse?.getStatus?.()
  const body = tusError.originalResponse?.getBody?.() ?? ''

  if (status === 413 || body.toLowerCase().includes('too large')) {
    const maxBytes = getMaxUploadBytes()
    const limitHint = maxBytes
      ? `Your app limit is ${formatFileSize(maxBytes)}.`
      : 'Free Supabase projects allow up to 50 MB per file.'

    return `File "${file.name}" is too large (${formatFileSize(file.size)}). ${limitHint} Increase the global limit in Supabase Dashboard → Storage → Settings, and the bucket limit under shared-files.`
  }

  if (status === 401 || status === 403) {
    return 'Upload permission denied. Check Supabase storage policies for the shared-files bucket.'
  }

  return tusError.message || 'Upload failed. Please try again.'
}

export function validateUploadFileSize(file: File): void {
  const maxBytes = getMaxUploadBytes()
  if (maxBytes !== null && file.size > maxBytes) {
    throw new Error(
      `"${file.name}" is too large (${formatFileSize(file.size)}). Maximum upload size is ${formatFileSize(maxBytes)}.`,
    )
  }
}

function uploadViaXHR(
  file: File,
  path: string,
  supabaseUrl: string,
  anonKey: string,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          path,
          publicUrl: buildPublicUrl(supabaseUrl, path),
        })
        return
      }

      if (xhr.status === 413) {
        reject(new Error(getUploadErrorMessage({ originalResponse: { getStatus: () => 413 } }, file)))
        return
      }

      reject(
        new Error(`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`),
      )
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload. Check your connection and try again.'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled.'))
    })

    xhr.open('POST', `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${encodedPath}`)
    xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`)
    xhr.setRequestHeader('apikey', anonKey)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.send(file)
  })
}

function uploadViaTus(
  file: File,
  path: string,
  supabaseUrl: string,
  projectId: string,
  anonKey: string,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  return import('tus-js-client').then(({ Upload }) =>
    new Promise((resolve, reject) => {
      const upload = new Upload(file, {
        endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          'x-upsert': 'false',
        },
        // Avoid sending a 6MB body on the creation POST for larger files (can trigger 413).
        uploadDataDuringCreation: file.size <= TUS_CHUNK_SIZE,
        uploadLengthDeferred: false,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: BUCKET_NAME,
          objectName: path,
          contentType: file.type || 'application/octet-stream',
          cacheControl: '3600',
        },
        chunkSize: TUS_CHUNK_SIZE,
        onError(error) {
          reject(new Error(getUploadErrorMessage(error, file)))
        },
        onProgress(bytesUploaded, bytesTotal) {
          onProgress(Math.round((bytesUploaded / bytesTotal) * 100))
        },
        onSuccess() {
          resolve({
            path,
            publicUrl: buildPublicUrl(supabaseUrl, path),
          })
        },
      })

      void upload
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(previousUploads[0])
          }
          upload.start()
        })
        .catch(reject)
    }),
  )
}

export async function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  validateUploadFileSize(file)

  const { url, anonKey } = getSupabaseConfig()
  const path = buildStoragePath(file.name)

  if (file.size < RESUMABLE_THRESHOLD) {
    return uploadViaXHR(file, path, url, anonKey, onProgress)
  }

  const projectId = getProjectId(url)

  try {
    return await uploadViaTus(file, path, url, projectId, anonKey, onProgress)
  } catch (error) {
    if (file.size <= XHR_FALLBACK_MAX) {
      onProgress(0)
      return uploadViaXHR(file, path, url, anonKey, onProgress)
    }

    throw error
  }
}

export function isLargeFileUpload(file: File): boolean {
  return file.size >= RESUMABLE_THRESHOLD
}
