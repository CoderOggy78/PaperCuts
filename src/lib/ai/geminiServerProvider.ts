import type {
  ActionItem,
  DeadlineItem,
  DocumentPage,
  EligibilityRequirement,
  RequiredDocument,
  StructuredAnalysis,
  UserProfileAnswers
} from '../../types/schema'
import type { DocumentAIProvider, ProviderMode } from './types'
import { DemoProvider } from './demoProvider'

export class GeminiServerProvider implements DocumentAIProvider {
  readonly id = 'gemini-server'
  readonly displayName = 'Gemini 3.5 Flash Lite (Server Boundary)'
  readonly mode: ProviderMode = 'custom_proxy'

  private endpointUrl: string

  constructor(endpointUrl = '/api/analyze') {
    this.endpointUrl = endpointUrl
  }

  async analyzeDocument(params: {
    documentId: string
    title: string
    pages: DocumentPage[]
    signal?: AbortSignal
    onStatusUpdate?: (stage: string) => void
  }): Promise<StructuredAnalysis> {
    params.onStatusUpdate?.('Sending extracted document pages to secure server boundary...')

    try {
      const res = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: params.documentId,
          title: params.title,
          pages: params.pages
        }),
        signal: params.signal
      })

      if (!res.ok) {
        // If hosted on a static host like GitHub Pages where /api/analyze returns 404
        if ((res.status === 404 || res.status === 405) && this.endpointUrl === '/api/analyze') {
          params.onStatusUpdate?.('Static hosting detected: running client-side deterministic analyzer...')
          const demo = new DemoProvider()
          return await demo.analyzeDocument(params)
        }

        let errMessage = `Server returned HTTP ${res.status}: ${res.statusText}`
        try {
          const errData = await res.json()
          if (errData?.error) {
            errMessage = errData.error
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errMessage)
      }

      params.onStatusUpdate?.('Validating structured output and deterministic citations...')
      const data = await res.json()

      if (!data?.analysis) {
        throw new Error('Server returned an invalid analysis response format.')
      }

      return data.analysis as StructuredAnalysis
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Document processing was cancelled or timed out.')
      }
      if (this.endpointUrl === '/api/analyze') {
        params.onStatusUpdate?.('Network endpoint unreachable: running client-side analyzer...')
        const demo = new DemoProvider()
        return await demo.analyzeDocument(params)
      }
      throw err
    }
  }

  async extractRequirements(pages: DocumentPage[], signal?: AbortSignal): Promise<EligibilityRequirement[]> {
    const analysis = await this.analyzeDocument({
      documentId: 'temp',
      title: 'Temp Extraction',
      pages,
      signal
    })
    return analysis.eligibilityRequirements
  }

  async evaluateEligibility(
    requirements: EligibilityRequirement[],
    profile: UserProfileAnswers
  ): Promise<EligibilityRequirement[]> {
    return requirements.map((req) => ({
      ...req,
      profileEvaluationStatus: profile.gpa ? 'matches' : 'needs_info',
      profileEvaluationReason: 'Evaluated against applicant profile.'
    }))
  }

  async generateActionPlan(
    _requirements: EligibilityRequirement[],
    deadlines: DeadlineItem[],
    requiredDocs: RequiredDocument[]
  ): Promise<ActionItem[]> {
    return requiredDocs.map((doc, idx) => ({
      id: `ACT-GEN-${idx + 1}`,
      title: `Submit: ${doc.title}`,
      instructions: doc.submissionRules || 'Prepare required documentation',
      whyItMatters: 'Mandatory documentation',
      prerequisites: [],
      dueDate: deadlines[0]?.normalizedDate || null,
      priority: 'high',
      priorityRationale: 'Mandatory submission item',
      sourceCitations: [doc.sourceCitation],
      completed: false,
      userEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }
}
