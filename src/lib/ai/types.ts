import type {
  ActionItem,
  DeadlineItem,
  DocumentPage,
  EligibilityRequirement,
  RequiredDocument,
  StructuredAnalysis,
  UserProfileAnswers
} from '../../types/schema'

export type ProviderMode =
  | 'demo_precomputed' // Deterministic sample demonstration
  | 'local_endpoint'   // Local endpoint (e.g. Ollama, llama.cpp, LocalAI)
  | 'custom_proxy'     // Private / server proxy endpoint (for secret-safe forwarding)
  | 'simulated_fallback' // Honest fallback when external service is offline or unconfigured

export interface AIProviderConfig {
  mode: ProviderMode
  // Endpoint URL for local runner or private proxy (e.g. "http://localhost:11434/api/generate" or "https://my-proxy.internal/v1")
  endpointUrl: string
  // Exact model identifier provided by the user (never invented or hardcoded)
  modelIdentifier: string
  // Optional custom authorization header token (held only in runtime memory, NEVER written to localStorage)
  ephemeralToken?: string
  // Request timeout in milliseconds
  timeoutMs: number
}

export interface DocumentAIProvider {
  readonly id: string
  readonly displayName: string
  readonly mode: ProviderMode

  analyzeDocument(
    params: {
      documentId: string
      title: string
      pages: DocumentPage[]
      signal?: AbortSignal
      onStatusUpdate?: (stage: string) => void
    }
  ): Promise<StructuredAnalysis>

  extractRequirements(
    pages: DocumentPage[],
    signal?: AbortSignal
  ): Promise<EligibilityRequirement[]>

  evaluateEligibility(
    requirements: EligibilityRequirement[],
    profile: UserProfileAnswers,
    signal?: AbortSignal
  ): Promise<EligibilityRequirement[]>

  generateActionPlan(
    requirements: EligibilityRequirement[],
    deadlines: DeadlineItem[],
    requiredDocs: RequiredDocument[],
    signal?: AbortSignal
  ): Promise<ActionItem[]>
}

export interface ModelExtractionPayload {
  metadata: {
    title: string
    documentType: string
    issuingOrganization: string | null
    publicationDate: string | null
    applicationPeriod: string | null
    relevantAudience: string | null
    language: string
  }
  eligibilityRequirements: Array<{
    id: string
    category: string
    description: string
    status: string
    conditionsAndExceptions: string
    pageNumber: number
    excerpt: string
  }>
  deadlines: Array<{
    id: string
    eventName: string
    originalDateText: string
    pageNumber: number
    excerpt: string
  }>
  requiredDocuments: Array<{
    id: string
    title: string
    status: string
    submissionRules: string
    pageNumber: number
    excerpt: string
  }>
  risksAndConditions: Array<{
    id: string
    type: string
    title: string
    description: string
    severity: string
    pageNumber: number
    excerpt: string
  }>
  questions: Array<{
    id: string
    question: string
    whyItMatters: string
    affectedRequirementId?: string
  }>
}
