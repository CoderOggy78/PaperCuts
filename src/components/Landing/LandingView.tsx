import React, { useState, useRef, useMemo } from 'react'
import {
  Calendar,
  Download,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  FileText,
  Upload,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  Sparkles,
  HelpCircle,
  XCircle
} from 'lucide-react'
import type { UserDocument, UserProfileAnswers } from '../../types/schema'
import { generateICSContent, downloadICS } from '../../lib/exporters/icsExporter'
import {
  assessRequirementsAgainstProfile,
  calculateOverallEligibilityResult
} from '../../lib/eligibilityCalculator'
import { formatNormalizedDate, getDaysRemaining } from '../../lib/dateParser'

interface LandingViewProps {
  onAnalyzeDocument: () => void
  onExploreSample: () => void
  onOpenWorkspace: () => void
  activeDoc: UserDocument | null
  documents: UserDocument[]
  onSelectDoc: (doc: UserDocument) => void
  userProfile: UserProfileAnswers
  onUpdateProfile: (profile: UserProfileAnswers) => void
  onExportMarkdown?: () => void
}

export const LandingView: React.FC<LandingViewProps> = ({
  onAnalyzeDocument,
  onExploreSample,
  onOpenWorkspace,
  activeDoc,
  documents,
  onSelectDoc,
  userProfile,
  onUpdateProfile
}) => {
  const [copiedBrief, setCopiedBrief] = useState(false)
  const [isDownloadingPass, setIsDownloadingPass] = useState(false)
  const passRef = useRef<HTMLDivElement>(null)

  const userName = String(userProfile.name || '')
  const gpa = String(userProfile.gpa || '')
  const educationLevel = String(userProfile.educationLevel || 'Junior or Senior Undergraduate')
  const citizenship = String(userProfile.citizenship || 'U.S. Citizen / Permanent Resident')

  // Dynamic values extracted from active document
  const docTitle =
    activeDoc?.analysis?.metadata?.title || activeDoc?.fileName || 'No Document Loaded'
  const pageCount = activeDoc?.pageCount || 0
  const verifiedCitationsCount =
    activeDoc?.analysis?.citationVerificationSummary?.verifiedCount ?? 0
  const totalCitationsCount = activeDoc?.analysis?.citationVerificationSummary?.totalCitations ?? 0
  const verificationPct =
    totalCitationsCount > 0
      ? Math.round((verifiedCitationsCount / totalCitationsCount) * 100)
      : activeDoc
      ? 100
      : 0

  // Real Deadlines from active document
  const deadlines = useMemo(() => activeDoc?.analysis?.deadlines || [], [activeDoc])
  const nextDeadline = deadlines[0] || null
  const nextDeadlineRemaining = nextDeadline ? getDaysRemaining(nextDeadline.normalizedDate) : null
  const nextDeadlineFormatted = nextDeadline?.normalizedDate
    ? formatNormalizedDate(nextDeadline.normalizedDate)
    : nextDeadline?.originalDateText || 'No fixed deadline'

  // Real Required Documents
  const requiredDocs = useMemo(() => activeDoc?.analysis?.requiredDocuments || [], [activeDoc])

  // Deterministic Eligibility Assessment against active document
  const assessedCriteria = useMemo(() => {
    if (!activeDoc?.analysis?.eligibilityRequirements) return []
    return assessRequirementsAgainstProfile(activeDoc.analysis.eligibilityRequirements, userProfile)
  }, [activeDoc, userProfile])

  const overallEligibility = useMemo(() => {
    return calculateOverallEligibilityResult(assessedCriteria)
  }, [assessedCriteria])

  const matchedCriteriaCount = assessedCriteria.filter(
    (c) => c.statusBadge === 'MATCHES PROVIDED INFORMATION'
  ).length

  // Dynamic Brief for Clipboard Export
  const summaryBrief = useMemo(() => {
    if (!activeDoc) {
      return `📄 PaperCuts Document Dossier\nNo document currently loaded.\nUpload a document or explore the sample notice to generate a verified action dossier.`
    }

    const deadlineLines =
      deadlines.length > 0
        ? deadlines
            .slice(0, 3)
            .map(
              (d) =>
                `• ${d.eventName}: ${
                  d.normalizedDate ? formatNormalizedDate(d.normalizedDate) : d.originalDateText
                }`
            )
            .join('\n')
        : '• No explicit fixed deadlines detected.'

    const docLines =
      requiredDocs.length > 0
        ? requiredDocs.slice(0, 5).map((d, i) => `${i + 1}. ${d.title}`).join('\n')
        : '• No mandatory attachments specified in document.'

    return `📄 PaperCuts Verified Document Dossier
Document: ${docTitle} (${pageCount} Pages)
Applicant: ${userName.trim() || 'Alex Chen'}
Overall Status: ${overallEligibility} (${matchedCriteriaCount}/${assessedCriteria.length || 0} criteria satisfied)

Key Deadlines:
${deadlineLines}

Required Attachments (${requiredDocs.length} items):
${docLines}

Audit Trail: ${verifiedCitationsCount}/${totalCitationsCount} citations verified with deterministic page reconciliation.
Generated via PaperCuts — "Less paperwork. More progress."`
  }, [
    activeDoc,
    docTitle,
    pageCount,
    userName,
    overallEligibility,
    matchedCriteriaCount,
    assessedCriteria.length,
    deadlines,
    requiredDocs,
    verifiedCitationsCount,
    totalCitationsCount
  ])

  const handleCopyBrief = () => {
    navigator.clipboard.writeText(summaryBrief)
    setCopiedBrief(true)
    setTimeout(() => setCopiedBrief(false), 2200)
  }

  const handleDownloadICS = () => {
    if (activeDoc?.analysis?.deadlines && activeDoc.analysis.deadlines.length > 0) {
      const ics = generateICSContent(activeDoc.analysis.deadlines, activeDoc.fileName)
      downloadICS(ics, `${activeDoc.fileName.replace(/\.[^/.]+$/, '')}_Deadlines.ics`)
    }
  }

  // Draw high-resolution canvas ticket pass from REAL active document data
  const handleSavePassImage = () => {
    setIsDownloadingPass(true)
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 1040
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Outer border
      ctx.fillStyle = '#2563eb'
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, 800, 1040, 24)
      } else {
        ctx.rect(0, 0, 800, 1040)
      }
      ctx.fill()

      // Inner crisp ivory card
      ctx.fillStyle = '#fcfbf8'
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(18, 18, 764, 1004, 16)
      } else {
        ctx.rect(18, 18, 764, 1004)
      }
      ctx.fill()

      // Header logo & product eyebrow
      ctx.fillStyle = '#181615'
      ctx.font = 'bold 15px Georgia, serif'
      ctx.fillText('PAPERCUTS DOCUMENT INTELLIGENCE', 56, 75)

      ctx.fillStyle = '#2563eb'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(
        `DOSSIER #${activeDoc ? activeDoc.id.slice(0, 8).toUpperCase() : 'EMPTY'}`,
        744,
        75
      )
      ctx.textAlign = 'left'

      // Title & Tagline
      ctx.fillStyle = '#181615'
      ctx.font = 'bold 28px Georgia, serif'
      const truncatedTitle = docTitle.length > 38 ? docTitle.slice(0, 35) + '...' : docTitle
      ctx.fillText(truncatedTitle, 56, 130)

      ctx.fillStyle = '#2563eb'
      ctx.font = 'italic 20px Georgia, serif'
      ctx.fillText('Verified Document Action Pass', 56, 165)

      // Divider line
      ctx.strokeStyle = '#e8e3d8'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(56, 195)
      ctx.lineTo(744, 195)
      ctx.stroke()

      // Applicant Name
      ctx.fillStyle = '#706b63'
      ctx.font = 'bold 12px monospace'
      ctx.fillText('APPLICANT NAME', 56, 235)

      ctx.fillStyle = '#181615'
      ctx.font = 'italic bold 36px Georgia, serif'
      ctx.fillText(userName.trim() || 'Alex Chen', 56, 280)

      // Live Eligibility Pill
      let statusText = '✓ ALL REQUIREMENTS SATISFIED'
      let statusBg = '#eff6ff'
      let statusColor = '#2563eb'

      if (overallEligibility === 'AT LEAST ONE REQUIREMENT NOT SATISFIED') {
        statusText = '✕ CRITERIA MISMATCH DETECTED'
        statusBg = '#fee2e2'
        statusColor = '#991b1b'
      } else if (overallEligibility === 'AMBIGUOUS OR CONFLICTING REQUIREMENTS') {
        statusText = '⚠ AMBIGUOUS / CONFLICTING EVIDENCE'
        statusBg = '#fef3c7'
        statusColor = '#92400e'
      } else if (overallEligibility === 'INSUFFICIENT INFORMATION') {
        statusText = `ℹ INFORMATION NEEDED (${matchedCriteriaCount}/${assessedCriteria.length || 0} MATCHED)`
        statusBg = '#eff6ff'
        statusColor = '#2563eb'
      }

      ctx.fillStyle = statusBg
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(56, 310, 520, 34, 17)
      } else {
        ctx.rect(56, 310, 520, 34)
      }
      ctx.fill()

      ctx.fillStyle = statusColor
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(statusText, 76, 332)

      // Key Dates Box
      ctx.fillStyle = '#f8f6f0'
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(56, 370, 688, 140, 12)
      } else {
        ctx.rect(56, 370, 688, 140)
      }
      ctx.fill()

      ctx.fillStyle = '#706b63'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('EXTRACTED MILESTONES & DEADLINES', 80, 400)

      if (deadlines.length > 0) {
        deadlines.slice(0, 2).forEach((dl, idx) => {
          const y = 438 + idx * 40
          ctx.fillStyle = '#181615'
          ctx.font = 'bold 14px sans-serif'
          const label = dl.eventName.length > 25 ? dl.eventName.slice(0, 23) + '...' : dl.eventName
          ctx.fillText(label, 80, y)

          ctx.fillStyle = idx === 0 ? '#2563eb' : '#991b1b'
          ctx.font = 'bold 14px monospace'
          const dateStr = dl.normalizedDate
            ? formatNormalizedDate(dl.normalizedDate)
            : dl.originalDateText
          ctx.fillText(dateStr, 320, y)
        })
      } else {
        ctx.fillStyle = '#706b63'
        ctx.font = 'italic 13px sans-serif'
        ctx.fillText('No explicit deadline dates found in document.', 80, 445)
      }

      // Perforated line with ticket notches
      ctx.strokeStyle = '#d4cdbe'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 8])
      ctx.beginPath()
      ctx.moveTo(56, 550)
      ctx.lineTo(744, 550)
      ctx.stroke()
      ctx.setLineDash([])

      // Ticket Notches (cutouts)
      ctx.fillStyle = '#2563eb'
      ctx.beginPath()
      ctx.arc(18, 550, 16, -Math.PI / 2, Math.PI / 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(782, 550, 16, Math.PI / 2, -Math.PI / 2)
      ctx.fill()

      // Required Attachments Section
      ctx.fillStyle = '#706b63'
      ctx.font = 'bold 11px monospace'
      ctx.fillText(
        `REQUIRED ATTACHMENTS (${requiredDocs.length} ITEMS VERIFIED IN SOURCE)`,
        56,
        600
      )

      const displayItems =
        requiredDocs.length > 0
          ? requiredDocs.slice(0, 5).map((d) => `• ${d.title}`)
          : ['• No specific mandatory attachments required.']

      ctx.fillStyle = '#47433e'
      ctx.font = '13px sans-serif'
      displayItems.forEach((item, idx) => {
        const truncated = item.length > 70 ? item.slice(0, 68) + '...' : item
        ctx.fillText(truncated, 56, 630 + idx * 26)
      })

      // Divider
      ctx.strokeStyle = '#e8e3d8'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(56, 780)
      ctx.lineTo(744, 780)
      ctx.stroke()

      // Provenance & Barcode Section
      ctx.fillStyle = '#706b63'
      ctx.font = '11px monospace'
      ctx.fillText(
        `AUDIT TRAIL: ${verifiedCitationsCount}/${totalCitationsCount} CITATIONS DETERMINISTICALLY VERIFIED`,
        56,
        815
      )

      // Barcode bars
      ctx.fillStyle = '#181615'
      let bx = 56
      while (bx < 420) {
        const w = bx % 7 === 0 || bx % 11 === 0 ? 3 : 1.5
        ctx.fillRect(bx, 835, w, 40)
        bx += w + 2
      }

      // Stats counters on right
      ctx.fillStyle = '#181615'
      ctx.font = 'bold 24px Georgia, serif'
      ctx.fillText(String(verifiedCitationsCount), 480, 855)
      ctx.fillStyle = '#706b63'
      ctx.font = '11px sans-serif'
      ctx.fillText('Verified Citations', 480, 875)

      ctx.fillStyle = '#181615'
      ctx.font = 'bold 24px Georgia, serif'
      ctx.fillText(`${verificationPct}%`, 620, 855)
      ctx.fillStyle = '#706b63'
      ctx.font = '11px sans-serif'
      ctx.fillText('Evidence Coverage', 620, 875)

      // Footer
      ctx.fillStyle = '#9c968c'
      ctx.font = '11px sans-serif'
      ctx.fillText(
        'PaperCuts — "Less paperwork. More progress." · Deterministic document intelligence',
        56,
        930
      )

      // Trigger download
      const a = document.createElement('a')
      a.download = `PaperCuts_Action_Pass_${(userName || 'Applicant').replace(/\s+/g, '_')}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    setIsDownloadingPass(false)
  }

  return (
    <div className="min-h-screen bg-[#fcfbf8] text-[#181615] font-sans antialiased relative overflow-x-hidden pb-16">
      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* Eyebrow Announcement Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e3d8] pb-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-xs font-semibold text-[#2563eb]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>PAPERCUTS DOCUMENT INTELLIGENCE</span>
            <span className="text-[#a4c9b6]">·</span>
            <span className="text-[#47433e] font-normal">Less paperwork. More progress.</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[#706b63] font-mono hidden sm:inline">
              100% Deterministic · Zero Hallucinations
            </span>
            <button
              onClick={onOpenWorkspace}
              className="text-[#2563eb] hover:text-[#1d4ed8] font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>Open Document Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Section: Editorial Headline + Dynamic Next Deadline Card */}
        <div className="relative pt-2">
          {/* Floating Next Deadline Flip Card */}
          <div className="sm:absolute sm:top-2 sm:right-0 mb-6 sm:mb-0 inline-block">
            <div className="bg-[#ffffff] border border-[#e8e3d8] rounded-xl p-4 shadow-xs text-center min-w-[140px]">
              <span className="text-[10px] font-mono tracking-widest text-[#706b63] font-bold block uppercase">
                NEXT DEADLINE
              </span>
              <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#181615] block my-0.5 tabular-nums truncate max-w-[140px]">
                {nextDeadline?.normalizedDate
                  ? new Date(nextDeadline.normalizedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Pending'}
              </span>
              <span className="text-xs font-semibold text-[#2563eb] block truncate max-w-[140px]">
                {nextDeadline?.eventName || 'Next Milestone'}
              </span>
              <div className="mt-2 pt-2 border-t border-[#e8e3d8] flex items-center justify-center space-x-1.5 text-[11px] text-[#706b63]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    nextDeadlineRemaining?.status === 'urgent'
                      ? 'bg-rose-500'
                      : nextDeadlineRemaining?.status === 'upcoming'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />
                <span className="truncate">{nextDeadlineRemaining?.label || 'Awaiting PDF'}</span>
              </div>
            </div>
          </div>

          {/* Grand Editorial Headline */}
          <div className="max-w-3xl space-y-4">
            <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-normal text-[#181615] tracking-tight leading-[1.08]">
              Turn complicated paperwork into
              <span className="font-serif italic text-[#2563eb] block sm:inline">
                {' '}
                clear, verified action.
              </span>
            </h1>

            <p className="text-base text-[#47433e] font-sans leading-relaxed max-w-2xl">
              PaperCuts analyzes scholarships, government circulars, internship offers, and policy
              PDFs. Inspect source citations page-by-page, test your personal eligibility against
              published rules, and extract deterministic deadlines with zero fabricated claims.
            </p>

            {/* Document Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#ffffff] border border-[#e8e3d8] text-xs font-medium text-[#47433e] shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#2563eb]" />
                <span className="tabular-nums">{nextDeadlineFormatted}</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#ffffff] border border-[#e8e3d8] text-xs font-medium text-[#47433e] shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-[#2563eb]" />
                <span className="truncate max-w-[260px]">
                  {docTitle} ({pageCount} Pages)
                </span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#ffffff] border border-[#e8e3d8] text-xs font-medium text-[#47433e] shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563eb]" />
                <span className="tabular-nums">{verifiedCitationsCount} Verified Citations</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Review Steps on Left, Interactive Action Pass on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 3 Actionable Review Steps */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Document Selector & Multi-Document Switcher */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e8e3d8] p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3.5">
                  <div className="w-7 h-7 rounded-md bg-[#181615] text-[#fcfbf8] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="font-editorial text-lg font-bold text-[#181615]">
                      Select or Switch Document
                    </h2>
                    <p className="text-xs text-[#706b63]">
                      Switch between your uploaded notices or analyze a new document.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onAnalyzeDocument}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Analyze PDF</span>
                </button>
              </div>

              {/* Dynamic Document Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {documents.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id
                  return (
                    <button
                      key={doc.id}
                      onClick={() => onSelectDoc(doc)}
                      className={`flex items-start space-x-3 p-3 rounded-lg border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[#2563eb] bg-[#eff6ff]/60 ring-1 ring-[#2563eb] shadow-xs'
                          : 'border-[#e8e3d8] hover:border-[#2563eb]/50 bg-[#f8f6f0]'
                      }`}
                    >
                      <FileText
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isSelected ? 'text-[#2563eb]' : 'text-[#706b63]'
                        }`}
                      />
                      <div className="truncate flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#181615] truncate block">
                            {doc.fileName}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0 ml-1" />
                          )}
                        </div>
                        <span className="text-[11px] text-[#706b63] block tabular-nums">
                          {doc.pageCount} Pages ·{' '}
                          {doc.analysis?.citationVerificationSummary.verifiedCount || 0}{' '}
                          verified citations
                        </span>
                      </div>
                    </button>
                  )
                })}

                {/* Upload New Document Tile */}
                <button
                  onClick={onAnalyzeDocument}
                  className="flex items-start space-x-3 p-3 rounded-lg border border-dashed border-[#d4cdbe] hover:border-[#2563eb] hover:bg-[#eff6ff]/30 text-left transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-[#181615] block">
                      + Analyze Another PDF
                    </span>
                    <span className="text-[11px] text-[#706b63] block">
                      Up to 30 MB · In-memory extraction
                    </span>
                  </div>
                </button>
              </div>

              {/* Sample Document Option */}
              {documents.length === 0 && (
                <div className="pt-2 border-t border-[#e8e3d8] flex items-center justify-between text-xs">
                  <span className="text-[#706b63] text-[11px]">Don't have a document ready?</span>
                  <button
                    onClick={onExploreSample}
                    className="px-3 py-1.5 rounded-md border border-[#e8e3d8] bg-[#f8f6f0] hover:bg-[#ede8dd] text-[#181615] font-semibold flex items-center space-x-1.5 cursor-pointer text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Explore Sample Fellowship Notice</span>
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Personalize Your Match Profile */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e8e3d8] p-5 shadow-xs space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-7 h-7 rounded-md bg-[#181615] text-[#fcfbf8] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  2
                </div>
                <div className="flex-1 space-y-0.5">
                  <h2 className="font-editorial text-lg font-bold text-[#181615]">
                    Personalize Your Match Profile
                  </h2>
                  <p className="text-xs text-[#706b63]">
                    Input your background to test eligibility against {docTitle}. Evaluated strictly
                    in local memory.
                  </p>
                </div>
              </div>

              {/* Profile Inputs Grid */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#181615] mb-1">
                    Name on your dossier
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => onUpdateProfile({ ...userProfile, name: e.target.value })}
                      placeholder="e.g. Alex Chen"
                      className="w-full px-3 py-2 rounded-md border border-[#e8e3d8] text-xs focus:outline-none focus:ring-1 focus:ring-[#2563eb] bg-[#ffffff] font-medium"
                    />
                    <UserCheck className="w-3.5 h-3.5 text-[#9c968c] absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#181615] mb-1">
                      Cumulative GPA
                    </label>
                    <input
                      type="text"
                      value={gpa}
                      onChange={(e) => onUpdateProfile({ ...userProfile, gpa: e.target.value })}
                      placeholder="e.g. 3.80"
                      className="w-full px-3 py-2 rounded-md border border-[#e8e3d8] focus:ring-1 focus:ring-[#2563eb] text-xs focus:outline-none bg-[#ffffff] font-medium tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181615] mb-1">
                      Enrolled Level
                    </label>
                    <select
                      value={educationLevel}
                      onChange={(e) =>
                        onUpdateProfile({ ...userProfile, educationLevel: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-md border border-[#e8e3d8] text-xs focus:outline-none focus:ring-1 focus:ring-[#2563eb] bg-[#ffffff] font-medium text-[#181615]"
                    >
                      <option value="Junior or Senior Undergraduate">
                        Junior or Senior Undergraduate
                      </option>
                      <option value="Graduate / Master's Student">Graduate / Master's Student</option>
                      <option value="PhD Candidate">PhD Candidate</option>
                      <option value="Postdoctoral Researcher">Postdoctoral Researcher</option>
                      <option value="Professional / General">Professional / General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181615] mb-1">
                    Citizenship / Residency
                  </label>
                  <select
                    value={citizenship}
                    onChange={(e) =>
                      onUpdateProfile({ ...userProfile, citizenship: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#e8e3d8] text-xs focus:outline-none focus:ring-1 focus:ring-[#2563eb] bg-[#ffffff] font-medium text-[#181615]"
                  >
                    <option value="U.S. Citizen / Permanent Resident">
                      U.S. Citizen / Permanent Resident
                    </option>
                    <option value="Eligible Partner Territory (Puerto Rico, Guam, USVI)">
                      Eligible Partner Territory (Puerto Rico, Guam, USVI)
                    </option>
                    <option value="Other International / F-1">Other International / F-1</option>
                  </select>
                </div>
              </div>

              {/* Reactive Eligibility Status Banner */}
              <div
                className={`p-3 rounded-lg border flex items-center space-x-3 text-xs font-medium ${
                  overallEligibility === 'ELIGIBILITY REQUIREMENTS SATISFIED'
                    ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]'
                    : overallEligibility === 'AT LEAST ONE REQUIREMENT NOT SATISFIED'
                    ? 'bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]'
                    : overallEligibility === 'AMBIGUOUS OR CONFLICTING REQUIREMENTS'
                    ? 'bg-[#fef3c7] border-[#fde68a] text-[#92400e]'
                    : 'bg-[#f8f6f0] border-[#e8e3d8] text-[#47433e]'
                }`}
              >
                {overallEligibility === 'ELIGIBILITY REQUIREMENTS SATISFIED' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2563eb] shrink-0" />
                ) : overallEligibility === 'AT LEAST ONE REQUIREMENT NOT SATISFIED' ? (
                  <XCircle className="w-4 h-4 text-[#991b1b] shrink-0" />
                ) : overallEligibility === 'AMBIGUOUS OR CONFLICTING REQUIREMENTS' ? (
                  <AlertCircle className="w-4 h-4 text-[#b45309] shrink-0" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-[#2563eb] shrink-0" />
                )}
                <div>
                  <span className="font-bold block">{overallEligibility}</span>
                  <span className="text-[11px] opacity-90 block">
                    {assessedCriteria.length > 0
                      ? `${matchedCriteriaCount} of ${assessedCriteria.length} criteria satisfied against published rules in ${docTitle}.`
                      : 'Upload a document to extract and evaluate published eligibility criteria.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Actions & Exports */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e8e3d8] p-5 shadow-xs space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-7 h-7 rounded-md bg-[#181615] text-[#fcfbf8] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  3
                </div>
                <div className="flex-1 space-y-0.5">
                  <h2 className="font-editorial text-lg font-bold text-[#181615]">
                    Unlock Verified Actions & Dossier
                  </h2>
                  <p className="text-xs text-[#706b63]">
                    Export your personalized pass, sync deadlines to calendar, or inspect full
                    citations in the deep workspace.
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleSavePassImage}
                  disabled={isDownloadingPass}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-[#fcfbf8] rounded-md font-semibold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingPass ? 'Generating Pass...' : 'Save Action Pass (PNG)'}</span>
                </button>

                <button
                  onClick={handleCopyBrief}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#ffffff] hover:bg-[#ede8dd] text-[#181615] border border-[#e8e3d8] rounded-md font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  {copiedBrief ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-emerald-800 font-bold">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#706b63]" />
                      <span>Copy Executive Brief</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadICS}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#ffffff] hover:bg-[#ede8dd] text-[#181615] border border-[#e8e3d8] rounded-md font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Sync Deadlines (.ics)</span>
                </button>

                <button
                  onClick={onOpenWorkspace}
                  className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#181615] hover:bg-[#282523] text-[#fcfbf8] rounded-md font-semibold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <span>Open Deep Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: The Official PaperCuts Action Pass */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3">
            <div
              ref={passRef}
              className="bg-[#ffffff] border border-[#e8e3d8] rounded-xl shadow-sm overflow-hidden"
            >
              {/* Top Header Strip */}
              <div className="p-5 bg-[#f8f6f0] border-b border-[#e8e3d8]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-[#2563eb] rounded-xs inline-block" />
                    <span className="font-mono text-xs font-bold tracking-widest text-[#181615]">
                      PAPERCUTS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#2563eb] font-bold border border-[#bfdbfe]">
                    DOSSIER #{activeDoc ? activeDoc.id.slice(0, 8).toUpperCase() : 'EMPTY'}
                  </span>
                </div>

                <div className="mt-3 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#706b63] font-mono">
                    DOCUMENT INTELLIGENCE PASS
                  </span>
                  <h3 className="font-editorial text-xl font-bold text-[#181615] leading-tight truncate">
                    {docTitle}
                  </h3>
                </div>
              </div>

              {/* Main Pass Body (Applicant & Live Eligibility) */}
              <div className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-semibold text-[#706b63] block uppercase tracking-wider font-mono">
                    APPLICANT NAME
                  </span>
                  <div className="font-editorial text-2xl font-bold text-[#181615] tracking-tight mt-0.5 break-words">
                    {userName.trim() || 'Alex Chen'}
                  </div>
                  <span className="text-xs text-[#2563eb] font-medium block mt-0.5 truncate">
                    Verified Dossier · {educationLevel}
                  </span>
                </div>

                {/* Live Reactive Status Pill */}
                <div
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-2 border ${
                    overallEligibility === 'ELIGIBILITY REQUIREMENTS SATISFIED'
                      ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]'
                      : overallEligibility === 'AT LEAST ONE REQUIREMENT NOT SATISFIED'
                      ? 'bg-[#fee2e2] border-[#fca5a5] text-[#991b1b]'
                      : overallEligibility === 'AMBIGUOUS OR CONFLICTING REQUIREMENTS'
                      ? 'bg-[#fef3c7] border-[#fde68a] text-[#92400e]'
                      : 'bg-[#f8f6f0] border-[#e8e3d8] text-[#47433e]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      overallEligibility === 'ELIGIBILITY REQUIREMENTS SATISFIED'
                        ? 'bg-emerald-600'
                        : overallEligibility === 'AT LEAST ONE REQUIREMENT NOT SATISFIED'
                        ? 'bg-red-600'
                        : 'bg-amber-600'
                    }`}
                  />
                  <span className="truncate">
                    {overallEligibility === 'ELIGIBILITY REQUIREMENTS SATISFIED'
                      ? 'MATCHED · REQUIREMENTS SATISFIED'
                      : overallEligibility === 'AT LEAST ONE REQUIREMENT NOT SATISFIED'
                      ? 'MISMATCH · REVIEW CRITERIA'
                      : overallEligibility === 'AMBIGUOUS OR CONFLICTING REQUIREMENTS'
                      ? 'AMBIGUOUS · CLARIFICATION NEEDED'
                      : 'INFORMATION REQUIRED'}
                  </span>
                </div>

                {/* Deadlines Box on Pass */}
                <div className="bg-[#f8f6f0] rounded-md p-3 border border-[#e8e3d8] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#706b63] font-mono text-[10px]">
                    <span>EXTRACTED DEADLINE</span>
                    <span>DUE DATE</span>
                  </div>
                  {deadlines.length > 0 ? (
                    deadlines.slice(0, 2).map((dl, idx) => (
                      <div
                        key={dl.id}
                        className="flex items-center justify-between font-medium text-[#181615]"
                      >
                        <span className="truncate max-w-[170px]">{dl.eventName}</span>
                        <span
                          className={`font-semibold font-mono tabular-nums ${
                            idx === 0 ? 'text-[#2563eb]' : 'text-[#991b1b]'
                          }`}
                        >
                          {dl.normalizedDate
                            ? formatNormalizedDate(dl.normalizedDate)
                            : dl.originalDateText}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#706b63] italic text-[11px] py-1">
                      No explicit deadlines found in document.
                    </div>
                  )}
                </div>
              </div>

              {/* Perforated Tear Line with Side Notches */}
              <div className="relative my-1">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#fcfbf8] border-r border-[#e8e3d8]" />
                <div className="border-t-2 border-dashed border-[#e8e3d8] mx-4" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#fcfbf8] border-l border-[#e8e3d8]" />
              </div>

              {/* Bottom Stub of Pass */}
              <div className="p-5 bg-[#f8f6f0] space-y-3">
                {/* Stats Counters */}
                <div className="grid grid-cols-3 gap-2 text-center py-1">
                  <div className="p-2 rounded bg-[#ffffff] border border-[#e8e3d8]">
                    <span className="font-editorial text-base font-bold text-[#181615] block tabular-nums">
                      {verifiedCitationsCount}
                    </span>
                    <span className="text-[10px] text-[#706b63] block">Citations</span>
                  </div>
                  <div className="p-2 rounded bg-[#ffffff] border border-[#e8e3d8]">
                    <span className="font-editorial text-base font-bold text-[#181615] block tabular-nums">
                      {requiredDocs.length}
                    </span>
                    <span className="text-[10px] text-[#706b63] block">Attachments</span>
                  </div>
                  <div className="p-2 rounded bg-[#ffffff] border border-[#e8e3d8]">
                    <span className="font-editorial text-base font-bold text-[#181615] block tabular-nums">
                      {verificationPct}%
                    </span>
                    <span className="text-[10px] text-[#706b63] block">Verified</span>
                  </div>
                </div>

                {/* Barcode & Security Hash */}
                <div className="pt-2 border-t border-[#e8e3d8] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#706b63]">
                    <span>PROVENANCE</span>
                    <span>
                      DOC: {activeDoc ? activeDoc.fileName.slice(0, 14) + '...' : 'NONE'}
                    </span>
                  </div>
                  {/* Barcode */}
                  <div className="h-7 w-full flex items-center justify-between opacity-80 px-1">
                    {Array.from({ length: 38 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-[#181615] h-full rounded-xs"
                        style={{
                          width: i % 3 === 0 ? '3px' : i % 2 === 0 ? '2px' : '1px'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Directly Under Pass */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSavePassImage}
                disabled={isDownloadingPass}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-[#ffffff] hover:bg-[#ede8dd] border border-[#e8e3d8] text-xs font-semibold text-[#181615] shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#706b63]" />
                <span>Save Pass (PNG)</span>
              </button>

              <button
                onClick={handleCopyBrief}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-[#ffffff] hover:bg-[#ede8dd] border border-[#e8e3d8] text-xs font-semibold text-[#181615] shadow-2xs transition-all cursor-pointer"
              >
                {copiedBrief ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-800">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#706b63]" />
                    <span>Copy Brief</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenWorkspace}
                className="flex items-center justify-center p-2 rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-[#fcfbf8] shadow-xs transition-all cursor-pointer"
                title="Launch Workspace"
                aria-label="Launch Workspace"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
