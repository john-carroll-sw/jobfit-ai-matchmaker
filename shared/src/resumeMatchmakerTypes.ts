// Shared types for JobFit AI Matchmaker

export interface JobAnalysisRequest {
  jobDescription: string;
}

export interface JobAnalysisResponse {
  jobTitle: string;
  requiredSkills: string[];
  experienceLevel: { minYears: number; preferredYears: number };
  education: { minimumLevel: string; preferredFields: string[] };
  certifications: { required: string[]; preferred: string[] };
  industryKnowledge: string[];
  softSkills: string[];
  keyResponsibilities: string[];
  preferredQualifications: string[];
}

export interface ResumeMatchingRequest {
  jobDescription: string;
  matchingOptions?: {
    useHybridSearch?: boolean;
    topResults?: number;
    industryType?: 'healthcare' | 'technology' | 'finance' | 'education' | 'general';
    customWeights?: {
      experience?: number;
      technicalSkills?: number;
      certifications?: number;
      education?: number;
    };
  };
}

export interface ResumeMatchingResponse {
  bestMatch?: {
    candidateId: string;
    candidateName: string;
    overallScore: number;
    recommendation: string;
  };
  matches: ResumeMatch[];
  metadata?: {
    totalCandidatesScanned?: number;
    processingTimeMs?: number;
    searchStrategy?: string;
  };
}

export interface MatchDimension {
  score: number;
  strengths: string[];
  gaps: string[];
  explanation: string;
}

export interface MatchAnalysis {
  overallMatch: number;
  summary: string;
  recommendedNextSteps: string[];
  technicalSkillsMatch: MatchDimension;
  experienceMatch: MatchDimension;
  educationMatch: MatchDimension;
  certificationsMatch?: MatchDimension;
  industryKnowledgeMatch?: MatchDimension;
  softSkillsMatch?: MatchDimension;
}

export interface ResumeMatch {
  resumeId: string;
  candidateName: string;
  searchScore: number;
  matchAnalysis: MatchAnalysis;
}
