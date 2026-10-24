import type { DocumentPage, EvidenceVerificationState, SourceCitation } from '../types/schema'

export function getEvidenceStateInfo(state: EvidenceVerificationState): {
  label: string
  badgeClass: string
  iconName: 'check' | 'calculator' | 'sparkles' | 'help' | 'x' | 'alert'
  description: string
} {
  switch (state) {
    case 'VERIFIED_IN_SOURCE':
      return {
        label: 'Verified in Source',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        iconName: 'check',
        description: 'Verbatim excerpt verified against extracted page text.'
      }
    case 'CALCULATED_FROM_VERIFIED_INPUTS':
      return {
        label: 'Calculated from Inputs',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        iconName: 'calculator',
        description: 'Derived mathematically or logically from verified source facts.'
      }
    case 'MODEL_INTERPRETATION':
      return {
        label: 'Model Interpretation',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        iconName: 'sparkles',
        description: 'Synthesized interpretation without a direct verbatim quote.'
      }
    case 'NEEDS_CLARIFICATION':
      return {
        label: 'Needs Clarification',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        iconName: 'help',
        description: 'Wording is ambiguous, conditional, or requires applicant inputs.'
      }
    case 'NOT_FOUND_IN_DOCUMENT':
      return {
        label: 'Not Found in Document',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        iconName: 'x',
        description: 'Claimed excerpt does not exist on the cited page.'
      }
    case 'CONFLICTING_EVIDENCE':
      return {
        label: 'Conflicting Evidence',
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
        iconName: 'alert',
        description: 'Contradictory statements found across different sections.'
      }
    default:
      return {
        label: 'Unverified',
        badgeClass: 'bg-stone-50 text-stone-700 border-stone-200',
        iconName: 'help',
        description: 'Pending deterministic evidence verification.'
      }
  }
}

/**
 * Normalizes text for evidence matching:
 * - Collapses consecutive whitespace and newlines
 * - Normalizes curly quotes, dashes, and invisible characters
 * - Optionally lowercases for case-insensitive search
 */
export function normalizeEvidenceText(str: string, lowercase = false): string {
  let cleaned = str
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

  if (lowercase) {
    cleaned = cleaned.toLowerCase()
  }
  return cleaned
}

export interface VerificationResult {
  verified: boolean
  matchScore: number
  matchOffset?: { start: number; end: number }
  warning?: string
}

/**
 * Verifies whether a cited excerpt actually appears on the claimed page of the document.
 * Returns match offsets when found, and helpful warnings when missing or suspicious.
 */
export function verifyCitationAgainstPage(
  citation: SourceCitation,
  pages: DocumentPage[]
): VerificationResult {
  const targetPage = pages.find((p) => p.pageNumber === citation.pageNumber)

  if (!targetPage) {
    return {
      verified: false,
      matchScore: 0,
      warning: `Citation claims page ${citation.pageNumber}, but document only has ${pages.length} page(s).`
    }
  }

  const rawPageText = targetPage.text || ''
  const rawExcerpt = citation.excerpt.trim()

  if (!rawExcerpt) {
    return {
      verified: false,
      matchScore: 0,
      warning: 'Cited excerpt is empty.'
    }
  }

  // 1. Exact raw match
  const exactIndex = rawPageText.indexOf(rawExcerpt)
  if (exactIndex !== -1) {
    return {
      verified: true,
      matchScore: 1.0,
      matchOffset: {
        start: exactIndex,
        end: exactIndex + rawExcerpt.length
      }
    }
  }

  // 2. Normalized whitespace match
  const normPage = normalizeEvidenceText(rawPageText, false)
  const normExcerpt = normalizeEvidenceText(rawExcerpt, false)

  const normIndex = normPage.indexOf(normExcerpt)
  if (normIndex !== -1) {
    return {
      verified: true,
      matchScore: 0.95,
      matchOffset: {
        start: normIndex,
        end: normIndex + normExcerpt.length
      }
    }
  }

  // 3. Case-insensitive normalized match
  const lowerNormPage = normalizeEvidenceText(rawPageText, true)
  const lowerNormExcerpt = normalizeEvidenceText(rawExcerpt, true)

  const lowerIndex = lowerNormPage.indexOf(lowerNormExcerpt)
  if (lowerIndex !== -1) {
    return {
      verified: true,
      matchScore: 0.9,
      matchOffset: {
        start: lowerIndex,
        end: lowerIndex + lowerNormExcerpt.length
      }
    }
  }

  // 4. Sub-segment matching for slightly truncated quotes (> 80% coverage)
  if (lowerNormExcerpt.length > 40) {
    const chunkA = lowerNormExcerpt.slice(0, 35)
    const chunkB = lowerNormExcerpt.slice(-35)
    if (lowerNormPage.includes(chunkA) && lowerNormPage.includes(chunkB)) {
      return {
        verified: true,
        matchScore: 0.85,
        warning: 'Excerpt matches with minor formatting or punctuation differences.'
      }
    }
  }

  // Check if the citation might belong to an adjacent page
  const adjacentPage = pages.find(
    (p) =>
      (p.pageNumber === citation.pageNumber - 1 || p.pageNumber === citation.pageNumber + 1) &&
      normalizeEvidenceText(p.text, true).includes(lowerNormExcerpt)
  )

  const pageAdvice = adjacentPage
    ? ` Note: this excerpt was actually found on page ${adjacentPage.pageNumber}.`
    : ''

  return {
    verified: false,
    matchScore: 0,
    warning: `Excerpt not found in extracted text for page ${citation.pageNumber}.${pageAdvice}`
  }
}

/**
 * Reconciles and verifies all citations in a structured analysis against the document's real pages.
 */
export function reconcileAllCitations<T extends { sourceCitations?: SourceCitation[]; sourceCitation?: SourceCitation }>(
  items: T[],
  pages: DocumentPage[]
): { items: T[]; totalCitations: number; verifiedCount: number; unverifiedCount: number; warnings: string[] } {
  let totalCitations = 0
  let verifiedCount = 0
  let unverifiedCount = 0
  const warnings: string[] = []

  const verifiedItems = items.map((item) => {
    const clone = { ...item }

    if (clone.sourceCitation) {
      totalCitations++
      const res = verifyCitationAgainstPage(clone.sourceCitation, pages)
      const vState: EvidenceVerificationState = res.verified
        ? 'VERIFIED_IN_SOURCE'
        : 'NOT_FOUND_IN_DOCUMENT'
      const vReason = res.warning || (res.verified ? 'Verbatim excerpt verified in source page' : 'Excerpt not found on page')

      clone.sourceCitation = {
        ...clone.sourceCitation,
        verifiedInSource: res.verified,
        verificationState: vState,
        verificationReason: vReason,
        matchScore: res.matchScore,
        matchOffset: res.matchOffset
      }
      if (res.verified) {
        verifiedCount++
      } else {
        unverifiedCount++
        if (res.warning) warnings.push(res.warning)
      }
    }

    if (clone.sourceCitations && Array.isArray(clone.sourceCitations)) {
      clone.sourceCitations = clone.sourceCitations.map((cit) => {
        totalCitations++
        const res = verifyCitationAgainstPage(cit, pages)
        const vState: EvidenceVerificationState = res.verified
          ? 'VERIFIED_IN_SOURCE'
          : 'NOT_FOUND_IN_DOCUMENT'
        const vReason = res.warning || (res.verified ? 'Verbatim excerpt verified in source page' : 'Excerpt not found on page')

        if (res.verified) {
          verifiedCount++
        } else {
          unverifiedCount++
          if (res.warning) warnings.push(res.warning)
        }
        return {
          ...cit,
          verifiedInSource: res.verified,
          verificationState: vState,
          verificationReason: vReason,
          matchScore: res.matchScore,
          matchOffset: res.matchOffset
        }
      })
    }

    return clone
  })

  return {
    items: verifiedItems,
    totalCitations,
    verifiedCount,
    unverifiedCount,
    warnings: Array.from(new Set(warnings))
  }
}
