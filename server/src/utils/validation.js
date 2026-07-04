import { z } from 'zod';

// Règle de mot de passe robuste : 8 caractères min, au moins une minuscule,
// une majuscule, un chiffre. Validée aussi côté client pour le confort UX,
// mais la validation serveur fait foi et ne peut jamais être contournée.
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(128, 'Le mot de passe est trop long.')
  .regex(/[a-z]/, 'Le mot de passe doit contenir une minuscule.')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule.')
  .regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre.');

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(254),
  password: passwordSchema,
  name: z.string().trim().min(1, 'Le nom est requis.').max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(254),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(512),
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide.')
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
});

export const syncSchema = z.object({
  version: z.number().int().nonnegative(),
  data: z.object({
    categories: z.array(z.any()).default([]),
    tasks: z.array(z.any()).default([]),
    events: z.array(z.any()).default([]),
    habits: z.array(z.any()).default([]),
    settings: z.record(z.any()).optional().default({}),
  }),
});

export function formatZodError(error) {
  const first = error.errors?.[0];
  return first?.message || 'Données invalides.';
}
