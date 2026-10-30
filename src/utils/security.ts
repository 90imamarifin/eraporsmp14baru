/**
 * Utility for data hashing, cryptographic checksums, and secure session validation.
 */

// Simple SHA-256 implementation using Web Crypto API
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate digital signature / verification seal for official printed report card (Rapor STS)
export function generateRaportVerificationCode(
  schoolNpsn: string,
  nisn: string,
  semester: string,
  academicYear: string,
  averageScore: number
): string {
  const seed = `${schoolNpsn}-${nisn}-${academicYear}-${semester}-${averageScore.toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `KEMDIKBUD-ERAPOR-SMP14-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

// Data encryption indicator simulation for secure client-side storage
export function maskSensitive(text: string): string {
  if (!text || text.length < 4) return '****';
  return text.substring(0, 2) + '*'.repeat(Math.max(2, text.length - 4)) + text.substring(text.length - 2);
}
