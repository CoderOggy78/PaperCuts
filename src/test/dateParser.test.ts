import { describe, it, expect } from 'vitest'
import { analyzeDateString, formatNormalizedDate, getDaysRemaining } from '../lib/dateParser'

describe('Deterministic Date & Deadline Parser', () => {
  it('parses unambiguous Month Day, Year formats into ISO strings', () => {
    const res = analyzeDateString('Application deadline: November 15, 2026 at 11:59 PM EST')
    expect(res.normalizedDate).toBe('2026-11-15')
    expect(res.timeAndZone).toBe('11:59 PM EST')
    expect(res.dateKind).toBe('fixed')
    expect(res.confidence).toBe('high')
    expect(res.unresolvedAmbiguities).toBeNull()
  })

  it('parses standard ISO date formats', () => {
    const res = analyzeDateString('Submissions close 2027-01-20 at 5:00 PM')
    expect(res.normalizedDate).toBe('2027-01-20')
    expect(res.dateKind).toBe('fixed')
  })

  it('flags dates with missing years as ambiguous without guessing', () => {
    // "October 15" without year should NOT guess 2026 or current year
    const res = analyzeDateString('Proposals due October 15 at 5:00 PM')
    expect(res.normalizedDate).toBeNull()
    expect(res.dateKind).toBe('unclear')
    expect(res.confidence).toBe('low')
    expect(res.unresolvedAmbiguities).toContain('Missing publication or calendar year')
  })

  it('identifies relative deadlines requiring external reference dates', () => {
    const withoutRef = analyzeDateString('Orientation takes place within 30 days of publication of award decisions')
    expect(withoutRef.dateKind).toBe('relative')
    expect(withoutRef.normalizedDate).toBeNull()
    expect(withoutRef.unresolvedAmbiguities).toContain('Relative deadline requires established reference date')

    // When established publication reference is supplied:
    const withRef = analyzeDateString(
      'File appeals within 14 days of publication of notice',
      '2026-10-01'
    )
    expect(withRef.dateKind).toBe('relative')
    expect(withRef.normalizedDate).toBe('2026-10-15')
  })

  it('flags timezone ambiguity when time is stated without a zone', () => {
    const res = analyzeDateString('Due by 5:00 PM on December 1, 2026')
    expect(res.normalizedDate).toBe('2026-12-01')
    expect(res.unresolvedAmbiguities).toContain('Time specified without an explicit timezone')
  })

  it('formats normalized dates for human readability', () => {
    expect(formatNormalizedDate('2026-11-15')).toBe('November 15, 2026')
    expect(formatNormalizedDate(null)).toBe('Date unspecified or ambiguous')
  })

  it('calculates remaining days without guessing', () => {
    const res = getDaysRemaining('2026-11-15')
    expect(res.status).toBeDefined()
    expect(typeof res.label).toBe('string')
  })
})
