import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveTaskOverride,
  mergeActionsWithUserOverrides,
  purgeAllPaperCutsData,
  loadTaskOverrides,
  saveUserProfile,
  loadUserProfile
} from '../lib/storage'
import type { ActionItem } from '../types/schema'

describe('Local Storage & Task Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists task completion overrides across re-analysis', () => {
    const rawActions: ActionItem[] = [
      {
        id: 'ACT-01',
        title: 'Request official transcript',
        instructions: 'Call registrar',
        whyItMatters: 'Mandatory',
        prerequisites: [],
        dueDate: '2026-10-31',
        priority: 'high',
        priorityRationale: 'Takes time',
        sourceCitations: [],
        completed: false,
        userEdited: false,
        createdAt: '2026-10-24T00:00:00Z',
        updatedAt: '2026-10-24T00:00:00Z'
      }
    ]

    // User marks task completed and adds custom note
    saveTaskOverride('ACT-01', {
      completed: true,
      userNotes: 'Called registrar on Monday, waiting for email verification.'
    })

    const overrides = loadTaskOverrides()
    expect(overrides['ACT-01'].completed).toBe(true)

    // Simulate re-analysis providing fresh uncompleted actions
    const merged = mergeActionsWithUserOverrides(rawActions)
    expect(merged[0].completed).toBe(true)
    expect(merged[0].userNotes).toBe('Called registrar on Monday, waiting for email verification.')
    expect(merged[0].userEdited).toBe(true)
  })

  it('persists user profile answers', () => {
    saveUserProfile({
      educationLevel: 'Undergraduate',
      currentGpa: 3.9,
      residencyRegion: 'Region A'
    })

    const loaded = loadUserProfile()
    expect(loaded.educationLevel).toBe('Undergraduate')
    expect(loaded.currentGpa).toBe(3.9)
    expect(loaded.residencyRegion).toBe('Region A')
  })

  it('purges all PaperCuts data on request', () => {
    saveTaskOverride('ACT-X', { completed: true })
    saveUserProfile({ currentGpa: 4.0 })

    purgeAllPaperCutsData()

    expect(loadTaskOverrides()).toEqual({})
    expect(loadUserProfile()).toEqual({})
  })
})
