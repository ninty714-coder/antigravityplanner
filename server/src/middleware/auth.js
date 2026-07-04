import { verifyAccessToken } from '../utils/tokens.js';
import db from '../db.js';

// Protège les routes privées : exige un access token JWT valide transmis via
// un cookie httpOnly (jamais accessible en JS, donc invulnérable au XSS pour
// le vol de session). Ne fuit aucune information sur la raison précise de
// l'échec (token expiré vs absent vs invalide) pour éviter d'aider un
// attaquant, tout en distinguant "expired" en interne pour permettre au
// client de tenter un refresh silencieux.
export function requireAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Authentification requise.' });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = db
      .prepare('SELECT id, email, name, avatar_color, is_active FROM users WHERE id = ?')
      .get(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'unauthorized', message: 'Authentification requise.' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'unauthorized', message: 'Authentification requise.' });
  }
}
