import { reconcileAllCitations } from '../evidenceVerifier'
import { buildShieldedDocumentContext } from './promptShield'
import type {
  ActionItem,
  DeadlineItem,
  DocumentPage,
  EligibilityRequirement,
  RequiredDocument,
  StructuredAnalysis,
  UserProfileAnswers
} from '../../types/schema'
import type { AIProviderConfig, DocumentAIProvider } from './types'

export class ConfigurableGemmaProvider implements DocumentAIProvider {
  readonly id = 'gemma-configurable'
  readonly displayName: string
  readonly mode: 'local_endpoint' | 'custom_proxy'

  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
    this.mode = config.mode === 'local_endpoint' ? 'local_endpoint' : 'custom_proxy'
    this.displayName = `Configured Gemma (${config.modelIdentifier || 'Custom Setup'})`
  }

  async analyzeDocument(params: {
    documentId: string
    title: string
    pages: DocumentPage[]
    signal?: AbortSignal
    onStatusUpdate?: (stage: string) => void
  }): Promise<StructuredAnalysis> {
    if (!this.config.endpointUrl) {
      throw new Error(
        'AI endpoint URL is not configured. Please open Settings to set your local runner or proxy endpoint URL.'
      )
    }

    if (!this.config.modelIdentifier) {
      throw new Error(
        'Model identifier is not set. Please provide your exact Gemma 4 / model identifier in Settings.'
      )
    }

    params.onStatusUpdate?.(`Connecting to ${this.displayName}...`)

    const promptText = `
You are PaperCuts Document Intelligence. Analyze the attached document and return a STRICT JSON object with these exact keys:
{
  "metadata": {
    "title": "Exact or inferred document title",
    "documentType": "scholarship|employment|government_application|public_notice|policy_guideline|academic_admission|grant_application|contract_or_agreement|general",
    "issuingOrganization": "Organization name or null",
    "publicationDate": "YYYY-MM-DD or null",
    "applicationPeriod": "Date range or null",
    "relevantAudience": "Target audience",
    "language": "en"
  },
  "eligibilityRequirements": [
    {
      "id": "REQ-01",
      "category": "academic|financial|residency_or_citizenship|employment_or_experience|identity_or_enrollment|general",
      "description": "Full requirement description",
      "status": "mandatory|preferred|unclear",
      "conditionsAndExceptions": "Specific conditions or exceptions",
      "pageNumber": 1,
      "excerpt": "Verbatim quote from the page supporting this claim"
    }
  ],
  "deadlines": [
    {
      "id": "DL-01",
      "eventName": "Event name",
      "originalDateText": "Exact text from document",
      "pageNumber": 1,
      "excerpt": "Verbatim excerpt containing date"
    }
  ],
  "requiredDocuments": [
    {
      "id": "DOC-01",
      "title": "Document name",
      "status": "mandatory|conditional",
      "submissionRules": "Formatting or filing rule",
      "pageNumber": 1,
      "excerpt": "Verbatim excerpt"
    }
  ],
  "risksAndConditions": [
    {
      "id": "RISK-01",
      "type": "disqualification|exception|penalty_or_restriction|missing_information|contradiction|ambiguous_clause",
      "title": "Risk title",
      "description": "Risk details",
      "severity": "critical|warning|info",
      "pageNumber": 1,
      "excerpt": "Verbatim excerpt"
    }
  ],
  "questions": [
    {
      "id": "Q-01",
      "question": "What to clarify",
      "whyItMatters": "Reason"
    }
  ]
}

RULES:
1. Every excerpt MUST be a verbatim quote from the claimed pageNumber. Never paraphrase or invent excerpts.
2. If a deadline or requirement is absent, do not fabricate it.
3. Return only valid JSON. Do not prepend markdown ticks.

${buildShieldedDocumentContext(params.pages)}
`

    params.onStatusUpdate?.('Sending request to model endpoint...')

    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => {
      timeoutController.abort()
    }, this.config.timeoutMs || 45000)

    // Combine abort signals
    const combinedSignal = params.signal
      ? anySignal([params.signal, timeoutController.signal])
      : timeoutController.signal

    let responseData: unknown
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (this.config.ephemeralToken) {
        headers['Authorization'] = `Bearer ${this.config.ephemeralToken}`
      }

      const res = await fetch(this.config.endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.config.modelIdentifier,
          prompt: promptText,
          stream: false,
          format: 'json'
        }),
        signal: combinedSignal
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Model provider rate limit reached (HTTP 429). Please wait before retrying.')
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error('Authentication failed (HTTP 401/403). Check proxy authorization or token.')
        }
        throw new Error(`Model endpoint returned error HTTP ${res.status}: ${res.statusText}`)
      }

      const rawJson = await res.json()
      // Extract response payload depending on server convention (e.g. Ollama .response, OpenAI-compatible choices, direct JSON)
      const textOutput = rawJson.response || rawJson.choices?.[0]?.message?.content || rawJson.output || rawJson
      responseData = typeof textOutput === 'string' ? parseJsonSafe(textOutput) : textOutput
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request was cancelled or timed out after ' + (this.config.timeoutMs / 1000) + 's.')
      }
      throw err
    }

    params.onStatusUpdate?.('Validating response structure and verifying citations...')

    // Reconcile and verify citations against actual pages
    const payload = responseData as Record<string, unknown>
    const rawReqs = (payload.eligibilityRequirements as Array<Record<string, unknown>>) || []
    const rawDeadlines = (payload.deadlines as Array<Record<string, unknown>>) || []
    const rawDocs = (payload.requiredDocuments as Array<Record<string, unknown>>) || []
    const rawRisks = (payload.risksAndConditions as Array<Record<string, unknown>>) || []

    const formattedReqs: EligibilityRequirement[] = rawReqs.map((r, idx) => ({
      id: String(r.id || `REQ-${idx + 1}`),
      category: (r.category as EligibilityRequirement['category']) || 'general',
      description: String(r.description || ''),
      status: (r.status as EligibilityRequirement['status']) || 'mandatory',
      conditionsAndExceptions: String(r.conditionsAndExceptions || 'None stated'),
      sourceCitations: [
        {
          id: `CIT-${r.id || idx}`,
          documentId: params.documentId,
          pageNumber: Number(r.pageNumber || 1),
          excerpt: String(r.excerpt || ''),
          verifiedInSource: false
        }
      ]
    }))

    const formattedDeadlines: DeadlineItem[] = rawDeadlines.map((d, idx) => ({
      id: String(d.id || `DL-${idx + 1}`),
      eventName: String(d.eventName || 'Deadline'),
      originalDateText: String(d.originalDateText || ''),
      normalizedDate: null,
      timeAndZone: null,
      dateKind: 'unclear',
      confidence: 'medium',
      unresolvedAmbiguities: null,
      isUserReminder: false,
      sourceCitation: {
        id: `CIT-DL-${idx}`,
        documentId: params.documentId,
        pageNumber: Number(d.pageNumber || 1),
        excerpt: String(d.excerpt || ''),
        verifiedInSource: false
      }
    }))

    const reconciledReqs = reconcileAllCitations(formattedReqs, params.pages)
    const reconciledDeadlines = reconcileAllCitations(formattedDeadlines, params.pages)

    const actions: ActionItem[] = reconciledReqs.items.map((req, idx) => ({
      id: `ACT-GEMMA-${idx + 1}`,
      title: `Satisfy requirement: ${req.description.slice(0, 60)}...`,
      instructions: `Review rule and gather required documentation for: ${req.description}`,
      whyItMatters: req.status === 'mandatory' ? 'Mandatory condition for eligibility.' : 'Recommended credential.',
      prerequisites: [],
      dueDate: reconciledDeadlines.items[0]?.normalizedDate || null,
      priority: req.status === 'mandatory' ? 'high' : 'medium',
      priorityRationale: 'Generated from verified requirement',
      sourceCitations: req.sourceCitations,
      completed: false,
      userEdited: false,
      relatedRequirementId: req.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    return {
      schemaVersion: '1.0.0',
      documentId: params.documentId,
      analysisTimestamp: new Date().toISOString(),
      providerMode: this.mode,
      providerDisplayName: this.displayName,
      metadata: {
        title: params.title,
        documentType: 'general',
        issuingOrganization: null,
        publicationDate: null,
        applicationPeriod: null,
        relevantAudience: null,
        language: 'en',
        extractionWarnings: reconciledReqs.warnings
      },
      eligibilityRequirements: reconciledReqs.items,
      deadlines: reconciledDeadlines.items,
      requiredDocuments: rawDocs.map((doc, idx) => ({
        id: String(doc.id || `DOC-${idx + 1}`),
        title: String(doc.title || 'Required Document'),
        status: (doc.status as RequiredDocument['status']) || 'mandatory',
        submissionRules: String(doc.submissionRules || ''),
        completed: false,
        sourceCitation: {
          id: `CIT-DOC-${idx}`,
          documentId: params.documentId,
          pageNumber: Number(doc.pageNumber || 1),
          excerpt: String(doc.excerpt || ''),
          verifiedInSource: false
        }
      })),
      actions,
      risksAndConditions: rawRisks.map((risk, idx) => ({
        id: String(risk.id || `RISK-${idx + 1}`),
        type: (risk.type as 'disqualification') || 'disqualification',
        title: String(risk.title || 'Risk item'),
        description: String(risk.description || ''),
        severity: 'warning',
        sourceCitations: []
      })),
      questions: [],
      citationVerificationSummary: {
        totalCitations: reconciledReqs.totalCitations + reconciledDeadlines.totalCitations,
        verifiedCount: reconciledReqs.verifiedCount + reconciledDeadlines.verifiedCount,
        unverifiedCount: reconciledReqs.unverifiedCount + reconciledDeadlines.unverifiedCount,
        warnings: reconciledReqs.warnings
      }
    }
  }

  async extractRequirements(pages: DocumentPage[]): Promise<EligibilityRequirement[]> {
    const res = await this.analyzeDocument({
      documentId: 'temp',
      title: 'Temp Extraction',
      pages
    })
    return res.eligibilityRequirements
  }

  async evaluateEligibility(
    _requirements: EligibilityRequirement[],
    profile: UserProfileAnswers
  ): Promise<EligibilityRequirement[]> {
    return _requirements.map((req) => ({
      ...req,
      profileEvaluationStatus: 'needs_info',
      profileEvaluationReason: `Profile evaluation for ${profile.educationLevel || 'applicant'} submitted.`
    }))
  }

  async generateActionPlan(
    _requirements: EligibilityRequirement[],
    deadlines: DeadlineItem[],
    requiredDocs: RequiredDocument[]
  ): Promise<ActionItem[]> {
    return requiredDocs.map((doc, idx) => ({
      id: `ACT-${idx + 1}`,
      title: `Submit: ${doc.title}`,
      instructions: doc.submissionRules,
      whyItMatters: 'Mandatory documentation',
      prerequisites: [],
      dueDate: deadlines[0]?.normalizedDate || null,
      priority: 'high',
      priorityRationale: 'Critical document',
      sourceCitations: [doc.sourceCitation],
      completed: false,
      userEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }
}

function parseJsonSafe(text: string): unknown {
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(clean)
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort()
      return signal
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}
