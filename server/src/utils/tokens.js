import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    'JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être définis dans les variables d\'environnement.'
  );
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Le refresh token lui-même est un identifiant opaque aléatoire (pas un JWT) :
// seul son empreinte SHA-256 est stockée en base, jamais le token en clair.
// Cela permet de le révoquer côté serveur (déconnexion, changement de mot de
// passe, suppression de compte) contrairement à un JWT stateless classique.
export function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TTL_DAYS);
  return d;
}

export function refreshCookieMaxAgeMs() {
  return REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
}

// Comparaison en temps constant pour éviter les attaques de timing sur les tokens.
export function safeCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
