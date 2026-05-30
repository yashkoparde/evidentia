import React from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Cpu, X } from 'lucide-react';
import { cn } from '../utils/utils';

export const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 flex flex-col gap-1.5 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={cn(
              "glass-panel p-2 flex items-center gap-3 pointer-events-auto group border-t border-white/5 shadow-2xl relative overflow-hidden",
              n.type === 'alert' && "bg-evidentia-danger/10 border-evidentia-danger/30 text-evidentia-danger",
              n.type === 'success' && "bg-evidentia-success/10 border-evidentia-success/30 text-evidentia-success",
              n.type === 'violet' && "bg-evidentia-violet/10 border-evidentia-violet/30 text-evidentia-violet"
            )}
          >
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 5, ease: "linear" }}
              className={cn(
                "absolute top-0 left-0 right-0 h-[1px] origin-left",
                n.type === 'alert' ? "bg-evidentia-danger" : 
                n.type === 'success' ? "bg-evidentia-success" : "bg-evidentia-violet"
              )}
            />
            
            <div className="flex-shrink-0">
              {n.type === 'alert' ? <AlertCircle className="w-3.5 h-3.5" /> : 
               n.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
               <Cpu className="w-3.5 h-3.5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-mono leading-tight uppercase tracking-[0.2em] font-bold">
                {n.message}
              </p>
            </div>

            <button 
              onClick={() => removeNotification(n.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-3 h-3 opacity-30 group-hover:opacity-100" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
