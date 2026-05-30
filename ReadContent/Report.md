# Evidentia: Digital Evidence Vault - In-Depth Technical Report

## 1. Executive Summary
**Evidentia** represents a paradigm shift in Digital Evidence Management (DEM). Traditional systems rely solely on relational databases, which are vulnerable to administrative manipulation or unauthorized access. Evidentia mitigates these risks by anchoring every digital artifact's "identity" (its cryptographic hash) onto a decentralized ledger (Polygon Blockchain). This technical report provides a comprehensive breakdown of the application's architecture, security protocols, and implementation details.

---

## 2. Advanced Technical Stack

### A. Core Frontend Architecture
The application is built on **React 18** using **Vite** for optimized build cycles. The state management is localized using the **Context API** (`AppContext.tsx`), which synchronizes data across the Dashboard, Evidence Details, and Verification modules.

- **Animation Engine**: We leveraged `framer-motion` for complex keyframe animations. Specifically, the "Cinematic Login" sequence utilizes staggered `AnimatePresence` phases to create a high-stakes, authoritative landing page.
- **Typography & Theme**: The "Brutalist-Cyber" aesthetic is achieved via **Tailwind CSS**. We used a palette of deep grays (`#0a0a0b`), neon cyan highlights (`#00f0ff`), and monochromatic typography to simulate a high-security government terminal.

### B. Scalable Cloud Backend (Supabase)
Supabase acts as the heart of the system, providing three critical services:
1. **PostgreSQL Database**: Stores evidence metadata, case history, and audit logs.
2. **Supabase Storage**: A globally distributed object store where evidence files are kept in private buckets accessible only through signed URLs.
3. **Supabase Auth**: Implements secure, JWT-based authentication. The system is designed to reject any operation from unauthenticated or unverified users.

### C. Blockchain Integrity Layer (Polygon/Ethereum)
For the "Truth Anchor," we use the **Polygon PoS** network. Polygon was selected for its EVM compatibility, high throughput, and low gas fees, making it economically viable for registering thousands of evidence records. We use **Ethers.js** as the bridge between the React frontend and the smart contract.

---

## 3. Detailed Logic & Code Explanations

### I. Cryptographic Fingerprinting (The Hashing Protocol)
When an officer uploads a file, it is never stored "blindly." The system first generates a unique digital fingerprint.

**Technical Implementation:**
We utilize the browser's native `Crypto.subtle` API. This ensures that the hashing happens locally on the device before the file even touches the network, providing high security and privacy.

```typescript
// Located in src/services/hashService.ts
export async function generateHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // We use SHA-256 for its optimal balance of security and speed
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert the binary buffer to a hex string for storage and contract interaction
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
```
**Why SHA-256?** It produces a 256-bit (32-byte) hash. Even a single bit change in the original 100GB video file will result in a completely different 64-character hex string, making tampering instantly detectable.

### II. Blockchain Registration (The Anchor)
The most critical part of the "Chain of Custody" is the blockchain transaction. This creates an immutable, timestamped record of the file's existence.

**Technical Implementation:**
In `blockchainService.ts`, we interface with a deployed `EvidenceVault` smart contract.

```typescript
// Explaining the registration logic
export const registerOnBlockchain = async (evidenceId: string, hash: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  // The 'registerEvidence' method on-chain stores: mapping(bytes32 => Record)
  // We convert the hex hash string to bytes32 format for the EVM
  const tx = await contract.registerEvidence(evidenceId, "0x" + hash);
  const receipt = await tx.wait(); // Wait for block confirmation
  return receipt.hash; // This is the Transaction ID (TXID)
};
```
By storing the hash on-chain, we ensure that even if a technician with "Super Admin" rights modifies the file in Supabase Storage, they cannot modify the hash on the Polygon blockchain. Any subsequent verification attempt will flag the discrepancy.

### III. The Verification Algorithim (Chain of Trust)
The `Verify.tsx` component is a forensic interface. It doesn't just "check" the database; it reconstructs the proof from scratch.

**The Three-Step Verification Process:**
1. **Local Reconstruction**: If a physical file is uploaded for verification, the system re-calculates the SHA-256 hash in the browser.
2. **Metadata Retrieval**: The system fetches the "Official Hash" from the Supabase PostgreSQL table.
3. **On-Chain Audit**: The system calls `contract.getEvidence(evidenceId)` to retrieve the hash directly from the Blockchain node.
4. **Final Consensus**:
   - `Hash(Local File) == Hash(Database) == Hash(Blockchain)` -> **VERIFIED**
   - If any of these differ -> **TAMPER DETECTED**

---

## 4. Database Schema & Relational Structure

The PostgreSQL schema is optimized for auditability and search performance.

### `evidence` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary key, also used as the external Digital Evidence ID. |
| `title` | TEXT | Human-readable title of the artifact. |
| `case_id` | TEXT | The associated police case number (e.g., CASE-2024-001). |
| `file_hash` | TEXT | The primary SHA-256 digital fingerprint. |
| `file_url` | TEXT | The path to the file in Supabase Storage. |
| `blockchain_tx`| TEXT | The unique transaction ID on the Polygon network. |
| `status` | ENUM | current state: `pending`, `verified`, or `tampered`. |

### `logs` Table
Every action creates a row in the `logs` table. This provides a non-extinguishable "Audit Trail."
- **Fields**: `userId`, `action` (UPLOAD/VERIFY/VIEW), `timestamp`, `details` (JSONB).
- **Security**: The logs table is strictly append-only; users cannot delete logs once they are created.

---

## 5. Security & Risk Management

### A. Protection Against "Internal Account" Errors
A common error in blockchain development is attempting to send data transactions to personal wallets instead of contracts. We implemented a robust guard in `blockchainService.ts` to catch these miscofigurations:
```typescript
if (error.message.includes('internal accounts cannot include data')) {
  throw new Error('Misconfiguration: Ensure VITE_CONTRACT_ADDRESS is a Contract, not a Wallet.');
}
```

### B. Authentication Hardening
We use Supabase Row-Level Security (RLS) to ensure that:
1. Users can only see evidence associated with their department.
2. Only "Superior Officers" can initiate deletion or archiving of files.
3. Every API call is verified against the `request.auth.uid` of the active session.

---

## 6. UI/UX Philosophy: The "Command Center"
We designed the UI to feel like a **Mission-Critical Dashboard**. 
- **Department Reveal**: The login page transition is timed specifically to command respect for the Department of Ministry of Home Affairs and NCRB.
- **Dynamic File Icons**: Using `lucide-react`, we built a mapping function that detects MIME types and file extensions (MP4, JPG, PDF) to give officers instant visual feedback on file category.
- **Glitch Effect**: In the `Verify` page, we use CSS animations for a "Scrambled Data" look when a tamper is detected, psychologically reinforcing the seriousness of the integrity breach.

---

## 7. Future Roadmap
- **AI-Powered Transcription**: Automated OCR and Video-to-Text for evidence indexing.
- **Multi-Chain Redundancy**: Simultaneously anchoring hashes to Polygon and Ethereum Mainnet for extreme durability.
- **Biometric Integration**: Tying upload actions to physical fingerprint scanners or facial recognition via WebAuthn.
