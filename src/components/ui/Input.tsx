import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] dark:focus:ring-[var(--accent)]/20",
              icon ? "pl-11" : "pl-4",
              error 
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" 
                : "border-slate-200 hover:border-slate-300 dark:border-slate-800/80 dark:hover:border-slate-700/80",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
