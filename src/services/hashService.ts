import CryptoJS from 'crypto-js';

/**
 * Generates a SHA-256 hash for a given file using the native Web Crypto API.
 * This is significantly faster and more memory-efficient than CryptoJS for large files.
 */
export async function generateHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Simple string hash for other purposes (like metadata integrity)
 */
export function generateStringHash(input: string): string {
  return CryptoJS.SHA256(input).toString();
}
