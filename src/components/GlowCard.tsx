import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowOnHover?: boolean;
}

const GlowCard = ({ children, className, glowOnHover = true }: GlowCardProps) => {
  return (
    <motion.div
      whileHover={glowOnHover ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative rounded-xl border border-border bg-card p-6 overflow-hidden group',
        className
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute -inset-[100px] bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-3xl" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50 blur-sm" />
      </div>
    </motion.div>
  );
};

export default GlowCard;
