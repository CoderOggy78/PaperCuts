import { useState, useEffect, useMemo } from 'react'
import { Upload, FileText, Sparkles } from 'lucide-react'
import { Sidebar, type NavTab } from './components/Layout/Sidebar'
import { TopBar } from './components/Layout/TopBar'
import { LandingView } from './components/Landing/LandingView'
import { DocumentWorkspace } from './components/Workspace/DocumentWorkspace'
import { ActionTrackerView } from './components/ActionTracker/ActionTrackerView'
import { DeadlinesView } from './components/Deadlines/DeadlinesView'
import { DocumentImportModal } from './components/Import/DocumentImportModal'
import { SettingsModal } from './components/Settings/SettingsModal'
import { ExportModal } from './components/Export/ExportModal'
import { SAMPLE_USER_DOCUMENT } from './data/sampleDocument'
import {
  createAIProvider,
  DEFAULT_AI_CONFIG,
  type AIProviderConfig
} from './lib/ai'
import {
  loadStoredDocuments,
  saveStoredDocuments,
  loadUserProfile,
  saveUserProfile,
  saveTaskOverride,
  mergeActionsWithUserOverrides
} from './lib/storage'
import { generateMarkdownExport, downloadFile } from './lib/exporters/documentExporter'
import type { SourceCitation, UserDocument, UserProfileAnswers } from './types/schema'

export function App() {
  // Navigation State - defaults to 'overview' (Kepler Dossier & Action Pass)
  const [activeTab, setActiveTab] = useState<NavTab>('overview')

  // Real Documents State: Starts strictly with stored documents, NEVER populated with fabricated demo documents by default!
  const [documents, setDocuments] = useState<UserDocument[]>(() => {
    return loadStoredDocuments()
  })

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    const stored = loadStoredDocuments()
    return stored[0]?.id || ''
  })

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() => {
    try {
      const raw = localStorage.getItem('papercuts_ai_config_v1')
      if (raw) return JSON.parse(raw)
    } catch {
      // fallback
    }
    return DEFAULT_AI_CONFIG
  })

  // User Profile Answers for Personalized Eligibility
  const [userProfile, setUserProfile] = useState<UserProfileAnswers>(() => loadUserProfile())

  // Citations jumping state
  const [activeCitation, setActiveCitation] = useState<SourceCitation | null>(null)

  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('')
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Save documents to storage whenever they change
  useEffect(() => {
    saveStoredDocuments(documents.filter((d) => !d.isDemoSample))
  }, [documents])

  // Save AI config
  useEffect(() => {
    try {
      const copy = { ...aiConfig }
      delete copy.ephemeralToken // NEVER persist auth secrets!
      localStorage.setItem('papercuts_ai_config_v1', JSON.stringify(copy))
    } catch {
      // ignore
    }
  }, [aiConfig])

  // Instantiate active AI Provider
  const aiProvider = useMemo(() => createAIProvider(aiConfig), [aiConfig])

  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === activeDocId) || documents[0] || null
  }, [documents, activeDocId])

  // Citation selection handler: jumps directly to workspace
  const handleSelectCitation = (citation: SourceCitation | null) => {
    setActiveCitation(citation)
    if (citation) {
      setActiveTab('workspace')
    }
  }

  // Document imported handler
  const handleDocumentImported = (newDoc: UserDocument) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)])
    setActiveDocId(newDoc.id)
    setActiveTab('workspace')
    localStorage.setItem('papercuts_visited', 'true')
  }

  // Action completion toggle handler
  const handleToggleAction = (actionId: string, completed: boolean) => {
    saveTaskOverride(actionId, { completed })

    setDocuments((prev) =>
      prev.map((doc) => {
        if (!doc.analysis) return doc
        const updatedActions = doc.analysis.actions.map((act) => {
          if (act.id === actionId) {
            return {
              ...act,
              completed,
              userEdited: true,
              updatedAt: new Date().toISOString()
            }
          }
          return act
        })
        return {
          ...doc,
          analysis: {
            ...doc.analysis,
            actions: updatedActions
          }
        }
      })
    )
  }

  // Update action notes handler
  const handleUpdateActionNotes = (actionId: string, notes: string) => {
    saveTaskOverride(actionId, { userNotes: notes })

    setDocuments((prev) =>
      prev.map((doc) => {
        if (!doc.analysis) return doc
        const updatedActions = doc.analysis.actions.map((act) => {
          if (act.id === actionId) {
            return {
              ...act,
              userNotes: notes,
              userEdited: true,
              updatedAt: new Date().toISOString()
            }
          }
          return act
        })
        return {
          ...doc,
          analysis: {
            ...doc.analysis,
            actions: updatedActions
          }
        }
      })
    )
  }

  // Update profile handler
  const handleUpdateProfile = (newProfile: UserProfileAnswers) => {
    setUserProfile(newProfile)
    saveUserProfile(newProfile)
  }

  // Purge data handler - clean wipe
  const handleDataPurged = () => {
    setDocuments([])
    setActiveDocId('')
    setUserProfile({})
    setActiveCitation(null)
    setActiveTab('overview')
  }

  // Remove document from workspace
  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== docId)
      if (activeDocId === docId) {
        setActiveDocId(next[0]?.id || '')
      }
      return next
    })
    setActiveCitation(null)
  }

  // Export markdown for active document
  const handleExportMarkdown = () => {
    if (activeDoc && activeDoc.analysis) {
      const md = generateMarkdownExport(activeDoc, activeDoc.analysis)
      downloadFile(md, `${activeDoc.fileName.replace(/\.[^/.]+$/, '')}_Action_Plan.md`, 'text/markdown')
    }
  }

  // Handle exploring sample - adds explicitly labeled sample to workspace
  const handleExploreSample = () => {
    setDocuments((prev) => {
      if (prev.some((d) => d.id === SAMPLE_USER_DOCUMENT.id)) return prev
      return [SAMPLE_USER_DOCUMENT, ...prev]
    })
    setActiveDocId(SAMPLE_USER_DOCUMENT.id)
    setActiveTab('workspace')
    localStorage.setItem('papercuts_visited', 'true')
  }

  // All actions aggregated across docs
  const allActions = useMemo(() => {
    const list = []
    for (const doc of documents) {
      if (doc.analysis) {
        list.push(...doc.analysis.actions)
      }
    }
    return mergeActionsWithUserOverrides(list)
  }, [documents])

  // All deadlines aggregated
  const allDeadlines = useMemo(() => {
    const list = []
    for (const doc of documents) {
      if (doc.analysis) {
        list.push(...doc.analysis.deadlines)
      }
    }
    return list
  }, [documents])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbf9f5] text-[#191716] font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab)
            if (tab === 'examples') {
              setActiveDocId(SAMPLE_USER_DOCUMENT.id)
              setActiveTab('workspace')
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenImport={() => setIsImportOpen(true)}
          aiConfig={aiConfig}
          docCount={documents.length}
          activeDocTitle={activeDoc?.fileName}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 h-full bg-[#f7f4ed]">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab)
                setMobileMenuOpen(false)
                if (tab === 'examples') {
                  setActiveDocId(SAMPLE_USER_DOCUMENT.id)
                  setActiveTab('workspace')
                }
              }}
              onOpenSettings={() => {
                setIsSettingsOpen(true)
                setMobileMenuOpen(false)
              }}
              onOpenImport={() => {
                setIsImportOpen(true)
                setMobileMenuOpen(false)
              }}
              aiConfig={aiConfig}
              docCount={documents.length}
              activeDocTitle={activeDoc?.fileName}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TopBar */}
        <TopBar
          documents={documents}
          activeDoc={activeDoc}
          onSelectDoc={(d) => {
            setActiveDocId(d.id)
          }}
          onRemoveDoc={handleRemoveDocument}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          aiConfig={aiConfig}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* View Switcher */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' ? (
            <LandingView
              onAnalyzeDocument={() => setIsImportOpen(true)}
              onExploreSample={handleExploreSample}
              onOpenWorkspace={() => setActiveTab('workspace')}
              activeDoc={activeDoc}
              documents={documents}
              onSelectDoc={(d) => {
                setActiveDocId(d.id)
              }}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onExportMarkdown={handleExportMarkdown}
            />
          ) : activeTab === 'workspace' ? (
            activeDoc ? (
              <DocumentWorkspace
                document={activeDoc}
                activeCitation={activeCitation}
                onSelectCitation={setActiveCitation}
                userProfile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onToggleAction={handleToggleAction}
                onOpenExportModal={() => setIsExportOpen(true)}
                onRemoveDocument={handleRemoveDocument}
                onUploadAnother={() => setIsImportOpen(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] bg-[#fcfbf8] p-6 text-center animate-fadeIn">
                <div className="max-w-xl w-full bg-white border border-[#e8e3d8] rounded-2xl p-8 shadow-sm space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center mx-auto shadow-xs">
                    <FileText className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#2563eb] font-bold px-2.5 py-0.5 rounded-full bg-[#eff6ff] border border-[#bfdbfe] inline-block">
                      Clean Workspace
                    </span>
                    <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#181615]">
                      No document loaded in workspace
                    </h2>
                    <p className="text-xs text-[#706b63] leading-relaxed max-w-md mx-auto">
                      Upload any scholarship announcement, college circular, internship offer, or government policy PDF.
                      PaperCuts extracts verifiable requirements, verifies citations page-by-page, and turns them into a personalized action plan.
                    </p>
                  </div>

                  {/* Dropzone trigger */}
                  <div
                    onClick={() => setIsImportOpen(true)}
                    className="border-2 border-dashed border-[#d4cdbe] hover:border-[#2563eb] hover:bg-[#eff6ff]/30 rounded-xl p-8 cursor-pointer transition-all space-y-2 group"
                  >
                    <Upload className="w-8 h-8 text-[#2563eb] mx-auto group-hover:scale-105 transition-transform" />
                    <p className="text-xs font-bold text-[#181615]">
                      Click or drag PDF to analyze
                    </p>
                    <p className="text-[11px] text-[#706b63]">
                      Standard PDF files up to 30 MB · In-memory page-by-page extraction
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#e8e3d8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-[#706b63] text-[11px]">Don't have a PDF right now?</span>
                    <button
                      onClick={handleExploreSample}
                      className="px-3.5 py-1.5 rounded-lg border border-[#e8e3d8] bg-[#f8f6f0] hover:bg-[#ede8dd] text-[#181615] font-semibold flex items-center space-x-1.5 cursor-pointer text-xs shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Explore Sample Fellowship Notice (Demo)</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : activeTab === 'actions' ? (
            <ActionTrackerView
              actions={allActions}
              onToggleAction={handleToggleAction}
              onUpdateActionNotes={handleUpdateActionNotes}
              onSelectCitation={handleSelectCitation}
              onExportMarkdown={handleExportMarkdown}
            />
          ) : activeTab === 'deadlines' ? (
            <DeadlinesView
              deadlines={allDeadlines}
              documentTitle={activeDoc?.fileName || 'PaperCuts Deadlines'}
              onSelectCitation={handleSelectCitation}
            />
          ) : (
            <LandingView
              onAnalyzeDocument={() => setIsImportOpen(true)}
              onExploreSample={handleExploreSample}
              onOpenWorkspace={() => setActiveTab('workspace')}
              activeDoc={activeDoc}
              documents={documents}
              onSelectDoc={(d) => setActiveDocId(d.id)}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onExportMarkdown={handleExportMarkdown}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {isImportOpen && (
        <DocumentImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onDocumentImported={handleDocumentImported}
          aiProvider={aiProvider}
          aiConfig={aiConfig}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentConfig={aiConfig}
        onSaveConfig={(cfg) => setAiConfig(cfg)}
        onDataPurged={handleDataPurged}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        document={activeDoc}
      />
    </div>
  )
}

export default App
