import { useState } from 'react'
import { FileDropzone } from './components/FileDropzone'
import { FileGallery } from './components/FileGallery'
import { AppHeader, EnvSetupNotice } from './components/Layout'
import { isSupabaseConfigured } from './lib/supabaseClient'

function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <AppHeader />

        {!isSupabaseConfigured ? (
          <EnvSetupNotice />
        ) : (
          <div className="space-y-10">
            <FileDropzone onUploadComplete={() => setRefreshKey((key) => key + 1)} />
            <FileGallery refreshKey={refreshKey} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
