import OpenAI, { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import { z } from "zod";
import { zodResponseFormat, zodTextFormat } from "openai/helpers/zod";

dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const modelName = process.env.AZURE_OPENAI_MODEL || "o4-mini";
if (!modelName) throw new Error("AZURE_OPENAI_MODEL is required");
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

const options = { endpoint, apiKey, deployment, apiVersion };
export const AzureOpenAIClient = new AzureOpenAI(options);

export const ReasoningResponse = z.object({
  reasoning: z.string(),
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
});

export async function performReasoning(
  systemMessage: string, 
  userMessage: string, 
  format?: any
): Promise<any> {
  const options: any = {
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    input: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ]
  };
  
  // Only add text format if one is provided
  if (format) {
    options.text = { format };
  }
  
  const response = await AzureOpenAIClient.responses.parse(options);

  if (response.error){
    console.error("Error in Azure OpenAI response:", response.error);
    throw new Error("Failed to parse reasoning response");
  }
  
  return response
}