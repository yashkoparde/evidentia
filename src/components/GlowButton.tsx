import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../utils/utils';

interface GlowButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'success' | 'danger' | 'ghost';
  glow?: boolean;
}

export const GlowButton: React.FC<GlowButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  glow = true,
  ...props 
}) => {
  const variants = {
    primary: 'border-evidentia-accent text-evidentia-accent hover:bg-evidentia-accent/10',
    success: 'border-evidentia-success text-evidentia-success hover:bg-evidentia-success/10',
    danger: 'border-evidentia-danger text-evidentia-danger hover:bg-evidentia-danger/10',
    ghost: 'border-white/20 text-white hover:bg-white/5',
  };

  const glows = {
    primary: 'hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]',
    success: 'hover:shadow-[0_0_15px_rgba(0,255,156,0.4)]',
    danger: 'hover:shadow-[0_0_15px_rgba(255,59,59,0.4)]',
    ghost: 'hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "px-6 py-2 border rounded-md font-mono text-sm uppercase tracking-widest transition-all duration-300 relative group",
        variants[variant],
        glow && glows[variant],
        className
      )}
      {...props as any}
    >
      <span className="relative z-10">{children as React.ReactNode}</span>
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md",
        variant === 'primary' && "bg-gradient-to-r from-evidentia-accent/20 to-transparent",
        variant === 'success' && "bg-gradient-to-r from-evidentia-success/20 to-transparent",
        variant === 'danger' && "bg-gradient-to-r from-evidentia-danger/20 to-transparent",
      )} />
    </motion.button>
  );
};
