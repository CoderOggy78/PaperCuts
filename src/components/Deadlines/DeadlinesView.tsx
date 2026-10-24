import React, { useState } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  AlertTriangle,
  Quote,
  ArrowRight,
  Filter
} from 'lucide-react'
import { downloadICS, generateICSContent } from '../../lib/exporters/icsExporter'
import { formatNormalizedDate, getDaysRemaining } from '../../lib/dateParser'
import type { DeadlineItem, SourceCitation } from '../../types/schema'

interface DeadlinesViewProps {
  deadlines: DeadlineItem[]
  documentTitle?: string
  onSelectCitation?: (citation: SourceCitation) => void
}

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({
  deadlines,
  documentTitle = 'PaperCuts Deadlines',
  onSelectCitation
}) => {
  const [selectedDeadline, setSelectedDeadline] = useState<DeadlineItem | null>(
    deadlines.length > 0 ? deadlines[0] : null
  )
  const [filterMode, setFilterMode] = useState<'all' | 'fixed' | 'relative'>('all')

  const handleExportAll = () => {
    const icsString = generateICSContent(deadlines, documentTitle)
    downloadICS(icsString, `${documentTitle.replace(/\s+/g, '_')}_Deadlines.ics`)
  }

  const handleExportSingle = (item: DeadlineItem) => {
    const icsString = generateICSContent([item], documentTitle)
    downloadICS(icsString, `${item.eventName.replace(/\s+/g, '_')}.ics`)
  }

  const filteredDeadlines = deadlines.filter((d) => {
    if (filterMode === 'fixed') return d.dateKind === 'fixed'
    if (filterMode === 'relative') return d.dateKind === 'relative'
    return true
  })

  // Sort by normalized date ascending (unnormalized at end)
  const sortedDeadlines = [...filteredDeadlines].sort((a, b) => {
    if (!a.normalizedDate) return 1
    if (!b.normalizedDate) return -1
    return a.normalizedDate.localeCompare(b.normalizedDate)
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-4">
      {/* Top Banner & Export Actions */}
      <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-[#b45309]" />
            <h2 className="font-editorial text-xl font-bold text-[#191716]">
              Deadline & Milestone Calendar
            </h2>
          </div>
          <p className="text-xs text-[#57534e] mt-1">
            Official dates parsed deterministically from document text. Never guess years or fabricate times.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleExportAll}
            className="flex items-center space-x-2 px-3.5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-[#fbf9f5] rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Calendar (.ics)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between text-xs border-b border-[#e6dfd3] pb-2">
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-[#736d65]" />
          <span className="font-semibold text-[#191716]">Filter:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-[#2563eb] text-[#fbf9f5]'
                : 'text-[#4a4642] hover:bg-[#efebe2]'
            }`}
          >
            All Deadlines ({deadlines.length})
          </button>
          <button
            onClick={() => setFilterMode('fixed')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterMode === 'fixed'
                ? 'bg-[#2563eb] text-[#fbf9f5]'
                : 'text-[#4a4642] hover:bg-[#efebe2]'
            }`}
          >
            Fixed Dates ({deadlines.filter((d) => d.dateKind === 'fixed').length})
          </button>
          <button
            onClick={() => setFilterMode('relative')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterMode === 'relative'
                ? 'bg-[#2563eb] text-[#fbf9f5]'
                : 'text-[#4a4642] hover:bg-[#efebe2]'
            }`}
          >
            Relative / Conditional ({deadlines.filter((d) => d.dateKind === 'relative').length})
          </button>
        </div>
      </div>

      {/* Main Grid: List + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Deadline list */}
        <div className="lg:col-span-7 space-y-3">
          {sortedDeadlines.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-8 text-center text-xs text-[#736d65]">
              No deadlines found matching this filter.
            </div>
          ) : (
            sortedDeadlines.map((dl) => {
              const remaining = getDaysRemaining(dl.normalizedDate)
              const isSelected = selectedDeadline?.id === dl.id

              let urgencyColor = 'bg-[#f5f1ea] text-[#736d65] border-[#e6dfd3]'
              if (remaining.status === 'urgent' || remaining.status === 'today') {
                urgencyColor = 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
              } else if (remaining.status === 'overdue') {
                urgencyColor = 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
              } else if (remaining.status === 'upcoming') {
                urgencyColor = 'bg-[#e8f0eb] text-[#2563eb] border-[#c2dcd0]'
              }

              return (
                <div
                  key={dl.id}
                  onClick={() => setSelectedDeadline(dl)}
                  className={`bg-[#ffffff] border rounded-lg p-4 cursor-pointer transition-all shadow-xs space-y-2.5 ${
                    isSelected
                      ? 'border-[#2563eb] ring-1 ring-[#2563eb]'
                      : 'border-[#e6dfd3] hover:border-[#736d65]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#191716]">
                        {dl.eventName}
                      </h3>
                      <p className="text-xs font-mono font-bold text-[#b45309] mt-0.5">
                        {dl.normalizedDate
                          ? formatNormalizedDate(dl.normalizedDate)
                          : 'Date pending external trigger'}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${urgencyColor}`}>
                      {remaining.label}
                    </span>
                  </div>

                  {/* Verbatim original wording */}
                  <div className="bg-[#fbf9f5] px-3 py-2 rounded-md border border-[#e6dfd3] text-xs">
                    <span className="font-semibold text-[#736d65]">Original Text: </span>
                    <span className="italic text-[#191716]">"{dl.originalDateText}"</span>
                  </div>

                  {dl.unresolvedAmbiguities && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#b45309]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{dl.unresolvedAmbiguities}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right: Selected Deadline Detail Drawer */}
        <div className="lg:col-span-5">
          {selectedDeadline ? (
            <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-5 space-y-4 shadow-xs sticky top-4">
              <div className="border-b border-[#e6dfd3] pb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#736d65] font-semibold">
                  Deadline Detail
                </span>
                <h3 className="font-editorial text-lg font-bold text-[#191716] mt-0.5">
                  {selectedDeadline.eventName}
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {/* Standardized Date */}
                <div>
                  <span className="font-semibold text-[#736d65] block">Standardized Date:</span>
                  <p className="font-mono text-sm font-bold text-[#191716] mt-0.5">
                    {selectedDeadline.normalizedDate
                      ? formatNormalizedDate(selectedDeadline.normalizedDate)
                      : 'Unambiguous ISO date not available'}
                  </p>
                </div>

                {/* Time & Timezone */}
                <div>
                  <span className="font-semibold text-[#736d65] block">Time & Timezone:</span>
                  <p className="text-[#191716] mt-0.5 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#736d65]" />
                    <span>{selectedDeadline.timeAndZone || 'Not explicitly stated in document'}</span>
                  </p>
                </div>

                {/* Date Kind */}
                <div>
                  <span className="font-semibold text-[#736d65] block">Classification:</span>
                  <p className="text-[#191716] capitalize mt-0.5">
                    {selectedDeadline.dateKind} deadline (Confidence: {selectedDeadline.confidence})
                  </p>
                </div>

                {/* Ambiguities */}
                {selectedDeadline.unresolvedAmbiguities && (
                  <div className="p-3 bg-[#fef3c7]/60 border border-[#fde68a] rounded-md text-[11px] text-[#92400e] space-y-1">
                    <p className="font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Date Ambiguity Note:</span>
                    </p>
                    <p>{selectedDeadline.unresolvedAmbiguities}</p>
                  </div>
                )}

                {/* Source Evidence Citation */}
                {selectedDeadline.sourceCitation && (
                  <div className="pt-2 border-t border-[#e6dfd3]">
                    <span className="font-semibold text-[#736d65] block mb-1.5">
                      Source Document Evidence:
                    </span>
                    <button
                      onClick={() => onSelectCitation?.(selectedDeadline.sourceCitation)}
                      className="w-full text-left bg-[#f5f1ea]/70 hover:bg-[#efebe2] border border-[#e6dfd3] rounded-md p-3 transition-colors cursor-pointer"
                      title="Jump to page in Document Workspace"
                    >
                      <div className="flex items-start space-x-2">
                        <Quote className="w-3.5 h-3.5 text-[#2563eb] shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1 flex-1">
                          <p className="italic text-[#191716]">
                            "{selectedDeadline.sourceCitation.excerpt}"
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-[#736d65] font-mono">
                            <span>Page {selectedDeadline.sourceCitation.pageNumber}</span>
                            <span className="text-[#2563eb] font-semibold flex items-center space-x-1">
                              <span>Jump to page</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Export Single Event CTA */}
                <div className="pt-2">
                  <button
                    onClick={() => handleExportSingle(selectedDeadline)}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#f5f1ea] hover:bg-[#efebe2] text-[#191716] border border-[#e6dfd3] rounded-md text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Event (.ics)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-6 text-center text-xs text-[#736d65]">
              Select a deadline to view detailed citation evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
