import { useState } from 'react'
import { FileDropzone } from './components/FileDropzone'
import { FileGallery } from './components/FileGallery'
import { AppHeader, EnvSetupNotice } from './components/Layout'
import { PasteInput } from './components/PasteInput'
import { isSupabaseConfigured } from './lib/supabaseClient'

function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => setRefreshKey((key) => key + 1)

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <AppHeader />

        {!isSupabaseConfigured ? (
          <EnvSetupNotice />
        ) : (
          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            <FileDropzone onUploadComplete={handleRefresh} />
            <PasteInput onSaveComplete={handleRefresh} />
            <FileGallery refreshKey={refreshKey} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
