import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore, authErrorMessage } from '../../store/authStore';
import { isValidEmail } from './validators';

interface ForgotPasswordPageProps {
  onNavigate: (route: 'login' | 'register' | 'forgot-password') => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isValidEmail(email)) {
      setError('Merci de renseigner une adresse e-mail valide.');
      return;
    }

    setSubmitting(true);
    try {
      const msg = await forgotPassword(email);
      setMessage(msg);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Indiquez votre e-mail : nous vous enverrons un lien de réinitialisation."
      footer={
        <button onClick={() => onNavigate('login')} className="font-semibold text-[var(--accent)] hover:underline">
          Retour à la connexion
        </button>
      }
    >
      {message ? (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
            <Icons.MailCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
        </div>
      ) : (
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
                Envoi...
              </span>
            ) : (
              'Envoyer le lien'
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};
