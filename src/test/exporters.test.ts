import { describe, it, expect } from 'vitest'
import { generateICSContent, escapeICalText, formatICalDate } from '../lib/exporters/icsExporter'
import { generateMarkdownExport } from '../lib/exporters/documentExporter'
import { SAMPLE_ANALYSIS, SAMPLE_USER_DOCUMENT } from '../data/sampleDocument'
import type { DeadlineItem } from '../types/schema'

describe('Document Exporters', () => {
  describe('ICS Calendar Exporter', () => {
    const mockDeadlines: DeadlineItem[] = [
      {
        id: 'DL-01',
        eventName: 'Application Filing Deadline',
        originalDateText: 'November 15, 2026 at 11:59 PM EST',
        normalizedDate: '2026-11-15',
        timeAndZone: '11:59 PM EST',
        dateKind: 'fixed',
        confidence: 'high',
        unresolvedAmbiguities: null,
        isUserReminder: false,
        sourceCitation: {
          id: 'cit-1',
          documentId: 'doc-1',
          pageNumber: 1,
          excerpt: 'Application Filing Deadline: November 15, 2026 at 11:59 PM EST.',
          verifiedInSource: true
        }
      }
    ]

    it('generates a valid RFC 5545 calendar file', () => {
      const ics = generateICSContent(mockDeadlines, 'Test Fellowship')
      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('VERSION:2.0')
      expect(ics).toContain('PRODID:-//PaperCuts//Document Intelligence//EN')
      expect(ics).toContain('BEGIN:VEVENT')
      expect(ics).toContain('DTSTART;VALUE=DATE:20261115')
      expect(ics).toContain('SUMMARY:[Deadline] Application Filing Deadline')
      expect(ics).toContain('END:VEVENT')
      expect(ics).toContain('END:VCALENDAR')
    })

    it('escapes special characters correctly according to RFC 5545', () => {
      const escaped = escapeICalText('Rule A, Rule B; Note \\ detail\nNew line')
      expect(escaped).toBe('Rule A\\, Rule B\\; Note \\\\ detail\\nNew line')
    })

    it('formats date strings to YYYYMMDD', () => {
      expect(formatICalDate('2026-11-15')).toBe('20261115')
    })

    it('skips deadlines that lack normalized unambiguous dates', () => {
      const ambiguousDeadline: DeadlineItem = {
        id: 'DL-99',
        eventName: 'Ambiguous Deadline',
        originalDateText: 'within 30 days',
        normalizedDate: null,
        timeAndZone: null,
        dateKind: 'relative',
        confidence: 'low',
        unresolvedAmbiguities: 'Missing reference',
        isUserReminder: false,
        sourceCitation: {
          id: 'cit-x',
          documentId: 'doc-1',
          pageNumber: 1,
          excerpt: 'within 30 days',
          verifiedInSource: true
        }
      }

      const ics = generateICSContent([ambiguousDeadline], 'Test')
      expect(ics).not.toContain('BEGIN:VEVENT')
    })
  })

  describe('Markdown Action Plan Exporter', () => {
    it('generates comprehensive Markdown with metadata, actions, and verbatim citations', () => {
      const md = generateMarkdownExport(SAMPLE_USER_DOCUMENT, SAMPLE_ANALYSIS)
      expect(md).toContain('# Action Plan: 2026_Meridian_Fellowship_Notice.pdf')
      expect(md).toContain('PaperCuts Document Intelligence Workspace')
      expect(md).toContain('## 1. Document Overview')
      expect(md).toContain('## 2. Priority Action Checklist')
      expect(md).toContain('## 3. Important Deadlines')
      expect(md).toContain('## 4. Required Supporting Documents')
      expect(md).toContain('## 5. Eligibility Criteria & Conditions')
      expect(md).toContain('## 6. Risks, Disqualifications & Ambiguities')
      expect(md).toContain('DEMO DATA — NOT AN OFFICIAL NOTICE')
      expect(md).toContain('REQ-01')
      expect(md).toContain('Verified in document: Yes')
    })
  })
})
