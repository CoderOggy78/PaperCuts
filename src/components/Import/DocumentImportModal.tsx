import React, { useState, useRef } from 'react'
import {
  Upload,
  X,
  AlertCircle,
  FileCheck2,
  Lock,
  Loader2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'
import { extractPdfDocument, validatePdfFile } from '../../lib/pdfExtractor'
import type { AIProviderConfig, DocumentAIProvider } from '../../lib/ai/types'
import type { UserDocument } from '../../types/schema'

interface DocumentImportModalProps {
  isOpen: boolean
  onClose: () => void
  onDocumentImported: (doc: UserDocument) => void
  aiProvider: DocumentAIProvider
  aiConfig: AIProviderConfig
}

export type ProcessingStage =
  | 'READY'
  | 'UPLOADING'
  | 'EXTRACTING'
  | 'ANALYZING'
  | 'VERIFYING'
  | 'COMPLETE'
  | 'FAILED'
  | 'UNSUPPORTED_FORMAT'
  | 'CANCELLED'
  | 'PARTIALLY_PROCESSED'

export const DocumentImportModal: React.FC<DocumentImportModalProps> = ({
  isOpen,
  onClose,
  onDocumentImported,
  aiProvider,
  aiConfig
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [stage, setStage] = useState<ProcessingStage>('READY')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedPagesCount, setProcessedPagesCount] = useState<number>(0)
  const [totalPagesCount, setTotalPagesCount] = useState<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  if (!isOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startProcessing(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startProcessing(e.target.files[0])
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setStage('CANCELLED')
    setStatusMessage('Processing cancelled by user.')
  }

  const handleReset = () => {
    setStage('READY')
    setSelectedFile(null)
    setErrorMessage(null)
    setStatusMessage('')
  }

  const startProcessing = async (file: File) => {
    setSelectedFile(file)
    setErrorMessage(null)

    // 1. Validation Stage
    setStage('UPLOADING')
    setStatusMessage('Validating file format and size...')

    const val = validatePdfFile(file)
    if (!val.valid) {
      if (val.error?.includes('Unsupported file type')) {
        setStage('UNSUPPORTED_FORMAT')
      } else {
        setStage('FAILED')
      }
      setErrorMessage(val.error || 'Invalid file.')
      return
    }

    abortControllerRef.current = new AbortController()

    try {
      // 2. Extraction Stage
      setStage('EXTRACTING')
      setStatusMessage('Extracting text page-by-page...')

      const extraction = await extractPdfDocument(file, file.name, (p) => {
        setStatusMessage(p.message)
        if (p.currentPage) setProcessedPagesCount(p.currentPage)
        if (p.totalPages) setTotalPagesCount(p.totalPages)
      })

      if (abortControllerRef.current?.signal.aborted) {
        setStage('CANCELLED')
        return
      }

      setProcessedPagesCount(extraction.pageCount)
      setTotalPagesCount(extraction.pageCount)

      // Check for unreadable / scanned documents
      if (extraction.isLikelyScanned) {
        setStage('FAILED')
        setErrorMessage(
          'Scanned / Image-only Document: This PDF contains no extractable digital text layer. PaperCuts requires readable text to verify citations against sources. Optical Character Recognition (OCR) is required.'
        )
        return
      }

      // 3. Analyzing Stage
      setStage('ANALYZING')
      setStatusMessage(`Analyzing requirements and dates via ${aiProvider.displayName}...`)

      const docId = `doc-${Date.now()}`
      const analysis = await aiProvider.analyzeDocument({
        documentId: docId,
        title: file.name,
        pages: extraction.pages,
        signal: abortControllerRef.current.signal,
        onStatusUpdate: (msg) => setStatusMessage(msg)
      })

      // 4. Verifying Stage
      setStage('VERIFYING')
      setStatusMessage('Verifying exact verbatim excerpts against extracted page text...')

      // Check for partial processing
      const isPartial = extraction.scannedPageCount > 0 && extraction.scannedPageCount < extraction.pageCount
      if (isPartial) {
        setStage('PARTIALLY_PROCESSED')
      }

      const userDoc: UserDocument = {
        id: docId,
        fileName: file.name,
        fileSizeBytes: file.size,
        fileType: file.type || 'application/pdf',
        pageCount: extraction.pageCount,
        processedPagesCount: extraction.pageCount - extraction.scannedPageCount,
        pages: extraction.pages,
        isDemoSample: false,
        isScannedDetected: extraction.isLikelyScanned,
        importedAt: new Date().toISOString(),
        analysis
      }

      setStage('COMPLETE')
      setStatusMessage('Processing complete! Document is ready.')
      onDocumentImported(userDoc)
    } catch (err: unknown) {
      if (abortControllerRef.current?.signal.aborted) {
        setStage('CANCELLED')
        setStatusMessage('Processing was cancelled.')
        return
      }
      setStage('FAILED')
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
    }
  }

  const isDemo = aiConfig.mode === 'demo_precomputed'

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-[#ffffff] border border-[#e8e3d8] rounded-xl max-w-xl w-full shadow-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e8e3d8] flex items-center justify-between bg-[#fcfbf8]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-editorial text-base font-bold text-[#181615]">
                Analyze Document
              </h2>
              <p className="text-xs text-[#706b63]">
                Extract requirements, deterministic deadlines, and verified citations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#706b63] hover:text-[#181615] hover:bg-[#ede8dd] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {stage === 'READY' || stage === 'FAILED' || stage === 'UNSUPPORTED_FORMAT' || stage === 'CANCELLED' ? (
            <>
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-[#2563eb] bg-[#eff6ff]/60 scale-[1.01]'
                    : 'border-[#d4cdbe] hover:border-[#2563eb] bg-[#fcfbf8]/60'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#181615]">
                      Drag and drop your PDF here, or{' '}
                      <label className="text-[#2563eb] hover:underline cursor-pointer font-bold">
                        browse files
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-[#706b63]">
                      Standard PDF documents up to 30 MB supported.
                    </p>
                    <p className="text-[11px] text-[#9c968c]">
                      DOCX and image formats must be converted to text-embedded PDF first.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Alert for Failed / Cancelled / Unsupported */}
              {errorMessage && (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="font-bold">
                      {stage === 'UNSUPPORTED_FORMAT'
                        ? 'Unsupported Document Format'
                        : stage === 'CANCELLED'
                        ? 'Processing Cancelled'
                        : 'Processing Error'}
                    </p>
                    <p className="leading-relaxed">{errorMessage}</p>
                    <button
                      onClick={handleReset}
                      className="mt-2 inline-flex items-center space-x-1 font-semibold text-rose-800 hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Try another document</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy & Engine Transparency Disclosure */}
              <div className="p-4 rounded-lg bg-[#f8f6f0] border border-[#e8e3d8] text-xs space-y-1.5 text-[#57534e]">
                <div className="flex items-center space-x-2 font-semibold text-[#181615]">
                  <ShieldAlert className="w-4 h-4 text-[#2563eb]" />
                  <span>Privacy & Engine Disclosure</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  {isDemo ? (
                    <>
                      <strong>Local Demo Mode:</strong> File processed entirely in browser memory. No document content is sent to remote servers.
                    </>
                  ) : (
                    <>
                      <strong>Gemini Processing Boundary:</strong> Document text will be securely sent to Gemini via your server boundary (
                      <code className="font-mono text-[#181615] font-semibold">{aiConfig.modelIdentifier}</code>
                      ) for extraction. API credentials remain strictly server-side.
                    </>
                  )}
                </p>
              </div>
            </>
          ) : (
            /* Active Processing State Machine */
            <div className="py-6 space-y-6">
              <div className="text-center space-y-2">
                {stage === 'COMPLETE' ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                ) : (
                  <Loader2 className="w-10 h-10 text-[#2563eb] animate-spin mx-auto" />
                )}
                <h3 className="font-editorial text-lg font-bold text-[#181615]">
                  {stage === 'COMPLETE' ? 'Analysis Complete' : `Processing: ${selectedFile?.name}`}
                </h3>
                <p className="text-xs text-[#57534e] font-sans">
                  {statusMessage}
                </p>
              </div>

              {/* Real State Badge indicator */}
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                  STAGE: {stage}
                </span>
                {totalPagesCount > 0 && (
                  <span className="text-xs font-mono text-[#706b63]">
                    ({processedPagesCount} of {totalPagesCount} pages)
                  </span>
                )}
              </div>

              {/* Genuine Pipeline Stages */}
              <div className="border border-[#e8e3d8] rounded-lg p-4 bg-[#fcfbf8] space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#47433e]">
                  <span className="flex items-center space-x-2">
                    <FileCheck2 className="w-4 h-4 text-[#2563eb]" />
                    <span>PDF Page-by-Page Extraction</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#2563eb]">
                    {stage === 'ANALYZING' || stage === 'VERIFYING' || stage === 'COMPLETE' ? '✓ Done' : 'In Progress'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#47433e]">
                  <span className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-[#2563eb]" />
                    <span>Scanned Page & Integrity Check</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#2563eb]">
                    {stage === 'ANALYZING' || stage === 'VERIFYING' || stage === 'COMPLETE' ? '✓ Passed' : 'Checking'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#47433e]">
                  <span className="flex items-center space-x-2">
                    <ArrowRight className="w-4 h-4 text-[#2563eb]" />
                    <span>Structured Requirements & Dates</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#2563eb]">
                    {stage === 'VERIFYING' || stage === 'COMPLETE' ? '✓ Extracted' : stage === 'ANALYZING' ? 'Running Model' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#47433e]">
                  <span className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2563eb]" />
                    <span>Deterministic Evidence Verification</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#2563eb]">
                    {stage === 'COMPLETE' ? '✓ Verified' : stage === 'VERIFYING' ? 'Reconciling' : 'Pending'}
                  </span>
                </div>
              </div>

              {stage !== 'COMPLETE' ? (
                <div className="flex justify-center">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-1.5 border border-[#e8e3d8] rounded-md text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Cancel Processing
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#e8e3d8]">
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto px-4 py-2 border border-[#e8e3d8] rounded-lg text-xs font-semibold text-[#181615] hover:bg-[#ede8dd] transition-colors cursor-pointer"
                  >
                    + Analyze Another Document
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>View in Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
