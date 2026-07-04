import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof HTMLMotionProps<"div">> {
  hoverable?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps & HTMLMotionProps<"div">>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    const cardStyles = cn(
      "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-premium dark:shadow-premium-dark transition-all duration-200",
      hoverable && "hover:shadow-premium-hover dark:hover:shadow-premium-hover-dark cursor-pointer border-slate-300/50 dark:hover:border-slate-700/50"
    );

    if (hoverable) {
      return (
        <motion.div
          ref={ref as any}
          whileHover={{ y: -2, scale: 1.005 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cardStyles}
          {...(props as any)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={cardStyles} {...(props as any)}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
