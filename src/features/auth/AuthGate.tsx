import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';

type PublicRoute = 'login' | 'register' | 'forgot-password';

function getResetToken(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (window.location.pathname === '/reset-password' && params.get('token')) {
    return params.get('token');
  }
  return null;
}

function clearResetUrl() {
  window.history.replaceState({}, '', '/');
}

interface AuthGateProps {
  children: React.ReactNode;
}

// Protection des routes privées : tant que la session n'est pas confirmée
// (ou si l'utilisateur est déconnecté), le contenu applicatif (planning,
// tâches, données personnelles...) n'est jamais monté ni chargé.
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { status, init } = useAuthStore();
  const [route, setRoute] = useState<PublicRoute>('login');
  const [resetToken, setResetToken] = useState<string | null>(() => getResetToken());

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onDone={() => {
          clearResetUrl();
          setResetToken(null);
          setRoute('login');
        }}
      />
    );
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute w-full h-full border-4 border-indigo-500/25 rounded-full" />
          <div className="absolute w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin" />
        </div>
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
          Vérification de la session...
        </span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    if (route === 'register') return <RegisterPage onNavigate={setRoute} />;
    if (route === 'forgot-password') return <ForgotPasswordPage onNavigate={setRoute} />;
    return <LoginPage onNavigate={setRoute} />;
  }

  return <>{children}</>;
};
