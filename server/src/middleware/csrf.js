import crypto from 'node:crypto';
import { safeCompare } from '../utils/tokens.js';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export function issueCsrfCookie(res) {
  const isSecure = process.env.COOKIE_SECURE === 'true';
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // Doit être lisible en JS côté client pour être renvoyé dans le header
    secure: isSecure,
    // Même raisonnement que pour les cookies d'auth : cross-site => "None".
    sameSite: isSecure ? 'none' : 'lax',
    path: '/',
  });
  return token;
}

export function clearCsrfCookie(res) {
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

// Protection CSRF par "double soumission de cookie" : à la connexion, le
// serveur pose un cookie NON httpOnly contenant un jeton aléatoire. Un site
// tiers malveillant peut forcer le navigateur à envoyer une requête (et donc
// le cookie), mais ne peut pas LIRE ce cookie (politique de même origine) et
// ne peut donc pas reproduire sa valeur dans l'en-tête personnalisé exigé
// ici. Toute requête de mutation sans en-tête correspondant est rejetée.
export function requireCsrf(req, res, next) {
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
  if (safeMethods.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
    return res.status(403).json({ error: 'csrf_invalid', message: 'Jeton de sécurité invalide.' });
  }
  next();
}
