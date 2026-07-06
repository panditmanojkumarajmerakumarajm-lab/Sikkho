import React, { useState, useEffect } from 'react';
import { 
  Sparkles, LogIn, LogOut, GraduationCap, Sun, Moon,
  Play, Award, Heart, History, User, Settings, ShieldCheck
} from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isAdmin: boolean;
  userEmail: string;
  activeTab?: 'home' | 'leaderboard' | 'favorites' | 'history' | 'profile';
  setActiveTab?: (tab: 'home' | 'leaderboard' | 'favorites' | 'history' | 'profile') => void;
  onOpenAdmin?: () => void;
}

export default function DeviceFrame({ 
  children, 
  isDarkMode, 
  setIsDarkMode, 
  isAdmin, 
  userEmail,
  activeTab,
  setActiveTab,
  onOpenAdmin
}: DeviceFrameProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'Discover', icon: Play },
    { id: 'leaderboard', label: 'Ranks', icon: Award },
    { id: 'favorites', label: 'Saved', icon: Heart },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'More', icon: User },
  ] as const;

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Premium Web Navigation Header */}
      {userEmail && (
        <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            {/* Logo Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-red-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-display">Sikkho</span>
                  <span className="hidden sm:inline-block text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/20">
                    Web Portal
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 font-medium">Comprehensive Tech Learning Platform</p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            {activeTab && setActiveTab && (
              <nav className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Controls & Quick Actions */}
            <div className="flex items-center gap-2.5">
              {/* Quick Dark Mode */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 transition"
                title="Toggle Dark/Light Mode"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
              </button>

              {isAdmin && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm animate-pulse"
                  title="Open Admin Dashboard Panel"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Console</span>
                </button>
              )}

              {/* User display badge */}
              {userEmail && (
                <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-850">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-red-500 font-display">
                    {userEmail.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-none">Logged In</span>
                    <span className="text-[11px] font-extrabold text-slate-850 dark:text-slate-200 truncate max-w-[120px]">{userEmail}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>
      )}

      {/* Main Responsive Layout Workspace */}
      <main className="flex-1 w-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col relative transition-colors">
        {children}
      </main>
      
    </div>
  );
}
