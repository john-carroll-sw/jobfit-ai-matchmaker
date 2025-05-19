import { performReasoning as retrieveReasoningResponse } from "./azureOpenAIClientWrapper";
import fs from "fs/promises";

export async function performReasoning(input: { state: any; disruptions: any[]; optimizationPriority?: string }) {
  // Load prompts
  let systemMessage = await fs.readFile(
    __dirname + "/../../prompts/jobfit_ai_matchmaker.system.txt",
    "utf-8"
  );
  const userMessage = await fs.readFile(
    __dirname + "/../../prompts/jobfit_ai_matchmaker.user.txt",
    "utf-8"
  );
  // Inject optimization priority if provided
  if (input.optimizationPriority) {
    systemMessage += `\nThe user has prioritized ${input.optimizationPriority}. When generating recommendations, give significant weight to optimizing for ${input.optimizationPriority}.`;
  }
  // Fill in placeholders
  const userMessageWithContext = userMessage
    .replace("{{currentState}}", JSON.stringify(input.state, null, 2))
    .replace("{{disruptions}}", JSON.stringify(input.disruptions, null, 2));
  // Console logs for debugging
  console.log("[Azure OpenAI system message]", systemMessage);
  console.log("[Azure OpenAI user message]", userMessageWithContext);
  // Call OpenAI with structured output schema
  const result = await retrieveReasoningResponse(systemMessage, userMessageWithContext);
  console.log("[Azure OpenAI structured output]", result);
  return result;
}
