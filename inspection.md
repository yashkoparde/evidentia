# Forensic AI Inspection Protocol (Parikshak.ai)

Evidentia utilizes the **Parikshak.ai** model (powered by Gemini 3 Flash) for its speed and long-context reasoning capabilities to perform automated forensic triage on uploaded artifacts.

## 1. Metadata Heuristics
When a file is uploaded, the system extracts EXIF data, headers, and file system metadata. Gemini analyzes these for:
- **Timestamp Logic:** Are the creation/modification dates consistent with the file's encoded metadata?
- **Device Signatures:** Does the camera model or software version match known valid profiles?

## 2. Structural Anomaly Detection
The AI scans the "skeleton" of the file. For example, in JPEGs, it looks for trailing data after the EOI (End of Image) marker, which often indicates hidden payloads or "steganography."

## 3. Natural Language Summarization
Instead of showing raw technical data, Gemini generates a "Human-Readable Brief." It converts technical forensic flags into plain English descriptions of why a file is considered high-risk or verified.

## 4. Prompt Engineering
Our system uses a specialized forensic prompt that instructs the model to:
- Identify "Edit Artifacts" (e.g., traces of Photoshop metadata).
- Evaluate "Risk Scores" based on the completeness of the digital chain of custody.
- Suggest "Observations" for human investigators to follow up on.

---
*Note: AI analysis is used for triaging and alerting. The final legal integrity rests on the SHA-256 Cryptographic Hash and the Blockchain Ledger.*
