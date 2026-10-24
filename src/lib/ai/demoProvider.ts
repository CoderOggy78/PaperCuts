import { SAMPLE_ANALYSIS } from '../../data/sampleDocument'
import { analyzeDateString } from '../dateParser'
import { reconcileAllCitations } from '../evidenceVerifier'
import type {
  ActionItem,
  ClarificationQuestion,
  DeadlineItem,
  DocumentPage,
  EligibilityRequirement,
  RequiredDocument,
  RiskOrCondition,
  StructuredAnalysis,
  UserProfileAnswers
} from '../../types/schema'
import type { DocumentAIProvider } from './types'

export class DemoProvider implements DocumentAIProvider {
  readonly id = 'demo-provider'
  readonly displayName = 'PaperCuts Demo Engine (Demonstration Mode)'
  readonly mode = 'demo_precomputed' as const

  async analyzeDocument(params: {
    documentId: string
    title: string
    pages: DocumentPage[]
    signal?: AbortSignal
    onStatusUpdate?: (stage: string) => void
  }): Promise<StructuredAnalysis> {
    params.onStatusUpdate?.('Analyzing document structure...')

    // If it's the preloaded sample document, return the rich pre-verified sample analysis
    if (params.documentId === 'doc-sample-meridian-2026') {
      await new Promise((r) => setTimeout(r, 400))
      return {
        ...SAMPLE_ANALYSIS,
        analysisTimestamp: new Date().toISOString()
      }
    }

    // For any user-uploaded document in demo mode:
    // Extract genuine findings directly from the user's actual document text!
    params.onStatusUpdate?.('Extracting requirements and verbatim evidence from pages...')
    await new Promise((r) => setTimeout(r, 500))

    if (params.signal?.aborted) {
      throw new Error('Analysis was cancelled by user.')
    }

    const { requirements, deadlines, requiredDocs, risks, questions } = extractHeuristicsFromPages(
      params.pages,
      params.documentId
    )

    params.onStatusUpdate?.('Reconciling citations with extracted text...')
    await new Promise((r) => setTimeout(r, 300))

    // Reconcile and verify citations against the real page text
    const reconciledReqs = reconcileAllCitations(requirements, params.pages)
    const reconciledDeadlines = reconcileAllCitations(deadlines, params.pages)
    const reconciledDocs = reconcileAllCitations(requiredDocs, params.pages)
    const reconciledRisks = reconcileAllCitations(risks, params.pages)

    // Generate action items derived from the verified requirements & deadlines
    const actions: ActionItem[] = reconciledReqs.items.map((req, idx) => {
      const relatedDeadline = reconciledDeadlines.items[idx % reconciledDeadlines.items.length]
      return {
        id: `ACT-USER-${idx + 1}`,
        title: `Satisfy requirement: ${req.description.slice(0, 60)}...`,
        instructions: `Gather verification evidence for: ${req.description}. Ensure all conditions (${req.conditionsAndExceptions}) are satisfied.`,
        whyItMatters: req.status === 'mandatory' ? 'Mandatory condition for eligibility consideration.' : 'Recommended qualification criteria.',
        prerequisites: [],
        dueDate: relatedDeadline?.normalizedDate || null,
        priority: req.status === 'mandatory' ? 'high' : 'medium',
        priorityRationale: req.status === 'mandatory' ? 'Core threshold identified in document text.' : 'Discretionary scoring criteria.',
        sourceCitations: req.sourceCitations,
        completed: false,
        userEdited: false,
        relatedRequirementId: req.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    const allWarnings = [
      'Note: This analysis was generated in Demonstration Mode without a live external model call.',
      ...reconciledReqs.warnings,
      ...reconciledDeadlines.warnings
    ]

    const totalCitations =
      reconciledReqs.totalCitations +
      reconciledDeadlines.totalCitations +
      reconciledDocs.totalCitations +
      reconciledRisks.totalCitations

    const verifiedCount =
      reconciledReqs.verifiedCount +
      reconciledDeadlines.verifiedCount +
      reconciledDocs.verifiedCount +
      reconciledRisks.verifiedCount

    return {
      schemaVersion: '1.0.0',
      documentId: params.documentId,
      analysisTimestamp: new Date().toISOString(),
      providerMode: 'demo_precomputed',
      providerDisplayName: 'PaperCuts Local Analyzer (Demonstration Mode)',
      metadata: {
        title: params.title.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        documentType: 'general',
        issuingOrganization: 'Extracted from document header',
        publicationDate: null,
        applicationPeriod: null,
        relevantAudience: 'General applicants / stakeholders',
        language: 'en',
        extractionWarnings: allWarnings
      },
      eligibilityRequirements: reconciledReqs.items,
      deadlines: reconciledDeadlines.items,
      requiredDocuments: reconciledDocs.items,
      actions,
      risksAndConditions: reconciledRisks.items,
      questions,
      citationVerificationSummary: {
        totalCitations,
        verifiedCount,
        unverifiedCount: totalCitations - verifiedCount,
        warnings: allWarnings
      }
    }
  }

  async extractRequirements(pages: DocumentPage[]): Promise<EligibilityRequirement[]> {
    const { requirements } = extractHeuristicsFromPages(pages, 'temp-doc')
    return requirements
  }

  async evaluateEligibility(
    requirements: EligibilityRequirement[],
    profile: UserProfileAnswers
  ): Promise<EligibilityRequirement[]> {
    return requirements.map((req) => {
      const lower = req.description.toLowerCase()

      // 1. GPA check
      if (lower.includes('gpa') && profile.currentGpa !== undefined && profile.currentGpa !== '') {
        const userGpa = parseFloat(String(profile.currentGpa))
        const match = lower.match(/(\d\.\d+)/)
        const threshold = match ? parseFloat(match[1]) : 3.0
        if (!isNaN(userGpa)) {
          if (userGpa >= threshold) {
            return {
              ...req,
              profileEvaluationStatus: 'matches',
              profileEvaluationReason: `Your provided GPA of ${userGpa} meets or exceeds the required threshold of ${threshold}.`
            }
          } else {
            return {
              ...req,
              profileEvaluationStatus: 'does_not_match',
              profileEvaluationReason: `Your provided GPA (${userGpa}) is below the required threshold of ${threshold}.`
            }
          }
        }
      }

      // 2. Education degree / field
      if (
        (lower.includes('undergraduate') || lower.includes('degree') || lower.includes('enrolled')) &&
        profile.educationLevel
      ) {
        if (profile.educationLevel.toLowerCase().includes('undergraduate') || profile.educationLevel.toLowerCase().includes('bachelor')) {
          return {
            ...req,
            profileEvaluationStatus: 'matches',
            profileEvaluationReason: `You indicated enrollment as '${profile.educationLevel}', which aligns with the undergraduate requirement.`
          }
        }
      }

      // 3. Residency
      if (lower.includes('reside') || lower.includes('region') || lower.includes('citizenship')) {
        if (profile.residencyRegion) {
          if (profile.residencyRegion.includes('A') || profile.residencyRegion.includes('B') || profile.residencyRegion.includes('C')) {
            return {
              ...req,
              profileEvaluationStatus: 'matches',
              profileEvaluationReason: `Your region (${profile.residencyRegion}) is listed among the eligible territories.`
            }
          } else {
            return {
              ...req,
              profileEvaluationStatus: 'ambiguous',
              profileEvaluationReason: `You selected '${profile.residencyRegion}'. Source document allows alternate accreditation for partner territories subject to review.`
            }
          }
        }
      }

      // Default: needs more info
      return {
        ...req,
        profileEvaluationStatus: 'needs_info',
        profileEvaluationReason: 'No specific profile data provided yet to assess this criterion.'
      }
    })
  }

  async generateActionPlan(
    _requirements: EligibilityRequirement[],
    deadlines: DeadlineItem[],
    requiredDocs: RequiredDocument[]
  ): Promise<ActionItem[]> {
    const actions: ActionItem[] = []

    requiredDocs.forEach((doc, i) => {
      actions.push({
        id: `ACT-DOC-${i + 1}`,
        title: `Prepare and submit: ${doc.title}`,
        instructions: `Format according to: ${doc.submissionRules}. Verify all pages before uploading.`,
        whyItMatters: doc.status === 'mandatory' ? 'Mandatory required document.' : 'Conditional supporting evidence.',
        prerequisites: [],
        dueDate: deadlines[0]?.normalizedDate || null,
        priority: doc.status === 'mandatory' ? 'high' : 'medium',
        priorityRationale: 'Required documentation item.',
        sourceCitations: [doc.sourceCitation],
        completed: false,
        userEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })

    return actions
  }
}

/**
 * Extracts verifiable candidate sentences and paragraphs from raw document text.
 */
function extractHeuristicsFromPages(pages: DocumentPage[], documentId: string) {
  const requirements: EligibilityRequirement[] = []
  const deadlines: DeadlineItem[] = []
  const requiredDocs: RequiredDocument[] = []
  const risks: RiskOrCondition[] = []
  const questions: ClarificationQuestion[] = []

  let reqCount = 0
  let dlCount = 0
  let docCount = 0

  for (const page of pages) {
    const lines = page.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 20)

    for (const line of lines) {
      const lower = line.toLowerCase()

      // Find deadline candidates
      if (
        (lower.includes('deadline') || lower.includes('due date') || lower.includes('no later than') || lower.includes('by 5:00') || lower.includes('by 11:59')) &&
        dlCount < 5
      ) {
        dlCount++
        const dateParsed = analyzeDateString(line)
        const eventMatch = line.match(/^([^:–—]+)[:–—]/)
        const eventName = eventMatch ? eventMatch[1].trim() : `Key Deadline #${dlCount}`

        deadlines.push({
          id: `DL-${dlCount}`,
          eventName,
          originalDateText: line,
          normalizedDate: dateParsed.normalizedDate,
          timeAndZone: dateParsed.timeAndZone,
          dateKind: dateParsed.dateKind,
          confidence: dateParsed.confidence,
          unresolvedAmbiguities: dateParsed.unresolvedAmbiguities,
          isUserReminder: false,
          sourceCitation: {
            id: `CIT-DL-${dlCount}`,
            documentId,
            pageNumber: page.pageNumber,
            excerpt: line,
            verifiedInSource: true
          }
        })
      }

      // Find required documents candidates
      if (
        (lower.includes('transcript') || lower.includes('letter of recommendation') || lower.includes('statement') || lower.includes('resume') || lower.includes('certificate') || lower.includes('endorsement')) &&
        docCount < 6
      ) {
        docCount++
        const isMandatory = !lower.includes('conditional') && !lower.includes('optional') && !lower.includes('if proposing')
        requiredDocs.push({
          id: `DOC-${docCount}`,
          title: line.split(/[:.]/)[0].trim(),
          status: isMandatory ? 'mandatory' : 'conditional',
          submissionRules: line,
          completed: false,
          sourceCitation: {
            id: `CIT-DOC-${docCount}`,
            documentId,
            pageNumber: page.pageNumber,
            excerpt: line,
            verifiedInSource: true
          }
        })
      }

      // Find eligibility requirement candidates
      if (
        (lower.includes('must be') || lower.includes('must have') || lower.includes('minimum gpa') || lower.includes('eligible') || lower.includes('applicants must')) &&
        reqCount < 6
      ) {
        reqCount++
        let category: EligibilityRequirement['category'] = 'general'
        if (lower.includes('gpa') || lower.includes('degree') || lower.includes('credit')) category = 'academic'
        else if (lower.includes('reside') || lower.includes('citizen') || lower.includes('territor')) category = 'residency_or_citizenship'
        else if (lower.includes('full-time') || lower.includes('employ') || lower.includes('intern')) category = 'employment_or_experience'

        requirements.push({
          id: `REQ-0${reqCount}`,
          category,
          description: line,
          status: lower.includes('prefer') ? 'preferred' : 'mandatory',
          conditionsAndExceptions: 'Extracted directly from document criteria.',
          sourceCitations: [
            {
              id: `CIT-REQ-0${reqCount}`,
              documentId,
              pageNumber: page.pageNumber,
              excerpt: line,
              verifiedInSource: true
            }
          ]
        })
      }

      // Find disqualification / ambiguity candidates
      if (lower.includes('disqualif') || lower.includes('ineligible') || lower.includes('late submission') || lower.includes('subject to committee review')) {
        risks.push({
          id: `RISK-${risks.length + 1}`,
          type: lower.includes('subject to') ? 'ambiguous_clause' : 'disqualification',
          title: line.split(/[:.]/)[0].trim(),
          description: line,
          severity: lower.includes('disqualif') ? 'critical' : 'warning',
          sourceCitations: [
            {
              id: `CIT-RISK-${risks.length + 1}`,
              documentId,
              pageNumber: page.pageNumber,
              excerpt: line,
              verifiedInSource: true
            }
          ]
        })
      }
    }
  }

  // If no requirements were detected (e.g. general document), create an honest fallback notice
  if (requirements.length === 0 && pages.length > 0) {
    const firstLine = pages[0].text.split('\n')[0] || 'Document overview'
    requirements.push({
      id: 'REQ-GEN-1',
      category: 'general',
      description: `Review general compliance rules stated in: "${firstLine.slice(0, 80)}"`,
      status: 'mandatory',
      conditionsAndExceptions: 'Detailed rules must be extracted with a configured model adapter.',
      sourceCitations: [
        {
          id: 'CIT-GEN-1',
          documentId,
          pageNumber: 1,
          excerpt: firstLine.slice(0, 120),
          verifiedInSource: true
        }
      ]
    })
  }

  return { requirements, deadlines, requiredDocs, risks, questions }
}
