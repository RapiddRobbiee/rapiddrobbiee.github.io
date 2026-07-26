import React from 'react';
import { motion } from 'framer-motion';
import { NewsBanner as NewsBannerType } from '../newsBanners';

interface NewsBannerProps {
  banner: NewsBannerType;
  onDismiss: (bannerId: string) => void;
}

const getStyleConfig = (type: NewsBannerType['type']) => {
  switch (type) {
    case 'info':
      return {
        border: 'border-blue-500/40',
        bg: 'from-blue-500/15 to-blue-600/5',
        text: 'text-blue-100',
        icon: 'fa-circle-info',
        iconColor: 'text-blue-400',
        button: 'bg-blue-500/30 hover:bg-blue-500/50 text-blue-100 border-blue-500/30',
      };
    case 'warning':
      return {
        border: 'border-amber-500/40',
        bg: 'from-amber-500/15 to-amber-600/5',
        text: 'text-amber-100',
        icon: 'fa-triangle-exclamation',
        iconColor: 'text-amber-400',
        button: 'bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 border-amber-500/30',
      };
    case 'success':
      return {
        border: 'border-emerald-500/40',
        bg: 'from-emerald-500/15 to-emerald-600/5',
        text: 'text-emerald-100',
        icon: 'fa-circle-check',
        iconColor: 'text-emerald-400',
        button: 'bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-100 border-emerald-500/30',
      };
    case 'announcement':
      return {
        border: 'border-purple-500/40',
        bg: 'from-purple-500/15 to-purple-600/5',
        text: 'text-purple-100',
        icon: 'fa-bullhorn',
        iconColor: 'text-purple-400',
        button: 'bg-purple-500/30 hover:bg-purple-500/50 text-purple-100 border-purple-500/30',
      };
    case 'urgent':
      return {
        border: 'border-red-500/50',
        bg: 'from-red-500/20 to-red-600/10',
        text: 'text-red-100',
        icon: 'fa-circle-exclamation',
        iconColor: 'text-red-400',
        button: 'bg-red-500/40 hover:bg-red-500/60 text-red-100 border-red-500/40',
      };
    default:
      return {
        border: 'border-blue-500/40',
        bg: 'from-blue-500/15 to-blue-600/5',
        text: 'text-blue-100',
        icon: 'fa-circle-info',
        iconColor: 'text-blue-400',
        button: 'bg-blue-500/30 hover:bg-blue-500/50 text-blue-100 border-blue-500/30',
      };
  }
};

export const NewsBanner: React.FC<NewsBannerProps> = ({ banner, onDismiss }) => {
  const { id, message, type, link, linkText, dismissible = true, centered = false } = banner;
  const styles = getStyleConfig(type);
  const showDualIcons = centered && (type === 'warning' || type === 'urgent');

  const handleDismiss = () => onDismiss(id);

  const handleLinkClick = () => {
    if (link) {
      if (link.startsWith('http')) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.hash = link;
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative mb-4 overflow-hidden rounded-xl border bg-gradient-to-br ${styles.bg} ${styles.border} backdrop-blur-md`}
      role="alert"
      aria-live="polite"
    >
      {centered ? (
        <div className="flex items-center justify-center gap-3 px-4 py-3">
          <i className={`fas ${styles.icon} ${styles.iconColor} shrink-0 text-lg`} />

          <div className="flex flex-col items-center">
            <p className={`${styles.text} font-medium leading-snug text-center`}>{message}</p>
            {link && linkText && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLinkClick}
                className={`mt-2 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors ${styles.button}`}
              >
                {linkText}
              </motion.button>
            )}
          </div>

          {showDualIcons && (
            <i className={`fas ${styles.icon} ${styles.iconColor} shrink-0 text-lg`} />
          )}

          {dismissible && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDismiss}
              className={`absolute right-2 top-2 rounded-full p-1.5 opacity-60 transition-opacity hover:opacity-100 ${styles.text}`}
              aria-label="Dismiss banner"
            >
              <i className="fas fa-times text-sm" />
            </motion.button>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3">
          <i className={`fas ${styles.icon} ${styles.iconColor} mt-0.5 shrink-0 text-lg`} />

          <div className="min-w-0 flex-1">
            <p className={`${styles.text} font-medium leading-snug`}>{message}</p>
            {link && linkText && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLinkClick}
                className={`mt-2 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors ${styles.button}`}
              >
                {linkText}
              </motion.button>
            )}
          </div>

          {dismissible && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDismiss}
              className={`shrink-0 rounded-full p-1.5 opacity-60 transition-opacity hover:opacity-100 ${styles.text}`}
              aria-label="Dismiss banner"
            >
              <i className="fas fa-times text-sm" />
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
};
