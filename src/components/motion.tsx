import React from 'react';
import { motion, type Variants } from 'motion/react';

const ease = [0.22, 1, 0.36, 1] as const;

export const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

/** Staggered container — wrap a list of <MotionItem> children. */
export const MotionList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div className={className} variants={listVariants} initial="hidden" animate="show">
    {children}
  </motion.div>
);

/** Animated list row. Keep `key` on this element when mapping. */
export const MotionItem: React.FC<{ children: React.ReactNode; className?: string; layout?: boolean }> = ({
  children,
  className,
  layout = true,
}) => (
  <motion.div className={className} variants={itemVariants} layout={layout}>
    {children}
  </motion.div>
);

/** Spring-in modal surface. */
export const MotionModal: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 10 }}
    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
  >
    {children}
  </motion.div>
);
