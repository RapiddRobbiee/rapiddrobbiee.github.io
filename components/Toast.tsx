import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ToastType } from '../context/ToastContext';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

const iconMap: Record<ToastType, string> = {
  success: 'fa-circle-check',
  error: 'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
};

const config: Record<ToastType, { border: string; bg: string; text: string; icon: string; bar: string; glow: string }> = {
  success: {
    border: 'border-emerald-500/35',
    bg: 'from-emerald-500/12 to-emerald-600/5',
    text: 'text-emerald-200',
    icon: 'text-emerald-400',
    bar: 'bg-emerald-400',
    glow: 'rgba(52,211,153,0.12)',
  },
  error: {
    border: 'border-red-500/35',
    bg: 'from-red-500/12 to-red-600/5',
    text: 'text-red-200',
    icon: 'text-red-400',
    bar: 'bg-red-400',
    glow: 'rgba(239,68,68,0.12)',
  },
  warning: {
    border: 'border-amber-500/35',
    bg: 'from-amber-500/12 to-amber-600/5',
    text: 'text-amber-200',
    icon: 'text-amber-400',
    bar: 'bg-amber-400',
    glow: 'rgba(251,191,36,0.12)',
  },
  info: {
    border: 'border-blue-500/35',
    bg: 'from-blue-500/12 to-blue-600/5',
    text: 'text-blue-200',
    icon: 'text-blue-400',
    bar: 'bg-blue-400',
    glow: 'rgba(59,130,246,0.12)',
  },
};

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const { id, message, type, duration } = toast;
  const c = config[type];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.88, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 28, mass: 0.9 }}
      className={`pointer-events-auto relative flex w-80 items-start gap-3 overflow-hidden rounded-2xl border bg-gradient-to-br ${c.bg} ${c.border} p-4 shadow-2xl backdrop-blur-2xl`}
      style={{ boxShadow: `0 12px 40px -8px ${c.glow}, 0 8px 32px -12px rgba(0,0,0,0.5)` }}
      role="alert"
    >
      {/* Icon with subtle glow */}
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        <i className={`fas ${iconMap[type]} ${c.icon} text-base relative z-10`} />
        <span
          className="absolute inset-0 rounded-full blur-md opacity-60"
          style={{ backgroundColor: c.glow.replace('0.12', '0.25') }}
        />
      </span>

      {/* Message */}
      <p className={`flex-1 text-sm font-semibold leading-snug tracking-wide ${c.text}`}>
        {message}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full opacity-40 transition-all hover:opacity-80 hover:bg-white/5"
        aria-label="Dismiss notification"
      >
        <i className="fas fa-times text-xs" />
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className={`absolute bottom-0 left-0 h-[3px] rounded-full ${c.bar}`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};
