import rateLimit from 'express-rate-limit';

// Limite globale, généreuse, sur toute l'API pour éviter les abus grossiers.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite stricte par IP sur les tentatives de connexion : au-delà de 10
// tentatives en 15 minutes depuis la même IP, on bloque temporairement,
// en complément du verrouillage par compte (voir routes/auth.js).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Trop de tentatives. Réessayez plus tard.' },
});

// Limite dédiée à la création de compte pour freiner l'inscription automatisée.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Trop de tentatives. Réessayez plus tard.' },
});

// Limite sur la demande de réinitialisation de mot de passe.
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Trop de tentatives. Réessayez plus tard.' },
});
