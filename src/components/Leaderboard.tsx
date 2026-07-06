import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Share2, Copy, CheckCircle, Flame, Gift, HelpCircle, Users } from 'lucide-react';
import { UserProfile } from '../types';

interface LeaderboardProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
}

export default function Leaderboard({ users, currentUser }: LeaderboardProps) {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'points' | 'referrals'>('points');

  // Sort users based on active sub tab
  const sortedUsers = [...users].sort((a, b) => {
    if (activeSubTab === 'points') {
      return b.points - a.points;
    } else {
      return b.referralCount - a.referralCount;
    }
  });

  const handleCopyCode = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (!currentUser) return;
    const shareText = `Hey! Join the Sikkho learning community using my referral code *${currentUser.referralCode}* to discover high-quality programming tutorials and earn rank badges! Download: ${window.location.href}`;
    navigator.clipboard.writeText(shareText);
    alert('🔗 Referral invitation link & text copied to clipboard! You can paste it into WhatsApp, Telegram or SMS to invite friends.');
  };

  // Helper to colorize badges
  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'Diamond':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-900/50';
      case 'Platinum':
        return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/50';
      case 'Gold':
        return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50';
      case 'Silver':
        return 'bg-slate-400/10 text-slate-500 border-slate-200 dark:border-slate-800';
      default:
        return 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/50';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-red-600 to-red-500 text-white p-5 rounded-b-[2.5rem] shadow-md relative shrink-0">
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-1.5 justify-center">
          <Award className="w-6 h-6 animate-pulse text-yellow-300" /> Sikkho Leaderboard
        </h2>
        <p className="text-[11px] text-red-100 text-center mt-1">
          Compete, earn activity points and unlock premier rank badges!
        </p>

        {/* Current User Stats inside Card */}
        {currentUser && (
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={currentUser.photoUrl} className="w-11 h-11 rounded-full object-cover border-2 border-white/30" alt="avatar" />
              <div>
                <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${getBadgeStyle(currentUser.badge)} bg-white text-slate-800`}>
                  {currentUser.badge} Tier
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-red-200 font-bold">Activity Points</p>
              <p className="text-xl font-extrabold text-white">{currentUser.points} PTS</p>
            </div>
          </div>
        )}
      </div>

      {/* Referral Program Segment */}
      {currentUser && (
        <div className="p-4 mx-4 -mt-3.5 bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-100 dark:border-slate-800/80 shrink-0 space-y-3 z-10 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-lg">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-none">Referral Code</h4>
                <p className="text-[10px] text-slate-400 mt-1">Invite friends to install the app!</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
              <span className="font-mono text-xs font-black text-red-600 dark:text-red-400 tracking-wider">
                {currentUser.referralCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-red-500 transition p-0.5"
                title="Copy Code"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/50">
            <div className="text-center p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-slate-400">Total Referrals</span>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5">{currentUser.referralCount}</p>
            </div>
            <button
              onClick={handleShareLink}
              className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs p-2 rounded-xl transition shadow-sm shadow-red-600/10"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Invite
            </button>
          </div>
        </div>
      )}

      {/* Tabs list inside Leaderboard */}
      <div className="mt-4 px-4 shrink-0 flex gap-2">
        <button
          onClick={() => setActiveSubTab('points')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'points'
              ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Activity Points
        </button>
        <button
          onClick={() => setActiveSubTab('referrals')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'referrals'
              ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Top Referrals
        </button>
      </div>

      {/* Leaderboard Scrollable Ranking List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {sortedUsers.map((user, idx) => {
          const rank = idx + 1;
          const isCurrentUser = currentUser?.uid === user.uid;

          return (
            <div
              key={user.uid}
              className={`p-3 rounded-2xl flex items-center gap-3 border transition-all ${
                isCurrentUser
                  ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80'
              }`}
            >
              {/* Rank Badge */}
              <div className="w-6 text-center select-none">
                {rank === 1 ? (
                  <span className="text-lg">🥇</span>
                ) : rank === 2 ? (
                  <span className="text-lg">🥈</span>
                ) : rank === 3 ? (
                  <span className="text-lg">🥉</span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">#{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <img src={user.photoUrl} className="w-10 h-10 rounded-full object-cover border border-slate-100" alt="avatar" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {user.name} {isCurrentUser && <span className="text-[9px] text-red-500 bg-red-100 px-1 py-0.2 rounded font-black ml-1">You</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[8px] uppercase font-bold px-1.5 py-0.2 rounded border ${getBadgeStyle(user.badge)}`}>
                    {user.badge}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {activeSubTab === 'points' ? `${user.points} points` : `${user.referralCount} referrals`}
                  </span>
                </div>
              </div>

              {/* Points Display */}
              <div className="text-right shrink-0">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {activeSubTab === 'points' ? `${user.points} PTS` : `${user.referralCount} REF`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
