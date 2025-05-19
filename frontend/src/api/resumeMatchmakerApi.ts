// API client for JobFit AI Matchmaker backend resume-matching endpoints
import type {
  JobAnalysisRequest,
  JobAnalysisResponse,
  ResumeMatchingRequest,
  ResumeMatchingResponse
} from '../types/resumeMatchmaker';

const API_BASE = 'http://localhost:4000/api/resume-matching';

export const analyzeJob = async (request: JobAnalysisRequest): Promise<JobAnalysisResponse> => {
  const response = await fetch(`${API_BASE}/analyze-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new Error('Failed to analyze job description');
  }
  return response.json();
};

export const matchResumes = async (request: ResumeMatchingRequest): Promise<ResumeMatchingResponse> => {
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
