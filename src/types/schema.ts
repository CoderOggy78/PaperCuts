import { z } from 'zod'

/**
 * PaperCuts Document Intelligence Schema v1.0.0
 * Comprehensive, versioned types and Zod schemas for document extraction,
 * evidence citations, eligibility criteria, deadlines, and action plans.
 */

export const EvidenceVerificationStateEnum = z.enum([
  'VERIFIED_IN_SOURCE',
  'CALCULATED_FROM_VERIFIED_INPUTS',
  'MODEL_INTERPRETATION',
  'NEEDS_CLARIFICATION',
  'NOT_FOUND_IN_DOCUMENT',
  'CONFLICTING_EVIDENCE'
])

export type EvidenceVerificationState = z.infer<typeof EvidenceVerificationStateEnum>

export const SourceCitationSchema = z.object({
  id: z.string(),
  documentId: z.string().optional(),
  pageNumber: z.number().int().positive(),
  excerpt: z.string().min(1),
  claimId: z.string().optional(),
  verifiedInSource: z.boolean().optional(),
  verificationState: EvidenceVerificationStateEnum.optional(),
  verificationReason: z.string().optional(),
  matchScore: z.number().min(0).max(1).optional(),
  matchOffset: z.object({
    start: z.number(),
    end: z.number()
  }).optional()
})

export type SourceCitation = z.infer<typeof SourceCitationSchema>

export const DocumentMetadataSchema = z.object({
  title: z.string().min(1),
  documentType: z.enum([
    'scholarship',
    'employment',
    'government_application',
    'public_notice',
    'policy_guideline',
    'academic_admission',
    'grant_application',
    'contract_or_agreement',
    'general'
  ]),
  issuingOrganization: z.string().nullable().default(null),
  publicationDate: z.string().nullable().default(null),
  applicationPeriod: z.string().nullable().default(null),
  relevantAudience: z.string().nullable().default(null),
  language: z.string().default('en'),
  extractionWarnings: z.array(z.string()).default([])
})

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>

export const EligibilityRequirementSchema = z.object({
  id: z.string(),
  category: z.enum([
    'academic',
    'financial',
    'residency_or_citizenship',
    'employment_or_experience',
    'identity_or_enrollment',
    'general'
  ]),
  description: z.string().min(1),
  status: z.enum(['mandatory', 'preferred', 'unclear']),
  conditionsAndExceptions: z.string().default('None stated'),
  sourceCitations: z.array(SourceCitationSchema).min(1),
  profileEvaluationStatus: z.enum([
    'matches',
    'does_not_match',
    'needs_info',
    'ambiguous'
  ]).optional(),
  profileEvaluationReason: z.string().optional(),
  remediationAdvice: z.string().optional()
})

export type EligibilityRequirement = z.infer<typeof EligibilityRequirementSchema>

export const DeadlineItemSchema = z.object({
  id: z.string(),
  eventName: z.string().min(1),
  originalDateText: z.string().min(1), // Verbatim wording from doc
  normalizedDate: z.string().nullable().default(null), // ISO string YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  timeAndZone: z.string().nullable().default(null),
  dateKind: z.enum(['fixed', 'relative', 'recurring', 'unclear']),
  confidence: z.enum(['high', 'medium', 'low']),
  unresolvedAmbiguities: z.string().nullable().default(null),
  isUserReminder: z.boolean().default(false),
  sourceCitation: SourceCitationSchema
})

export type DeadlineItem = z.infer<typeof DeadlineItemSchema>

export const RequiredDocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  status: z.enum(['mandatory', 'conditional', 'optional']),
  submissionRules: z.string().default('Follow standard submission format'),
  completed: z.boolean().default(false),
  sourceCitation: SourceCitationSchema
})

export type RequiredDocument = z.infer<typeof RequiredDocumentSchema>

export const ActionItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  instructions: z.string().min(1),
  whyItMatters: z.string(),
  prerequisites: z.array(z.string()).default([]),
  dueDate: z.string().nullable().default(null),
  priority: z.enum(['high', 'medium', 'low']),
  priorityRationale: z.string(),
  sourceCitations: z.array(SourceCitationSchema).default([]),
  completed: z.boolean().default(false),
  userEdited: z.boolean().default(false),
  userNotes: z.string().optional(),
  relatedRequirementId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export type ActionItem = z.infer<typeof ActionItemSchema>

export const RiskOrConditionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'disqualification',
    'exception',
    'penalty_or_restriction',
    'missing_information',
    'contradiction',
    'ambiguous_clause'
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['critical', 'warning', 'info']).default('warning'),
  sourceCitations: z.array(SourceCitationSchema).default([])
})

export type RiskOrCondition = z.infer<typeof RiskOrConditionSchema>

export const ClarificationQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  whyItMatters: z.string().min(1),
  affectedRequirementId: z.string().optional(),
  targetEntity: z.string().optional()
})

export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>

export const DocumentPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  text: z.string(),
  characterCount: z.number(),
  hasImages: z.boolean().default(false),
  isLikelyScanned: z.boolean().default(false),
  warning: z.string().optional()
})

export type DocumentPage = z.infer<typeof DocumentPageSchema>

export const StructuredAnalysisSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  documentId: z.string(),
  analysisTimestamp: z.string(),
  providerMode: z.enum([
    'demo_precomputed',
    'local_endpoint',
    'custom_proxy',
    'simulated_fallback',
    'gemini_api'
  ]),
  providerDisplayName: z.string(),
  metadata: DocumentMetadataSchema,
  eligibilityRequirements: z.array(EligibilityRequirementSchema),
  deadlines: z.array(DeadlineItemSchema),
  requiredDocuments: z.array(RequiredDocumentSchema),
  actions: z.array(ActionItemSchema),
  risksAndConditions: z.array(RiskOrConditionSchema),
  questions: z.array(ClarificationQuestionSchema),
  citationVerificationSummary: z.object({
    totalCitations: z.number(),
    verifiedCount: z.number(),
    unverifiedCount: z.number(),
    warnings: z.array(z.string())
  })
})

export type StructuredAnalysis = z.infer<typeof StructuredAnalysisSchema>

export interface UserDocument {
  id: string
  fileName: string
  fileSizeBytes: number
  fileType: string
  pageCount: number
  pages: DocumentPage[]
  processedPagesCount?: number
  isDemoSample: boolean
  isScannedDetected: boolean
  importedAt: string
  analysis: StructuredAnalysis | null
}

export interface UserProfileAnswers {
  name?: string
  educationLevel?: string
  currentInstitution?: string
  fieldOfStudy?: string
  currentGpa?: number | string
  gpa?: string
  graduationYear?: number | string
  residencyRegion?: string
  citizenship?: string
  employmentStatus?: string
  specialConditions?: string
  [key: string]: unknown
}
