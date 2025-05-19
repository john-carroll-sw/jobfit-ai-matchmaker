import OpenAI, { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import { z } from "zod";
import { zodResponseFormat, zodTextFormat } from "openai/helpers/zod";

dotenv.config();

/**
 * Azure OpenAI Client wrapper class
 * Provides a consistent interface for interacting with Azure OpenAI
 */
export class AzureOpenAIClientWrapper {
  private reasoningClient: AzureOpenAI;
  private embeddingClient: AzureOpenAI;
  private reasoningModelName: string;
  private embeddingModelName: string;
  
  /**
   * Create a new Azure OpenAI client wrapper
   * @param options Configuration options for the client
   */
  constructor(options?: {
    endpoint?: string;
    apiKey?: string;
    modelDeploymentName?: string;
    embeddingModelName?: string;
    apiVersion?: string;
  }) {
    // Reasoning model config
    const reasoningEndpoint = options?.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    const reasoningApiKey = options?.apiKey || process.env.AZURE_OPENAI_API_KEY;
    const reasoningDeployment = options?.modelDeploymentName || process.env.AZURE_OPENAI_DEPLOYMENT || "o4-mini";
    const reasoningApiVersion = options?.apiVersion || process.env.AZURE_OPENAI_API_VERSION;

    // Embedding model config
    const embeddingEndpoint = process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT || reasoningEndpoint;
    const embeddingApiKey = process.env.AZURE_OPENAI_EMBEDDING_API_KEY || reasoningApiKey;
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-3-large";
    const embeddingApiVersion = process.env.AZURE_OPENAI_EMBEDDING_API_VERSION || reasoningApiVersion;

    if (!reasoningDeployment) throw new Error("AZURE_OPENAI_DEPLOYMENT is required");
    if (!embeddingDeployment) throw new Error("AZURE_OPENAI_EMBEDDING_DEPLOYMENT is required");

    this.reasoningModelName = reasoningDeployment;
    this.embeddingModelName = embeddingDeployment;
    this.reasoningClient = new AzureOpenAI({ endpoint: reasoningEndpoint, apiKey: reasoningApiKey, deployment: reasoningDeployment, apiVersion: reasoningApiVersion });
    this.embeddingClient = new AzureOpenAI({ endpoint: embeddingEndpoint, apiKey: embeddingApiKey, deployment: embeddingDeployment, apiVersion: embeddingApiVersion });
  }
  
  /**
   * Get the underlying AzureOpenAI client
   */
  getClient(): AzureOpenAI {
    return this.reasoningClient;
  }
  
  /**
   * Generate embeddings for text
   * @param text Text to generate embeddings for
   * @returns Vector embedding
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.embeddingClient.embeddings.create({
      model: this.embeddingModelName,
      input: text
    });
    
    return response.data[0].embedding;
  }
  
  /**
   * Perform reasoning with the LLM using system and user messages
   * @param systemMessage The system message/prompt
   * @param userMessage The user message/query
   * @param format Required format for structured output
   * @returns Parsed response
   */
  async performReasoning(
    systemMessage: string, 
    userMessage: string, 
    format: any
  ): Promise<any> {
    const options: any = {
      model: this.reasoningModelName,
      input: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      text: { format }
    };
    
    const response = await this.reasoningClient.responses.parse(options);

    if (response.error){
      console.error("Error in Azure OpenAI response:", response.error);
      throw new Error("Failed to parse reasoning response");
    }
    
    return response;
  }
}
