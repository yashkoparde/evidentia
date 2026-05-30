# Database Schema: Evidentia

This document contains the definitive schema for the forensic application. This version reflects the "Nuclear Reset" state.

## Tables

### 1. profiles
Stores user identity and linked wallet data.
- `id`: uuid (PK, refs auth.users)
- `name`: text
- `email`: text
- `wallet_address`: text (Linked MetaMask/Polygon address)
- `role`: text (default: 'analyst')
- `created_at`: timestamptz

### 2. evidence
Forensic artifacts and their cryptographic anchors.
- `id`: uuid (PK)
- `title`: text
- `case_id`: text
- `description`: text
- `file_size`: bigint
- `file_type`: text
- `file_hash`: text (SHA-256)
- `tx_hash`: text (Blockchain Transaction Hash)
- `storage_path`: text (Supabase Storage path)
- `status`: text (pending | verified | tampered)
- `thumbnail`: text (Base64)
- `thumbnail_type`: text
- `duration`: numeric (for media)
- `user_id`: uuid (refs profiles)
- `created_at`: timestamptz

### 3. audit_logs
Immutable chain of custody logs.
- `id`: uuid (PK)
- `action`: text
- `details`: text
- `timestamp`: timestamptz
- `user_name`: text
- `user_id`: uuid (refs profiles)
- `status`: text (success | warning | alert)
- `ai_summary`: text (AI-generated activity brief)
- `evidence_id`: uuid (refs evidence)

## Storage
- Bucket Name: `evidence-vault`
- Visibility: `Private`
- Purpose: Binary storage for all forensic uploads.
