import { Router } from 'express';
import argon2 from 'argon2';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
  formatZodError,
} from '../utils/validation.js';

const router = Router();

router.use(requireAuth, requireCsrf);

// PATCH /api/account/profile
router.patch('/profile', (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', message: formatZodError(parsed.error) });
  }
  const { name, avatarColor } = parsed.data;
  if (name === undefined && avatarColor === undefined) {
    return res.status(400).json({ error: 'validation_error', message: 'Aucune modification fournie.' });
  }

  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const nextName = name ?? current.name;
  const nextAvatar = avatarColor ?? current.avatar_color;

  db.prepare('UPDATE users SET name = ?, avatar_color = ?, updated_at = ? WHERE id = ?').run(
    nextName,
    nextAvatar,
    new Date().toISOString(),
    req.userId
  );

  const updated = db.prepare('SELECT id, email, name, avatar_color, created_at FROM users WHERE id = ?').get(req.userId);
  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarColor: updated.avatar_color,
      createdAt: updated.created_at,
    },
  });
});

// POST /api/account/change-password
router.post('/change-password', (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', message: formatZodError(parsed.error) });
  }
  const { currentPassword, newPassword } = parsed.data;

  (async () => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    const valid = await argon2.verify(user.password_hash, currentPassword).catch(() => false);
    if (!valid) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Mot de passe actuel incorrect.' });
    }

    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
        newHash,
        new Date().toISOString(),
        req.userId
      );
      // Toutes les autres sessions/appareils sont déconnectés par sécurité.
      db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(req.userId);
    });
    tx();

    res.json({ ok: true, message: 'Mot de passe modifié. Veuillez vous reconnecter.' });
  })();
});

// DELETE /api/account
router.delete('/', (req, res) => {
  const parsed = deleteAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', message: formatZodError(parsed.error) });
  }

  (async () => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    const valid = await argon2.verify(user.password_hash, parsed.data.password).catch(() => false);
    if (!valid) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Mot de passe incorrect.' });
    }

    // ON DELETE CASCADE supprime automatiquement user_data, refresh_tokens
    // et password_reset_tokens associés : aucune donnée orpheline.
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.clearCookie('csrf_token', { path: '/' });
    res.json({ ok: true, message: 'Compte supprimé.' });
  })();
});

export default router;
