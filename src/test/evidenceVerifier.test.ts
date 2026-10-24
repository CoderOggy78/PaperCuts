import { describe, it, expect } from 'vitest'
import {
  verifyCitationAgainstPage,
  reconcileAllCitations,
  normalizeEvidenceText
} from '../lib/evidenceVerifier'
import type { DocumentPage, SourceCitation } from '../types/schema'

describe('Evidence Verification Engine', () => {
  const mockPages: DocumentPage[] = [
    {
      pageNumber: 1,
      text: 'The Application Filing Deadline is November 15, 2026 at 11:59 PM EST. Late submissions will not be considered.',
      characterCount: 110,
      hasImages: false,
      isLikelyScanned: false
    },
    {
      pageNumber: 2,
      text: 'Applicants must achieve a minimum cumulative Grade Point Average (GPA) of 3.5 on a 4.0 scale at the time of submission.',
      characterCount: 120,
      hasImages: false,
      isLikelyScanned: false
    }
  ]

  it('verifies exact verbatim text matches on the specified page', () => {
    const citation: SourceCitation = {
      id: 'cit-1',
      documentId: 'doc-test',
      pageNumber: 2,
      excerpt: 'minimum cumulative Grade Point Average (GPA) of 3.5',
      verifiedInSource: false
    }

    const result = verifyCitationAgainstPage(citation, mockPages)
    expect(result.verified).toBe(true)
    expect(result.matchScore).toBe(1.0)
    expect(result.matchOffset).toBeDefined()
  })

  it('verifies normalized text with minor whitespace differences', () => {
    const citation: SourceCitation = {
      id: 'cit-2',
      documentId: 'doc-test',
      pageNumber: 1,
      excerpt: 'The Application   Filing Deadline is\nNovember 15, 2026',
      verifiedInSource: false
    }

    const result = verifyCitationAgainstPage(citation, mockPages)
    expect(result.verified).toBe(true)
    expect(result.matchScore).toBeGreaterThanOrEqual(0.9)
  })

  it('rejects citations where excerpt does not appear in the page text', () => {
    const citation: SourceCitation = {
      id: 'cit-3',
      documentId: 'doc-test',
      pageNumber: 2,
      excerpt: 'Applicants must submit a financial asset statement of $50,000',
      verifiedInSource: false
    }

    const result = verifyCitationAgainstPage(citation, mockPages)
    expect(result.verified).toBe(false)
    expect(result.matchScore).toBe(0)
    expect(result.warning).toContain('Excerpt not found in extracted text for page 2')
  })

  it('rejects citations targeting pages that do not exist in the document', () => {
    const citation: SourceCitation = {
      id: 'cit-4',
      documentId: 'doc-test',
      pageNumber: 99,
      excerpt: 'Some rule',
      verifiedInSource: false
    }

    const result = verifyCitationAgainstPage(citation, mockPages)
    expect(result.verified).toBe(false)
    expect(result.warning).toContain('Citation claims page 99, but document only has 2 page(s)')
  })

  it('reconciles all citations across a list of requirement items', () => {
    const items = [
      {
        id: 'REQ-1',
        description: 'GPA minimum',
        sourceCitations: [
          {
            id: 'cit-a',
            documentId: 'doc-test',
            pageNumber: 2,
            excerpt: 'minimum cumulative Grade Point Average (GPA) of 3.5',
            verifiedInSource: false
          },
          {
            id: 'cit-b',
            documentId: 'doc-test',
            pageNumber: 2,
            excerpt: 'Hallucinated requirement text that does not exist',
            verifiedInSource: false
          }
        ]
      }
    ]

    const reconciled = reconcileAllCitations(items, mockPages)
    expect(reconciled.totalCitations).toBe(2)
    expect(reconciled.verifiedCount).toBe(1)
    expect(reconciled.unverifiedCount).toBe(1)
    expect(reconciled.items[0].sourceCitations?.[0]?.verifiedInSource).toBe(true)
    expect(reconciled.items[0].sourceCitations?.[1]?.verifiedInSource).toBe(false)
  })

  it('normalizes curly quotes, dashes, and extra whitespace', () => {
    const raw = '“Smart quotes” and — em dash with   spaces'
    const normalized = normalizeEvidenceText(raw)
    expect(normalized).toBe('"Smart quotes" and - em dash with spaces')
  })
})
