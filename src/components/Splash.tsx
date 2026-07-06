import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, GraduationCap } from 'lucide-react';

interface SplashProps {
  onFinish: () => void;
}

export default function Splash({ onFinish }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-between py-12 px-6 z-50">
      <div />

      <div className="flex flex-col items-center text-center">
        {/* Animated Outer Red Ring with Icon */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-24 h-24 bg-gradient-to-tr from-red-600 to-red-500 rounded-3xl flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(239,68,68,0.5)] mb-6"
        >
          <GraduationCap className="w-12 h-12 text-white" />
        </motion.div>

        {/* Animated Brand Header */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
        >
          Sikkho
        </motion.h1>

        {/* Animated Slogan */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2"
        >
          Learn. Share. Grow. Achieve.
        </motion.p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* Bottom Loading Indicator */}
        <div className="w-24 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="absolute top-0 bottom-0 w-1/2 bg-red-600 rounded-full"
          />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-bold">
          Made with ❤️ by Gautam Tiwari
        </p>
      </div>
    </div>
  );
}
