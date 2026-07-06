import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Play, Award, Users, GraduationCap } from 'lucide-react';

interface OnboardingProps {
  onFinish: () => void;
}

const SLIDES = [
  {
    icon: <Play className="w-12 h-12 text-white" />,
    title: 'Discover Latest Videos',
    description: 'Get handpicked, high-quality YouTube learning content. Touch any video card to launch YouTube instantly and level up your skills.'
  },
  {
    icon: <Award className="w-12 h-12 text-white" />,
    title: 'Earn Points & Badges',
    description: 'Track your watch progress, join community events, and unlock rank badges from Bronze all the way to legendary Diamond tier.'
  },
  {
    icon: <Users className="w-12 h-12 text-white" />,
    title: 'Invite Friends, Build Community',
    description: 'Share your exclusive referral code. Earn special activity bonuses whenever your friends sign up to learn together!'
  }
];

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide === SLIDES.length - 1) {
      onFinish();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 flex flex-col justify-between p-6 z-40 transition-colors duration-300">
      
      {/* Top Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-1">
          <GraduationCap className="w-5 h-5 text-red-600 animate-pulse" />
          <span className="font-bold text-slate-800 dark:text-white">Sikkho</span>
        </div>
        <button
          id="onboarding-skip"
          onClick={onFinish}
          className="text-xs font-semibold text-slate-400 hover:text-red-500 dark:text-slate-600 transition"
        >
          Skip
        </button>
      </div>

      {/* Slide Body */}
      <div className="flex-1 flex flex-col justify-center py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center px-4"
          >
            {/* Slide Icon */}
            <div className="w-24 h-24 bg-red-500 rounded-[2rem] flex items-center justify-center shadow-lg shadow-red-500/20 mb-8">
              {SLIDES[currentSlide].icon}
            </div>

            {/* Slide Title */}
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {SLIDES[currentSlide].title}
            </h2>

            {/* Slide Description */}
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-4 max-w-sm">
              {SLIDES[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col gap-6 pb-6">
        {/* Slide indicators */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx 
                  ? 'w-6 bg-red-600' 
                  : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          id="onboarding-next"
          onClick={handleNext}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-red-600/25 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

    </div>
  );
}
