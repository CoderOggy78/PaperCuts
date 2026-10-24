import React, { useState } from 'react'
import {
  FileText,
  CheckSquare,
  Calendar,
  Settings as SettingsIcon,
  ShieldCheck,
  FolderOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { AIProviderConfig } from '../../lib/ai/types'

export type NavTab = 'workspace' | 'overview' | 'actions' | 'deadlines' | 'examples'

interface SidebarProps {
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
  onOpenSettings: () => void
  onOpenImport: () => void
  aiConfig: AIProviderConfig
  docCount: number
  activeDocTitle?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onOpenImport,
  aiConfig,
  docCount,
  activeDocTitle
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isDemoMode = aiConfig.mode === 'demo_precomputed'

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Dossier & Action Pass',
      icon: Sparkles,
      badge: activeDocTitle ? 'Active' : undefined,
      description: 'Executive briefing and personalized action pass'
    },
    {
      id: 'workspace' as NavTab,
      label: 'Document Workspace',
      icon: FileText,
      description: '3-column source reader and evidence inspector'
    },
    {
      id: 'actions' as NavTab,
      label: 'Action Tracker',
      icon: CheckSquare,
      description: 'Prioritized checklist with notes'
    },
    {
      id: 'deadlines' as NavTab,
      label: 'Deadlines & Timeline',
      icon: Calendar,
      description: 'Deterministic dates and iCal export'
    }
  ]

  return (
    <aside
      className={`bg-[#f8f6f0] border-r border-[#e8e3d8] flex flex-col justify-between h-screen select-none shrink-0 transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
      aria-label="Application Navigation"
    >
      {/* Top Brand & Actions */}
      <div>
        {/* Brand Header */}
        <div className="h-14 border-b border-[#e8e3d8] px-3.5 flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-7 h-7 rounded-md bg-[#2563eb] text-[#fcfbf8] flex items-center justify-center shrink-0 shadow-2xs">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="m9 15 2 2 4-4" />
                </svg>
              </div>
              <div className="truncate">
                <span className="font-editorial text-base font-bold tracking-tight text-[#181615] block leading-tight">
                  PaperCuts
                </span>
                <span className="text-[10px] text-[#706b63] font-medium tracking-tight block">
                  Document Intelligence
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-md bg-[#2563eb] text-[#fcfbf8] flex items-center justify-center shadow-2xs" title="PaperCuts">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="m9 15 2 2 4-4" />
              </svg>
            </div>
          )}

          {/* Collapse rail toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-[#706b63] hover:text-[#181615] hover:bg-[#ede8dd] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Upload Action */}
        <div className="p-2.5">
          <button
            onClick={onOpenImport}
            className={`w-full flex items-center justify-center space-x-2 py-2 px-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-[#fcfbf8] rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
              isCollapsed ? 'px-0' : ''
            }`}
            title="Import Document PDF"
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Analyze Document</span>}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-2 py-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isSelected = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#ffffff] text-[#2563eb] font-bold shadow-2xs border border-[#e8e3d8]'
                    : 'text-[#47433e] hover:bg-[#ede8dd] hover:text-[#181615]'
                }`}
                title={isCollapsed ? item.label : item.description}
                aria-current={isSelected ? 'page' : undefined}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#2563eb]' : 'text-[#706b63]'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0 ml-1" title="Document loaded" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer / Privacy & AI Status */}
      <div className="p-2.5 border-t border-[#e8e3d8] space-y-2 bg-[#f4f1e8]/60">
        {!isCollapsed ? (
          <>
            {/* Privacy badge */}
            <div className="px-2.5 py-2 rounded-md bg-[#ffffff] border border-[#e8e3d8] text-[11px] text-[#47433e] space-y-1">
              <div className="flex items-center justify-between font-semibold text-[#181615]">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Local Memory</span>
                </div>
                <span className="text-[10px] font-mono text-[#706b63] tabular-nums">
                  {docCount} {docCount === 1 ? 'dossier' : 'dossiers'}
                </span>
              </div>
              <p className="text-[10px] text-[#706b63] leading-tight">
                {isDemoMode
                  ? 'All text processed in private local memory.'
                  : `Endpoint: ${aiConfig.modelIdentifier}`}
              </p>
            </div>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-[#47433e] hover:bg-[#ede8dd] hover:text-[#181615] transition-colors cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <SettingsIcon className="w-3.5 h-3.5 text-[#706b63]" />
                <span>AI Configuration</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#b45309]' : 'bg-[#1b4332]'}`} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-2 py-1">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-md text-[#706b63] hover:text-[#181615] hover:bg-[#ede8dd]"
              title="Settings & AI Configuration"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            <div className="w-2 h-2 rounded-full bg-[#1b4332]" title="Local in-memory mode" />
          </div>
        )}
      </div>
    </aside>
  )
}
