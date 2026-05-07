import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLeadStore } from '@/store/leadStore'
import toast from 'react-hot-toast'

export default function BulkUploadModal({ open, onClose }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)
  const { fetchLeads } = useLeadStore()

  const reset = () => {
    setFile(null)
    setResult(null)
    setUploading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFilePick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) { setFile(f); setResult(null) }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/bulk/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setResult(data)
      if (data.created > 0) {
        fetchLeads()
        toast.success(`${data.created} lead${data.created > 1 ? 's' : ''} imported`)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadSample = () => {
    window.open('/api/bulk/sample', '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="bg-surface border-border p-0 gap-0 max-w-xl">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="font-display font-semibold text-text-primary text-sm flex items-center gap-2">
            <FileSpreadsheet size={15} className="text-accent" />
            Bulk Upload Leads
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-5 space-y-4">
          {/* Step 1 — Download sample */}
          <div className="bg-[#0a0a0a] border border-[#252525] rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-text-primary text-sm font-medium">Step 1 — Download the sample file</p>
                <p className="text-text-muted text-xs mt-1 leading-relaxed">
                  Fill in your leads using the template. Required column: <span className="text-[#f0f0f0] font-mono text-[11px]">Business Name</span>. All others are optional.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadSample}
                className="shrink-0 h-8 border-[#2e2e2e] bg-[#111] text-text-secondary hover:text-text-primary hover:border-[#444] text-xs gap-1.5"
              >
                <Download size={12} />
                Sample .xlsx
              </Button>
            </div>
          </div>

          {/* Step 2 — Upload file */}
          <div className="bg-[#0a0a0a] border border-[#252525] rounded-lg p-4 space-y-3">
            <p className="text-text-primary text-sm font-medium">Step 2 — Upload your filled file</p>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                file ? 'border-accent/40 bg-accent/5' : 'border-[#2e2e2e] hover:border-[#444]'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFilePick}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet size={16} className="text-accent" />
                  <span className="text-text-primary text-sm font-medium">{file.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null) }}
                    className="text-text-muted hover:text-text-secondary ml-1"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload size={20} className="mx-auto text-text-muted" />
                  <p className="text-text-secondary text-sm">Drop your file here or click to browse</p>
                  <p className="text-text-muted text-xs">.xlsx or .csv — max 5 MB</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full h-9 bg-accent text-background hover:bg-accent/90 font-semibold text-sm gap-2"
            >
              {uploading
                ? <><Loader2 size={14} className="animate-spin" />Uploading…</>
                : <><Upload size={14} />Upload & Import</>
              }
            </Button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#0a0a0a] border border-[#252525] rounded-lg p-4 space-y-3"
              >
                {/* Summary row */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-success font-medium">
                    <CheckCircle2 size={14} />
                    {result.created} imported
                  </span>
                  {result.failed > 0 && (
                    <span className="flex items-center gap-1.5 text-p0 font-medium">
                      <XCircle size={14} />
                      {result.failed} failed
                    </span>
                  )}
                  <span className="text-text-muted text-xs ml-auto">{result.total} rows total</span>
                </div>

                {/* Error table */}
                {result.errors?.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle size={11} className="text-p1" />
                      Row errors
                    </p>
                    {result.errors.map((e, i) => (
                      <div key={i} className="bg-p0/5 border border-p0/15 rounded-md px-3 py-2">
                        <p className="text-[#f0f0f0] text-xs font-medium mb-1">
                          Row {e.row}{e.businessName ? ` — ${e.businessName}` : ''}
                        </p>
                        <ul className="space-y-0.5">
                          {e.errors.map((msg, j) => (
                            <li key={j} className="text-p0 text-[11px] flex items-start gap-1.5">
                              <span className="mt-0.5 shrink-0">·</span>
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {result.failed === 0 && (
                  <p className="text-success text-xs">All rows imported successfully.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary text-xs h-7"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
