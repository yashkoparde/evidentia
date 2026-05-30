# Tamper Detection Architecture

Evidentia is designed to detect digital tampering at three distinct layers. This approach ensures that even if one layer is bypassed, the others will flag the anomaly.

## Layer 1: The Cryptographic "Source" Hash
When a file is first ingested, we generate a **SHA-256 hash**.
- **The Principle:** If even a single bit of the file changes (e.g., changing one pixel in a photo or one word in a document), the hash will change entirely.
- **The Check:** During verification, the system re-hashes the file and compares it to the original stored hash.

## Layer 2: Blockchain-Backed Immutability
Traditional databases can be edited by an administrator. Evidentia commits every hash to a **Blockchain Ledger**.
- **The Shield:** Once a hash is recorded on the ledger with a timestamp, it cannot be deleted or modified.
- **The Verification:** The "Verify" tool queries the blockchain to see if the record exists and matches the current state of the file.

## Layer 3: AI Meta-Consistency (Parikshak.ai)
Sophisticated attackers can sometimes forge hashes if they control the server. However, forging "internal metadata consistency" is much harder.
- **The Heuristic:** The AI checks for "Metadata Stripping" (removing all location/time data), which is a common sign of a forged document.
- **The Verdict:** If the file's binary content is "clean" but its historical metadata is missing or logically impossible, the system flags it as "High Risk."

## Real-World Example
1. **Attacker:** Modifies a surveillance video to remove a person.
2. **Evidentia Verify:** 
   - Re-hashes the modified video.
   - Compares it to the Blockchain record.
   - **RESULT:** "HASH_MISMATCH_TAMPER_DETECTED"
   - UI turns **Alert Red** and freezes the chain of custody.
