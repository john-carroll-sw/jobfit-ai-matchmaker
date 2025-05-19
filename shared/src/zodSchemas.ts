import { z } from 'zod';

// Define Zod schemas for our shared types

export const JobAnalysisResponseSchema = z.object({
  jobTitle: z.string(),
  requiredSkills: z.array(z.string()),
  experienceLevel: z.object({
    minYears: z.number(),
    preferredYears: z.number()
  }),
  education: z.object({
    minimumLevel: z.string(),
    preferredFields: z.array(z.string())
  }),
  certifications: z.object({
    required: z.array(z.string()),
    preferred: z.array(z.string())
  }),
  industryKnowledge: z.array(z.string()),
  softSkills: z.array(z.string()),
  keyResponsibilities: z.array(z.string()),
  preferredQualifications: z.array(z.string())
});

export const MatchDimensionSchema = z.object({
  score: z.number(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  explanation: z.string()
});

export const MatchAnalysisSchema = z.object({
  technicalSkillsMatch: MatchDimensionSchema,
  experienceMatch: MatchDimensionSchema,
  educationMatch: MatchDimensionSchema,
  certificationsMatch: MatchDimensionSchema.optional(),
  industryKnowledgeMatch: MatchDimensionSchema.optional(),
  softSkillsMatch: MatchDimensionSchema.optional(),
  overallMatch: z.number(),
  summary: z.string(),
  recommendedNextSteps: z.array(z.string())
});

export const ResumeMatchSchema = z.object({
  resumeId: z.string(),
  candidateName: z.string(),
  searchScore: z.number(),
  matchAnalysis: MatchAnalysisSchema
});

export const BestMatchRecommendationSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  recommendation: z.string()
});

export const ResumeMatchingResponseSchema = z.object({
  matches: z.array(ResumeMatchSchema),
  bestMatch: BestMatchRecommendationSchema.optional(),
  metadata: z.object({
    totalCandidatesScanned: z.number().optional(),
    processingTimeMs: z.number().optional(),
    searchStrategy: z.string().optional()
  }).optional()
});


export const MatchingOptionsSchema = z.object({
  useHybridSearch: z.boolean().optional().default(true),
  topResults: z.number().int().positive().max(20).optional().default(5),
  industryType: z.enum(['healthcare', 'technology', 'finance', 'education', 'general']).optional().default('general'),
  customWeights: z.record(z.string(), z.number().min(0).max(1)).optional()
});

export type MatchingOptions = z.infer<typeof MatchingOptionsSchema>;
export type ResumeMatchingResponse = z.infer<typeof ResumeMatchingResponseSchema>;