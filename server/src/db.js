import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || './data/planner.db';
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, '..', dbPath);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

export const db = new Database(resolvedPath);

// Bonnes pratiques SQLite : contraintes de clés étrangères actives + mode WAL pour la concurrence.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  -- Toutes les données applicatives de l'utilisateur (tâches, sous-tâches,
  -- événements, habitudes, objectifs, catégories, paramètres, préférences,
  -- thème, notifications) sont stockées sous forme d'un document JSON
  -- versionné, propre à chaque utilisateur. Ce document reproduit fidèlement
  -- la structure déjà utilisée côté client (Dexie / zustand), garantissant
  -- l'isolation stricte des données entre comptes (clé étrangère user_id,
  -- contrainte UNIQUE, jamais d'accès croisé possible).
  CREATE TABLE IF NOT EXISTS user_data (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    payload TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    user_agent TEXT,
    ip TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
`);

export default db;
