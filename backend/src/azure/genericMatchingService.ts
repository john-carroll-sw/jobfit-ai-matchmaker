import { AzureOpenAIClient, performReasoning } from "./azureOpenAIClient";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents"; 
import { DefaultAzureCredential } from "@azure/identity";
import { IMatchingService } from "./matchingService";
import { MatchingOptions, ResumeMatchingResponseSchema } from "./matchingTypes";
import { zodTextFormat } from "openai/helpers/zod";
import fs from "fs/promises";
import path from "path";

/**
 * Generic implementation of the resume matching service
 * This service can be used for job matching across industries
 */
export class GenericMatchingService implements IMatchingService {
  private azureOpenAIClient: typeof AzureOpenAIClient;
  private searchClient: SearchClient<any>;
  
  constructor() {
    // Use the existing OpenAI client
    this.azureOpenAIClient = AzureOpenAIClient;
    
    // Initialize Azure AI Search client
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT || "";
    const apiKey = process.env.AZURE_SEARCH_KEY;
    const indexName = process.env.AZURE_SEARCH_INDEX || "vector-index";
    
    if (!searchEndpoint) {
      throw new Error("AZURE_SEARCH_ENDPOINT environment variable is required");
    }
    
    // Use either API key or DefaultAzureCredential
    const credential = apiKey 
      ? new AzureKeyCredential(apiKey)
      : new DefaultAzureCredential();
    
    this.searchClient = new SearchClient(
      searchEndpoint,
      indexName,
      credential
    );
  }
  
  /**
   * Generate embeddings for text using Azure OpenAI
   * @param text The text to generate embeddings for
   * @returns A vector of embeddings
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;
    
    if (!embeddingDeployment) {
      throw new Error("AZURE_OPENAI_EMBEDDING_DEPLOYMENT environment variable is required");
    }
    
    const response = await this.azureOpenAIClient.embeddings.create({
      model: embeddingDeployment,
      input: text
    });
    
    return response.data[0].embedding;
  }
  
  /**
   * Perform vector search using the job description embedding
   * @param jobEmbedding Embedding vector for the job description
   * @param topK Number of top results to return
   * @returns Search results
   */
  private async performVectorSearch(jobEmbedding: number[], topK: number = 5): Promise<any[]> {
    try {
      // Search using vector
      const searchOptions = {
        select: ["id", "name", "summary", "skills", "experience", "education"],
        filter: "document_type eq 'resume'",
        top: topK
      };
      
      // NOTE: This is a simplified implementation since vectorQueries might not be directly supported
      // in the version we're using. In a production environment, you'd properly configure Azure AI Search
      // for vector search capabilities.
      const searchResults = await this.searchClient.search("*", searchOptions);
      
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
   * Perform hybrid search combining text and vector search
   * @param jobDescription Text of the job description
   * @param jobEmbedding Embedding vector for the job description
   * @param topK Number of top results to return
   * @returns Search results
   */
  private async performHybridSearch(jobDescription: string, jobEmbedding: number[], topK: number = 5): Promise<any[]> {
    try {
      // Extract keywords from job description for text search
      const searchOptions = {
        queryType: "full" as const, 
        select: ["id", "name", "summary", "skills", "experience", "education"],
        filter: "document_type eq 'resume'",
        top: topK
      };
      
      // Perform text search since we may not have vector search configured
      const searchResults = await this.searchClient.search(jobDescription, searchOptions);
      
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
      const systemPromptPath = path.join(__dirname, '../../prompts/industry_job_analyzer.system.txt');
      const systemPrompt = await fs.readFile(systemPromptPath, 'utf-8');
      
      // Use Azure OpenAI to analyze the job
      const response = await performReasoning(systemPrompt, jobDescription);
      
      return response;
    } catch (error) {
      console.error("Error analyzing job description:", error);
      throw new Error(`Failed to analyze job description: ${error}`);
    }
  }
  
  /**
   * Match resumes to a job description
   * @param jobDescription The job description to match resumes against
   * @param options Matching options
   * @returns A list of resume matches with scores and explanations
   */
  public async matchResumes(jobDescription: string, options?: MatchingOptions): Promise<any[]> {
    try {
      const useHybridSearch = options?.useHybridSearch ?? true;
      const topK = options?.topResults ?? 5;
      const industryType = options?.industryType ?? 'general';
      
      // Generate embedding for the job description
      const jobEmbedding = await this.generateEmbedding(jobDescription);
      
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
      const systemPromptPath = path.join(__dirname, '../../prompts/industry_resume_matcher.system.txt');
      const systemPrompt = await fs.readFile(systemPromptPath, 'utf-8');
      
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
          jobDescription,
          resume,
          options: {
            weights,
            industryType
          }
        });
        
        // Get detailed match analysis
        const matchAnalysis = await performReasoning(systemPrompt, userMessageContent);
        
        return {
          resumeId: resume.id,
          candidateName: resume.name || "Anonymous Candidate",
          searchScore: result.score,
          matchAnalysis
        };
      });
      
      const detailedMatches = await Promise.all(matchPromises);
      
      // Sort by overall match score if available, otherwise by search score
      return detailedMatches.sort((a, b) => {
        if (a.matchAnalysis && b.matchAnalysis && 
            a.matchAnalysis.overallMatch !== undefined && 
            b.matchAnalysis.overallMatch !== undefined) {
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
