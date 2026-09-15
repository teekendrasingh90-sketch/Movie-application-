import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Sparkles } from 'lucide-react';
import { iosFeedback } from '../services/iosFeedback';

interface InterfaceIntroSplashProps {
  onFinish?: () => void;
}

export const InterfaceIntroSplash: React.FC<InterfaceIntroSplashProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    iosFeedback('cinema');

    const timer = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 1100);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="interface-intro-splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => {
          setVisible(false);
          onFinish?.();
        }}
        className="fixed inset-0 z-[250] bg-[#060608] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
      >
        {/* Dynamic Projector Light Flares */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-br from-[#FFB020]/25 via-[#7C5CFF]/15 to-transparent blur-[80px] pointer-events-none" />

        {/* Ambient Film Grain Pattern */}
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          {/* Animated Emblem */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-5 flex items-center justify-center"
          >
            {/* Golden Halo Shimmer */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 rounded-full border border-dashed border-[#FFB020]/40"
            />

            <div className="absolute w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#16161D] to-[#242430] border border-white/20 shadow-2xl flex items-center justify-center">
              <Film className="w-8 h-8 text-[#FFB020]" />
            </div>

            <Sparkles className="w-4 h-4 text-[#FFB020] absolute -top-1 -right-1 animate-pulse" />
          </motion.div>

          {/* Glowing Brand Title */}
          <motion.h1
            initial={{ y: 15, opacity: 0, letterSpacing: '0.3em' }}
            animate={{ y: 0, opacity: 1, letterSpacing: '0.15em' }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="text-4xl sm:text-5xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_25px_rgba(255,176,32,0.4)]"
          >
            P<span className="text-[#FFB020]">op</span>
          </motion.h1>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-[#8E8E93] mt-2"
          >
            Movies &amp; Web Series
          </motion.p>

          {/* Loading line indicator */}
          <div className="w-36 h-1 rounded-full bg-white/10 overflow-hidden mt-6">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              className="w-full h-full bg-gradient-to-r from-transparent via-[#FFB020] to-transparent"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
