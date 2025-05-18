// API client for JobFit AI Matchmaker backend resume-matching endpoints

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

export interface ResumeMatch {
  resumeId: string;
  candidateName: string;
  searchScore: number;
  matchAnalysis: any; // You can type this more strictly if you want
}

const API_BASE = 'http://localhost:4000/api/resume-matching';

export const analyzeJob = async (jobDescription: string): Promise<JobAnalysisResponse> => {
  const response = await fetch(`${API_BASE}/analyze-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription })
  });
  if (!response.ok) {
    throw new Error('Failed to analyze job description');
  }
  return response.json();
};

export const matchResumes = async (request: ResumeMatchingRequest): Promise<ResumeMatch[]> => {
  const response = await fetch(`${API_BASE}/match-resumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new Error('Failed to match resumes');
  }
  return response.json();
};
