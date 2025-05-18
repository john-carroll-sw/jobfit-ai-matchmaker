import { z } from "zod";

/**
 * Generic criteria schema for industry-agnostic resume evaluation
 */
export const ResumeEvaluationCriteriaSchema = z.object({
  experienceLevel: z.number().min(0).max(10).describe("Overall experience score out of 10"),
  relevantSpecialties: z.array(z.string()).describe("List of relevant specialties for the role"),
  yearsOfExperience: z.number().min(0).describe("Total years of relevant experience"),
  certifications: z.array(z.string()).describe("List of relevant certifications"),
  technicalSkillsMatch: z.number().min(0).max(10).describe("Score for technical skills match"),
  educationMatch: z.number().min(0).max(10).describe("Score for education match to requirements"),
  communicationSkills: z.number().min(0).max(10).describe("Assessment of communication skills"),
  
  // Extension point for additional industry-specific criteria
  industrySpecificScores: z.record(z.string(), z.number().min(0).max(10)).optional().describe("Industry-specific evaluation scores"),
  industrySpecificSkills: z.record(z.string(), z.array(z.string())).optional().describe("Industry-specific skills and competencies")
});

/**
 * Generic resume matching response schema
 */
export const ResumeMatchingResponseSchema = z.object({
  overallMatch: z.number().min(0).max(100).describe("Overall match percentage from 0-100"),
  criteriaEvaluation: ResumeEvaluationCriteriaSchema,
  
  // Matching details
  strengths: z.array(
    z.object({
      area: z.string().describe("Area of strength"),
      details: z.string().describe("Detailed explanation of the strength"),
      importanceWeight: z.number().min(1).max(5).describe("How important this strength is for the role (1-5)")
    })
  ).describe("Candidate's strengths relative to the position"),
  
  gaps: z.array(
    z.object({
      area: z.string().describe("Area where there is a gap"),
      details: z.string().describe("Detailed explanation of the gap"),
      criticality: z.number().min(1).max(5).describe("How critical this gap is for the role (1-5)")
    })
  ).describe("Candidate's gaps relative to the position"),
  
  matchExplanation: z.string().describe("Detailed explanation of the match assessment"),
  recommendedNextSteps: z.array(z.string()).describe("Recommended next steps in the hiring process")
});

/**
 * Generic matching options that can be used across industries
 */
export const MatchingOptionsSchema = z.object({
  useHybridSearch: z.boolean().optional().default(true),
  topResults: z.number().int().positive().max(20).optional().default(5),
  industryType: z.enum(['healthcare', 'technology', 'finance', 'education', 'general']).optional().default('general'),
  customWeights: z.record(z.string(), z.number().min(0).max(1)).optional()
});

export type ResumeEvaluationCriteria = z.infer<typeof ResumeEvaluationCriteriaSchema>;
export type ResumeMatchingResponse = z.infer<typeof ResumeMatchingResponseSchema>;
export type MatchingOptions = z.infer<typeof MatchingOptionsSchema>;
