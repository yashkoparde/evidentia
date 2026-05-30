import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { ArmorIQClient } from '@armoriq/sdk';

// Initialize AI and ArmorIQ
let ai: GoogleGenAI | null = null;
let armoriqClient: ArmorIQClient | null = null;

function getAIClient() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
    }
    ai = new GoogleGenAI({ apiKey: key || 'placeholder' });
  }
  return ai;
}

function getArmorIQClient() {
  if (!armoriqClient) {
    const apiKey = process.env.VITE_ARMORIQ_API_KEY || process.env.ARMORIQ_API_KEY || "ak_default_placeholder";
    const userId = process.env.VITE_ARMORIQ_USER_ID || process.env.ARMORIQ_USER_ID || "evidentia-user";
    const agentId = process.env.VITE_ARMORIQ_AGENT_ID || process.env.ARMORIQ_AGENT_ID || "evidentia-forensic-agent";

    armoriqClient = new ArmorIQClient({
      apiKey,
      userId,
      agentId,
      contextId: 'evidentia-default',
    });
  }
  return armoriqClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Analyze Evidence Metadata
  app.post("/api/analyze-evidence", async (req, res) => {
    try {
      const { metadata } = req.body;
      const aiClient = getAIClient();
      const armoriq = getArmorIQClient();

      const prompt = `
        Analyze the following digital evidence metadata:
        ${JSON.stringify(metadata, null, 2)}
        
        Provide a JSON response with:
        - summary: A brief forensic observation summary.
        - riskScore: 0 to 100 based on likelihood of tampering or sensitivity.
        - observations: A string array of key forensic anomalies or details.
        - fileType: A refined classification.
      `;

      // ArmorIQ Plan Capture
      const planDefinition = {
        goal: 'Analyze evidence metadata forensically',
        steps: [
          {
            action: 'generate_forensic_insights',
            tool: 'gemini-3-flash-preview',
            inputs: { hash: metadata.hash }
          }
        ]
      };
      
      const planCapture = armoriq.capturePlan('gemini-3-flash-preview', prompt, planDefinition);
      const intentToken = await armoriq.getIntentToken(planCapture);
      console.log("[ArmorIQ] Execution plan captured with intent token:", intentToken?.tokenId || intentToken);

       const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });

      const textOutput = response.text;
      let result;
      try {
        result = JSON.parse(textOutput || "{}");
      } catch (e) {
        // Fallback cleanup if model returns markdown wrapped json
        const cleanJson = textOutput?.replace(/```json/g, '').replace(/```/g, '') || '{}';
        result = JSON.parse(cleanJson);
      }
      
      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing evidence:', error);
      res.status(500).json({ error: error.message || 'Analysis failed' });
    }
  });

  // API Route: Summarize Log Action
  app.post("/api/summarize-log", async (req, res) => {
    try {
      const { action } = req.body;
      const aiClient = getAIClient();
      const armoriq = getArmorIQClient();

      const prompt = `
        Summarize this system audit log action securely and professionally in 1 sentence.
        Action context: "${action}"
        Return ONLY the summary text.
      `;

      // ArmorIQ Plan Capture
      const planDefinition = {
        goal: 'Summarize audit log securely',
        steps: [
          {
            action: 'generate_log_summary',
            tool: 'gemini-3-flash-preview',
            inputs: { action }
          }
        ]
      };
      
      const planCapture = armoriq.capturePlan('gemini-3-flash-preview', prompt, planDefinition);
      const intentToken = await armoriq.getIntentToken(planCapture);
      console.log("[ArmorIQ] Log summary plan captured with intent:", intentToken?.tokenId || intentToken);

      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      res.json({ result: response.text || '' });
    } catch (error: any) {
      console.error('Error summarizing log:', error);
      res.status(500).json({ error: error.message || 'Log summarization failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
