// Validation côté client : améliore l'expérience utilisateur (retour immédiat),
// mais ne remplace jamais la validation serveur qui fait foi (voir server/src/utils/validation.js).

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export interface PasswordCheck {
  minLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
}

export function checkPassword(password: string): PasswordCheck {
  return {
    minLength: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasDigit: /[0-9]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const c = checkPassword(password);
  return c.minLength && c.hasLower && c.hasUpper && c.hasDigit;
}

export function passwordStrengthLabel(password: string): { label: string; ratio: number; color: string } {
  const c = checkPassword(password);
  const score = [c.minLength, c.hasLower, c.hasUpper, c.hasDigit, password.length >= 12].filter(Boolean).length;
  if (password.length === 0) return { label: '', ratio: 0, color: 'bg-slate-200 dark:bg-slate-800' };
  if (score <= 2) return { label: 'Faible', ratio: 0.33, color: 'bg-rose-500' };
  if (score <= 4) return { label: 'Moyen', ratio: 0.66, color: 'bg-amber-500' };
  return { label: 'Fort', ratio: 1, color: 'bg-emerald-500' };
}
