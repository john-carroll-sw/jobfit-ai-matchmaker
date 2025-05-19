import { AzureOpenAIClientWrapper } from "./azureOpenAIClientWrapper";
import { AzureKeyCredential, SearchClient } from "@azure/search-documents";
import { DefaultAzureCredential } from "@azure/identity";
import { MatchingOptions, ResumeMatchingResponse } from "@jobfit-ai/shared";

/**
 * Industry-agnostic interface for resume matching services
 */
export interface IMatchingService {
  /**
   * Analyzes a job description for requirements and criteria
   * @param jobDescription The job description text
   * @returns Analysis of the job requirements
   */
  analyzeJobDescription(jobDescription: string): Promise<any>;
  
  /**
   * Matches resumes to a job description based on specified options
   * @param jobDescription The job description to match resumes against
   * @param options Matching configuration options
   * @returns A structured response with matches, best match recommendation, and metadata
   */
  matchResumes(jobDescription: string, options?: MatchingOptions): Promise<ResumeMatchingResponse>;
}

/**
 * Base class with common functionality for resume matching services
 */
export abstract class BaseMatchingService implements IMatchingService {
  protected searchClient: SearchClient<any>;
  protected azureOpenAIClientWrapper: AzureOpenAIClientWrapper;
  protected endpoint: string;
  protected apiKey?: string;
  protected indexName: string;
  
  constructor() {
    // Initialize Azure AI Search client
    this.endpoint = process.env.AZURE_SEARCH_ENDPOINT || "";
    this.apiKey = process.env.AZURE_SEARCH_KEY;
    this.indexName = process.env.AZURE_SEARCH_INDEX || "vector-index";
    
    if (!this.endpoint) {
      throw new Error("AZURE_SEARCH_ENDPOINT environment variable is required");
    }
    
    this.searchClient = new SearchClient(
      this.endpoint,
      this.indexName,
      this.apiKey ? new AzureKeyCredential(this.apiKey) : new DefaultAzureCredential()
    );
    
    // Initialize Azure OpenAI Client
    this.azureOpenAIClientWrapper = new AzureOpenAIClientWrapper();
  }
  
  /**
   * Perform vector search for resumes
   * @param queryEmbedding Embedding vector to search with
   * @param options Search options
   * @returns Search results
   */
  protected async performVectorSearch(queryEmbedding: number[], topK: number = 5): Promise<any[]> {
    // Implementation will depend on your Azure Search setup
    // This is a placeholder for the actual vector search implementation
    throw new Error("Method not implemented - should be overridden by subclass");
  }
  
  /**
   * Perform hybrid search (vector + keyword) for resumes
   * @param queryText Text query
   * @param queryEmbedding Embedding vector
   * @param options Search options
   * @returns Search results
   */
  protected async performHybridSearch(queryText: string, queryEmbedding: number[], topK: number = 5): Promise<any[]> {
    // Implementation will depend on your Azure Search setup
    // This is a placeholder for the actual hybrid search implementation
    throw new Error("Method not implemented - should be overridden by subclass");
  }
  
  /**
   * Analyze a job description - abstract method to be implemented by industry-specific services
   */
  public abstract analyzeJobDescription(jobDescription: string): Promise<any>;
  
  /**
   * Match resumes to a job description - abstract method to be implemented by industry-specific services
   */
  public abstract matchResumes(jobDescription: string, options?: MatchingOptions): Promise<ResumeMatchingResponse>;
}
