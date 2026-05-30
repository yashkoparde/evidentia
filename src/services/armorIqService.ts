import { ArmorIQClient, PlanCapture, IntentToken } from '@armoriq/sdk';

/**
 * ArmorIQ Service
 * Integrates ArmorIQ SDK for cryptographic intent verification of AI actions.
 */

// Define client instance
let armoriqClient: ArmorIQClient | null = null;

export const getArmorIQClient = (): ArmorIQClient => {
  if (armoriqClient) return armoriqClient;

  // Ensure API key matches SDK expected format: starts with ak_live_, ak_claw_, or ak_test_
  let apiKey = import.meta.env.VITE_ARMORIQ_API_KEY || "ak_test_evidentia_placeholder";
  if (!apiKey.startsWith("ak_live_") && !apiKey.startsWith("ak_claw_") && !apiKey.startsWith("ak_test_")) {
    apiKey = `ak_test_${apiKey}`;
  }
  const userId = import.meta.env.VITE_ARMORIQ_USER_ID || "evidentia-user";
  const agentId = import.meta.env.VITE_ARMORIQ_AGENT_ID || "evidentia-forensic-agent";

  try {
    armoriqClient = new ArmorIQClient({
      apiKey,
      userId,
      agentId,
      // Optional configurations based on ArmorIQ API
      contextId: 'evidentia-default',
    });
    return armoriqClient;
  } catch (error) {
    console.error("Failed to initialize ArmorIQClient:", error);
    throw error;
  }
};

/**
 * Helper to capture an AI execution plan and retrieve an intent token.
 */
export const captureAndGetIntent = async (
  llm: string,
  prompt: string,
  plan: any
): Promise<IntentToken | null> => {
  try {
    const client = getArmorIQClient();
    
    // 1. Capture Your Plan
    const planCapture = client.capturePlan(llm, prompt, plan);
    
    // 2. Get Intent Token
    const token = await client.getIntentToken(planCapture);
    return token;
  } catch (error) {
    console.error("ArmorIQ plan capture error:", error);
    return null;
  }
};

/**
 * Explanatory helper: Agent workflow in Evidentia
 * The AI Agent follows these steps:
 * 1. Analyzes the incoming evidence metadata (title, hash, description) using Gemini 3.
 * 2. Generates a risk score and observation JSON via `geminiService.ts`/`aiService.ts`.
 * 3. With ArmorIQ integration: The agent now cryptographically secures its intent using ArmorIQ SDK before calling external endpoints.
 */
export const explainAgentWorkflow = () => {
  return `
    Evidentia AI Agent Workflow:
    1. Evidence is submitted with title, description, content type, and SHA-256 Hash.
    2. The Agent calls Gemini (GoogleGenAI SDK) to analyze metadata.
    3. The prompt asks for a strict forensic analysis (JSON output: summary, risk score, observations).
    4. (ArmorIQ Step) The agent registers this plan with the ArmorIQ SDK to generate an Intent Token.
    5. Fallback scenarios map to a simulated system if the AI or Intent Verification services are offline.
  `;
};
