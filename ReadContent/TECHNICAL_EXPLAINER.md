# Evidentia Technical Protocol

## 1. Data Persistence Layer
Evidentia utilizes a multi-tiered storage approach:
- **Cloud Database:** Metadata is indexed via Supabase (PostgreSQL) for relational state management and real-time dashboard updates.
- **Secure File Storage:** Artifacts are persisted in private Supabase Storage buckets, structured by user identity to prevent cross-tenant access.
- **Blockchain Ledger:** The cryptographic fingerprint of every artifact is committed to a simulated Ethereum L2 layer via `blockchainService.ts`.

## 5. Secure Storage Protocol
Every artifact is stored using a strict directory pattern:
`${userId}/evidence/${evidenceId}/${evidenceId}.${extension}`

Key Security Features:
- **Tenant Isolation:** Users can only browse their own file paths at the storage layer.
- **Signed URL Resolution:** Direct access to private storage is prohibited. The terminal generates temporary (1-hour) signed URLs only when specific evidence is being inspected.
- **Synchronized Purge:** Deleting an evidence record automatically wipes the metadata from the database and the physical binary from storage.

## 2. Cryptographic Hashing Protocol
We implement the **SHA-256** algorithm via `CryptoJS`:
- **Input:** Raw File ArrayBuffer.
- **Output:** Hexadecimal unique identifier.
- **Purpose:** To create a "Point-in-Time" signature that is mathematically impossible to replicate with different data.

## 3. Decentralized Node Infrastructure
The UI reflects a distributed network of forensic agents:
- **Diagnostic Nodes:** Run Gemini AI models to analyze metadata for risk scores and forensic observations.
- **Ledger Nodes:** Ensure the chain of custody is synchronized across the decentralized network, making it impossible for a single actor to delete or alter evidence history.

## 4. AI Forensic Analysis
Powered by **Parikshak.ai** (Custom Gemini 1.5 Node), the AI doesn't just read tags—it performs heuristic analysis on:
- File structure anomalies.
- Metadata inconsistencies (e.g., timestamps that don't match the file type signature).
- Risk scoring based on common digital forgery patterns.
