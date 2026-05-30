import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../utils/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, title, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className={cn("glass-panel p-6 relative group overflow-hidden", className)}
    >
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-evidentia-accent/40 group-hover:border-evidentia-accent transition-colors" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-evidentia-accent/40 group-hover:border-evidentia-accent transition-colors" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-evidentia-accent/40 group-hover:border-evidentia-accent transition-colors" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-evidentia-accent/40 group-hover:border-evidentia-accent transition-colors" />
      
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold tracking-widest text-evidentia-accent uppercase">
            {title}
          </h3>
          <div className="w-12 h-[1px] bg-evidentia-accent/20" />
        </div>
      )}
      
      {children}
    </motion.div>
  );
};
