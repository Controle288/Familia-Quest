import React from 'react';
import { Sparkles, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useFamily } from '../context/FamilyContext';

export const LevelUpModal: React.FC = () => {
  const { levelUpModal, dismissLevelUpModal } = useFamily();

  return (
    <AnimatePresence>
      {levelUpModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-sm bg-white/90 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-2xl border border-white/60 dark:border-slate-700"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Animated Glow Star Icon */}
            <motion.div
              className="relative w-28 h-28 flex items-center justify-center mb-4"
              initial={{ rotate: -25, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse-subtle" />
              <div className="w-24 h-24 rounded-full bg-linear-to-tr from-[#3525cd] via-[#4f46e5] to-[#8455ef] flex items-center justify-center text-white shadow-xl animate-float">
                <Star className="w-12 h-12 fill-[#ffc107] text-[#ffc107]" />
              </div>
            </motion.div>

            {/* Celebration Text */}
            <motion.div
              className="space-y-1 mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <h2 className="text-3xl font-heading font-extrabold text-[#3525cd] tracking-wider uppercase">
                SUBIU DE NÍVEL!
              </h2>
              <p className="text-lg font-heading font-bold text-slate-800 dark:text-slate-100">
                {levelUpModal.profileName} atingiu o{' '}
                <span className="text-[#6b38d4] font-extrabold">Nível {levelUpModal.newLevel}</span>
              </p>
            </motion.div>

            <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm mb-6 leading-relaxed">
              Continue assim, aventureiro! Novas missões e recompensas épicas esperam por você.
            </p>

            {/* Action Button */}
            <motion.button
              onClick={dismissLevelUpModal}
              whileTap={{ scale: 0.95 }}
              className="w-full h-12 rounded-full bg-[#3525cd] text-white font-heading font-bold text-base hover:bg-[#2e1fb5] transition-all shadow-lg shadow-indigo-500/25 active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-current" />
              Uau!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
