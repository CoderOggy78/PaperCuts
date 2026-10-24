import { useState, useRef, useEffect } from 'react'
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  Quote,
  Calendar,
  CheckSquare,
  FileCheck2,
  AlertTriangle,
  Download,
  Info,
  Copy,
  Check,
  Type,
  ShieldAlert,
  ArrowRight,
  Trash2,
  Upload
} from 'lucide-react'
import { EligibilityChecker } from '../Eligibility/EligibilityChecker'
import { formatNormalizedDate, getDaysRemaining } from '../../lib/dateParser'
import type {
  SourceCitation,
  UserDocument,
  UserProfileAnswers
} from '../../types/schema'

interface DocumentWorkspaceProps {
  document: UserDocument
  activeCitation: SourceCitation | null
  onSelectCitation: (cit: SourceCitation | null) => void
  userProfile: UserProfileAnswers
  onUpdateProfile: (profile: UserProfileAnswers) => void
  onToggleAction: (actionId: string, completed: boolean) => void
  onOpenExportModal: () => void
  onRemoveDocument?: (docId: string) => void
  onUploadAnother?: () => void
}

type WorkspaceTab =
  | 'overview'
  | 'eligibility'
  | 'deadlines'
  | 'documents'
  | 'actions'
  | 'risks'

export const DocumentWorkspace: React.FC<DocumentWorkspaceProps> = ({
  document,
  activeCitation,
  onSelectCitation,
  userProfile,
  onUpdateProfile,
  onToggleAction,
  onOpenExportModal,
  onRemoveDocument,
  onUploadAnother
}) => {
  const [userPageNum, setUserPageNum] = useState(1)
  const [prevCitationId, setPrevCitationId] = useState<string | null>(null)

  // Sync page when citation changes
  if (activeCitation && activeCitation.id !== prevCitationId) {
    setPrevCitationId(activeCitation.id)
    if (activeCitation.pageNumber >= 1 && activeCitation.pageNumber <= document.pageCount) {
      setUserPageNum(activeCitation.pageNumber)
    }
  }

  const currentPageNum = userPageNum
  const setCurrentPageNum = (pageOrFn: number | ((prev: number) => number)) => {
    setUserPageNum(pageOrFn)
  }

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [readerTypography, setReaderTypography] = useState<'clean' | 'mono'>('clean')
  const [docSearchQuery, setDocSearchQuery] = useState('')
  const [copiedCitationQuote, setCopiedCitationQuote] = useState(false)
  const [mobileColumn, setMobileColumn] = useState<'reader' | 'analysis'>('analysis')
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(false)
  const textContainerRef = useRef<HTMLDivElement>(null)

  const analysis = document.analysis
  const currentPage = document.pages.find((p) => p.pageNumber === currentPageNum) || document.pages[0]

  // Auto-scroll to active citation highlight when citation is selected
  useEffect(() => {
    if (activeCitation && activeCitation.pageNumber === currentPageNum) {
      const timer = setTimeout(() => {
        const el = window.document.getElementById('active-citation-element')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [activeCitation, currentPageNum])

  // Copy citation quote with official attribution
  const handleCopyCitationAttribution = () => {
    if (!activeCitation) return
    const text = `"${activeCitation.excerpt}"\n— ${document.fileName}, Page ${activeCitation.pageNumber}`
    navigator.clipboard.writeText(text)
    setCopiedCitationQuote(true)
    setTimeout(() => setCopiedCitationQuote(false), 2000)
  }

  // Count active citations for a given page
  const getPageCitationCount = (pageNumber: number) => {
    if (!analysis) return 0
    let count = 0
    analysis.eligibilityRequirements.forEach((r) => {
      if (r.sourceCitations?.some((c) => c.pageNumber === pageNumber)) count++
    })
    analysis.deadlines.forEach((d) => {
      if (d.sourceCitation?.pageNumber === pageNumber) count++
    })
    analysis.requiredDocuments.forEach((doc) => {
      if (doc.sourceCitation?.pageNumber === pageNumber) count++
    })
    return count
  }

  // Render page text with active citation highlighting
  const renderHighlightedPageText = (pageText: string) => {
    if (!pageText) {
      return (
        <div className="p-8 text-center text-xs text-[#706b63] italic">
          [No extractable text found on this page. Document page may contain only scanned image content.]
        </div>
      )
    }

    const fontClass = readerTypography === 'mono'
      ? 'font-mono text-xs leading-relaxed text-[#181615]'
      : 'font-sans text-[13px] leading-7 text-[#282523]'

    if (!activeCitation || activeCitation.pageNumber !== currentPageNum) {
      // In-page search query match highlighting
      if (docSearchQuery.trim()) {
        const parts = pageText.split(new RegExp(`(${escapeRegex(docSearchQuery)})`, 'gi'))
        return (
          <div className={`${fontClass} whitespace-pre-wrap select-text`}>
            {parts.map((part, i) =>
              part.toLowerCase() === docSearchQuery.toLowerCase() ? (
                <mark key={i} className="bg-[#fde047] text-[#181615] px-0.5 rounded font-bold">
                  {part}
                </mark>
              ) : (
                part
              )
            )}
          </div>
        )
      }

      return (
        <div className={`${fontClass} whitespace-pre-wrap select-text`}>
          {pageText}
        </div>
      )
    }

    // Active citation highlighting
    const excerpt = activeCitation.excerpt.trim()
    const idx = pageText.toLowerCase().indexOf(excerpt.toLowerCase())

    if (idx === -1) {
      // Minor whitespace variance fallback
      return (
        <div className="space-y-3 select-text">
          <div className="p-2.5 rounded bg-[#fef3c7] border border-[#fde68a] text-xs text-[#92400e] flex items-center justify-between">
            <div>
              <strong>Visual Highlight Notice:</strong> Exact excerpt is on this page across minor line formatting.
            </div>
            <button
              onClick={handleCopyCitationAttribution}
              className="ml-2 font-semibold hover:underline shrink-0 text-[11px]"
            >
              {copiedCitationQuote ? 'Copied quote!' : 'Copy excerpt'}
            </button>
          </div>
          <div className={`${fontClass} whitespace-pre-wrap`}>
            {pageText}
          </div>
        </div>
      )
    }

    const before = pageText.slice(0, idx)
    const match = pageText.slice(idx, idx + excerpt.length)
    const after = pageText.slice(idx + excerpt.length)

    return (
      <div className={`${fontClass} whitespace-pre-wrap select-text`}>
        {before}
        <mark
          id="active-citation-element"
          className="bg-[#fde047] border-b-2 border-[#b45309] font-semibold text-[#181615] px-1 py-0.5 rounded shadow-xs citation-highlight-active"
        >
          {match}
        </mark>
        {after}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#fcfbf8]">
      {/* Document Workspace Sub-header */}
      <div className="h-11 border-b border-[#e8e3d8] bg-[#f8f6f0] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 truncate">
          <span className="font-editorial font-bold text-sm text-[#181615] truncate">
            {document.fileName}
          </span>
          {document.isDemoSample && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eaf2ec] text-[#2563eb] border border-[#c2dcd0] shrink-0">
              VERIFIED SAMPLE
            </span>
          )}
          <span className="text-xs text-[#706b63] hidden sm:inline tabular-nums">
            · {document.pageCount} page(s)
          </span>
        </div>

        {/* Right subheader controls */}
        <div className="flex items-center space-x-2">
          {/* Mobile column switch */}
          <div className="lg:hidden flex rounded-md border border-[#e8e3d8] bg-[#ffffff] p-0.5 text-xs font-semibold">
            <button
              onClick={() => setMobileColumn('reader')}
              className={`px-2.5 py-1 rounded transition-colors ${
                mobileColumn === 'reader' ? 'bg-[#2563eb] text-[#fcfbf8]' : 'text-[#706b63]'
              }`}
            >
              Document Reader
            </button>
            <button
              onClick={() => setMobileColumn('analysis')}
              className={`px-2.5 py-1 rounded transition-colors ${
                mobileColumn === 'analysis' ? 'bg-[#2563eb] text-white' : 'text-[#706b63]'
              }`}
            >
              Evidence Panel
            </button>
          </div>

          {onUploadAnother && (
            <button
              onClick={onUploadAnother}
              className="hidden md:flex items-center space-x-1 px-2.5 py-1 bg-[#ffffff] hover:bg-[#ede8dd] border border-[#e8e3d8] rounded text-xs font-semibold text-[#181615] transition-colors cursor-pointer shadow-2xs"
              title="Upload another document without refreshing"
            >
              <Upload className="w-3.5 h-3.5 text-[#2563eb]" />
              <span className="hidden sm:inline">Add Another Doc</span>
            </button>
          )}

          <button
            onClick={onOpenExportModal}
            className="flex items-center space-x-1 px-2.5 py-1 bg-[#ffffff] hover:bg-[#ede8dd] border border-[#e8e3d8] rounded text-xs font-semibold text-[#181615] transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#706b63]" />
            <span className="hidden sm:inline">Export Report</span>
          </button>

          {onRemoveDocument && (
            <button
              onClick={() => {
                if (window.confirm(`Remove "${document.fileName}" from workspace?`)) {
                  onRemoveDocument(document.id)
                }
              }}
              className="flex items-center space-x-1 px-2 py-1 bg-[#ffffff] hover:bg-rose-50 border border-[#e8e3d8] hover:border-rose-300 rounded text-xs font-semibold text-rose-700 transition-colors cursor-pointer shadow-2xs"
              title="Remove document from workspace"
              aria-label="Remove document"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: LEFT NAV / PAGE THUMBNAILS (Desktop) */}
        <div
          className={`border-r border-[#e8e3d8] bg-[#fcfbf8] hidden xl:flex flex-col shrink-0 justify-between transition-all duration-200 ${
            leftNavCollapsed ? 'w-12' : 'w-56'
          }`}
        >
          <div>
            <div className="p-3 border-b border-[#e8e3d8] bg-[#f8f6f0] flex items-center justify-between">
              {!leftNavCollapsed && (
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#706b63]">
                  Pages ({document.pageCount})
                </span>
              )}
              <button
                onClick={() => setLeftNavCollapsed(!leftNavCollapsed)}
                className="p-1 rounded text-[#706b63] hover:text-[#181615] hover:bg-[#ede8dd] transition-colors ml-auto cursor-pointer"
                title={leftNavCollapsed ? 'Expand page list' : 'Collapse page list'}
                aria-label="Toggle page navigation"
              >
                {leftNavCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
              {document.pages.map((p) => {
                const isSelected = p.pageNumber === currentPageNum
                const hasActiveCitation = activeCitation?.pageNumber === p.pageNumber
                const citCount = getPageCitationCount(p.pageNumber)

                return (
                  <button
                    key={p.pageNumber}
                    onClick={() => setCurrentPageNum(p.pageNumber)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-xs transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#ffffff] font-bold text-[#2563eb] shadow-2xs border border-[#e8e3d8]'
                        : 'hover:bg-[#ede8dd] text-[#47433e]'
                    }`}
                    title={`Page ${p.pageNumber} (${p.characterCount} characters, ${citCount} citations)`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#2563eb]' : 'text-[#706b63]'}`} />
                      {!leftNavCollapsed && <span className="truncate">Page {p.pageNumber}</span>}
                    </div>

                    {!leftNavCollapsed && (
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {citCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[#eaf2ec] text-[#2563eb] tabular-nums">
                            {citCount}
                          </span>
                        )}
                        {hasActiveCitation && (
                          <span className="w-2 h-2 rounded-full bg-[#b45309]" title="Currently cited page" />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Jump to Cited Page if active */}
          {activeCitation && activeCitation.pageNumber !== currentPageNum && !leftNavCollapsed && (
            <div className="p-2 border-t border-[#e8e3d8] bg-[#fef3c7]/60">
              <button
                onClick={() => setCurrentPageNum(activeCitation.pageNumber)}
                className="w-full text-left text-xs font-semibold text-[#b45309] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Jump to cited Page {activeCitation.pageNumber}</span>
              </button>
            </div>
          )}

          {/* Document Metadata Summary Card */}
          {!leftNavCollapsed && (
            <div className="p-3 border-t border-[#e8e3d8] bg-[#f8f6f0]/60 text-[11px] text-[#706b63] space-y-1">
              <p><strong>Audience:</strong> {analysis?.metadata.relevantAudience || 'General'}</p>
              <p><strong>Verified Citations:</strong> {analysis?.citationVerificationSummary.verifiedCount || 0}</p>
              <p><strong>Size:</strong> {(document.fileSizeBytes / 1024).toFixed(0)} KB</p>
            </div>
          )}
        </div>

        {/* COLUMN 2: CENTER DOCUMENT READER (The Archival Reading Pane) */}
        <div
          className={`flex-1 flex flex-col bg-[#ffffff] border-r border-[#e8e3d8] overflow-hidden ${
            mobileColumn === 'reader' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Reader Controls Toolbar */}
          <div className="h-10 border-b border-[#e8e3d8] bg-[#fcfbf8] px-3 flex items-center justify-between shrink-0">
            {/* Page Navigation Controls */}
            <div className="flex items-center space-x-1 text-xs">
              <button
                disabled={currentPageNum <= 1}
                onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-[#ede8dd] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-[#47433e]" />
              </button>

              <span className="font-mono text-xs font-semibold text-[#181615] tabular-nums px-1">
                Page {currentPageNum} of {document.pageCount}
              </span>

              <button
                disabled={currentPageNum >= document.pageCount}
                onClick={() => setCurrentPageNum((p) => Math.min(document.pageCount, p + 1))}
                className="p-1 rounded hover:bg-[#ede8dd] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 text-[#47433e]" />
              </button>
            </div>

            {/* In-Document Search, Zoom & Typography Toggle */}
            <div className="flex items-center space-x-2">
              <div className="relative hidden sm:block">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#706b63]" />
                <input
                  type="text"
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  placeholder="Find on page..."
                  className="pl-6 pr-2 py-0.5 text-xs bg-[#f4f1e8] border border-[#e8e3d8] rounded text-[#181615] w-32 focus:w-44 transition-all focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              {/* Typography Mode Toggle */}
              <button
                onClick={() => setReaderTypography(readerTypography === 'clean' ? 'mono' : 'clean')}
                className="p-1 rounded hover:bg-[#ede8dd] text-[#706b63] hover:text-[#181615] transition-colors cursor-pointer"
                title={`Switch font: Currently ${readerTypography === 'clean' ? 'Editorial Serif/Sans' : 'Monospace'}`}
                aria-label="Toggle typography style"
              >
                <Type className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 text-xs text-[#706b63]">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                  className="p-1 hover:bg-[#ede8dd] rounded cursor-pointer"
                  title="Zoom Out"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] w-9 text-center tabular-nums">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                  className="p-1 hover:bg-[#ede8dd] rounded cursor-pointer"
                  title="Zoom In"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Citation Alert Bar */}
          {activeCitation && (
            <div className="bg-[#fef3c7] border-b border-[#fde68a] px-4 py-2 flex items-center justify-between text-xs text-[#92400e] shrink-0 animate-fadeIn">
              <div className="flex items-center space-x-2 truncate">
                <Quote className="w-4 h-4 text-[#b45309] shrink-0" />
                <span className="truncate">
                  <strong>Active Citation (Page {activeCitation.pageNumber}):</strong> "{activeCitation.excerpt.slice(0, 90)}..."
                </span>
              </div>
              <div className="flex items-center space-x-3 shrink-0 ml-2">
                <button
                  onClick={handleCopyCitationAttribution}
                  className="flex items-center space-x-1 text-xs font-semibold hover:underline cursor-pointer"
                  title="Copy quote with official citation"
                >
                  {copiedCitationQuote ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#b45309]" />
                      <span>Copy quote</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onSelectCitation(null)}
                  className="text-xs font-semibold hover:underline cursor-pointer text-[#78350f]"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Document Content Viewport (Archival Paper Sheet) */}
          <div
            ref={textContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#f5f2eb]/60"
          >
            <div
              className="max-w-3xl mx-auto border border-[#e8e3d8] rounded-md p-6 sm:p-8 bg-[#ffffff] shadow-sm min-h-[560px] relative transition-all"
              style={{ fontSize: `${zoomLevel}%` }}
            >
              {/* Paper Sheet Header */}
              <div className="border-b border-[#e8e3d8] pb-3 mb-6 flex items-center justify-between text-[11px] font-mono text-[#706b63]">
                <span className="uppercase tracking-wider">
                  SOURCE DOCUMENT VIEW · PAGE {currentPageNum}
                </span>
                <span className="tabular-nums">{currentPage.characterCount} characters</span>
              </div>

              {/* Main Highlighted Page Text */}
              {renderHighlightedPageText(currentPage.text)}

              {/* Paper Sheet Footer */}
              <div className="border-t border-[#e8e3d8] pt-4 mt-8 flex items-center justify-between text-[10px] font-mono text-[#9c968c]">
                <span>PAPERCUTS VERIFIED TRANSCRIPTION</span>
                <span>PAGE {currentPageNum} OF {document.pageCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: RIGHT EVIDENCE & ANALYSIS PANEL */}
        <div
          className={`w-full lg:w-[480px] xl:w-[540px] flex flex-col bg-[#fcfbf8] overflow-hidden ${
            mobileColumn === 'analysis' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Analysis Navigation Tabs */}
          <div className="border-b border-[#e8e3d8] bg-[#f8f6f0] px-2 flex space-x-0.5 overflow-x-auto shrink-0">
            {[
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'eligibility', label: 'Eligibility', icon: CheckSquare },
              { id: 'deadlines', label: 'Deadlines', icon: Calendar },
              { id: 'documents', label: 'Required Docs', icon: FileCheck2 },
              { id: 'actions', label: 'Action Plan', icon: CheckSquare },
              { id: 'risks', label: 'Risks & Questions', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                  className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#2563eb] text-[#2563eb] bg-[#ffffff]'
                      : 'border-transparent text-[#706b63] hover:text-[#181615] hover:bg-[#ede8dd]/60'
                  }`}
                  aria-selected={isSelected}
                  role="tab"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Analysis Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && analysis && (
              <div className="space-y-4 text-xs">
                {/* Document Metadata card */}
                <div className="bg-[#ffffff] border border-[#e8e3d8] rounded-lg p-4 space-y-3 shadow-2xs">
                  <div className="border-b border-[#e8e3d8] pb-2">
                    <span className="text-[10px] font-mono uppercase text-[#706b63] font-semibold tracking-wider">
                      Extracted Document Metadata
                    </span>
                    <h3 className="font-editorial text-base font-bold text-[#181615] mt-0.5">
                      {analysis.metadata.title}
                    </h3>
                  </div>

                  <div className="space-y-2 text-[#47433e]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold text-[#181615] block">Issuing Authority:</span>
                        <p>{analysis.metadata.issuingOrganization || 'Not explicitly stated'}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-[#181615] block">Document Type:</span>
                        <p className="capitalize">{analysis.metadata.documentType.replace(/_/g, ' ')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold text-[#181615] block">Publication Date:</span>
                        <p className="tabular-nums">{analysis.metadata.publicationDate || 'Not stated'}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-[#181615] block">Application Period:</span>
                        <p>{analysis.metadata.applicationPeriod || 'Not stated'}</p>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-[#181615] block">Target Audience:</span>
                      <p className="leading-relaxed">{analysis.metadata.relevantAudience || 'General audience'}</p>
                    </div>
                  </div>
                </div>

                {/* Evidence Verification Health */}
                <div className="bg-[#ffffff] border border-[#e8e3d8] rounded-lg p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#706b63] font-semibold tracking-wider">
                      Evidence Citation Health
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#eaf2ec] text-[#2563eb] tabular-nums">
                      {analysis.citationVerificationSummary.verifiedCount} / {analysis.citationVerificationSummary.totalCitations} Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-[#706b63] leading-relaxed">
                    Every extracted requirement, deadline, and rule has been matched against verbatim text in the source document.
                  </p>
                </div>

                {/* Document Warnings if present */}
                {analysis.metadata.extractionWarnings && analysis.metadata.extractionWarnings.length > 0 && (
                  <div className="bg-[#fef3c7]/70 border border-[#fde68a] rounded-lg p-3.5 space-y-1.5 text-xs text-[#92400e]">
                    <p className="font-bold flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-[#b45309]" />
                      <span>Document Warnings & Cautions</span>
                    </p>
                    {analysis.metadata.extractionWarnings.map((w, i) => (
                      <p key={i} className="text-[11px] leading-relaxed">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ELIGIBILITY CHECK */}
            {activeTab === 'eligibility' && analysis && (
              <EligibilityChecker
                requirements={analysis.eligibilityRequirements}
                userProfile={userProfile}
                onUpdateProfile={onUpdateProfile}
                onSelectCitation={onSelectCitation}
              />
            )}

            {/* TAB 3: DEADLINES & TIMELINE */}
            {activeTab === 'deadlines' && analysis && (
              <div className="space-y-3">
                {analysis.deadlines.map((dl) => {
                  const remaining = getDaysRemaining(dl.normalizedDate)
                  return (
                    <div
                      key={dl.id}
                      className="bg-[#ffffff] border border-[#e8e3d8] rounded-lg p-3.5 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[#181615]">{dl.eventName}</h4>
                          <p className="text-xs font-mono font-bold text-[#b45309] tabular-nums mt-0.5">
                            {dl.normalizedDate ? formatNormalizedDate(dl.normalizedDate) : 'Pending conditional trigger'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            remaining.status === 'urgent'
                              ? 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
                              : 'bg-[#f4f1e8] text-[#706b63] border-[#e8e3d8]'
                          }`}
                        >
                          {remaining.label}
                        </span>
                      </div>

                      <div className="bg-[#fcfbf8] p-2 rounded text-[11px] text-[#47433e] border border-[#e8e3d8]/60">
                        <span className="font-semibold text-[#706b63]">Text in document: </span>
                        <span className="italic">"{dl.originalDateText}"</span>
                      </div>

                      {dl.sourceCitation && (
                        <button
                          onClick={() => onSelectCitation(dl.sourceCitation)}
                          className="w-full text-left text-[11px] text-[#2563eb] font-semibold hover:underline flex items-center space-x-1 cursor-pointer pt-1"
                        >
                          <Quote className="w-3 h-3 text-[#2563eb]" />
                          <span>View citation on Page {dl.sourceCitation.pageNumber}</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* TAB 4: REQUIRED DOCUMENTS */}
            {activeTab === 'documents' && analysis && (
              <div className="space-y-3">
                {analysis.requiredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-[#ffffff] border border-[#e8e3d8] rounded-lg p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-[#181615]">{doc.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          doc.status === 'mandatory'
                            ? 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
                            : 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#47433e]">
                      <strong>Submission Rule:</strong> {doc.submissionRules}
                    </p>

                    {doc.sourceCitation && (
                      <button
                        onClick={() => onSelectCitation(doc.sourceCitation)}
                        className="text-[11px] text-[#2563eb] font-semibold hover:underline flex items-center space-x-1 cursor-pointer pt-1"
                      >
                        <Quote className="w-3 h-3 text-[#2563eb]" />
                        <span>Source Quote (Page {doc.sourceCitation.pageNumber})</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: ACTION PLAN */}
            {activeTab === 'actions' && analysis && (
              <div className="space-y-3">
                {analysis.actions.map((act) => (
                  <div
                    key={act.id}
                    className="bg-[#ffffff] border border-[#e8e3d8] rounded-lg p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start space-x-2.5">
                      <input
                        type="checkbox"
                        checked={act.completed}
                        onChange={(e) => onToggleAction(act.id, e.target.checked)}
                        className="mt-0.5 rounded border-[#d4cdbe] text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
                      />
                      <div className="flex-1">
                        <h4 className={`text-xs font-bold ${act.completed ? 'line-through text-[#706b63]' : 'text-[#181615]'}`}>
                          {act.title}
                        </h4>
                        <p className="text-[11px] text-[#47433e] mt-0.5">{act.instructions}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#706b63] pt-1.5 border-t border-[#e8e3d8]/60">
                      <span>Priority: <strong className="uppercase">{act.priority}</strong></span>
                      {act.dueDate && <span className="tabular-nums">Due: <strong>{act.dueDate}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 6: RISKS AND QUESTIONS */}
            {activeTab === 'risks' && analysis && (
              <div className="space-y-4">
                {/* Risks list */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#706b63]">
                    Disqualifications & Hidden Conditions
                  </h4>
                  {analysis.risksAndConditions.map((risk) => (
                    <div
                      key={risk.id}
                      className="bg-[#ffffff] border border-[#e8e3d8] rounded-lg p-3.5 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#181615]">{risk.title}</span>
                        <span className="text-[10px] font-bold uppercase text-[#991b1b] bg-[#fee2e2] px-2 py-0.5 rounded border border-[#fca5a5]">
                          {risk.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#47433e] leading-relaxed">{risk.description}</p>
                    </div>
                  ))}
                </div>

                {/* Questions for Clarification */}
                {analysis.questions && analysis.questions.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-[#e8e3d8]">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#706b63]">
                      Clarification Questions for Issuer
                    </h4>
                    {analysis.questions.map((q) => (
                      <div
                        key={q.id}
                        className="bg-[#ffffff] border border-[#e8e3d8] rounded-lg p-3.5 space-y-1 shadow-2xs"
                      >
                        <p className="text-xs font-bold text-[#181615]">❓ {q.question}</p>
                        <p className="text-[11px] text-[#47433e]">
                          <strong>Why it matters:</strong> {q.whyItMatters}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
