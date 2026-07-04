import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import './db.js'; // Initialise le schéma SQLite au démarrage
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import syncRoutes from './routes/sync.js';
import { globalLimiter } from './middleware/rateLimiters.js';

const app = express();
const PORT = process.env.PORT || 4000;

// CLIENT_ORIGIN accepte une ou plusieurs origines séparées par des virgules,
// ex: "http://localhost:5173,https://premium-planner-app-saas.vercel.app"
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Nécessaire derrière un proxy/load balancer (Render, Railway, Fly.io, etc.)
// pour que `req.secure` / le flag Secure des cookies soient corrects.
app.set('trust proxy', 1);

// Sécurité HTTP de base (en-têtes anti-clickjacking, anti-sniffing, CSP restrictive, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

// CORS strict : une seule origine autorisée (le frontend), credentials activés
// pour laisser passer les cookies httpOnly d'authentification.
app.use(
  cors({
    origin(origin, callback) {
      // Requêtes sans origine (curl, health checks, apps mobiles) : autorisées.
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  })
);

app.use(express.json({ limit: '2mb' })); // limite la taille pour éviter les abus (DoS applicatif)
app.use(cookieParser());
app.use(globalLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/sync', syncRoutes);

// 404 générique
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Ressource introuvable.' });
});

// Gestionnaire d'erreurs global : ne renvoie jamais la stack trace ni les
// détails internes au client (pas de fuite d'informations), tout en
// journalisant le détail complet côté serveur pour le débogage.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid_json', message: 'Requête invalide.' });
  }
  res.status(500).json({ error: 'server_error', message: 'Une erreur inattendue est survenue.' });
});

app.listen(PORT, () => {
  console.log(`API planner démarrée sur http://localhost:${PORT}`);
});
