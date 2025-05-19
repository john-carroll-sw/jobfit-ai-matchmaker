import { BaseMatchingService } from "./baseMatchingService";
import { zodTextFormat } from "openai/helpers/zod";
import fs from "fs/promises";
import path from "path";
import { MatchingOptions, ResumeMatchSchema, JobAnalysisResponseSchema } from '@jobfit-ai/shared';

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
   * Match resumes to a job description
   * @param jobDescription The job description to match resumes against
   * @param options Matching options including weights for various factors
   * @returns A list of resume matches with scores and explanations
   */
  public async matchResumes(jobDescription: string, options?: MatchingOptions): Promise<any[]> {
    try {
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
        return [];
      }
      
      // Load the resume matcher system prompt
      const systemPromptPath = path.join(__dirname, '../prompts/industry_resume_matcher.system.txt');
      const systemPrompt = await fs.readFile(systemPromptPath, 'utf-8');
      const format = zodTextFormat(ResumeMatchSchema, "resume_match");
      
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
        const matchAnalysis = await this.azureOpenAIClientWrapper.performReasoning(systemPrompt, userMessageContent, format);
        const parsedMatchAnalysis = matchAnalysis?.output_parsed || matchAnalysis;
        
        return {
          resumeId: resume.id,
          candidateName: resume.name || "Anonymous Candidate",
          searchScore: result.score,
          matchAnalysis: parsedMatchAnalysis,
        };
      });
      
      const detailedMatches = await Promise.all(matchPromises);
      
      // Sort by overall match score
      return detailedMatches.sort((a, b) => {
        if (a.matchAnalysis && b.matchAnalysis) {
          return b.matchAnalysis.overallMatch - a.matchAnalysis.overallMatch;
        }
        return b.searchScore - a.searchScore;
      });
    } catch (error) {
      console.error("Error matching resumes:", error);
      throw new Error(`Failed to match resumes: ${error}`);
    }
  }
}
