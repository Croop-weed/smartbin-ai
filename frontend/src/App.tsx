import React, { useEffect, useState } from 'react'

interface Bin {
  id: string
  name: string
  location: string
  bin_present: boolean
  bin_full: boolean
}

type FileMap = Record<string, File | null>
type LoadingMap = Record<string, boolean>

const API_BASE = 'http://127.0.0.1:8000/api/v1'

export default function App() {
  const [bins, setBins] = useState<Bin[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [newBinName, setNewBinName] = useState<string>('')
  const [newBinLocation, setNewBinLocation] = useState<string>('')
  const [creating, setCreating] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [binFiles, setBinFiles] = useState<FileMap>({})
  const [binUploading, setBinUploading] = useState<LoadingMap>({})

  useEffect(() => {
    void fetchBins('priority')
  }, [])

  async function fetchBins(sort = 'priority'): Promise<void> {
    setRefreshing(true)
    try {
      const res = await fetch(`${API_BASE}/bins?sort=${sort}`)
      if (!res.ok) throw new Error('Unable to load bins')
      const data = await res.json() as Bin[]
      setBins(data)
    } catch (e) {
      console.error(e)
      showNotification('Could not load bins')
    } finally {
      setRefreshing(false)
    }
  }

  function showNotification(msg: string): void {
    setMessage(msg)
    setTimeout(() => setMessage(null), 4000)
  }

  async function createBin(): Promise<void> {
    if (!newBinName.trim() || !newBinLocation.trim()) {
      showNotification('Please enter a bin name and location.')
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/bins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBinName.trim(),
          location: newBinLocation.trim(),
        }),
      })
      if (!res.ok) {
        const error = await res.json() as { detail?: string }
        throw new Error(error.detail || 'Could not create bin')
      }
      setNewBinName('')
      setNewBinLocation('')
      showNotification('Bin created successfully 🎉')
      await fetchBins('priority')
    } catch (err) {
      console.error(err)
      showNotification((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function deleteBin(binId: string): Promise<void> {
    const deleteConfirmed = window.confirm('Delete this bin? This cannot be undone.')
    if (!deleteConfirmed) return

    try {
      const res = await fetch(`${API_BASE}/bins/${binId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      showNotification('Bin removed successfully')
      setBinFiles((prev) => {
        const next = { ...prev }
        delete next[binId]
        return next
      })
      await fetchBins('priority')
    } catch (err) {
      console.error(err)
      showNotification('Delete failed')
    }
  }

  function handleBinFileChange(e: React.ChangeEvent<HTMLInputElement>, binId: string): void {
    const file = e.target.files?.[0] ?? null
    setBinFiles((prev) => ({ ...prev, [binId]: file }))
  }

  async function uploadBinPhoto(binId: string): Promise<void> {
    const selectedFile = binFiles[binId]
    if (!selectedFile) {
      showNotification('Select a photo before uploading')
      return
    }

    setBinUploading((prev) => ({ ...prev, [binId]: true }))

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch(`${API_BASE}/bins/${binId}/photo`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json() as Bin
      
      showNotification(`AI Updated: ${data.name} is now ${data.bin_full ? 'Full' : data.bin_present ? 'Present' : 'Empty'}`)
      setBinFiles((prev) => ({ ...prev, [binId]: null }))
      await fetchBins('priority')
    } catch (err) {
      console.error(err)
      showNotification('Object detection upload failed')
    } finally {
      setBinUploading((prev) => ({ ...prev, [binId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      
      {/* Toast Alert Banner */}
      {message && (
        <div className="fixed top-6 right-6 z-50 max-w-sm rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md border-l-4 border-l-emerald-500 animate-in fade-in slide-in-from-top-4">
          <p className="text-sm font-medium text-slate-200">{message}</p>
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                SmartBin — Central Infrastructure
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">Real-time edge computer vision state tracking analytics dashboard</p>
            </div>
            <button 
              onClick={() => void fetchBins('priority')} 
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 hover:text-white hover:border-slate-700 active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Syncing Edge...
                </>
              ) : 'Force Sync'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Creation Panel */}
        <section className="lg:col-span-1 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-100">Provisional Unit Provisioning</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Spin up localized tracking units into active system routing logs.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Unit Identifier Name</label>
              <input
                type="text"
                placeholder="e.g., Bin-Alpha-04"
                value={newBinName}
                onChange={(e) => setNewBinName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Physical Deployment Hub</label>
              <input
                type="text"
                placeholder="e.g., Floor 3, Block B"
                value={newBinLocation}
                onChange={(e) => setNewBinLocation(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
              />
            </div>
          </div>

          <button 
            onClick={() => void createBin()} 
            disabled={creating}
            className="w-full inline-flex items-center justify-center py-3.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/10"
          >
            {creating ? 'Registering Instance...' : 'Deploy Unit Pipeline'}
          </button>
        </section>

        {/* Right Side: Nodes Grid */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-slate-200">
              Active Nodes Summary <span className="ml-2 text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full">{bins.length}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {bins.map((b) => {
              let statusText = 'Empty'
              let statusBadgeClass = 'bg-slate-950 text-slate-400 border border-slate-800'
              let cardStateClass = 'border-slate-900 hover:border-slate-800/80 hover:shadow-slate-900/50'
              let iconGlowColor = 'text-slate-600'
              
              if (b.bin_full) {
                statusText = 'Critical Action Needed'
                statusBadgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                cardStateClass = 'border-rose-500/20 shadow-lg shadow-rose-950/5 bg-gradient-to-b from-slate-900/20 to-rose-950/5'
                iconGlowColor = 'text-rose-400 animate-pulse'
              } else if (b.bin_present) {
                statusText = 'Active / Partially Clear'
                statusBadgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                cardStateClass = 'border-amber-500/20 bg-gradient-to-b from-slate-900/20 to-amber-950/5'
                iconGlowColor = 'text-amber-400'
              }

              return (
                <div key={b.id} className={`flex flex-col rounded-2xl p-6 bg-slate-900/20 backdrop-blur-md border shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${cardStateClass}`}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="space-y-1">
                      <span className={`inline-block text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-md ${statusBadgeClass}`}>
                        {statusText}
                      </span>
                      <h3 className="font-extrabold text-slate-100 tracking-tight text-lg pt-1">{b.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {b.location}
                      </p>
                    </div>
                    
                    <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${iconGlowColor}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-auto pt-5 border-t border-slate-900/60 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 inline-flex items-center justify-center px-3 py-2.5 text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-slate-200 cursor-pointer transition-all truncate max-w-[170px] shadow-sm">
                        <span className="truncate">{binFiles[b.id]?.name ?? 'Select Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleBinFileChange(e, b.id)}
                          className="hidden"
                        />
                      </label>
                      
                      <button
                        onClick={() => void uploadBinPhoto(b.id)}
                        disabled={!binFiles[b.id] || binUploading[b.id]}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-100 text-slate-950 hover:bg-white active:scale-[0.97] transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                      >
                        {binUploading[b.id] ? 'Analyzing...' : 'Run YOLO'}
                      </button>
                    </div>

                    <button 
                      onClick={() => void deleteBin(b.id)}
                      className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-rose-400 transition-all rounded-xl hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10"
                    >
                      Decommission Node
                    </button>
                  </div>
                </div>
              )
            })}

            {bins.length === 0 && (
              <div className="col-span-full border border-dashed border-slate-900 rounded-2xl p-14 text-center text-slate-600 text-sm font-medium tracking-wide">
                No telemetry infrastructure nodes deployed. Create a provision unit block on the sidebar.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-24 text-center py-6 text-[10px] font-mono tracking-widest text-slate-600 uppercase">
        System Operational Matrix &bull; Powered by SmartBin ML Pipeline Engine
      </footer>
    </div>
  )
}