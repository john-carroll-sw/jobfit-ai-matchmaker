import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const modelName = process.env.AZURE_OPENAI_MODEL;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

async function main() {
  try {
    const options = { endpoint, apiKey, deployment, apiVersion };
    const client = new AzureOpenAI(options);

    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "I am going to Paris, what should I see?" }
      ],
      max_completion_tokens: 1000,
      model: modelName
    });

    if (response?.error !== undefined && response.status !== "200") {
      throw response.error;
    }
    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("The sample encountered an error:", err);
  }
}

main();