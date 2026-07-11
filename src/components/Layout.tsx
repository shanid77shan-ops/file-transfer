import { AlertTriangle, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMissingEnvVars } from '../lib/supabaseClient'

const DEFAULT_HEADING = 'Easy File'
const HEADING_STORAGE_KEY = 'easy-file-heading'

export function EnvSetupNotice() {
  const missing = getMissingEnvVars()

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold sm:text-lg">Supabase is not configured</h2>
          <p className="mt-1 text-sm leading-relaxed">
            Create a <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs sm:text-sm">.env</code>{' '}
            file in the project root and add:
          </p>
          <pre className="mt-3 max-w-full overflow-x-auto rounded-xl bg-white p-3 text-[11px] leading-relaxed text-slate-800 sm:text-xs">
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
  const [heading, setHeading] = useState(DEFAULT_HEADING)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(DEFAULT_HEADING)

  useEffect(() => {
    const saved = localStorage.getItem(HEADING_STORAGE_KEY)
    if (saved?.trim()) {
      setHeading(saved)
      setDraft(saved)
      document.title = saved
    }
  }, [])

  const startEditing = () => {
    setDraft(heading)
    setIsEditing(true)
  }

  const saveHeading = () => {
    const trimmed = draft.trim() || DEFAULT_HEADING
    setHeading(trimmed)
    setDraft(trimmed)
    localStorage.setItem(HEADING_STORAGE_KEY, trimmed)
    document.title = trimmed
    setIsEditing(false)
  }

  const cancelEditing = () => {
    setDraft(heading)
    setIsEditing(false)
  }

  return (
    <header className="mb-6 text-center sm:mb-8 lg:mb-10">
      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center sm:mb-4 sm:h-24 sm:w-24">
        <img
          src="/logo.png"
          alt={`${heading} logo`}
          width={96}
          height={96}
          className="h-full w-full rounded-full object-cover shadow-lg shadow-teal-200/80 ring-2 ring-white"
        />
      </div>

      {isEditing ? (
        <div className="mx-auto max-w-xl px-2">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveHeading()
              if (event.key === 'Escape') cancelEditing()
            }}
            onBlur={saveHeading}
            autoFocus
            maxLength={48}
            aria-label="Edit app heading"
            className="w-full rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-center text-2xl font-bold text-red-600 outline-none ring-red-200 focus:ring-4 sm:text-4xl lg:text-5xl"
          />
          <p className="mt-2 text-xs text-slate-500">Press Enter to save · Esc to cancel</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="group mx-auto flex max-w-full items-center justify-center gap-2 px-2"
          aria-label="Edit heading"
        >
          <h1 className="text-3xl font-bold tracking-tight text-red-600 sm:text-4xl lg:text-5xl">
            {heading}
          </h1>
          <Pencil
            className="h-4 w-4 shrink-0 text-red-400 opacity-0 transition group-hover:opacity-100 sm:h-5 sm:w-5"
            aria-hidden="true"
          />
        </button>
      )}

      {!isEditing && (
        <p className="mt-1 text-xs text-slate-400">Tap heading to edit</p>
      )}

      <p className="mx-auto mt-2 max-w-xl px-2 text-sm leading-relaxed text-slate-500 sm:text-base">
        Upload files from any device and share download links anywhere.
      </p>
    </header>
  )
}
