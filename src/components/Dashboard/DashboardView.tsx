import {
  FileText,
  Upload,
  Sparkles,
  ArrowRight,
  FolderOpen,
  CheckCircle2
} from 'lucide-react'
import { formatNormalizedDate, getDaysRemaining } from '../../lib/dateParser'
import type { ActionItem, DeadlineItem, UserDocument } from '../../types/schema'

interface DashboardViewProps {
  documents: UserDocument[]
  activeDoc: UserDocument | null
  onSelectDoc: (doc: UserDocument) => void
  onOpenWorkspace: () => void
  onOpenImport: () => void
  onExploreSample: () => void
  onToggleAction: (actionId: string, completed: boolean) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  activeDoc,
  onSelectDoc,
  onOpenWorkspace,
  onOpenImport,
  onExploreSample,
  onToggleAction
}) => {
  // Aggregate deadlines across all documents
  const allDeadlines: Array<DeadlineItem & { docTitle: string }> = []
  const allActions: Array<ActionItem & { docTitle: string }> = []

  documents.forEach((doc) => {
    if (doc.analysis) {
      doc.analysis.deadlines.forEach((dl) => {
        allDeadlines.push({ ...dl, docTitle: doc.fileName })
      })
      doc.analysis.actions.forEach((act) => {
        allActions.push({ ...act, docTitle: doc.fileName })
      })
    }
  })

  // Upcoming deadlines (sorted by normalizedDate)
  const upcomingDeadlines = [...allDeadlines]
    .sort((a, b) => {
      if (!a.normalizedDate) return 1
      if (!b.normalizedDate) return -1
      return a.normalizedDate.localeCompare(b.normalizedDate)
    })
    .slice(0, 5)

  // Outstanding high/medium priority actions
  const outstandingActions = allActions.filter((a) => !a.completed).slice(0, 6)

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-8 animate-fadeIn">
      {/* Top Welcome / Hero Banner */}
      <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f0eb] text-[#1b4332] border border-[#c2dcd0]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Document Intelligence Workspace</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#191716]">
            Less paperwork. More progress.
          </h1>
          <p className="text-xs text-[#57534e] max-w-xl leading-relaxed">
            PaperCuts indexes complex documents page-by-page, extracts verifiable requirements and deadlines, and turns them into a personalized, evidence-backed action plan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenImport}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#1b4332] hover:bg-[#143326] text-[#fbf9f5] rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Analyze a document</span>
          </button>
          <button
            onClick={onExploreSample}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#ffffff] hover:bg-[#f5f1ea] text-[#191716] border border-[#e6dfd3] rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#b45309]" />
            <span>Sample Document</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Recently Opened Docs + Upcoming Deadlines + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Documents & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Documents Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-base font-bold text-[#191716]">
                Documents in Workspace ({documents.length})
              </h2>
              <button
                onClick={onOpenImport}
                className="text-xs font-semibold text-[#1b4332] hover:underline"
              >
                + Add PDF
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-6 text-center space-y-3">
                <FolderOpen className="w-8 h-8 text-[#a69f94] mx-auto" />
                <div>
                  <p className="text-xs font-bold text-[#191716]">No documents imported yet</p>
                  <p className="text-[11px] text-[#736d65]">
                    Upload a scholarship notice, job contract, or public filing to get started.
                  </p>
                </div>
                <button
                  onClick={onOpenImport}
                  className="px-3.5 py-1.5 bg-[#1b4332] text-[#fbf9f5] rounded-md text-xs font-semibold"
                >
                  Analyze your first document
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isActive = activeDoc?.id === doc.id
                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        onSelectDoc(doc)
                        onOpenWorkspace()
                      }}
                      className={`bg-[#ffffff] border rounded-lg p-4 transition-all shadow-xs cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'border-[#1b4332] ring-1 ring-[#1b4332]'
                          : 'border-[#e6dfd3] hover:border-[#736d65]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="p-2 rounded bg-[#f5f1ea] border border-[#e6dfd3] text-[#1b4332] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5">
                            <h3 className="text-xs font-bold text-[#191716] truncate">
                              {doc.fileName}
                            </h3>
                            {doc.isDemoSample && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                                DEMO
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#57534e]">
                            {doc.pageCount} page(s) · {doc.analysis?.eligibilityRequirements.length || 0} requirements · {doc.analysis?.deadlines.length || 0} deadlines
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-xs font-semibold text-[#1b4332] flex items-center space-x-1">
                          <span className="hidden sm:inline">Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Outstanding Actions Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-base font-bold text-[#191716]">
                Priority Actions To Do ({outstandingActions.length})
              </h2>
            </div>

            {outstandingActions.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-6 text-center text-xs text-[#736d65]">
                {documents.length === 0
                  ? 'Actions will appear here once you analyze a document.'
                  : 'All priority actions completed! Great job.'}
              </div>
            ) : (
              <div className="space-y-2">
                {outstandingActions.map((act) => (
                  <div
                    key={act.id}
                    className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-3.5 flex items-start space-x-3 shadow-xs"
                  >
                    <input
                      type="checkbox"
                      checked={act.completed}
                      onChange={(e) => onToggleAction(act.id, e.target.checked)}
                      className="mt-0.5 rounded border-[#d5cbbe] text-[#1b4332] focus:ring-[#1b4332]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#191716]">{act.title}</h4>
                        <span className="text-[10px] uppercase font-bold text-[#991b1b] bg-[#fee2e2] px-1.5 py-0.5 rounded border border-[#fca5a5]">
                          {act.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#57534e] mt-0.5">{act.instructions}</p>
                      {act.dueDate && (
                        <p className="text-[10px] font-mono text-[#b45309] mt-1">
                          Due: {act.dueDate} ({getDaysRemaining(act.dueDate).label})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Upcoming Deadlines */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-3">
            <h2 className="font-editorial text-base font-bold text-[#191716]">
              Upcoming Key Deadlines
            </h2>

            {upcomingDeadlines.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-6 text-center text-xs text-[#736d65]">
                No deadlines registered. Import a document to extract milestone dates.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map((dl) => {
                  const remaining = getDaysRemaining(dl.normalizedDate)
                  return (
                    <div
                      key={dl.id}
                      className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-3.5 space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-[#191716]">{dl.eventName}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f5f1ea] border border-[#e6dfd3] text-[#736d65]">
                          {remaining.label}
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-[#b45309]">
                        {dl.normalizedDate ? formatNormalizedDate(dl.normalizedDate) : 'Date pending external trigger'}
                      </p>
                      <p className="text-[11px] text-[#57534e] italic truncate">
                        "{dl.originalDateText}"
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Privacy & Trust Guarantee */}
          <div className="p-4 bg-[#f7f4ed] border border-[#e6dfd3] rounded-lg space-y-1 text-xs text-[#57534e]">
            <p className="font-bold text-[#191716]">100% Transparent Provenance</p>
            <p className="text-[11px] leading-relaxed">
              PaperCuts never invents deadlines, fees, or legal requirements. Every single extraction displays the exact supporting sentence and page citation from your file.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
