import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Send, Film, RotateCw, CheckCircle2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, COLLECTIONS, handleFirestoreError, OperationType } from '../lib/firebase';

interface VideoRequestModalProps {
  onClose: () => void;
  userProfile?: any;
  onAddPoints?: (pts: number) => void;
}

export default function VideoRequestModal({ onClose, userProfile, onAddPoints }: VideoRequestModalProps) {
  const [name, setName] = useState(userProfile?.name || '');
  const [mobile, setMobile] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !message.trim()) return;
    setIsSending(true);

    try {
      await addDoc(collection(db, COLLECTIONS.REQUESTS), {
        name: name.trim(),
        mobile: mobile.trim(),
        videoUrl: videoUrl.trim() || null,
        message: message.trim(),
        createdAt: new Date().toISOString()
      });

      if (onAddPoints) {
        onAddPoints(50); // Give 50 points reward!
      }
      setSuccess(true);
    } catch (err) {
      console.error('Failed to submit request:', err);
      handleFirestoreError(err, OperationType.CREATE, COLLECTIONS.REQUESTS);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 z-40 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Film className="text-red-500 w-5 h-5" /> Video Request Form
        </h3>
        <button id="request-close" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 animate-bounce" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white text-lg">Request Saved Successfully!</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
            Your request has been saved to Firebase Firestore. Admin Gautam Tiwari will review it and upload a matching tutorial soon.
          </p>
          <p className="text-xs text-red-500 font-bold mt-2">
            You earned +50 Activity Points!
          </p>
          <button
            onClick={onClose}
            className="mt-6 bg-red-600 text-white font-semibold text-xs py-2 px-5 rounded-lg hover:bg-red-700 transition"
          >
            Great, Thanks!
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col flex-1 pb-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Can't find a topic you want? Submit a tutorial idea or video remix request. We will create a YouTube video covering it!
          </p>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 8955932061"
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Reference YouTube Link (Optional)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Topic / Message</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what tutorial topic or code you would like Gautam Tiwari to teach..."
              className="w-full flex-1 p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 dark:text-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSending || !name.trim() || !mobile.trim() || !message.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-red-600/20 disabled:opacity-55 mt-auto"
          >
            {isSending ? <RotateCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Request
          </button>
        </form>
      )}
    </div>
  );
}
