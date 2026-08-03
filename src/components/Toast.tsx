'use client';

// ============================================================
// Toast Notifications Component
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import { ToastMessage } from './GameContext';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

const TOAST_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: 'ℹ️',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.15)',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: '✅',
  },
  warning: {
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.3)',
    icon: '⚠️',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '❌',
  },
};

export default function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 100,
        maxWidth: 360,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.slice(-5).map((toast) => {
          const colors = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: colors.bg,
                backdropFilter: 'blur(16px)',
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                boxShadow: 'var(--shadow-md)',
                pointerEvents: 'auto',
              }}
            >
              <span>{colors.icon}</span>
              <span style={{ flex: 1 }}>{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
