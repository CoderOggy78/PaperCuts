import React from 'react'
import {
  Search,
  Settings as SettingsIcon,
  PlusCircle,
  FileText,
  Cpu,
  Menu,
  ShieldCheck,
  ChevronDown,
  Trash2
} from 'lucide-react'
import type { AIProviderConfig } from '../../lib/ai/types'
import type { UserDocument } from '../../types/schema'

interface TopBarProps {
  documents: UserDocument[]
  activeDoc: UserDocument | null
  onSelectDoc: (doc: UserDocument) => void
  onRemoveDoc?: (docId: string) => void
  onOpenImport: () => void
  onOpenSettings: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  aiConfig: AIProviderConfig
  onToggleMobileMenu?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  documents,
  activeDoc,
  onSelectDoc,
  onRemoveDoc,
  onOpenImport,
  onOpenSettings,
  searchQuery,
  onSearchChange,
  aiConfig,
  onToggleMobileMenu
}) => {
  const isDemo = aiConfig.mode === 'demo_precomputed'
  const verifiedCitationsCount = activeDoc?.analysis?.citationVerificationSummary.verifiedCount || 0
  const totalCitationsCount = activeDoc?.analysis?.citationVerificationSummary.totalCitations || 0

  return (
    <header className="h-14 border-b border-[#e8e3d8] bg-[#fcfbf8] px-4 flex items-center justify-between shrink-0">
      {/* Left: Mobile Drawer Toggle + Document Switcher */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-md hover:bg-[#ede8dd] text-[#47433e] cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-[#706b63] hidden sm:block shrink-0" />
          <div className="relative flex items-center space-x-1.5">
            {documents.length > 0 ? (
              <>
                <div className="relative">
                  <select
                    value={activeDoc?.id || ''}
                    onChange={(e) => {
                      const target = documents.find((d) => d.id === e.target.value)
                      if (target) onSelectDoc(target)
                    }}
                    className="appearance-none text-xs font-semibold bg-[#ffffff] border border-[#e8e3d8] rounded-md pl-2.5 pr-7 py-1.5 text-[#181615] max-w-[240px] sm:max-w-[320px] truncate focus:outline-none focus:ring-1 focus:ring-[#2563eb] shadow-2xs cursor-pointer"
                    aria-label="Select active document"
                  >
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.isDemoSample ? '⭐ [Demo] ' : ''}{d.fileName} ({d.pageCount} pgs)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#706b63] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {activeDoc && onRemoveDoc && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove "${activeDoc.fileName}" from workspace?`)) {
                        onRemoveDoc(activeDoc.id)
                      }
                    }}
                    className="p-1.5 rounded-md text-[#9c968c] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove document from workspace"
                    aria-label="Remove document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              <span className="text-xs text-[#706b63] italic">No document loaded</span>
            )}
          </div>

          {/* Provenance Pill */}
          {totalCitationsCount > 0 && (
            <div className="hidden xl:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-[10px] font-semibold text-[#2563eb]">
              <ShieldCheck className="w-3 h-3 text-[#2563eb]" />
              <span className="tabular-nums">{verifiedCitationsCount}/{totalCitationsCount} Citations Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Search across document requirements & evidence */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#706b63]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search requirements, deadlines, evidence excerpts..."
            className="w-full text-xs pl-8 pr-12 py-1.5 bg-[#ffffff] border border-[#e8e3d8] rounded-md text-[#181615] placeholder-[#9c968c] focus:outline-none focus:ring-1 focus:ring-[#2563eb] shadow-2xs"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#9c968c] bg-[#f4f1e8] border border-[#e8e3d8] px-1 py-0.2 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: AI Engine status pill + New Analysis CTA */}
      <div className="flex items-center space-x-2.5">
        {/* Engine status indicator */}
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors bg-[#ffffff] hover:bg-[#ede8dd] border-[#e8e3d8] cursor-pointer shadow-2xs"
          title="Click to configure AI Engine (Gemini API / Local Runner)"
          aria-label="AI Engine Settings"
        >
          <Cpu className={`w-3.5 h-3.5 ${isDemo ? 'text-[#b45309]' : 'text-[#2563eb]'}`} />
          <span className="text-[#47433e] hidden sm:inline">Engine:</span>
          <span className="font-semibold text-[#181615] truncate max-w-[120px]">
            {isDemo ? 'Demo Mode' : aiConfig.modelIdentifier}
          </span>
        </button>

        {/* Primary New Analysis Button */}
        <button
          onClick={onOpenImport}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Analyze Document</span>
          <span className="sm:hidden">Upload</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-[#706b63] hover:text-[#181615] hover:bg-[#ede8dd] transition-colors cursor-pointer"
          title="Settings & Privacy Disclosure"
          aria-label="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
