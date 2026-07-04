import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { Button } from '../../components/ui/Button';
import { useAuthStore, authErrorMessage } from '../../store/authStore';
import { isPasswordValid, checkPassword, passwordStrengthLabel } from './validators';

interface ResetPasswordPageProps {
  token: string;
  onDone: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ token, onDone }) => {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrengthLabel(password);
  const rules = checkPassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(password)) {
      setError('Le mot de passe ne respecte pas les critères de sécurité requis.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Mot de passe mis à jour" subtitle="">
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
            <Icons.CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Votre mot de passe a bien été mis à jour.
          </p>
          <Button onClick={onDone} size="lg" className="w-full">
            Se connecter
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choisir un nouveau mot de passe" subtitle="Ce lien de réinitialisation est valable 1 heure.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <PasswordField
            label="Nouveau mot de passe"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          {password.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: `${strength.ratio * 100}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className={rules.minLength ? 'text-emerald-600 dark:text-emerald-400' : ''}>8+ caractères</span>
                <span className={rules.hasUpper ? 'text-emerald-600 dark:text-emerald-400' : ''}>Majuscule</span>
                <span className={rules.hasLower ? 'text-emerald-600 dark:text-emerald-400' : ''}>Minuscule</span>
                <span className={rules.hasDigit ? 'text-emerald-600 dark:text-emerald-400' : ''}>Chiffre</span>
              </div>
            </div>
          )}
        </div>

        <PasswordField
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={submitting}
        />

        {error && (
          <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-600 dark:text-rose-400">
            <Icons.AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="w-full mt-1">
          {submitting ? (
            <span className="flex items-center gap-2">
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
              Mise à jour...
            </span>
          ) : (
            'Mettre à jour le mot de passe'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};
