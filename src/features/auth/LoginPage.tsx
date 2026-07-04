import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore, authErrorMessage } from '../../store/authStore';
import { isValidEmail } from './validators';

interface LoginPageProps {
  onNavigate: (route: 'login' | 'register' | 'forgot-password') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError('Merci de renseigner une adresse e-mail valide.');
      return;
    }
    if (!password) {
      setError('Merci de renseigner votre mot de passe.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password, rememberMe);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Bon retour parmi nous"
      subtitle="Connectez-vous pour retrouver votre planning."
      footer={
        <span className="text-slate-500 dark:text-slate-400">
          Pas encore de compte ?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            Créer un compte
          </button>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

        <PasswordField
          label="Mot de passe"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />

        <div className="flex items-center justify-between -mt-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            Se souvenir de moi
          </label>
          <button
            type="button"
            onClick={() => onNavigate('forgot-password')}
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </div>

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
              Connexion...
            </span>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};
