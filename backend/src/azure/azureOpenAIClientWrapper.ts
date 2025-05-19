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
  private client: AzureOpenAI;
  private deployment: string;
  
  /**
   * Create a new Azure OpenAI client wrapper
   * @param options Configuration options for the client
   */
  constructor(options?: {
    endpoint?: string;
    apiKey?: string;
    deployment?: string;
    apiVersion?: string;
  }) {
    const endpoint = options?.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    const modelName = process.env.AZURE_OPENAI_MODEL || "o4-mini";
    const deployment = options?.deployment || process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiKey = options?.apiKey || process.env.AZURE_OPENAI_API_KEY;
    const apiVersion = options?.apiVersion || process.env.AZURE_OPENAI_API_VERSION;
    
    if (!modelName) throw new Error("AZURE_OPENAI_MODEL is required");
    if (!deployment) throw new Error("AZURE_OPENAI_DEPLOYMENT is required");
    
    this.deployment = deployment;
    this.client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });
  }
  
  /**
   * Get the underlying AzureOpenAI client
   */
  getClient(): AzureOpenAI {
    return this.client;
  }
  
  /**
   * Generate embeddings for text
   * @param text Text to generate embeddings for
   * @returns Vector embedding
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.deployment,
      input: text
    });
    
    return response.data[0].embedding;
  }
  
  /**
   * Perform reasoning with the LLM using system and user messages
   * @param systemMessage The system message/prompt
   * @param userMessage The user message/query
   * @param format Optional format for structured output
   * @returns Parsed response
   */
  async performReasoning(
    systemMessage: string, 
    userMessage: string, 
    format?: any
  ): Promise<any> {
    const options: any = {
      model: this.deployment,
      input: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ]
    };
    
    // Only add text format if one is provided
    if (format) {
      options.text = { format };
    }
    
    const response = await this.client.responses.parse(options);

    if (response.error){
      console.error("Error in Azure OpenAI response:", response.error);
      throw new Error("Failed to parse reasoning response");
    }
    
    return response;
  }
}
