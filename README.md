# <img src="https://img.icons8.com/isometric/50/000000/fingerprint.png" width="32"/> Evidentia: Digital Evidence Vault

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Polygon](https://img.shields.io/badge/Polygon-Mainnet-8247E5?style=for-the-badge&logo=polygon&logoColor=white)](https://polygon.technology/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/Security-Government_Grade-red?style=for-the-badge)](https://github.com/)

> **Mission-Critical Integrity.** Evidentia is a next-generation Digital Evidence Management System (DEMS) architected for the **National Crime Records Bureau (NCRB)**. It bridges the gap between cloud storage accessibility and blockchain-backed immutability.

---

## Technical Vision

Traditional evidence management is plagued by the "Trust Paradox"—how can we prove a file hasn't been modified by its own administrators? Evidentia solves this by generating a **Cryptographic Fingerprint (SHA-256)** at the moment of upload and anchoring it to the **Polygon Blockchain**. 

Even a single-pixel alteration to an image or a one-second cut in a video will cause a verification failure against the immutable on-chain record.

## Key Features

### Cinematic "Bureau" Interface
A high-stakes, brutalist-cyber terminal designed for government intelligence operations.
- **Boot Sequence**: Staggered UI initialization simulating high-security clearance.
- **Glassmorphism**: Sophisticated layering using Tailwind and Framer Motion.

### ⛓️ Immutable Chain of Custody
Every upload is a transaction.
- **Blockchain Anchoring**: Hashes are stored on-chain, ensuring absolute proof of integrity.
- **Forensic Verification**: Real-time comparison between Local Binary, Database Metadata, and Blockchain Records.

### 🔍 Smart Artifact Analysis
- **Dynamic Identification**: Automatic detection of MP4, JPG, PDF, and Archives with specialized iconography.
- **Tamper Glitch Protocol**: Visual "emergency" state triggers when hash discrepancies are detected.

---

## 🛠️ Tech Stack & Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | High-performance SPA with Atomic Design |
| **Logic** | TypeScript | Type-safe forensic operations |
| **Styling** | Tailwind CSS | Custom government-terminal aesthetic |
| **Animation** | Framer Motion | Fluid state transitions and cinematic effects |
| **Database** | Supabase (PostgreSQL) | Metadata storage and system orchestration |
| **Storage** | Supabase Storage (S3) | Encrypted artifact hosting |
| **Blockchain** | Polygon PoS | Immutable SHA-256 hash anchoring |
| **Web3** | Ethers.js | EVM contract interaction |

---

## 📁 System Architecture

```mermaid
graph TD
    A[Officer Uploads File] --> B[SHA-256 Hash Generated Locally]
    B --> C[File Uploaded to Private S3 Bucket]
    B --> D[Hash Sent to Polygon Smart Contract]
    C --> E[PostgreSQL Metadata Created]
    D --> E
    E --> F[Verification Dashboard]
    F --> G[Comparison: Local vs DB vs Blockchain]
```

---

## ⚙️ Development Setup

### 1. Clone & Prerequisite
```bash
git clone https://github.com/your-username/evidentia.git
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
# Supabase
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Blockchain (Polygon)
VITE_CONTRACT_ADDRESS=0x... # Your EvidenceVault Smart Contract
VITE_BLOCKCHAIN_RPC_URL=https://polygon-mainnet.infura.io/v3/...
```

### 3. Run Development Server
```bash
npm run dev
```

---
this system is designed for high-integrity evidentiary storage. 

**"Integrity is the bedrock of justice."**
