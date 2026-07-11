import { AlertTriangle, CloudUpload } from 'lucide-react'
import { getMissingEnvVars } from '../lib/supabaseClient'

export function EnvSetupNotice() {
  const missing = getMissingEnvVars()

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">Supabase is not configured</h2>
          <p className="mt-1 text-sm">
            Create a <code className="rounded bg-amber-100 px-1.5 py-0.5">.env</code>{' '}
            file in the project root and add:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs text-slate-800">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
          <p className="mt-3 text-sm">
            Missing: <strong>{missing.join(', ')}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

export function AppHeader() {
  return (
    <header className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
        <CloudUpload className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        File Transfer
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
        Upload files from any device and share download links anywhere.
      </p>
    </header>
  )
}
