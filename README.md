# Evidentia: Secure Ledger & Digital Evidence Intelligence
# <img src="https://img.icons8.com/isometric/50/000000/fingerprint.png" width="32"/> Evidentia: Digital Evidence Vault

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Polygon](https://img.shields.io/badge/Polygon-Mainnet-8247E5?style=for-the-badge&logo=polygon&logoColor=white)](https://polygon.technology/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/Security-Government_Grade-red?style=for-the-badge)](https://github.com/)
Evidentia is a next-generation Digital Evidence Management System (DEMS) designed to ensure absolute chain-of-custody, forensic analysis verification, and mathematical proof of data integrity. 

By bridging high-performance Web3 blockchain anchoring with cloud persistence, and pairing it with secure AI-driven forensic analysis protected by the **ArmorIQ API Framework**, Evidentia eliminates the vulnerability of inside-administrator tampering in modern evidence registries.

---

## Technical Architecture Overview

Traditional evidence registers are vulnerable to the "Trust Paradox"—if database administrators can modify rows, how does a court prove the records are pure? Evidentia solves this using a two-tier cryptographic anchor:

1. **Polygon Blockchain Fingerprint**: An immutable on-chain record that permanently nails down the original hash of each file during intake.
2. **ArmorIQ Security Layer**: A cryptographic AI intent and execution-verification pipeline that safeguards AI-assisted audits. This prevents any system prompt-injection, manipulation, or unauthorized AI evaluation of forensic assets.

```
+---------------------------------------------------------------------------------+
|                                 EVIDENTIA REGISTRY                              |
+---------------------------------------------------------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
             [ Polygon Blockchain ]               [ ArmorIQ Protected AI ]
             * Unalterable Proof of Hash          * Secure Plan Capture
             * Public Ledger Timestamp            * Cryptographic Intent Token
             * Verifiable State Consensus         * Verified Gemini Analysis
```

---

## ArmorIQ Security Integration & Purpose

AI models like Gemini provide unparalleled automated forensic observations. However, using AI in judicial or legal applications introduces major risks: prompt hijacking, malicious log alterations, or execution-state tampering.

Evidentia completely mitigates this by integrating the **ArmorIQ Software Development Kit (SDK)** directly inside its backend API.

### The Guarded Execution Loop

When an officer triggers a metadata analysis or system audit summary, the system does not communicate directly with the LLM. Instead, it routes through the following protected state machine:

```
[Request Received] 
        |
        +---> 1. Define Execution Plan Boundary (Goal, Steps, Tools, Inputs)
        |
        +---> 2. Invoke `armoriqClient.capturePlan(...)`
        |
        +---> 3. Negotiate Plan Security and Obtain `Intent Token` from ArmorIQ
        |
        +---> 4. Securely Forward Plan to Gemini API (gemini-3-flash-preview)
        |
        +---> 5. Execute, Verify, and Hydrate the Live Evidence UI dashboard
```

### Detailed Code Pattern

Below is the verified implementation pattern deployed in our production API gateway (`server.ts`):

```typescript
import { ArmorIQClient } from '@armoriq/sdk';
import { GoogleGenAI } from "@google/genai";

const armoriq = new ArmorIQClient({
  apiKey: process.env.ARMORIQ_API_KEY,
  userId: "evidentia-user",
  agentId: "evidentia-forensic-agent",
  contextId: "evidentia-default"
});

// Defining the rigid forensic intent
const planDefinition = {
  goal: 'Analyze evidence metadata forensically',
  steps: [{
    action: 'generate_forensic_insights',
    tool: 'gemini-3-flash-preview',
    inputs: { hash: metadata.hash }
  }]
};

// Cryptographic plan locking before transmitting raw context to LLM
const planCapture = armoriq.capturePlan('gemini-3-flash-preview', promptText, planDefinition);
const intentToken = await armoriq.getIntentToken(planCapture);
```

### Benefits of the ArmorIQ Framework in Evidentia
* **No Unauthorized Scope Escalation**: The LLM is restricted strictly to the defined actions within the verified plan.
* **Audit Authenticity**: Every single automated forensic summary is bound to a unique `intentToken` stored inside our logs, certifying that the AI summary was not tampered with post-facto.
* **Verifiable Chain of Thought**: Provides forensic examiners with absolute certainty over what data the AI model processed and how it arrived at its risk metrics.

---

## High-Integrity Features

### Universal Secure Link & QR Decoder
Instead of navigating menus manually, external validators can input secure links or scan generated QR tags. The decoding unit unpacks secure UUID markers, references the smart contract registry, and automatically redirects the portal window directly to the corresponding immutable record.

### Real-Time Forensic Diagnostics
A dual-tier visual dashboard displays matching indicators between the local client upload, database metadata, and the blockchain ledger contract state. Color-coded risk metrics and structured forensic briefings are dynamically populated by our secure Gemini engine.

---

## Core Technologies

* **Core Runtime**: Vite, React 18, TypeScript
* **State & Flow**: Framer Motion
* **Decentralized Anchoring**: Polygon Testnet/Mainnet via Web3 contract bindings
* **Identity & Authentication**: JWT-based Secure Officer Login
* **Security & Guarding**: ArmorIQ SDK
* **Intelligent Summary Engine**: Gemini 3 Flash Preview via server-side proxying

---

## System Configuration & Setup

### Requirements
Ensure Node.js 18 or above is installed on your local environment.

### Environment Schema
To enable full high-integrity verification services, configure the following environment properties inside your `.env` configuration:

```env
# Database Credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Decentralized Network Parameters
VITE_CONTRACT_ADDRESS=0x...
VITE_BLOCKCHAIN_RPC_URL=https://polygon-mainnet.infura.io/v3/...

# Secure AI & Guarding Keys
GEMINI_API_KEY=AIzaSy...
ARMORIQ_API_KEY=ak_...
```

### Setup Execution

Compile and start the dual-end application using the commands:

```bash
# Initialize dependency workspace
npm install

# Build static assets & compile ES backend server
npm run build

# Direct standalone local execution
npm run start
```

---

## Compliance and Security Statement
This digital environment is engineered for strict chain-of-custody enforcement. Unauthorized configurations, log suppression, or attempts to bypass the ArmorIQ secure AI capture layer will immediately flag verification deficits across our decentralized validator consensus.
