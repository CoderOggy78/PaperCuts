/**
 * Deterministic date parser and deadline analyzer for legal/official documents.
 * Adheres strictly to the rule:
 * - Preserve original date wording verbatim
 * - Normalize dates ONLY when unambiguous
 * - Never silently guess missing years
 * - Flag relative dates that require an external reference date
 * - Detect timezone ambiguity
 */

export interface ParsedDateInfo {
  originalText: string
  normalizedDate: string | null // ISO 8601 string or null
  timeAndZone: string | null
  dateKind: 'fixed' | 'relative' | 'recurring' | 'unclear'
  confidence: 'high' | 'medium' | 'low'
  unresolvedAmbiguities: string | null
}

const MONTHS: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12
}

/**
 * Parses and validates date strings from documents.
 */
export function analyzeDateString(rawText: string, referencePublicationDate?: string | null): ParsedDateInfo {
  const text = rawText.trim()

  // 1. Check for relative dates
  const relativeMatch = text.match(/within\s+(\d+)\s+(calendar\s+|business\s+|working\s+)?days(\s+of|\s+after|\s+following)\s+([^,.;\n]+)/i)
  if (relativeMatch) {
    const days = parseInt(relativeMatch[1], 10)
    const anchor = relativeMatch[4].trim()

    if (referencePublicationDate && (anchor.toLowerCase().includes('publication') || anchor.toLowerCase().includes('notice'))) {
      const pubDate = new Date(referencePublicationDate)
      if (!isNaN(pubDate.getTime())) {
        const targetDate = new Date(pubDate)
        targetDate.setDate(targetDate.getDate() + days)
        const iso = targetDate.toISOString().split('T')[0]
        return {
          originalText: text,
          normalizedDate: iso,
          timeAndZone: null,
          dateKind: 'relative',
          confidence: 'medium',
          unresolvedAmbiguities: `Resolved from publication date (${referencePublicationDate}) + ${days} days.`
        }
      }
    }

    return {
      originalText: text,
      normalizedDate: null,
      timeAndZone: null,
      dateKind: 'relative',
      confidence: 'medium',
      unresolvedAmbiguities: `Relative deadline requires established reference date for '${anchor}'.`
    }
  }

  // 2. Check for time & timezone if present
  let extractedTime: string | null = null
  let timezoneWarning: string | null = null

  const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)|(?:[01]?\d|2[0-3]):[0-5]\d)(?:\s*([A-Z]{3,4}|GMT[+-]\d{1,2}|UTC[+-]\d{1,2}))?/i)
  if (timeMatch) {
    const rawTime = timeMatch[1]
    const tz = timeMatch[2]
    if (tz) {
      extractedTime = `${rawTime} ${tz}`
    } else {
      extractedTime = rawTime
      timezoneWarning = 'Time specified without an explicit timezone (e.g. EST, PST, UTC).'
    }
  }

  // 3. ISO format YYYY-MM-DD
  const isoMatch = text.match(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/)
  if (isoMatch) {
    return {
      originalText: text,
      normalizedDate: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      timeAndZone: extractedTime,
      dateKind: 'fixed',
      confidence: 'high',
      unresolvedAmbiguities: timezoneWarning
    }
  }

  // 4. "Month Day, Year" or "Day Month Year"
  // e.g. "November 15, 2026" or "15 November 2026"
  const monthNames = Object.keys(MONTHS).join('|')
  const dateRegexA = new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d{2})\\b`, 'i')
  const matchA = text.match(dateRegexA)
  if (matchA) {
    const month = MONTHS[matchA[1].toLowerCase()]
    const day = parseInt(matchA[2], 10)
    const year = parseInt(matchA[3], 10)
    const paddedM = String(month).padStart(2, '0')
    const paddedD = String(day).padStart(2, '0')
    return {
      originalText: text,
      normalizedDate: `${year}-${paddedM}-${paddedD}`,
      timeAndZone: extractedTime,
      dateKind: 'fixed',
      confidence: 'high',
      unresolvedAmbiguities: timezoneWarning
    }
  }

  const dateRegexB = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames}),?\\s+(20\\d{2})\\b`, 'i')
  const matchB = text.match(dateRegexB)
  if (matchB) {
    const day = parseInt(matchB[1], 10)
    const month = MONTHS[matchB[2].toLowerCase()]
    const year = parseInt(matchB[3], 10)
    const paddedM = String(month).padStart(2, '0')
    const paddedD = String(day).padStart(2, '0')
    return {
      originalText: text,
      normalizedDate: `${year}-${paddedM}-${paddedD}`,
      timeAndZone: extractedTime,
      dateKind: 'fixed',
      confidence: 'high',
      unresolvedAmbiguities: timezoneWarning
    }
  }

  // 5. Date with MISSING YEAR, e.g. "15 October" or "November 15"
  const missingYearRegex = new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b|\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})\\b`, 'i')
  if (missingYearRegex.test(text)) {
    return {
      originalText: text,
      normalizedDate: null,
      timeAndZone: extractedTime,
      dateKind: 'unclear',
      confidence: 'low',
      unresolvedAmbiguities: 'Missing publication or calendar year. Cannot safely determine due date without guessing.'
    }
  }

  // 6. Unclear or unparsed
  return {
    originalText: text,
    normalizedDate: null,
    timeAndZone: extractedTime,
    dateKind: 'unclear',
    confidence: 'low',
    unresolvedAmbiguities: 'Date wording is irregular or unstructured.'
  }
}

/**
 * Formats a normalized date for human-readable display.
 */
export function formatNormalizedDate(dateStr: string | null): string {
  if (!dateStr) return 'Date unspecified or ambiguous'
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  const year = parts[0]
  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${monthNames[monthIdx]} ${day}, ${year}`
}

/**
 * Calculates remaining days from today (local time).
 */
export function getDaysRemaining(normalizedDate: string | null): { days: number | null; label: string; status: 'overdue' | 'today' | 'urgent' | 'upcoming' | 'unclear' } {
  if (!normalizedDate) {
    return { days: null, label: 'Date not fixed', status: 'unclear' }
  }

  const [year, month, day] = normalizedDate.split('-').map(Number)
  const target = new Date(year, month - 1, day, 23, 59, 59)
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

  const diffMs = target.getTime() - todayMidnight.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { days: diffDays, label: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`, status: 'overdue' }
  }
  if (diffDays === 0) {
    return { days: 0, label: 'Due today', status: 'today' }
  }
  if (diffDays <= 7) {
    return { days: diffDays, label: `In ${diffDays} day${diffDays === 1 ? '' : 's'}`, status: 'urgent' }
  }
  return { days: diffDays, label: `In ${diffDays} days`, status: 'upcoming' }
}
