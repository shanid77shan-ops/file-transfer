import { AlertTriangle } from 'lucide-react'
import { getMissingEnvVars } from '../lib/supabaseClient'

export function EnvSetupNotice() {
  const missing = getMissingEnvVars()

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold sm:text-lg">Supabase is not configured</h2>
          <p className="mt-1 text-sm leading-relaxed">
            Create a <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-900/60 sm:text-sm">.env</code>{' '}
            file in the project root and add:
          </p>
          <pre className="mt-3 max-w-full overflow-x-auto rounded-xl bg-white p-3 text-[11px] leading-relaxed text-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:text-xs">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
          </pre>
          <p className="mt-3 break-words text-sm">
            Missing: <strong>{missing.join(', ')}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

export function AppHeader() {
  return (
    <header className="mb-6 text-center sm:mb-8 lg:mb-10">
      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center sm:mb-4 sm:h-24 sm:w-24">
        <img
          src="/logo.png"
          alt="Easy File logo"
          width={96}
          height={96}
          className="h-full w-full rounded-full object-cover shadow-lg shadow-teal-200/80 ring-2 ring-white dark:shadow-teal-900/40 dark:ring-slate-800"
        />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl lg:text-4xl">
        Easy File
      </h1>
      <p className="mx-auto mt-2 max-w-xl px-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
        Upload files from any device and share download links anywhere.
      </p>
    </header>
  )
}
