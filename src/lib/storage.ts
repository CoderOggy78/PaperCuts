import type { ActionItem, UserDocument, UserProfileAnswers } from '../types/schema'

const STORAGE_KEYS = {
  DOCUMENTS: 'papercuts_documents_v1',
  ACTIVE_DOC_ID: 'papercuts_active_doc_id',
  USER_PROFILE: 'papercuts_user_profile_v1',
  TASK_OVERRIDES: 'papercuts_task_overrides_v1',
  AI_CONFIG: 'papercuts_ai_config_v1'
}

export interface TaskOverride {
  completed: boolean
  userNotes?: string
  userEdited: boolean
  updatedAt: string
}

/**
 * Loads stored user documents from browser storage.
 */
export function loadStoredDocuments(): UserDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS)
    if (!raw) return []
    return JSON.parse(raw) as UserDocument[]
  } catch (err) {
    console.warn('Failed to parse stored documents from localStorage:', err)
    return []
  }
}

/**
 * Saves documents to browser storage.
 */
export function saveStoredDocuments(docs: UserDocument[]): boolean {
  try {
    // Strip heavy binary data if any; keep extracted text and analysis
    const serialized = JSON.stringify(docs)
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, serialized)
    return true
  } catch (err) {
    console.error('Storage quota exceeded or storage blocked:', err)
    return false
  }
}

/**
 * Loads task completion states and user notes to preserve across re-analysis.
 */
export function loadTaskOverrides(): Record<string, TaskOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASK_OVERRIDES)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Saves task override state.
 */
export function saveTaskOverride(taskId: string, override: Partial<TaskOverride>): void {
  const current = loadTaskOverrides()
  current[taskId] = {
    ...current[taskId],
    ...override,
    updatedAt: new Date().toISOString(),
    userEdited: true,
    completed: override.completed !== undefined ? override.completed : (current[taskId]?.completed || false)
  }
  try {
    localStorage.setItem(STORAGE_KEYS.TASK_OVERRIDES, JSON.stringify(current))
  } catch (err) {
    console.warn('Failed to persist task override:', err)
  }
}

/**
 * Merges freshly analyzed actions with previous user modifications.
 * Preserves completed state and user notes.
 */
export function mergeActionsWithUserOverrides(actions: ActionItem[]): ActionItem[] {
  const overrides = loadTaskOverrides()

  return actions.map((act) => {
    const override = overrides[act.id]
    if (!override) return act

    return {
      ...act,
      completed: override.completed,
      userNotes: override.userNotes !== undefined ? override.userNotes : act.userNotes,
      userEdited: override.userEdited || act.userEdited,
      updatedAt: override.updatedAt || act.updatedAt
    }
  })
}

/**
 * Loads user profile answers for personalized eligibility checks.
 */
export function loadUserProfile(): UserProfileAnswers {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Saves user profile answers.
 */
export function saveUserProfile(profile: UserProfileAnswers): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
  } catch (err) {
    console.warn('Failed to save profile:', err)
  }
}

/**
 * Completely wipes all PaperCuts data from browser storage.
 */
export function purgeAllPaperCutsData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
  })
}

/**
 * Clears stored documents specifically.
 */
export function clearStoredDocuments(): void {
  localStorage.removeItem(STORAGE_KEYS.DOCUMENTS)
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_DOC_ID)
}

/**
 * Computes storage metrics for the privacy modal.
 */
export function getStorageUsage(): { bytes: number; formatted: string; docCount: number } {
  let totalBytes = 0
  Object.values(STORAGE_KEYS).forEach((k) => {
    const val = localStorage.getItem(k)
    if (val) totalBytes += val.length * 2 // UTF-16 approx
  })

  const docs = loadStoredDocuments()

  return {
    bytes: totalBytes,
    formatted: (totalBytes / 1024).toFixed(1) + ' KB',
    docCount: docs.length
  }
}
