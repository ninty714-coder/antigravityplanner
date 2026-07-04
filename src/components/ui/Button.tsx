import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg';

// We combine motion props with standard HTML button props
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<"button">> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps & HTMLMotionProps<"button">>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";
    
    const variants = {
      primary: "bg-[var(--accent)] hover:opacity-90 text-white shadow-sm dark:focus:ring-offset-slate-900",
      secondary: "bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus:ring-slate-400 dark:focus:ring-offset-slate-900",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm dark:bg-rose-500 dark:hover:bg-rose-600 focus:ring-rose-500 dark:focus:ring-offset-slate-900",
      ghost: "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300",
      glass: "glass hover:bg-white/80 dark:hover:bg-slate-900/80 text-slate-800 dark:text-slate-200 border-white/20 dark:border-white/10"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };

    return (
      <motion.button
        ref={ref as any}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
