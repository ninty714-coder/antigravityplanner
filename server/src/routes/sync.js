import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { syncSchema, formatZodError } from '../utils/validation.js';

const router = Router();
router.use(requireAuth, requireCsrf);

// GET /api/sync - restaure toutes les données de l'utilisateur (nouvel appareil, reconnexion...)
router.get('/', (req, res) => {
  const row = db.prepare('SELECT payload, version, updated_at FROM user_data WHERE user_id = ?').get(req.userId);
  if (!row) {
    return res.json({ version: 0, data: { categories: [], tasks: [], events: [], habits: [], settings: {} }, updatedAt: null });
  }
  res.json({ version: row.version, data: JSON.parse(row.payload), updatedAt: row.updated_at });
});

// PUT /api/sync - sauvegarde automatique de l'ensemble des données (tâches, sous-tâches,
// calendrier, objectifs, habitudes, routines, notes, rappels, paramètres, préférences, thème...)
// Utilise un numéro de version pour une concurrence optimiste simple : si un autre appareil
// a déjà poussé une version plus récente, le client est informé du conflit et reçoit la
// version serveur à jour plutôt que d'écraser silencieusement des données plus récentes.
router.put('/', (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'validation_error', message: formatZodError(parsed.error) });
  }
  const { version, data } = parsed.data;

  const existing = db.prepare('SELECT version, payload, updated_at FROM user_data WHERE user_id = ?').get(req.userId);
  const currentVersion = existing?.version ?? 0;

  if (existing && version < currentVersion) {
    return res.status(409).json({
      error: 'conflict',
      message: 'Des données plus récentes existent déjà (synchronisées depuis un autre appareil).',
      version: currentVersion,
      data: JSON.parse(existing.payload),
      updatedAt: existing.updated_at,
    });
  }

  const nextVersion = currentVersion + 1;
  const now = new Date().toISOString();
  const payload = JSON.stringify(data);

  if (existing) {
    db.prepare('UPDATE user_data SET payload = ?, version = ?, updated_at = ? WHERE user_id = ?').run(
      payload,
      nextVersion,
      now,
      req.userId
    );
  } else {
    db.prepare('INSERT INTO user_data (user_id, payload, version, updated_at) VALUES (?, ?, ?, ?)').run(
      req.userId,
      payload,
      nextVersion,
      now
    );
  }

  res.json({ ok: true, version: nextVersion, updatedAt: now });
});

export default router;
