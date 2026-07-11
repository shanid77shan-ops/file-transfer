import { AlertCircle, CheckCircle2, Link2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { createPasteRecord } from '../lib/filesApi'
import { parsePastedContent } from '../lib/pasteUtils'

interface PasteInputProps {
  onSaveComplete: () => void
}

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success'; label: string }
  | { status: 'error'; message: string }

export function PasteInput({ onSaveComplete }: PasteInputProps) {
  const [value, setValue] = useState('')
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' })

  const handleSave = async () => {
    setSaveState({ status: 'saving' })

    try {
      const parsed = parsePastedContent(value)

      await createPasteRecord({
        name: parsed.name,
        size: parsed.size,
        mimeType: parsed.mimeType,
        publicUrl: parsed.publicUrl,
        itemType: parsed.itemType,
        textContent: parsed.textContent,
      })

      setSaveState({
        status: 'success',
        label: parsed.itemType === 'link' ? 'Link saved' : 'Text saved',
      })
      setValue('')
      onSaveComplete()

      window.setTimeout(() => {
        setSaveState({ status: 'idle' })
      }, 2500)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not save. Please try again.'
      setSaveState({ status: 'error', message })
    }
  }

  const isSaving = saveState.status === 'saving'

  return (
    <section className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Link2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
              Paste a link or text
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              URLs, notes, or anything you want to share
            </p>
          </div>
        </div>

        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Paste a link (https://...) or any text here..."
          rows={4}
          disabled={isSaving}
          className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-70 sm:px-4"
        />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Single-line URLs are saved as links · multi-line content as text
          </p>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !value.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 active:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60 sm:shrink-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>

      {saveState.status === 'success' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:p-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{saveState.label} successfully.</p>
        </div>
      )}

      {saveState.status === 'error' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 break-words">{saveState.message}</p>
        </div>
      )}
    </section>
  )
}
