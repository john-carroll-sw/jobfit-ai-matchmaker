import { BaseMatchingService } from "./baseMatchingService";
import { zodTextFormat } from "openai/helpers/zod";
import fs from "fs/promises";
import path from "path";
import { MatchingOptions, ResumeMatchSchema, JobAnalysisResponseSchema } from '@jobfit-ai/shared';
import { ResumeMatchingResponse } from '@jobfit-ai/shared/src/resumeMatchmakerTypes';

/**
 * Default implementation of the resume matching service
 * This service can be used for general job matching across industries
 */
export class MatchingService extends BaseMatchingService {
  // No need to redeclare azureOpenAIClient as it's already in the base class
  
  constructor() {
    super();
    // Base class already initializes the OpenAI client
  }
  
  /**
   * Perform vector search for resumes
   * @param queryEmbedding Embedding vector to search with
   * @param topK Number of top results to return
   * @returns Search results
   */
  protected async performVectorSearch(queryEmbedding: number[], topK: number = 5): Promise<any[]> {
    try {
      // Execute the search with vector query using vectorSearchOptions pattern from the JavaScript example
      const searchResults = await this.searchClient.search(
        "",
        {
          vectorSearchOptions: {
            queries: [
              { 
                kind: "vector",
                vector: queryEmbedding, 
                fields: ["embedding"], 
                kNearestNeighborsCount: topK 
              }
            ]
          },
          select: ["id", "name", "summary", "skills", "experience", "education"],
          filter: "document_type eq 'resume'",  // Filter to only show resumes
          top: topK
        }
      );
      
      // Process results
      const results: any[] = [];
      for await (const result of searchResults.results) {
        results.push({
          id: result.document.id,
          name: result.document.name || "Unknown Candidate",
          summary: result.document.summary || "",
          skills: result.document.skills || [],
          experience: result.document.experience || "",
          education: result.document.education || "",
          score: result.score,
          document: result.document
        });
      }
      
      return results;
    } catch (error) {
      console.error("Error performing vector search:", error);
      throw new Error(`Failed to perform vector search: ${error}`);
    }
  }
  
  /**
   * Perform hybrid search (vector + keyword) for resumes
   * @param queryText Text query
   * @param queryEmbedding Embedding vector
   * @param topK Number of top results to return
   * @returns Search results
   */
  protected async performHybridSearch(queryText: string, queryEmbedding: number[], topK: number = 5): Promise<any[]> {
    try {
      // Execute the search with both text and vector components using vectorSearchOptions
      const searchResults = await this.searchClient.search(
        queryText,
        {
          queryType: "semantic",
          semanticSearchOptions: {
            configurationName: "semanticConfig"
          },
          vectorSearchOptions: {
            queries: [
              {
                kind: "vector",
                vector: queryEmbedding,
                fields: ["embedding"],
                kNearestNeighborsCount: topK
              }
            ]
          },
          select: ["id", "name", "summary", "skills", "experience", "education"],
          filter: "document_type eq 'resume'",  // Filter to only show resumes
          top: topK
        }
      );
      
      // Process results
      const results: any[] = [];
      for await (const result of searchResults.results) {
        results.push({
          id: result.document.id,
          name: result.document.name || "Unknown Candidate",
          summary: result.document.summary || "",
          skills: result.document.skills || [],
          experience: result.document.experience || "",
          education: result.document.education || "",
          score: result.score,
          semanticScore: result.rerankerScore, // Semantic score if available
          document: result.document
        });
      }
      
      return results;
    } catch (error) {
      console.error("Error performing hybrid search:", error);
      throw new Error(`Failed to perform hybrid search: ${error}`);
    }
  }
  
  /**
   * Analyze a job description to extract key requirements
   * @param jobDescription The job description to analyze
   * @returns Analysis of job requirements
   */
  public async analyzeJobDescription(jobDescription: string): Promise<any> {
    try {
      // Load the job analyzer system prompt
      const systemPromptPath = path.join(__dirname, '../prompts/industry_job_analyzer.system.txt');
      const systemPrompt = await fs.readFile(systemPromptPath, 'utf-8');
      
      const format = zodTextFormat(JobAnalysisResponseSchema, "job_analysis");

      // Use Azure OpenAI to analyze the job
      const response = await this.azureOpenAIClientWrapper.performReasoning(systemPrompt, jobDescription, format);
      const parsed = response?.output_parsed || response;
      
      return parsed;
    } catch (error) {
      console.error("Error analyzing job description:", error);
      throw new Error(`Failed to analyze job description: ${error}`);
    }
  }
  
  /**
   * Get the total number of candidate resumes in the database
   * @returns Total number of candidates
   */
  private async getTotalCandidateCount(): Promise<number> {
    try {
      // Using countDocuments instead of count
      const results = await this.searchClient.search("*", {
        filter: "document_type eq 'resume'",
        top: 0, // We just want count, not actual results
        includeTotalCount: true
      });
      
      return results.count || 0;
    } catch (error) {
      console.error("Error counting candidates:", error);
      return 0; // Return 0 if count fails
    }
  }
  
  /**
   * Generate a recommendation explaining why the top candidate is the best match
   * @param topCandidates Top ranked candidates
   * @param jobDescription The original job description
   * @param jobAnalysis Analyzed job requirements
   * @returns Recommendation text
   */
  private async generateBestMatchRecommendation(
    topCandidates: any[],
    jobDescription: string,
    jobAnalysis: any
  ): Promise<string> {
    if (!topCandidates.length) return "";
    
    try {
      // Load the best match explainer system prompt
      const systemPromptPath = path.join(__dirname, '../prompts/best_match_explainer.system.txt');
      let systemPrompt = await fs.readFile(systemPromptPath, 'utf-8').catch(() => {
        // If file doesn't exist, use a default prompt
        return `You are an AI talent matching expert. Your task is to explain why the top candidate is the best match for the job, or if multiple candidates are strong contenders, explain the similarities and differences. Focus on key strengths, critical qualifications, and what sets the top candidate(s) apart.`;
      });
      
      const userMessageContent = JSON.stringify({
        description: "This object contains the top candidates, their match analyses, the job description, and job requirements analysis.",
        jobDescription,
        jobAnalysis,
        topCandidates: topCandidates.map(c => ({
          candidateName: c.candidateName,
          overallScore: c.matchAnalysis.overallMatch,
          strengths: {
            technicalSkills: c.matchAnalysis.technicalSkillsMatch?.strengths || [],
            experience: c.matchAnalysis.experienceMatch?.strengths || [],
            education: c.matchAnalysis.educationMatch?.strengths || []
          },
          summary: c.matchAnalysis.summary
        }))
      });
      
      // Get recommendation from LLM
      const response = await this.azureOpenAIClientWrapper.performReasoning(
        systemPrompt,
        userMessageContent
      );
      
      return response?.text || response?.output_parsed?.text || response || "";
      
    } catch (error) {
      console.error("Error generating best match recommendation:", error);
      return `The top candidate has an overall match score of ${topCandidates[0]?.matchAnalysis?.overallMatch || 'N/A'}.`;
    }
  }
  
  /**
   * Match resumes to a job description
   * @param jobDescription The job description to match resumes against
   * @param options Matching options including weights for various factors
   * @returns A structured response with matches, best match recommendation, and metadata
   */
  public async matchResumes(jobDescription: string, options?: MatchingOptions): Promise<ResumeMatchingResponse> {
    try {
      const startTime = Date.now();
      const useHybridSearch = options?.useHybridSearch ?? true;
      const topK = options?.topResults ?? 10;
      const industryType = options?.industryType ?? 'general';
      
      // First, analyze the job description
      const jobAnalysis = await this.analyzeJobDescription(jobDescription);
      const parsedjobAnalysis = jobAnalysis?.output_parsed || jobAnalysis;
      
      // Generate embedding for the job description
      const jobEmbedding = await this.azureOpenAIClientWrapper.generateEmbedding(jobDescription);
      
      // Perform search using the chosen method
      let searchResults;
      if (useHybridSearch) {
        searchResults = await this.performHybridSearch(jobDescription, jobEmbedding, topK);
      } else {
        searchResults = await this.performVectorSearch(jobEmbedding, topK);
      }
      
      if (!searchResults || searchResults.length === 0) {
        return {
          matches: [],
          metadata: {
            totalCandidatesScanned: 0,
            processingTimeMs: Date.now() - startTime,
            searchStrategy: useHybridSearch ? 'hybrid' : 'vector'
          }
        };
      }
      
      // Load the resume matcher system prompt
      const systemPromptPath = path.join(__dirname, '../prompts/industry_resume_matcher.system.txt');
      const systemPrompt = await fs.readFile(systemPromptPath, 'utf-8');
      const resumeMatcherFormat = zodTextFormat(ResumeMatchSchema, "resume_match");
      
      // Create customized weights based on industry type or specified weights
      const weights = {
        experience: options?.customWeights?.["experience"] ?? 0.3,
        technicalSkills: options?.customWeights?.["technicalSkills"] ?? 0.3,
        certifications: options?.customWeights?.["certifications"] ?? 0.2,
        education: options?.customWeights?.["education"] ?? 0.2
      };
      
      // For each result, use Azure OpenAI to provide a detailed match analysis
      const matchPromises = searchResults.map(async (result) => {
        const resume = result.document;
        
        // Format prompt for detailed matching
        const userMessageContent = JSON.stringify({
          description: "This object contains the original job description, a structured analysis of the job requirements, the candidate's resume, and the matching options used for evaluation.",
          jobDescription,
          jobAnalysis: parsedjobAnalysis,
          resume,
          options: {
            weights,
            industryType
          }
        });
        
        // Get detailed match analysis
        const matchAnalysis = await this.azureOpenAIClientWrapper.performReasoning(systemPrompt, userMessageContent, resumeMatcherFormat);
        const parsedMatchAnalysis = matchAnalysis?.output_parsed || matchAnalysis;
        
        // Remove redundant fields if present
        if (parsedMatchAnalysis && typeof parsedMatchAnalysis === 'object') {
          delete parsedMatchAnalysis.resumeId;
          delete parsedMatchAnalysis.candidateName;
          delete parsedMatchAnalysis.searchScore;
        }
        
        return {
          resumeId: resume.id,
          candidateName: resume.name || "Anonymous Candidate",
          searchScore: result.score,
          matchAnalysis: parsedMatchAnalysis.matchAnalysis || parsedMatchAnalysis,
        };
      });
      
      const detailedMatches = await Promise.all(matchPromises);
      
      // Sort by overall match score
      const sortedMatches = detailedMatches.sort((a, b) => {
        if (a.matchAnalysis && b.matchAnalysis) {
          return b.matchAnalysis.overallMatch - a.matchAnalysis.overallMatch;
        }
        return b.searchScore - a.searchScore;
      });
      
      // Generate best match recommendation if we have matches
      let bestMatch = undefined;
      if (sortedMatches.length > 0) {
        // Only look at top 3 (or fewer) candidates for best match analysis
        const topCandidates = sortedMatches.slice(0, Math.min(3, sortedMatches.length));
        const recommendation = await this.generateBestMatchRecommendation(
          topCandidates,
          jobDescription,
          parsedjobAnalysis
        );
        
        bestMatch = {
          candidateId: sortedMatches[0].resumeId,
          candidateName: sortedMatches[0].candidateName,
          recommendation
        };
      }
      
      // Get total candidate count for metadata
      const totalCandidates = await this.getTotalCandidateCount();
      
      // Prepare complete response
      return {
        matches: sortedMatches,
        bestMatch,
        metadata: {
          totalCandidatesScanned: totalCandidates,
          processingTimeMs: Date.now() - startTime,
          searchStrategy: useHybridSearch ? 'hybrid' : 'vector'
        }
      };
    } catch (error) {
      console.error("Error matching resumes:", error);
      throw new Error(`Failed to match resumes: ${error}`);
    }
  }
}
