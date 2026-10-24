import type { EligibilityRequirement, UserProfileAnswers } from '../types/schema'

export type OverallEligibilityOutcome =
  | 'ELIGIBILITY REQUIREMENTS SATISFIED'
  | 'AT LEAST ONE REQUIREMENT NOT SATISFIED'
  | 'INSUFFICIENT INFORMATION'
  | 'AMBIGUOUS OR CONFLICTING REQUIREMENTS'

export interface AssessedCriterion extends EligibilityRequirement {
  statusBadge:
    | 'MATCHES PROVIDED INFORMATION'
    | 'DOES NOT MATCH PROVIDED INFORMATION'
    | 'AMBIGUOUS IN SOURCE DOCUMENT'
    | 'NEEDS MORE INFORMATION'
  userProvided: string
  explanation: string
  remediation?: string
}

/**
 * Deterministically calculates the overall eligibility result.
 * Rule: NEVER declare fully eligible while any mandatory criterion remains unresolved or missing info.
 */
export function calculateOverallEligibilityResult(
  assessed: Array<{
    status: 'mandatory' | 'preferred' | 'unclear'
    statusBadge: AssessedCriterion['statusBadge']
  }>
): OverallEligibilityOutcome {
  if (assessed.length === 0) {
    return 'INSUFFICIENT INFORMATION'
  }

  const mandatory = assessed.filter((r) => r.status === 'mandatory')
  const targets = mandatory.length > 0 ? mandatory : assessed

  // 1. Any failed criterion disqualifies
  if (targets.some((r) => r.statusBadge === 'DOES NOT MATCH PROVIDED INFORMATION')) {
    return 'AT LEAST ONE REQUIREMENT NOT SATISFIED'
  }

  // 2. Any ambiguous criterion blocks confirmation
  if (targets.some((r) => r.statusBadge === 'AMBIGUOUS IN SOURCE DOCUMENT')) {
    return 'AMBIGUOUS OR CONFLICTING REQUIREMENTS'
  }

  // 3. Any missing info blocks confirmation
  if (targets.some((r) => r.statusBadge === 'NEEDS MORE INFORMATION')) {
    return 'INSUFFICIENT INFORMATION'
  }

  return 'ELIGIBILITY REQUIREMENTS SATISFIED'
}

/**
 * Compares user answers against requirement criteria deterministically.
 */
export function assessRequirementsAgainstProfile(
  requirements: EligibilityRequirement[],
  profile: UserProfileAnswers
): AssessedCriterion[] {
  return requirements.map((req) => {
    const lower = req.description.toLowerCase()

    // 1. GPA evaluation
    if (lower.includes('gpa') || lower.includes('grade point')) {
      const gpaInput = profile.gpa !== undefined && profile.gpa !== ''
        ? String(profile.gpa)
        : profile.currentGpa !== undefined && profile.currentGpa !== ''
        ? String(profile.currentGpa)
        : null

      if (!gpaInput) {
        return {
          ...req,
          statusBadge: 'NEEDS MORE INFORMATION',
          userProvided: 'GPA not specified in profile',
          explanation: 'Document requires GPA verification, but no GPA was provided in your background profile.',
          remediation: 'Enter your cumulative GPA in the background form to evaluate this requirement.'
        }
      }

      const gpaVal = parseFloat(gpaInput)
      const match = lower.match(/(\d\.\d+)/)
      const threshold = match ? parseFloat(match[1]) : 3.5

      if (!isNaN(gpaVal)) {
        if (gpaVal >= threshold) {
          return {
            ...req,
            statusBadge: 'MATCHES PROVIDED INFORMATION',
            userProvided: `Cumulative GPA: ${gpaVal.toFixed(2)}`,
            explanation: `Your reported GPA of ${gpaVal.toFixed(2)} satisfies the minimum requirement of ${threshold.toFixed(2)} stated in source.`,
            remediation: 'Provide official transcript verifying this GPA.'
          }
        } else {
          return {
            ...req,
            statusBadge: 'DOES NOT MATCH PROVIDED INFORMATION',
            userProvided: `Cumulative GPA: ${gpaVal.toFixed(2)}`,
            explanation: `Your reported GPA of ${gpaVal.toFixed(2)} is below the required threshold of ${threshold.toFixed(2)}.`,
            remediation: 'Check with issuing organization for exceptions or alternative qualifications.'
          }
        }
      }
    }

    // 2. Education level evaluation
    if (lower.includes('undergraduate') || lower.includes('bachelor') || lower.includes('junior') || lower.includes('senior')) {
      const level = profile.educationLevel ? String(profile.educationLevel).toLowerCase() : ''
      if (!level) {
        return {
          ...req,
          statusBadge: 'NEEDS MORE INFORMATION',
          userProvided: 'Education level not provided',
          explanation: 'Academic enrollment level is required to assess eligibility.',
          remediation: 'Select your current degree level in profile.'
        }
      }

      const isUndergrad = level.includes('undergraduate') || level.includes('junior') || level.includes('senior') || level.includes('bachelor')
      if (isUndergrad) {
        return {
          ...req,
          statusBadge: 'MATCHES PROVIDED INFORMATION',
          userProvided: `Enrollment: ${profile.educationLevel}`,
          explanation: 'Your enrolled level satisfies the undergraduate student requirement.',
          remediation: 'Submit registrar enrollment verification.'
        }
      } else {
        return {
          ...req,
          statusBadge: 'DOES NOT MATCH PROVIDED INFORMATION',
          userProvided: `Enrollment: ${profile.educationLevel}`,
          explanation: 'Document restricts eligibility strictly to undergraduate applicants.',
          remediation: 'Review graduate or alternative program opportunities.'
        }
      }
    }

    // 3. Citizenship or residency
    if (lower.includes('citizen') || lower.includes('residen') || lower.includes('territor')) {
      const citizen = profile.citizenship ? String(profile.citizenship) : profile.residencyRegion ? String(profile.residencyRegion) : ''
      if (!citizen) {
        return {
          ...req,
          statusBadge: 'NEEDS MORE INFORMATION',
          userProvided: 'Citizenship/residency not provided',
          explanation: 'Residency or citizenship status is required by this criterion.',
          remediation: 'Specify your citizenship or eligible territory in profile.'
        }
      }

      if (citizen.toLowerCase().includes('citizen') || citizen.toLowerCase().includes('permanent resident')) {
        return {
          ...req,
          statusBadge: 'MATCHES PROVIDED INFORMATION',
          userProvided: `Status: ${citizen}`,
          explanation: 'Citizenship status matches published standard eligibility.',
          remediation: 'Provide proof of citizenship or permanent residency.'
        }
      }

      if (citizen.toLowerCase().includes('territor') || citizen.toLowerCase().includes('region')) {
        return {
          ...req,
          statusBadge: 'AMBIGUOUS IN SOURCE DOCUMENT',
          userProvided: `Status: ${citizen}`,
          explanation: 'Document mentions partner territories but approval guidelines require institutional endorsement.',
          remediation: 'Obtain partner territory institutional endorsement affidavit.'
        }
      }

      return {
        ...req,
        statusBadge: 'DOES NOT MATCH PROVIDED INFORMATION',
        userProvided: `Status: ${citizen}`,
        explanation: 'Status does not match published domestic/territory residency criteria.',
        remediation: 'Confirm with sponsor if foreign national or international visas are supported.'
      }
    }

    // Default
    return {
      ...req,
      statusBadge: 'NEEDS MORE INFORMATION',
      userProvided: 'No corresponding field provided',
      explanation: 'No specific profile data available for this criterion.',
      remediation: 'Review the source excerpt and verify with issuing authority.'
    }
  })
}
