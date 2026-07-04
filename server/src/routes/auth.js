import { Router } from 'express';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import db from '../db.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  formatZodError,
} from '../utils/validation.js';
import {
  signAccessToken,
  generateOpaqueToken,
  hashToken,
  refreshTokenExpiry,
  refreshCookieMaxAgeMs,
} from '../utils/tokens.js';
import { issueCsrfCookie, clearCsrfCookie } from '../middleware/csrf.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from '../middleware/rateLimiters.js';

const router = Router();

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const isProd = () => process.env.NODE_ENV === 'production';
const cookieSecure = () => process.env.COOKIE_SECURE === 'true';
// Frontend (Vercel) et backend (Railway/Render/...) vivent sur des domaines
// différents : c'est une requête cross-site aux yeux du navigateur. Les
// cookies "Lax" ne sont alors JAMAIS envoyés sur les appels fetch/XHR, donc
// on doit utiliser "None" (qui exige "Secure") dès que COOKIE_SECURE=true.
const cookieSameSite = () => (cookieSecure() ? 'none' : 'lax');

function setAuthCookies(res, { accessToken, refreshToken, rememberMe }) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: cookieSameSite(),
    path: '/',
    maxAge: 15 * 60 * 1000, // aligné sur ACCESS_TOKEN_TTL par défaut (15 min)
  });

  const refreshCookieOptions = {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: cookieSameSite(),
    path: '/api/auth', // limite l'exposition du cookie de refresh aux routes d'auth
  };
  if (rememberMe) {
    refreshCookieOptions.maxAge = refreshCookieMaxAgeMs();
  }
  // Sans "Se souvenir de moi", le cookie de refresh est un cookie de session
  // (pas de maxAge) : il disparaît à la fermeture du navigateur.
  res.cookie('refresh_token', refreshToken, refreshCookieOptions);

  issueCsrfCookie(res);
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
  clearCsrfCookie(res);
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarColor: user.avatar_color,
    createdAt: user.created_at,
  };
}

function createSession(res, user, rememberMe, req) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateOpaqueToken();

  db.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    nanoid(),
    user.id,
    hashToken(refreshToken),
    refreshTokenExpiry().toISOString(),
    req.get('user-agent') || null,
    req.ip,
    new Date().toISOString()
  );

  setAuthCookies(res, { accessToken, refreshToken, rememberMe });
}

// POST /api/auth/register
router.post('/register', registerLimiter, (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', message: formatZodError(parsed.error) });
  }
  const { email, password, name } = parsed.data;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    // Message générique : ne confirme pas explicitement qu'un compte existe déjà
    // sous cette adresse pour limiter l'énumération de comptes.
    return res.status(409).json({ error: 'email_taken', message: 'Impossible de créer ce compte.' });
  }

  (async () => {
    try {
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
      const id = nanoid();
      const now = new Date().toISOString();

      const insertUser = db.prepare(
        `INSERT INTO users (id, email, password_hash, name, avatar_color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      const insertData = db.prepare(
        `INSERT INTO user_data (user_id, payload, version, updated_at) VALUES (?, ?, 0, ?)`
      );

      const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];

      const tx = db.transaction(() => {
        insertUser.run(id, email, passwordHash, name, avatarColor, now, now);
        insertData.run(id, JSON.stringify({ categories: [], tasks: [], events: [], habits: [], settings: {} }), now);
      });
      tx();

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      createSession(res, user, true, req);
      res.status(201).json({ user: publicUser(user) });
    } catch (err) {
      console.error('register error:', err.message);
      res.status(500).json({ error: 'server_error', message: 'Une erreur est survenue. Réessayez.' });
    }
  })();
});

// POST /api/auth/login
router.post('/login', loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', message: formatZodError(parsed.error) });
  }
  const { email, password, rememberMe } = parsed.data;

  (async () => {
    const genericError = () =>
      res.status(401).json({ error: 'invalid_credentials', message: 'E-mail ou mot de passe incorrect.' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !user.is_active) return genericError();

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        error: 'account_locked',
        message: 'Compte temporairement verrouillé suite à plusieurs échecs. Réessayez plus tard.',
      });
    }

    let valid = false;
    try {
      valid = await argon2.verify(user.password_hash, password);
    } catch {
      valid = false;
    }

    if (!valid) {
      const attempts = user.failed_login_attempts + 1;
      const lockUntil =
        attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS).toISOString() : null;
      db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(
        attempts,
        lockUntil,
        user.id
      );
      return genericError();
    }

    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
    createSession(res, user, rememberMe, req);
    res.json({ user: publicUser(user) });
  })();
});

// POST /api/auth/refresh - renouvelle l'access token à partir du refresh token (rotation)
router.post('/refresh', (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'unauthorized', message: 'Session expirée.' });

  const tokenHash = hashToken(token);
  const row = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(tokenHash);

  if (!row || row.revoked || new Date(row.expires_at) < new Date()) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'unauthorized', message: 'Session expirée.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id);
  if (!user || !user.is_active) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'unauthorized', message: 'Session expirée.' });
  }

  // Rotation : l'ancien refresh token est révoqué immédiatement, un nouveau est émis.
  // Détecte aussi le rejeu (réutilisation d'un token déjà révoqué serait bloquée ci-dessus).
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(row.id);

  createSession(res, user, true, req);
  res.json({ user: publicUser(user) });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(hashToken(token));
  }
  clearAuthCookies(res);
  res.json({ ok: true });
});

// GET /api/auth/me - restaure la session au chargement de l'app
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', message: formatZodError(parsed.error) });
  }
  const { email } = parsed.data;
  const genericResponse = () =>
    res.json({ ok: true, message: 'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return genericResponse(); // ne révèle jamais si l'e-mail existe

  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

  db.prepare(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).run(nanoid(), user.id, hashToken(token), expiresAt, new Date().toISOString());

  const resetLink = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/reset-password?token=${token}`;

  // TODO Production : brancher un vrai fournisseur d'e-mail transactionnel
  // (Resend, SendGrid, Postmark, SES...) pour envoyer `resetLink` à l'utilisateur.
  // En attendant, le lien est journalisé côté serveur pour permettre les tests.
  if (!isProd()) {
    console.log(`[reset-password] Lien de réinitialisation pour ${email} : ${resetLink}`);
  }

  genericResponse();
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', message: formatZodError(parsed.error) });
  }
  const { token, password } = parsed.data;

  (async () => {
    const tokenHash = hashToken(token);
    const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ?').get(tokenHash);

    if (!row || row.used || new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'invalid_token', message: 'Lien de réinitialisation invalide ou expiré.' });
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, updated_at = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(
        passwordHash,
        now,
        row.user_id
      );
      db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);
      // Sécurité : un changement de mot de passe révoque toutes les sessions actives.
      db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(row.user_id);
    });
    tx();

    res.json({ ok: true, message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' });
  })();
});

export default router;
