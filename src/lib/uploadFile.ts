import type { UploadResult } from '../types/file'
import { buildStoragePath } from './fileUtils'
import { getSupabaseConfig } from './supabaseClient'

export const BUCKET_NAME = 'shared-files'

/** Supabase TUS requires exactly 6MB chunks. */
const TUS_CHUNK_SIZE = 6 * 1024 * 1024

/** Files below this size use a single request; larger files use resumable TUS. */
const RESUMABLE_THRESHOLD = TUS_CHUNK_SIZE

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
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET_NAME,
        objectName: path,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      chunkSize: TUS_CHUNK_SIZE,
      onError(error) {
        reject(new Error(error.message || 'Upload failed. Please try again.'))
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
  const { url, anonKey } = getSupabaseConfig()
  const path = buildStoragePath(file.name)

  if (file.size >= RESUMABLE_THRESHOLD) {
    const projectId = getProjectId(url)
    return uploadViaTus(file, path, url, projectId, anonKey, onProgress)
  }

  return uploadViaXHR(file, path, url, anonKey, onProgress)
}

export function isLargeFileUpload(file: File): boolean {
  return file.size >= RESUMABLE_THRESHOLD
}
