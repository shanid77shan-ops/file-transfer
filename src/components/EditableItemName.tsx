import { Loader2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'

interface EditableItemNameProps {
  name: string
  saving: boolean
  onSave: (name: string) => Promise<void>
}

export function EditableItemName({ name, saving, onSave }: EditableItemNameProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  useEffect(() => {
    if (!isEditing) setDraft(name)
  }, [name, isEditing])

  const startEditing = () => {
    setDraft(name)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDraft(name)
    setIsEditing(false)
  }

  const saveName = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === name) {
      cancelEditing()
      return
    }

    try {
      await onSave(trimmed)
      setIsEditing(false)
    } catch {
      setDraft(name)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void saveName()
          if (event.key === 'Escape') cancelEditing()
        }}
        onBlur={() => void saveName()}
        disabled={saving}
        autoFocus
        maxLength={120}
        aria-label="Edit item name"
        className="w-full rounded-md border border-red-300 bg-white px-2 py-1 text-sm font-bold text-red-600 outline-none ring-red-200 focus:ring-2 sm:text-base"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      disabled={saving}
      title="Tap to rename"
      className="group flex w-full min-w-0 items-start gap-1 text-left disabled:opacity-60"
      aria-label={`Rename ${name}`}
    >
      <span className="line-clamp-2 min-w-0 flex-1 text-sm font-bold leading-snug text-red-600 sm:text-base">
        {name}
      </span>
      {saving ? (
        <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-red-400" aria-hidden="true" />
      ) : (
        <Pencil
          className="mt-0.5 h-3 w-3 shrink-0 text-red-400 opacity-70 sm:opacity-0 sm:transition group-hover:opacity-100"
          aria-hidden="true"
        />
      )}
    </button>
  )
}
