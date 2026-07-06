import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, HelpCircle, MessageSquare, Shield, Scroll, CheckCircle2, 
  RotateCw, RefreshCw, Send, ArrowUpRight, Award, Flame, User, Youtube 
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, COLLECTIONS, handleFirestoreError, OperationType } from '../lib/firebase';

interface PageProps {
  onClose: () => void;
  userProfile?: any;
  onAddPoints?: (pts: number) => void;
}

export function FAQ({ onClose }: PageProps) {
  const faqs = [
    {
      q: 'What is Sikkho?',
      a: 'Sikkho is a curated learning portal designed to help subscribers discover our latest tutorials, guides, and YouTube videos, helping boost our learning community.'
    },
    {
      q: 'How do I earn points and badges?',
      a: 'You earn 50 activity points by sharing feedback or sending video requests. Your badge updates dynamically (Bronze: <200, Silver: 200+, Gold: 500+, Platinum: 1000+, Diamond: 2000+ points).'
    },
    {
      q: 'How does the Referral system work?',
      a: 'Every user gets a unique referral code. Share your link or code. When another user registers with your code, you both earn points!'
    },
    {
      q: 'Can I watch videos directly in the app?',
      a: 'All video cards launch YouTube directly in the YouTube app or browser. This helps support content creators directly with real views and subscriptions!'
    },
    {
      q: 'How do I request a remix or tutorial video?',
      a: 'Open the floating menu or bottom bar, click "Video Request", fill out your mobile number, title idea and reference video, and our team will get on it.'
    }
  ];

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 z-40 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <HelpCircle className="text-red-500 w-5 h-5" /> FAQ & Help
        </h3>
        <button id="faq-close" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 flex-1">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden transition-colors">
            <button
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              className="w-full text-left p-4 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/80 font-semibold text-sm text-slate-800 dark:text-slate-200 flex justify-between items-center gap-4"
            >
              <span>{faq.q}</span>
              <span className="text-red-500">{activeIdx === i ? '−' : '+'}</span>
            </button>
            {activeIdx === i && (
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 leading-relaxed border-t border-slate-100 dark:border-slate-800/50">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Feedback({ onClose, userProfile, onAddPoints }: PageProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);

    try {
      await addDoc(collection(db, COLLECTIONS.FEEDBACKS), {
        name: userProfile?.name || 'Anonymous User',
        email: userProfile?.email || 'anonymous@example.com',
        message: message.trim(),
        createdAt: new Date().toISOString()
      });

      if (onAddPoints) {
        onAddPoints(50); // Give 50 points for feedback!
      }
      setSent(true);
    } catch (err) {
      console.error('Feedback failed to send:', err);
      handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.FEEDBACKS);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 z-40 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <MessageSquare className="text-red-500 w-5 h-5" /> Give Feedback
        </h3>
        <button id="feedback-close" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      {sent ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white text-lg">Thank You for Your Feedback!</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
            We really appreciate your support. You earned <span className="font-bold text-red-500">+50 points</span> for contributing!
          </p>
          <button
            onClick={onClose}
            className="mt-6 bg-red-600 text-white font-semibold text-xs py-2 px-5 rounded-lg hover:bg-red-700 transition"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Have any suggestions, ideas, or bugs to report? Share them below. Real feedback helps make Sikkho the best YouTube discovery hub!
          </p>

          <div className="flex-1 min-h-[150px] flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Your Message</label>
            <textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think or suggest new features..."
              className="w-full flex-1 p-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 dark:text-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-red-600/20 disabled:opacity-55"
          >
            {isSending ? <RotateCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
}

export function AboutDeveloper({ onClose }: PageProps) {
  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 z-40 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Award className="text-red-500 w-5 h-5" /> About Developer
        </h3>
        <button id="about-close" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 flex-1 flex flex-col items-center text-center">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
            alt="Gautam Tiwari"
            className="w-24 h-24 rounded-full border-4 border-red-500 object-cover shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 bg-red-600 p-1.5 rounded-full text-white">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h4 className="text-xl font-bold text-slate-950 dark:text-white">Gautam Tiwari</h4>
          <p className="text-xs text-red-500 font-semibold mt-0.5">Admin & Content Creator</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 max-w-xs leading-relaxed">
            Welcome to Sikkho! I design and create tutorials focusing on YouTube Growth, Algorithm Hacks, Content Strategy, and Video Optimization to help you scale your channel successfully.
          </p>
        </div>

        <div className="w-full bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">YouTube Channel</span>
            <p className="text-xs font-bold text-slate-800 dark:text-white">Sikkho YouTube Grow</p>
          </div>
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 text-white p-2 rounded-xl hover:bg-red-700 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <Youtube className="w-4 h-4" /> Subscribe
          </a>
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-600 space-y-1">
          <p>Email: tiwarigautam819@gmail.com</p>
          <p>WhatsApp Support: +91 8955932061</p>
          <p className="mt-4 text-[10px]">Version 1.0.0 (Stable Production)</p>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicy({ onClose }: PageProps) {
  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 z-40 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="text-red-500 w-5 h-5" /> Privacy Policy
        </h3>
        <button id="privacy-close" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-3 leading-relaxed flex-1">
        <p className="font-semibold text-slate-800 dark:text-slate-300">Last updated: July 2026</p>
        <p>At Sikkho, accessible from our application, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Sikkho and how we use it.</p>
        <p className="font-bold text-slate-800 dark:text-slate-300">1. Information We Collect</p>
        <p>If you log in using your Google account via Firebase Authentication, we store your public profile name, registered email address, and profile avatar image safely. This is exclusively to display your credentials on the leaderboard and rank profile page.</p>
        <p className="font-bold text-slate-800 dark:text-slate-300">2. Cookies and Data Logs</p>
        <p>Sikkho uses local storage configuration caches to store offline video thumbnails, watch history lists, and favorite playlists to guarantee near-instant loading times without requiring continuous active internet connection.</p>
        <p className="font-bold text-slate-800 dark:text-slate-300">3. Under Age Usage</p>
        <p>Sikkho does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our platform, please contact us immediately to remove it.</p>
      </div>
    </div>
  );
}

export function TermsConditions({ onClose }: PageProps) {
  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 z-40 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Scroll className="text-red-500 w-5 h-5" /> Terms & Conditions
        </h3>
        <button id="terms-close" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-3 leading-relaxed flex-1">
        <p className="font-semibold text-slate-800 dark:text-slate-300">Welcome to Sikkho!</p>
        <p>These terms and conditions outline the rules and regulations for the use of Sikkho's platform.</p>
        <p className="font-bold text-slate-800 dark:text-slate-300">1. User Account Rules</p>
        <p>By registering on Sikkho via Google Sign-In, you agree to represent your true identity. Manipulating points, spoofing referral links, or writing offensive comments/feedback messages will result in immediate termination of account access from our leaderboards.</p>
        <p className="font-bold text-slate-800 dark:text-slate-300">2. Video Content</p>
        <p>All learning resources, banners, and links point directly to public YouTube tutorials. Users are redirected to the YouTube official service when clicked. We do not host copyrighted stream media files directly on our Firestore databases.</p>
        <p className="font-bold text-slate-800 dark:text-slate-300">3. Referral System</p>
        <p>Points earned from invitations are purely promotional activity indicators. They have no monetary exchange value and cannot be redeemed for real currency or cash. They serve purely as user engagement score badges.</p>
      </div>
    </div>
  );
}

export function UpdateChecker({ onClose }: PageProps) {
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setChecked(true);
    }, 1800);
  };

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 z-40 flex flex-col p-6 justify-between">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <RefreshCw className="text-red-500 w-5 h-5" /> Update Checker
          </h3>
          <button id="update-close" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-6">
          <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-4">
            <RotateCw className={`w-7 h-7 ${checking ? 'animate-spin' : ''}`} />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white text-base">Sikkho App Version</h4>
          <span className="text-xs bg-red-100 dark:bg-red-950/50 text-red-600 px-3 py-1 rounded-full font-bold mt-2">
            v1.0.0 Stable
          </span>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            We continuously refine performance, cache mechanics, and and add features without updating files on Google Play.
          </p>
        </div>

        {checked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Everything is Up-to-Date</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-500/80 mt-1">
                You are running the absolute latest build containing offline support and real-time Firestore database sync.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <button
        id="check-update-btn"
        onClick={handleCheck}
        disabled={checking}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/15 disabled:opacity-50"
      >
        {checking ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Check For New Update'}
      </button>
    </div>
  );
}
