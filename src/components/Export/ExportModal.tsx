import React from 'react'
import {
  X,
  Download,
  FileCode,
  FileText,
  Calendar,
  Printer,
  ShieldCheck
} from 'lucide-react'
import { downloadFile, generateMarkdownExport } from '../../lib/exporters/documentExporter'
import { downloadICS, generateICSContent } from '../../lib/exporters/icsExporter'
import type { UserDocument } from '../../types/schema'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  document: UserDocument | null
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  if (!isOpen || !document || !document.analysis) return null

  const analysis = document.analysis
  const baseName = document.fileName.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_')

  const handleExportMarkdown = () => {
    const md = generateMarkdownExport(document, analysis)
    downloadFile(md, `${baseName}_Action_Plan.md`, 'text/markdown;charset=utf-8')
  }

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(analysis, null, 2)
    downloadFile(jsonStr, `${baseName}_Structured_Analysis.json`, 'application/json;charset=utf-8')
  }

  const handleExportICS = () => {
    const ics = generateICSContent(analysis.deadlines, analysis.metadata.title)
    downloadICS(ics, `${baseName}_Deadlines.ics`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 no-print">
      <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg max-w-lg w-full shadow-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e6dfd3] flex items-center justify-between bg-[#fbf9f5]">
          <div>
            <h2 className="font-editorial text-lg font-bold text-[#191716]">
              Export Analysis & Action Plan
            </h2>
            <p className="text-xs text-[#57534e]">
              Download structured data, calendars, or print-ready briefs with full citation provenance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#736d65] hover:text-[#191716] hover:bg-[#efebe2]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="p-6 space-y-4 text-xs">
          {/* Markdown Action Plan */}
          <button
            onClick={handleExportMarkdown}
            className="w-full flex items-start space-x-3.5 p-3.5 rounded-lg border border-[#e6dfd3] hover:border-[#2563eb] hover:bg-[#fbf9f5] transition-all text-left group cursor-pointer"
          >
            <div className="p-2 rounded bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-white transition-colors shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#191716]">
                  Executive Markdown Action Plan (.md)
                </span>
                <Download className="w-4 h-4 text-[#736d65]" />
              </div>
              <p className="text-[11px] text-[#57534e] mt-1 leading-relaxed">
                Checklist formatted with priority tasks, prerequisite rules, verbatim citations, and clear labels distinguishing source facts from AI interpretations.
              </p>
            </div>
          </button>

          {/* JSON Structured Analysis */}
          <button
            onClick={handleExportJSON}
            className="w-full flex items-start space-x-3.5 p-3.5 rounded-lg border border-[#e6dfd3] hover:border-[#2563eb] hover:bg-[#fbf9f5] transition-all text-left group cursor-pointer"
          >
            <div className="p-2 rounded bg-[#f5f1ea] border border-[#e6dfd3] text-[#1e3a8a] group-hover:bg-[#1e3a8a] group-hover:text-[#fbf9f5] transition-colors shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#191716]">
                  Full Structured Schema (.json)
                </span>
                <Download className="w-4 h-4 text-[#736d65]" />
              </div>
              <p className="text-[11px] text-[#57534e] mt-1 leading-relaxed">
                Complete machine-readable JSON adhering to PaperCuts Schema v1.0.0, including all verified source offsets and warnings.
              </p>
            </div>
          </button>

          {/* ICS Calendar Export */}
          <button
            onClick={handleExportICS}
            className="w-full flex items-start space-x-3.5 p-3.5 rounded-lg border border-[#e6dfd3] hover:border-[#2563eb] hover:bg-[#fbf9f5] transition-all text-left group cursor-pointer"
          >
            <div className="p-2 rounded bg-[#f5f1ea] border border-[#e6dfd3] text-[#b45309] group-hover:bg-[#b45309] group-hover:text-[#fbf9f5] transition-colors shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#191716]">
                  Calendar Events (.ics)
                </span>
                <Download className="w-4 h-4 text-[#736d65]" />
              </div>
              <p className="text-[11px] text-[#57534e] mt-1 leading-relaxed">
                Standard RFC 5545 iCalendar file compatible with Apple Calendar, Google Calendar, and Outlook, with embedded citation notes.
              </p>
            </div>
          </button>

          {/* Print Friendly View */}
          <button
            onClick={handlePrint}
            className="w-full flex items-start space-x-3.5 p-3.5 rounded-lg border border-[#e6dfd3] hover:border-[#2563eb] hover:bg-[#fbf9f5] transition-all text-left group cursor-pointer"
          >
            <div className="p-2 rounded bg-[#f5f1ea] border border-[#e6dfd3] text-[#4a4642] group-hover:bg-[#4a4642] group-hover:text-[#fbf9f5] transition-colors shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#191716]">
                  Print-Friendly Report
                </span>
                <Printer className="w-4 h-4 text-[#736d65]" />
              </div>
              <p className="text-[11px] text-[#57534e] mt-1 leading-relaxed">
                Clean, media-styled printable brief without navigation bars or UI chrome.
              </p>
            </div>
          </button>

          {/* Legal / Authenticity Notice */}
          <div className="p-3 bg-[#f7f4ed] border border-[#e6dfd3] rounded-md text-[11px] text-[#736d65] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#1b4332] shrink-0" />
            <span>
              Exports include informational synthesis and citations only. PaperCuts does not issue official certificates or legal approvals.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
