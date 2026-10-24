import { useState } from 'react'
import {
  CheckSquare,
  Square,
  Quote,
  ArrowRight,
  Filter,
  Search,
  Download,
  Edit3
} from 'lucide-react'
import { getDaysRemaining } from '../../lib/dateParser'
import type { ActionItem, SourceCitation } from '../../types/schema'

interface ActionTrackerViewProps {
  actions: ActionItem[]
  onToggleAction: (actionId: string, completed: boolean) => void
  onUpdateActionNotes: (actionId: string, notes: string) => void
  onSelectCitation?: (citation: SourceCitation) => void
  onExportMarkdown?: () => void
}

export const ActionTrackerView: React.FC<ActionTrackerViewProps> = ({
  actions,
  onToggleAction,
  onUpdateActionNotes,
  onSelectCitation,
  onExportMarkdown
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'todo' | 'completed' | 'upcoming' | 'overdue'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(
    actions.length > 0 ? actions[0] : null
  )
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [tempNotes, setTempNotes] = useState('')

  const handleStartEditNotes = (action: ActionItem) => {
    setEditingNotesId(action.id)
    setTempNotes(action.userNotes || '')
  }

  const handleSaveNotes = (actionId: string) => {
    onUpdateActionNotes(actionId, tempNotes)
    setEditingNotesId(null)
  }

  // Filter tasks
  const filteredActions = actions.filter((act) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        act.title.toLowerCase().includes(q) ||
        act.instructions.toLowerCase().includes(q) ||
        act.priorityRationale.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    if (filterMode === 'todo') return !act.completed
    if (filterMode === 'completed') return act.completed

    const remaining = getDaysRemaining(act.dueDate)
    if (filterMode === 'overdue') return remaining.status === 'overdue' && !act.completed
    if (filterMode === 'upcoming') return remaining.status === 'upcoming' || remaining.status === 'urgent'

    return true
  })

  // Sort by priority (high -> medium -> low)
  const priorityOrder = { high: 1, medium: 2, low: 3 }
  const sortedActions = [...filteredActions].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const completedCount = actions.filter((a) => a.completed).length
  const progressPercent = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-4">
      {/* Top Banner & Progress */}
      <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-[#2563eb]" />
            <h2 className="font-editorial text-xl font-bold text-[#191716]">
              Action Tracker & Checklist
            </h2>
          </div>
          <p className="text-xs text-[#57534e]">
            Concrete, evidence-backed tasks derived from extracted requirements. Preserved across re-analysis.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#191716]">
              {completedCount} of {actions.length} Done ({progressPercent}%)
            </span>
            <div className="w-28 bg-[#e6dfd3] h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-[#2563eb] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {onExportMarkdown && (
            <button
              onClick={onExportMarkdown}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-[#e6dfd3] hover:bg-[#f5f1ea] text-[#191716] rounded-md text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .md</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-[#e6dfd3] pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#736d65]" />
          <span className="font-semibold text-[#191716]">Show:</span>
          {(['all', 'todo', 'completed', 'upcoming', 'overdue'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                filterMode === mode
                  ? 'bg-[#2563eb] text-[#fbf9f5]'
                  : 'text-[#4a4642] hover:bg-[#efebe2]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#736d65]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#ffffff] border border-[#e6dfd3] rounded-md text-xs text-[#191716] placeholder-[#a69f94] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>
      </div>

      {/* Main 2-Column: Checklist + Provenance Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Task Checklist */}
        <div className="lg:col-span-7 space-y-3">
          {sortedActions.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-8 text-center text-xs text-[#736d65]">
              No tasks found for the current filter.
            </div>
          ) : (
            sortedActions.map((act) => {
              const remaining = getDaysRemaining(act.dueDate)
              const isSelected = selectedAction?.id === act.id

              let priorityBadge = 'bg-[#f5f1ea] text-[#736d65] border-[#e6dfd3]'
              if (act.priority === 'high') priorityBadge = 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
              if (act.priority === 'medium') priorityBadge = 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'

              return (
                <div
                  key={act.id}
                  onClick={() => setSelectedAction(act)}
                  className={`bg-[#ffffff] border rounded-lg p-4 transition-all shadow-xs space-y-2 cursor-pointer ${
                    isSelected
                      ? 'border-[#2563eb] ring-1 ring-[#2563eb]'
                      : 'border-[#e6dfd3] hover:border-[#736d65]'
                  } ${act.completed ? 'opacity-70 bg-[#faf8f4]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleAction(act.id, !act.completed)
                        }}
                        className="mt-0.5 text-[#2563eb] hover:scale-110 transition-transform"
                        aria-label={act.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {act.completed ? (
                          <CheckSquare className="w-5 h-5 text-[#2563eb]" />
                        ) : (
                          <Square className="w-5 h-5 text-[#a69f94] hover:text-[#2563eb]" />
                        )}
                      </button>

                      <div>
                        <h3 className={`text-xs font-bold leading-snug ${act.completed ? 'line-through text-[#736d65]' : 'text-[#191716]'}`}>
                          {act.title}
                        </h3>
                        <p className="text-[11px] text-[#57534e] line-clamp-2 mt-0.5">
                          {act.instructions}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${priorityBadge}`}>
                        {act.priority}
                      </span>
                      {act.dueDate && (
                        <span className="text-[10px] font-mono text-[#b45309]">
                          Due: {act.dueDate} ({remaining.label})
                        </span>
                      )}
                    </div>
                  </div>

                  {act.userNotes && (
                    <div className="ml-8 text-[11px] bg-[#f5f1ea] px-2.5 py-1 rounded text-[#4a4642] italic">
                      Note: {act.userNotes}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Task Provenance Drawer */}
        <div className="lg:col-span-5">
          {selectedAction ? (
            <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-5 space-y-4 shadow-xs sticky top-4">
              <div className="border-b border-[#e6dfd3] pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#736d65] font-semibold">
                    Task Provenance & Details
                  </span>
                  <button
                    onClick={() => onToggleAction(selectedAction.id, !selectedAction.completed)}
                    className="text-xs font-semibold text-[#2563eb] hover:underline"
                  >
                    {selectedAction.completed ? 'Mark as Incomplete' : 'Mark as Completed'}
                  </button>
                </div>
                <h3 className="font-editorial text-base font-bold text-[#191716] mt-1">
                  {selectedAction.title}
                </h3>
              </div>

              <div className="space-y-3 text-xs text-[#57534e]">
                {/* Instructions */}
                <div>
                  <span className="font-semibold text-[#191716] block">Detailed Instructions:</span>
                  <p className="mt-0.5 leading-relaxed">{selectedAction.instructions}</p>
                </div>

                {/* Why it matters */}
                <div>
                  <span className="font-semibold text-[#191716] block">Why This Matters:</span>
                  <p className="mt-0.5 leading-relaxed">{selectedAction.whyItMatters}</p>
                </div>

                {/* Priority Rationale */}
                <div>
                  <span className="font-semibold text-[#191716] block">Priority Rationale:</span>
                  <p className="mt-0.5 leading-relaxed">{selectedAction.priorityRationale}</p>
                </div>

                {/* Due Date & Urgency */}
                {selectedAction.dueDate && (
                  <div>
                    <span className="font-semibold text-[#191716] block">Target Due Date:</span>
                    <p className="font-mono text-xs text-[#b45309] mt-0.5">
                      {selectedAction.dueDate} ({getDaysRemaining(selectedAction.dueDate).label})
                    </p>
                  </div>
                )}

                {/* User Notes editor */}
                <div className="pt-2 border-t border-[#e6dfd3]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#191716]">Personal Notes:</span>
                    {editingNotesId !== selectedAction.id && (
                      <button
                        onClick={() => handleStartEditNotes(selectedAction)}
                        className="text-[11px] text-[#2563eb] flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit note</span>
                      </button>
                    )}
                  </div>

                  {editingNotesId === selectedAction.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Add personal tracking notes or status updates..."
                        className="w-full text-xs p-2 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-2.5 py-1 text-[11px] text-[#736d65]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNotes(selectedAction.id)}
                          className="px-3 py-1 bg-[#2563eb] text-[#fbf9f5] rounded text-[11px] font-semibold"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-[#736d65]">
                      {selectedAction.userNotes || 'No notes added yet. Notes survive re-analysis.'}
                    </p>
                  )}
                </div>

                {/* Source Citations */}
                {selectedAction.sourceCitations && selectedAction.sourceCitations.length > 0 && (
                  <div className="pt-2 border-t border-[#e6dfd3]">
                    <span className="font-semibold text-[#191716] block mb-1.5">
                      Source Document Citations:
                    </span>
                    <div className="space-y-2">
                      {selectedAction.sourceCitations.map((cit: SourceCitation) => (
                        <button
                          key={cit.id}
                          onClick={() => onSelectCitation?.(cit)}
                          className="w-full text-left bg-[#f5f1ea]/70 hover:bg-[#efebe2] border border-[#e6dfd3] rounded-md p-2.5 transition-colors cursor-pointer"
                          title="Jump to page in Document Workspace"
                        >
                          <div className="flex items-start space-x-2">
                            <Quote className="w-3.5 h-3.5 text-[#2563eb] shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1 flex-1">
                              <p className="italic text-[#191716]">"{cit.excerpt}"</p>
                              <div className="flex items-center justify-between text-[10px] text-[#736d65] font-mono">
                                <span>Page {cit.pageNumber}</span>
                                <span className="text-[#2563eb] font-semibold flex items-center space-x-1">
                                  <span>Jump to text</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-6 text-center text-xs text-[#736d65]">
              Select an action to view its provenance and evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
