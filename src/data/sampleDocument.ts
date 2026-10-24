import type { DocumentPage, StructuredAnalysis, UserDocument } from '../types/schema'

export const SAMPLE_DOCUMENT_PAGES: DocumentPage[] = [
  {
    pageNumber: 1,
    characterCount: 1320,
    hasImages: false,
    isLikelyScanned: false,
    text: `MERIDIAN EDUCATIONAL TRUST & RESEARCH FOUNDATION
[DEMO DATA — NOT AN OFFICIAL NOTICE]
Document ID: MET-2026-NHF-09
Notice: Public Fellowship Guidelines & Call for Applications

THE 2026 NEXT-HORIZON UNDERGRADUATE FELLOWSHIP
Publication Date: October 1, 2026
Applicable Cycle: Academic Year 2027–2028
Issuing Authority: Office of Academic Grants, Meridian Educational Trust

1. PROGRAM OVERVIEW AND PURPOSE
The Meridian Educational Trust invites applications for the 2026 Next-Horizon Undergraduate Fellowship. The fellowship awards up to twenty-five merit-based grants of $25,000 each to exceptional undergraduate scholars pursuing original research in STEM, public policy, or environmental humanities.

2. OFFICIAL CALENDAR AND DEADLINES
All applicants must adhere strictly to the schedule below:
- Application Filing Deadline: November 15, 2026 at 11:59 PM EST. No extensions will be granted.
- Faculty Recommendation Deadline: November 22, 2026 at 5:00 PM EST.
- Final Award Announcement: January 20, 2027 via the applicant portal.
- Mandatory Orientation: Within 30 days of publication of final award decisions.

Note: Late submissions received after 11:59 PM EST on November 15, 2026 will not be considered under any circumstances.`
  },
  {
    pageNumber: 2,
    characterCount: 1480,
    hasImages: false,
    isLikelyScanned: false,
    text: `MERIDIAN EDUCATIONAL TRUST & RESEARCH FOUNDATION
[DEMO DATA — NOT AN OFFICIAL NOTICE]
Next-Horizon Fellowship Guidelines — Page 2 of 4

3. ELIGIBILITY CRITERIA AND THRESHOLDS
Candidates must satisfy all criteria below at the time of formal submission:

A. Academic Standing and Grade Threshold:
Applicants must be currently enrolled full-time in an accredited undergraduate degree program (STEM, public policy, or environmental humanities) and have achieved a minimum cumulative Grade Point Average (GPA) of 3.5 on a 4.0 scale (or equivalent) at the time of submission.

B. Credit Accumulation and Standing:
Applicants must have completed at least two academic years (minimum 60 semester credits) and have an anticipated graduation date between December 2027 and June 2029.

C. Residency and Regional Affiliation:
Applicants must reside legally within eligible member territories (Regions A, B, and C) or hold active student visa status within an accredited regional institution.

D. Exclusions and Disqualifications:
Immediate family members of Meridian Foundation board trustees or full-time foundation staff are strictly ineligible to receive awards. Individuals who have previously accepted a national-level grant exceeding $15,000 in the same fiscal year may not hold concurrent funding.`
  },
  {
    pageNumber: 3,
    characterCount: 1560,
    hasImages: false,
    isLikelyScanned: false,
    text: `MERIDIAN EDUCATIONAL TRUST & RESEARCH FOUNDATION
[DEMO DATA — NOT AN OFFICIAL NOTICE]
Next-Horizon Fellowship Guidelines — Page 3 of 4

4. REQUIRED SUPPORTING DOCUMENTS AND SUBMISSION STANDARDS
Every submission package must contain the following formal evidence:

1. Official University Transcript:
Official university academic transcript displaying coursework through Spring 2026 with institutional registrar seal. Must be submitted as a single PDF under 10MB. Unofficial web printouts will be rejected immediately.

2. Two Confidential Recommendation Letters:
Two confidential letters of recommendation from faculty advisors or laboratory directors, submitted directly via institutional email. Letters must be on official department letterhead and signed by the recommending faculty member.

3. Personal Research Statement:
A 500-word personal statement detailing research methodology, community impact, and career objectives. Statements exceeding 550 words will be penalized during scoring.

4. Conditional Requirement — Laboratory Safety Endorsement:
Applicants proposing wet-lab or clinical research involving hazardous materials or biological agents must attach an Institutional Biosafety Committee (IBC) approval letter or preliminary clearance memorandum. Non-laboratory proposals are exempt from this requirement.`
  },
  {
    pageNumber: 4,
    characterCount: 1390,
    hasImages: false,
    isLikelyScanned: false,
    text: `MERIDIAN EDUCATIONAL TRUST & RESEARCH FOUNDATION
[DEMO DATA — NOT AN OFFICIAL NOTICE]
Next-Horizon Fellowship Guidelines — Page 4 of 4

5. AMBIGUOUS CLAUSES, SPECIAL CONDITIONS, AND APPEALS

Section 5.1 — Partner Territory Exceptions:
Applicants from affiliated partner territories may submit alternative accreditation certificates in lieu of regional registrar seals, subject to committee review within 30 days of application intake.
[Note: The criteria for what constitutes an approved 'alternative accreditation certificate' are determined on a case-by-case basis by the intake panel.]

Section 5.2 — Disqualification Rules:
Incomplete dossiers will be disqualified without refund or appeal. Submissions containing plagiarized statements or unverified credentials will be permanently barred from all future foundation programs.

Section 5.3 — Inquiries and Administrative Contacts:
Questions regarding eligibility determinations should be directed to admissions@meridian-foundation-demo.org no later than November 5, 2026. The foundation cannot guarantee responses to queries submitted after this date.`
  }
]

export const SAMPLE_ANALYSIS: StructuredAnalysis = {
  schemaVersion: '1.0.0',
  documentId: 'doc-sample-meridian-2026',
  analysisTimestamp: '2026-10-24T09:30:00.000Z',
  providerMode: 'demo_precomputed',
  providerDisplayName: 'PaperCuts Sample Engine (Demonstration Mode)',
  metadata: {
    title: 'The 2026 Next-Horizon Undergraduate Fellowship Call for Applications',
    documentType: 'scholarship',
    issuingOrganization: 'Meridian Educational Trust & Research Foundation',
    publicationDate: '2026-10-01',
    applicationPeriod: 'October 1, 2026 – November 15, 2026',
    relevantAudience: 'Undergraduate students in STEM, public policy, or environmental humanities with GPA >= 3.5',
    language: 'en',
    extractionWarnings: [
      'DEMO DATA — NOT AN OFFICIAL NOTICE. Preloaded demonstration dataset for product evaluation.'
    ]
  },
  eligibilityRequirements: [
    {
      id: 'REQ-01',
      category: 'academic',
      description: 'Minimum cumulative GPA of 3.5 on a 4.0 scale in STEM, public policy, or environmental humanities.',
      status: 'mandatory',
      conditionsAndExceptions: 'Applies to full-time currently enrolled undergraduates only.',
      sourceCitations: [
        {
          id: 'CIT-REQ-01',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 2,
          excerpt: 'Applicants must be currently enrolled full-time in an accredited undergraduate degree program (STEM, public policy, or environmental humanities) and have achieved a minimum cumulative Grade Point Average (GPA) of 3.5 on a 4.0 scale (or equivalent) at the time of submission.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    },
    {
      id: 'REQ-02',
      category: 'academic',
      description: 'Completion of at least 60 semester credits (two academic years) with expected graduation between Dec 2027 and June 2029.',
      status: 'mandatory',
      conditionsAndExceptions: 'Must be verified by official transcript.',
      sourceCitations: [
        {
          id: 'CIT-REQ-02',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 2,
          excerpt: 'Applicants must have completed at least two academic years (minimum 60 semester credits) and have an anticipated graduation date between December 2027 and June 2029.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    },
    {
      id: 'REQ-03',
      category: 'residency_or_citizenship',
      description: 'Legal residence in Region A, B, or C, or active student visa status in an accredited regional institution.',
      status: 'mandatory',
      conditionsAndExceptions: 'Partner territory students may provide alternative accreditation (subject to review).',
      sourceCitations: [
        {
          id: 'CIT-REQ-03',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 2,
          excerpt: 'Applicants must reside legally within eligible member territories (Regions A, B, and C) or hold active student visa status within an accredited regional institution.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    },
    {
      id: 'REQ-04',
      category: 'general',
      description: 'No direct family ties to Meridian Foundation board trustees or full-time staff; no concurrent awards over $15,000.',
      status: 'mandatory',
      conditionsAndExceptions: 'Disqualifies candidate permanently for this cycle.',
      sourceCitations: [
        {
          id: 'CIT-REQ-04',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 2,
          excerpt: 'Immediate family members of Meridian Foundation board trustees or full-time foundation staff are strictly ineligible to receive awards.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    }
  ],
  deadlines: [
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
        id: 'CIT-DL-01',
        documentId: 'doc-sample-meridian-2026',
        pageNumber: 1,
        excerpt: 'Application Filing Deadline: November 15, 2026 at 11:59 PM EST. No extensions will be granted.',
        verifiedInSource: true,
        matchScore: 1.0
      }
    },
    {
      id: 'DL-02',
      eventName: 'Faculty Recommendation Deadline',
      originalDateText: 'November 22, 2026 at 5:00 PM EST',
      normalizedDate: '2026-11-22',
      timeAndZone: '5:00 PM EST',
      dateKind: 'fixed',
      confidence: 'high',
      unresolvedAmbiguities: null,
      isUserReminder: false,
      sourceCitation: {
        id: 'CIT-DL-02',
        documentId: 'doc-sample-meridian-2026',
        pageNumber: 1,
        excerpt: 'Faculty Recommendation Deadline: November 22, 2026 at 5:00 PM EST.',
        verifiedInSource: true,
        matchScore: 1.0
      }
    },
    {
      id: 'DL-03',
      eventName: 'Inquiries Cut-off Date',
      originalDateText: 'no later than November 5, 2026',
      normalizedDate: '2026-11-05',
      timeAndZone: null,
      dateKind: 'fixed',
      confidence: 'high',
      unresolvedAmbiguities: 'No specific time of day stated; assume business close.',
      isUserReminder: false,
      sourceCitation: {
        id: 'CIT-DL-03',
        documentId: 'doc-sample-meridian-2026',
        pageNumber: 4,
        excerpt: 'Questions regarding eligibility determinations should be directed to admissions@meridian-foundation-demo.org no later than November 5, 2026.',
        verifiedInSource: true,
        matchScore: 1.0
      }
    },
    {
      id: 'DL-04',
      eventName: 'Mandatory Orientation (Relative Date)',
      originalDateText: 'Within 30 days of publication of final award decisions',
      normalizedDate: null,
      timeAndZone: null,
      dateKind: 'relative',
      confidence: 'medium',
      unresolvedAmbiguities: 'Reference date depends on final award announcement on January 20, 2027 (~February 19, 2027).',
      isUserReminder: false,
      sourceCitation: {
        id: 'CIT-DL-04',
        documentId: 'doc-sample-meridian-2026',
        pageNumber: 1,
        excerpt: 'Mandatory Orientation: Within 30 days of publication of final award decisions.',
        verifiedInSource: true,
        matchScore: 1.0
      }
    }
  ],
  requiredDocuments: [
    {
      id: 'DOC-01',
      title: 'Official University Transcript',
      status: 'mandatory',
      submissionRules: 'Must show coursework through Spring 2026 with registrar seal. Single PDF under 10MB.',
      completed: false,
      sourceCitation: {
        id: 'CIT-DOC-01',
        documentId: 'doc-sample-meridian-2026',
        pageNumber: 3,
        excerpt: 'Official university academic transcript displaying coursework through Spring 2026 with institutional registrar seal. Must be submitted as a single PDF under 10MB.',
        verifiedInSource: true,
        matchScore: 1.0
      }
    },
    {
      id: 'DOC-02',
      title: 'Two Confidential Recommendation Letters',
      status: 'mandatory',
      submissionRules: 'From faculty advisor or lab director on university letterhead, emailed directly by faculty.',
      completed: false,
      sourceCitation: {
        id: 'CIT-DOC-02',
        documentId: 'doc-sample-meridian-2026',
        pageNumber: 3,
        excerpt: 'Two confidential letters of recommendation from faculty advisors or laboratory directors, submitted directly via institutional email.',
        verifiedInSource: true,
        matchScore: 1.0
      }
    },
    {
      id: 'DOC-03',
      title: 'Personal Research Statement (500 Words)',
      status: 'mandatory',
      submissionRules: 'Exactly 500 words on methodology and impact; penalty if exceeding 550 words.',
      completed: false,
      sourceCitation: {
        id: 'CIT-DOC-03',
        documentId: 'doc-sample-meridian-2026',
        pageNumber: 3,
        excerpt: 'A 500-word personal statement detailing research methodology, community impact, and career objectives.',
        verifiedInSource: true,
        matchScore: 1.0
      }
    },
    {
      id: 'DOC-04',
      title: 'Institutional Biosafety (IBC) Endorsement',
      status: 'conditional',
      submissionRules: 'Required only for applicants proposing wet-lab research with biohazards. Non-lab proposals are exempt.',
      completed: false,
      sourceCitation: {
        id: 'CIT-DOC-04',
        documentId: 'doc-sample-meridian-2026',
        pageNumber: 3,
        excerpt: 'Applicants proposing wet-lab or clinical research involving hazardous materials or biological agents must attach an Institutional Biosafety Committee (IBC) approval letter or preliminary clearance memorandum.',
        verifiedInSource: true,
        matchScore: 1.0
      }
    }
  ],
  actions: [
    {
      id: 'ACT-01',
      title: 'Request official university transcript with registrar seal',
      instructions: 'Contact your college registrar office to issue an official transcript through Spring 2026 in PDF format (<10MB). Allow 5–7 business days for processing.',
      whyItMatters: 'Unofficial web printouts will cause immediate disqualification.',
      prerequisites: ['Completed Spring 2026 grades recorded'],
      dueDate: '2026-10-31',
      priority: 'high',
      priorityRationale: 'Registrars typically require up to 2 weeks during mid-semester to issue sealed electronic documents.',
      completed: false,
      userEdited: false,
      relatedRequirementId: 'REQ-01',
      createdAt: '2026-10-24T09:30:00.000Z',
      updatedAt: '2026-10-24T09:30:00.000Z',
      sourceCitations: [
        {
          id: 'CIT-ACT-01',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 3,
          excerpt: 'Official university academic transcript displaying coursework through Spring 2026 with institutional registrar seal. Must be submitted as a single PDF under 10MB.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    },
    {
      id: 'ACT-02',
      title: 'Secure commitments from two faculty recommenders',
      instructions: 'Send formal requests along with your CV and project summary to two faculty advisors. Remind them of the separate November 22 deadline.',
      whyItMatters: 'Recommenders must email letters directly; late letters disqualify the application.',
      prerequisites: ['Draft research proposal'],
      dueDate: '2026-11-01',
      priority: 'high',
      priorityRationale: 'Faculty need sufficient lead time before their November 22 cutoff.',
      completed: false,
      userEdited: false,
      relatedRequirementId: 'REQ-02',
      createdAt: '2026-10-24T09:30:00.000Z',
      updatedAt: '2026-10-24T09:30:00.000Z',
      sourceCitations: [
        {
          id: 'CIT-ACT-02',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 3,
          excerpt: 'Two confidential letters of recommendation from faculty advisors or laboratory directors, submitted directly via institutional email.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    },
    {
      id: 'ACT-03',
      title: 'Draft and edit 500-word personal statement',
      instructions: 'Write statement covering methodology, community impact, and career goals. Strictly limit length to between 480 and 520 words.',
      whyItMatters: 'Statements over 550 words receive point deductions.',
      prerequisites: [],
      dueDate: '2026-11-08',
      priority: 'medium',
      priorityRationale: 'Core qualitative scoring factor for the merit committee.',
      completed: false,
      userEdited: false,
      relatedRequirementId: 'REQ-01',
      createdAt: '2026-10-24T09:30:00.000Z',
      updatedAt: '2026-10-24T09:30:00.000Z',
      sourceCitations: [
        {
          id: 'CIT-ACT-03',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 3,
          excerpt: 'A 500-word personal statement detailing research methodology, community impact, and career objectives. Statements exceeding 550 words will be penalized during scoring.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    },
    {
      id: 'ACT-04',
      title: 'Determine if Biosafety (IBC) endorsement is required',
      instructions: 'Review whether your project touches biological samples or laboratory hazards. If yes, request an IBC approval memorandum immediately.',
      whyItMatters: 'Mandatory condition for wet-lab studies; computational/policy projects are exempt.',
      prerequisites: ['Finalized experimental scope'],
      dueDate: '2026-11-05',
      priority: 'medium',
      priorityRationale: 'Institutional safety boards often take weeks to issue approval letters.',
      completed: false,
      userEdited: false,
      relatedRequirementId: 'REQ-01',
      createdAt: '2026-10-24T09:30:00.000Z',
      updatedAt: '2026-10-24T09:30:00.000Z',
      sourceCitations: [
        {
          id: 'CIT-ACT-04',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 3,
          excerpt: 'Applicants proposing wet-lab or clinical research involving hazardous materials or biological agents must attach an Institutional Biosafety Committee (IBC) approval letter or preliminary clearance memorandum.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    }
  ],
  risksAndConditions: [
    {
      id: 'RISK-01',
      type: 'disqualification',
      title: 'Strict cutoff: 11:59 PM EST on November 15, 2026',
      description: 'The foundation enforces a strict zero-tolerance policy for late submissions. Even server latency on the applicant side will not excuse late filing.',
      severity: 'critical',
      sourceCitations: [
        {
          id: 'CIT-RISK-01',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 1,
          excerpt: 'Late submissions received after 11:59 PM EST on November 15, 2026 will not be considered under any circumstances.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    },
    {
      id: 'RISK-02',
      type: 'ambiguous_clause',
      title: 'Partner Territory Accreditation Ambiguity',
      description: 'Section 5.1 allows alternative accreditation for partner territories, but neither specifies which certificates qualify nor guarantees review turnaround before the final deadline.',
      severity: 'warning',
      sourceCitations: [
        {
          id: 'CIT-RISK-02',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 4,
          excerpt: 'Applicants from affiliated partner territories may submit alternative accreditation certificates in lieu of regional registrar seals, subject to committee review within 30 days of application intake.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    },
    {
      id: 'RISK-03',
      type: 'disqualification',
      title: 'Family relation or concurrent national award restriction',
      description: 'Immediate relatives of foundation board members or recipients of other grants >$15,000 in the same fiscal year are ineligible.',
      severity: 'critical',
      sourceCitations: [
        {
          id: 'CIT-RISK-03',
          documentId: 'doc-sample-meridian-2026',
          pageNumber: 2,
          excerpt: 'Immediate family members of Meridian Foundation board trustees or full-time foundation staff are strictly ineligible to receive awards.',
          verifiedInSource: true,
          matchScore: 1.0
        }
      ]
    }
  ],
  questions: [
    {
      id: 'Q-01',
      question: 'What specific alternative certificates are accepted under Section 5.1 for partner territory accreditation?',
      whyItMatters: 'If you attend an institution in a partner territory, submitting an unapproved alternative certificate will trigger dossier rejection.',
      affectedRequirementId: 'REQ-03',
      targetEntity: 'Admissions Office (admissions@meridian-foundation-demo.org)'
    },
    {
      id: 'Q-02',
      question: 'Does preliminary IBC clearance suffice if full committee approval is pending past November 15?',
      whyItMatters: 'For wet-lab applicants, clarification determines whether an in-progress safety application allows filing or disqualifies the package.',
      affectedRequirementId: 'REQ-01',
      targetEntity: 'Grants Administrator'
    }
  ],
  citationVerificationSummary: {
    totalCitations: 14,
    verifiedCount: 14,
    unverifiedCount: 0,
    warnings: []
  }
}

export const SAMPLE_USER_DOCUMENT: UserDocument = {
  id: 'doc-sample-meridian-2026',
  fileName: '2026_Meridian_Fellowship_Notice.pdf',
  fileSizeBytes: 42800,
  fileType: 'application/pdf',
  pageCount: 4,
  pages: SAMPLE_DOCUMENT_PAGES,
  isDemoSample: true,
  isScannedDetected: false,
  importedAt: '2026-10-24T09:30:00.000Z',
  analysis: SAMPLE_ANALYSIS
}
