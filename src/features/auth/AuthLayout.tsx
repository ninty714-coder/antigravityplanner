import React from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Écran d'authentification élégant, responsive, compatible mode sombre :
// panneau de marque à gauche (masqué sur mobile), formulaire à droite.
export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Panneau de marque */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-md flex flex-col gap-6 text-white"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg">
            <Icons.Zap className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            Antigravity Planner
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Vos tâches, votre calendrier, vos habitudes et vos objectifs, synchronisés en toute sécurité sur tous vos appareils.
          </p>
          <div className="flex flex-col gap-3 mt-4">
            {[
              { icon: 'ShieldCheck', text: 'Chiffrement des mots de passe (Argon2)' },
              { icon: 'RefreshCw', text: 'Synchronisation automatique multi-appareils' },
              { icon: 'Lock', text: 'Vos données ne sont visibles que par vous' },
            ].map((item) => {
              const ItemIcon = (Icons as any)[item.icon];
              return (
                <div key={item.text} className="flex items-center gap-3 text-sm text-indigo-50">
                  <ItemIcon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1.5 lg:hidden mb-2 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Icons.Zap className="w-4.5 h-4.5" />
              </div>
              <span className="font-extrabold text-slate-850 dark:text-slate-50 text-base tracking-tight">
                Antigravity Planner
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="text-center text-sm">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
};
