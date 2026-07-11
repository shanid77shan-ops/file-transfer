import type { UploadResult } from '../types/file'
import { buildStoragePath } from './fileUtils'
import { getSupabaseConfig } from './supabaseClient'

const BUCKET_NAME = 'shared-files'

export async function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const { url, anonKey } = getSupabaseConfig()
  const path = buildStoragePath(file.name)
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
          publicUrl: `${url}/storage/v1/object/public/${BUCKET_NAME}/${encodedPath}`,
        })
        return
      }

      reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText || xhr.statusText}`))
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload. Check your connection and try again.'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled.'))
    })

    xhr.open(
      'POST',
      `${url}/storage/v1/object/${BUCKET_NAME}/${encodedPath}`,
    )
    xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`)
    xhr.setRequestHeader('apikey', anonKey)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.send(file)
  })
}

export { BUCKET_NAME }
