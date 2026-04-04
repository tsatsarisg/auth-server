import { createHash, timingSafeEqual } from 'crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verifyToken(token: string, storedHash: string): boolean {
  const hash = hashToken(token);
  const hashBuf = Buffer.from(hash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (hashBuf.length !== storedBuf.length) return false;
  return timingSafeEqual(hashBuf, storedBuf);
}
