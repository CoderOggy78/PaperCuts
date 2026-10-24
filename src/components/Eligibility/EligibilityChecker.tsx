import React, { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Quote,
  ArrowRight
} from 'lucide-react'
import type { EligibilityRequirement, SourceCitation, UserProfileAnswers } from '../../types/schema'

import {
  assessRequirementsAgainstProfile,
  calculateOverallEligibilityResult,
  type OverallEligibilityOutcome
} from '../../lib/eligibilityCalculator'

interface EligibilityCheckerProps {
  requirements: EligibilityRequirement[]
  userProfile: UserProfileAnswers
  onUpdateProfile: (profile: UserProfileAnswers) => void
  onSelectCitation?: (citation: SourceCitation) => void
}

export const EligibilityChecker: React.FC<EligibilityCheckerProps> = ({
  requirements,
  userProfile,
  onUpdateProfile,
  onSelectCitation
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<UserProfileAnswers>({
    educationLevel: userProfile.educationLevel || '',
    currentGpa: userProfile.currentGpa !== undefined ? userProfile.currentGpa : userProfile.gpa || '',
    gpa: userProfile.gpa || '',
    residencyRegion: userProfile.residencyRegion || '',
    citizenship: userProfile.citizenship || '',
    fieldOfStudy: userProfile.fieldOfStudy || '',
    graduationYear: userProfile.graduationYear || '',
    employmentStatus: userProfile.employmentStatus || ''
  })

  // Detect which fields are actually relevant to this document
  const reqText = requirements.map((r) => r.description.toLowerCase()).join(' ')
  const isGpaRelevant = reqText.includes('gpa') || reqText.includes('grade')
  const isDegreeRelevant = reqText.includes('undergraduate') || reqText.includes('degree') || reqText.includes('academic') || reqText.includes('bachelor')
  const isResidencyRelevant = reqText.includes('reside') || reqText.includes('region') || reqText.includes('territor') || reqText.includes('citizen')
  const isGradYearRelevant = reqText.includes('graduation') || reqText.includes('credit') || reqText.includes('year')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateProfile(formData)
    setIsFormOpen(false)
  }

  // Assess each criterion dynamically against the user's provided profile
  const assessedRequirements = assessRequirementsAgainstProfile(requirements, userProfile)
  const overallResult: OverallEligibilityOutcome = calculateOverallEligibilityResult(assessedRequirements)

  const matchCount = assessedRequirements.filter((r) => r.statusBadge === 'MATCHES PROVIDED INFORMATION').length
  const mismatchCount = assessedRequirements.filter((r) => r.statusBadge === 'DOES NOT MATCH PROVIDED INFORMATION').length
  const ambiguousCount = assessedRequirements.filter((r) => r.statusBadge === 'AMBIGUOUS IN SOURCE DOCUMENT').length
  const needsInfoCount = assessedRequirements.filter((r) => r.statusBadge === 'NEEDS MORE INFORMATION').length

  const getOverallResultStyle = (res: OverallEligibilityOutcome) => {
    switch (res) {
      case 'ELIGIBILITY REQUIREMENTS SATISFIED':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
          badge: 'bg-emerald-600 text-white',
          desc: 'All mandatory published requirements match your provided background credentials.'
        }
      case 'AT LEAST ONE REQUIREMENT NOT SATISFIED':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-950',
          badge: 'bg-rose-600 text-white',
          desc: 'At least one mandatory criterion does not match your current reported profile.'
        }
      case 'AMBIGUOUS OR CONFLICTING REQUIREMENTS':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-950',
          badge: 'bg-amber-600 text-white',
          desc: 'Document contains conflicting rules or ambiguous terms requiring sponsor clarification.'
        }
      case 'INSUFFICIENT INFORMATION':
      default:
        return {
          bg: 'bg-blue-50 border-blue-300 text-blue-950',
          badge: 'bg-blue-600 text-white',
          desc: 'Provide your profile background above to evaluate unassessed mandatory requirements.'
        }
    }
  }

  const resultStyle = getOverallResultStyle(overallResult)

  return (
    <div className="space-y-6">
      {/* Overall Deterministic Outcome Banner */}
      <div className={`border rounded-xl p-5 shadow-xs space-y-2 ${resultStyle.bg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${resultStyle.badge}`}>
              DETERMINISTIC EVALUATION
            </span>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-3 py-1 bg-white hover:bg-stone-50 border border-current rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            {isFormOpen ? 'Hide Background Form' : 'Edit Your Profile'}
          </button>
        </div>

        <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight">
          {overallResult}
        </h3>
        <p className="text-xs opacity-90 leading-relaxed">
          {resultStyle.desc}
        </p>

        {/* Summary Metric Pills */}
        <div className="flex flex-wrap gap-2 pt-2 text-xs font-medium">
          <span className="px-2.5 py-1 bg-white/80 rounded-md border border-current">
            {matchCount} Matches Provided Info
          </span>
          {mismatchCount > 0 && (
            <span className="px-2.5 py-1 bg-white/80 rounded-md border border-current">
              {mismatchCount} Does Not Match
            </span>
          )}
          {ambiguousCount > 0 && (
            <span className="px-2.5 py-1 bg-white/80 rounded-md border border-current">
              {ambiguousCount} Ambiguous Clause
            </span>
          )}
          {needsInfoCount > 0 && (
            <span className="px-2.5 py-1 bg-white/80 rounded-md border border-current">
              {needsInfoCount} Missing Info
            </span>
          )}
        </div>
      </div>

      {/* Profile Form Drawer */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-5 space-y-4 shadow-xs animate-fadeIn"
        >
          <div className="border-b border-[#e6dfd3] pb-2">
            <h4 className="font-editorial text-sm font-bold text-[#191716]">
              Your Background Information
            </h4>
            <p className="text-[11px] text-[#736d65]">
              Only relevant fields are requested. Evaluated strictly inside your browser. Never transmitted externally.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {isGpaRelevant && (
              <div>
                <label className="block font-semibold text-[#191716] mb-1">
                  Cumulative GPA (4.0 scale)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={formData.currentGpa as string}
                  onChange={(e) => setFormData({ ...formData, currentGpa: e.target.value })}
                  placeholder="e.g. 3.80"
                  className="w-full px-3 py-1.5 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                />
                <p className="text-[10px] text-[#736d65] mt-1">Needed to evaluate GPA minimums (Page 2).</p>
              </div>
            )}

            {isDegreeRelevant && (
              <div>
                <label className="block font-semibold text-[#191716] mb-1">
                  Current Education Level
                </label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                >
                  <option value="Undergraduate (Bachelor Degree)">Undergraduate (Bachelor Degree)</option>
                  <option value="Associate Degree">Associate Degree</option>
                  <option value="Graduate (Master / PhD)">Graduate (Master / PhD)</option>
                  <option value="High School">High School</option>
                </select>
                <p className="text-[10px] text-[#736d65] mt-1">Needed to evaluate degree level threshold.</p>
              </div>
            )}

            {isResidencyRelevant && (
              <div>
                <label className="block font-semibold text-[#191716] mb-1">
                  Residency / Territory
                </label>
                <select
                  value={formData.residencyRegion}
                  onChange={(e) => setFormData({ ...formData, residencyRegion: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                >
                  <option value="Region A (Eligible Territory)">Region A (Eligible Member Territory)</option>
                  <option value="Region B (Eligible Territory)">Region B (Eligible Member Territory)</option>
                  <option value="Region C (Eligible Territory)">Region C (Eligible Member Territory)</option>
                  <option value="Partner Territory (Special Exception)">Partner Territory (Special Exception)</option>
                  <option value="Other / Non-Member Region">Other / Non-Member Region</option>
                </select>
                <p className="text-[10px] text-[#736d65] mt-1">Needed to test Section 3.C regional criteria.</p>
              </div>
            )}

            {isGradYearRelevant && (
              <div>
                <label className="block font-semibold text-[#191716] mb-1">
                  Anticipated Graduation Year
                </label>
                <input
                  type="text"
                  value={formData.graduationYear as string}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  placeholder="e.g. 2028"
                  className="w-full px-3 py-1.5 border border-[#e6dfd3] rounded-md bg-[#fbf9f5] text-[#191716]"
                />
                <p className="text-[10px] text-[#736d65] mt-1">Needed to check graduation timeframe (Dec 2027–June 2029).</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#e6dfd3]">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 text-xs text-[#736d65] hover:text-[#191716]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Save & Recalculate
            </button>
          </div>
        </form>
      )}

      {/* Criteria Breakdown Cards */}
      <div className="space-y-4">
        {assessedRequirements.map((req, idx) => {
          let badgeBg = 'bg-[#f5f1ea] text-[#736d65] border-[#e6dfd3]'
          let Icon = HelpCircle

          if (req.statusBadge === 'MATCHES PROVIDED INFORMATION') {
            badgeBg = 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]'
            Icon = CheckCircle2
          } else if (req.statusBadge === 'DOES NOT MATCH PROVIDED INFORMATION') {
            badgeBg = 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
            Icon = XCircle
          } else if (req.statusBadge === 'AMBIGUOUS IN SOURCE DOCUMENT') {
            badgeBg = 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]'
            Icon = AlertTriangle
          }

          return (
            <div
              key={req.id || idx}
              className="bg-[#ffffff] border border-[#e6dfd3] rounded-lg p-5 space-y-3.5 shadow-xs"
            >
              {/* Header: Status Badge + Criterion */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e6dfd3]/80 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-[#736d65]">
                    [{req.id}]
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#736d65]">
                    {req.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{req.statusBadge}</span>
                </div>
              </div>

              {/* 1. Criterion description */}
              <div>
                <p className="text-xs font-bold text-[#191716] leading-snug">
                  {req.description}
                </p>
                {req.conditionsAndExceptions !== 'None stated' && (
                  <p className="text-[11px] text-[#736d65] mt-0.5">
                    <strong>Conditions/Exceptions:</strong> {req.conditionsAndExceptions}
                  </p>
                )}
              </div>

              {/* 2. User's Provided Info */}
              <div className="bg-[#fbf9f5] p-2.5 rounded-md border border-[#e6dfd3] text-xs">
                <span className="font-semibold text-[#736d65]">Your Provided Background: </span>
                <span className="font-medium text-[#191716]">{req.userProvided}</span>
              </div>

              {/* 3. Explanation of comparison */}
              <div className="text-xs text-[#57534e] space-y-1">
                <p>
                  <strong className="text-[#191716]">Analysis: </strong>
                  {req.explanation}
                </p>
                <p className="text-[11px] text-[#736d65]">
                  <strong>What could change this result: </strong>
                  {req.remediation}
                </p>
              </div>

              {/* 4. Exact Source Evidence Quote with Clickable Citation */}
              {req.sourceCitations && req.sourceCitations.length > 0 && (
                <div className="pt-1">
                  {req.sourceCitations.map((cit) => (
                    <button
                      key={cit.id}
                      onClick={() => onSelectCitation?.(cit)}
                      className="w-full text-left bg-[#f5f1ea]/60 hover:bg-[#efebe2] border border-[#e6dfd3] rounded-md p-2.5 transition-colors group cursor-pointer"
                      title="Click to jump to page and highlight source excerpt"
                    >
                      <div className="flex items-start space-x-2">
                        <Quote className="w-3.5 h-3.5 text-[#2563eb] shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1 flex-1">
                          <p className="italic text-[#191716] group-hover:text-[#2563eb] transition-colors">
                            "{cit.excerpt}"
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-[#736d65] font-mono">
                            <span>Page {cit.pageNumber} · Verified in document</span>
                            <span className="text-[#2563eb] font-semibold flex items-center space-x-1">
                              <span>Jump to text</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
