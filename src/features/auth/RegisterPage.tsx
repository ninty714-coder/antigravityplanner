import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore, authErrorMessage } from '../../store/authStore';
import { isValidEmail, isPasswordValid, checkPassword, passwordStrengthLabel } from './validators';

interface RegisterPageProps {
  onNavigate: (route: 'login' | 'register' | 'forgot-password') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = passwordStrengthLabel(password);
  const rules = checkPassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Merci de renseigner votre nom.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Merci de renseigner une adresse e-mail valide.');
      return;
    }
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
      await register(email, password, name.trim());
      setSuccess(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Compte créé avec succès" subtitle="">
        <div className="flex flex-col items-center text-center gap-4 py-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
            <Icons.CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Bienvenue {name.trim()} ! Votre compte a été créé et vous êtes connecté(e). Redirection vers votre planning...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Créer votre compte"
      subtitle="Votre espace personnel, sauvegardé et synchronisé automatiquement."
      footer={
        <span className="text-slate-500 dark:text-slate-400">
          Déjà un compte ?{' '}
          <button onClick={() => onNavigate('login')} className="font-semibold text-[var(--accent)] hover:underline">
            Se connecter
          </button>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nom complet"
          autoComplete="name"
          placeholder="Alex Dupont"
          icon={<Icons.User className="w-4 h-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />

        <Input
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          icon={<Icons.Mail className="w-4 h-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />

        <div className="flex flex-col gap-2">
          <PasswordField
            label="Mot de passe"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
          {password.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${strength.color}`}
                  style={{ width: `${strength.ratio * 100}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className={rules.minLength ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                  8+ caractères
                </span>
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
          error={confirmPassword.length > 0 && confirmPassword !== password ? 'Les mots de passe ne correspondent pas.' : undefined}
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
              Création du compte...
            </span>
          ) : (
            'Créer mon compte'
          )}
        </Button>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
          En créant un compte, vous acceptez que vos données de planning soient stockées de façon sécurisée afin d'être synchronisées entre vos appareils.
        </p>
      </form>
    </AuthLayout>
  );
};
