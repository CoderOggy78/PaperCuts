import { describe, it, expect } from 'vitest'
import { DemoProvider } from '../lib/ai/demoProvider'
import { ConfigurableGemmaProvider } from '../lib/ai/configurableGemmaProvider'
import { createAIProvider } from '../lib/ai'
import { SAMPLE_DOCUMENT_PAGES } from '../data/sampleDocument'
import type { DocumentPage } from '../types/schema'

describe('Modular AI Providers', () => {
  describe('DemoProvider', () => {
    const demo = new DemoProvider()

    it('returns the verified sample analysis for the precomputed sample document', async () => {
      const res = await demo.analyzeDocument({
        documentId: 'doc-sample-meridian-2026',
        title: '2026_Meridian_Fellowship_Notice.pdf',
        pages: SAMPLE_DOCUMENT_PAGES
      })

      expect(res.providerMode).toBe('demo_precomputed')
      expect(res.metadata.title).toContain('Next-Horizon')
      expect(res.eligibilityRequirements.length).toBeGreaterThanOrEqual(4)
      expect(res.deadlines.length).toBeGreaterThanOrEqual(3)
      expect(res.citationVerificationSummary.verifiedCount).toBe(14)
    })

    it('performs honest heuristic extraction from user document text in demo mode', async () => {
      const customPages: DocumentPage[] = [
        {
          pageNumber: 1,
          text: 'Notice of Public Housing Eligibility.\nApplication Deadline: December 1, 2026 at 5:00 PM EST.\nApplicants must be full-time residents of the district and provide a certified utility bill.',
          characterCount: 180,
          hasImages: false,
          isLikelyScanned: false
        }
      ]

      const res = await demo.analyzeDocument({
        documentId: 'doc-custom-1',
        title: 'housing_rules.pdf',
        pages: customPages
      })

      expect(res.providerMode).toBe('demo_precomputed')
      expect(res.deadlines.length).toBeGreaterThan(0)
      expect(res.deadlines[0].originalDateText).toContain('December 1, 2026')
      expect(res.deadlines[0].sourceCitation.verifiedInSource).toBe(true)
    })

    it('handles cancellation via AbortSignal', async () => {
      const controller = new AbortController()
      controller.abort()

      await expect(
        demo.analyzeDocument({
          documentId: 'doc-custom-2',
          title: 'test.pdf',
          pages: SAMPLE_DOCUMENT_PAGES,
          signal: controller.signal
        })
      ).rejects.toThrow('cancelled')
    })
  })

  describe('ConfigurableGemmaProvider Factory', () => {
    it('creates DemoProvider when mode is demo_precomputed', () => {
      const provider = createAIProvider({
        mode: 'demo_precomputed',
        endpointUrl: '',
        modelIdentifier: 'gemma-4',
        timeoutMs: 45000
      })
      expect(provider.mode).toBe('demo_precomputed')
      expect(provider instanceof DemoProvider).toBe(true)
    })

    it('creates ConfigurableGemmaProvider when local endpoint is provided', () => {
      const provider = createAIProvider({
        mode: 'local_endpoint',
        endpointUrl: 'http://localhost:11434/api/generate',
        modelIdentifier: 'gemma-4-it',
        timeoutMs: 30000
      })
      expect(provider.mode).toBe('local_endpoint')
      expect(provider instanceof ConfigurableGemmaProvider).toBe(true)
      expect(provider.displayName).toContain('gemma-4-it')
    })

    it('throws meaningful error if endpoint URL is missing when analyzing in custom mode', async () => {
      const provider = new ConfigurableGemmaProvider({
        mode: 'local_endpoint',
        endpointUrl: '',
        modelIdentifier: 'gemma-4',
        timeoutMs: 1000
      })

      await expect(
        provider.analyzeDocument({
          documentId: 'doc-test',
          title: 'test.pdf',
          pages: SAMPLE_DOCUMENT_PAGES
        })
      ).rejects.toThrow('endpoint URL is not configured')
    })
  })
})
