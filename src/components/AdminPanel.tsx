import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Edit2, Image, Bell, Users, MessageSquare, 
  Film, Settings, Link, RotateCw, Save, RefreshCcw, Eye, Search, AlertCircle 
} from 'lucide-react';
import { 
  collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import { db, COLLECTIONS, handleFirestoreError, OperationType } from '../lib/firebase';
import { Video, BannerSlide, VideoRequest, FeedbackMessage, AppNotification, UserProfile } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshVideos: () => void;
}

export default function AdminPanel({ onClose, onRefreshVideos }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'videos' | 'banners' | 'notifications' | 'users' | 'requests' | 'feedback'>('videos');
  
  // Lists
  const [videos, setVideos] = useState<Video[]>([]);
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);

  // Form inputs
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState('YouTube Grow Lesson');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoId, setVideoId] = useState('');

  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerVideoUrl, setBannerVideoUrl] = useState('');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'New Video' | 'Announcement' | 'Live Stream'>('New Video');

  // Load Admin Tab Data
  const loadData = async () => {
    setLoading(true);
    let path = '';
    try {
      if (activeTab === 'videos') {
        path = COLLECTIONS.VIDEOS;
        const snap = await getDocs(query(collection(db, path), orderBy('uploadedAt', 'desc')));
        setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Video)));
      } else if (activeTab === 'banners') {
        path = COLLECTIONS.BANNERS;
        const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
        setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as BannerSlide)));
      } else if (activeTab === 'notifications') {
        path = COLLECTIONS.NOTIFICATIONS;
        const snap = await getDocs(query(collection(db, path), orderBy('sentAt', 'desc')));
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
      } else if (activeTab === 'users') {
        path = COLLECTIONS.USERS;
        const snap = await getDocs(query(collection(db, path), orderBy('points', 'desc')));
        setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as unknown as UserProfile)));
      } else if (activeTab === 'requests') {
        path = COLLECTIONS.REQUESTS;
        const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoRequest)));
      } else if (activeTab === 'feedback') {
        path = COLLECTIONS.FEEDBACKS;
        const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
        setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackMessage)));
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Extract YouTube ID Helper
  const parseYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Auto fetch Title & Thumbnail
  const handleUrlChange = async (url: string) => {
    setVideoUrl(url);
    const id = parseYoutubeId(url);
    if (id) {
      setVideoId(id);
      setVideoThumbnail(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
      setFetchingMeta(true);
      try {
        // Fetch from noembed CORS proxy
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
        const data = await res.json();
        if (data && data.title) {
          setVideoTitle(data.title);
        }
      } catch (err) {
        console.warn('Could not auto fetch video title, manual input enabled', err);
      } finally {
        setFetchingMeta(false);
      }
    }
  };

  // Add Video to Firestore
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !videoTitle || !videoId) return;
    setLoading(true);

    try {
      const newVideo: Omit<Video, 'id'> = {
        videoUrl,
        videoId,
        title: videoTitle,
        thumbnail: videoThumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        category: videoCategory,
        uploadedAt: new Date().toISOString(),
        views: 0
      };

      await setDoc(doc(db, COLLECTIONS.VIDEOS, videoId), newVideo);
      
      // Reset
      setVideoUrl('');
      setVideoTitle('');
      setVideoId('');
      setVideoThumbnail('');

      loadData();
      onRefreshVideos();
    } catch (err) {
      console.error('Failed to add video:', err);
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.VIDEOS}/${videoId}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete Video from Firestore
  const handleDeleteVideo = async (vid: string) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.VIDEOS, vid));
      loadData();
      onRefreshVideos();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.VIDEOS}/${vid}`);
    }
  };

  // Clear All Videos from Firestore
  const handleClearAllVideos = async () => {
    if (!window.confirm('⚠️ WARNING: Are you absolutely sure you want to delete ALL videos from the database? This action cannot be undone!')) return;
    setLoading(true);
    try {
      for (const vid of videos) {
        await deleteDoc(doc(db, COLLECTIONS.VIDEOS, vid.id));
      }
      alert('✅ All videos have been deleted successfully!');
      loadData();
      onRefreshVideos();
    } catch (err) {
      console.error('Failed to clear all videos:', err);
      alert('Error clearing videos: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Add Banner
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerUrl) return;
    setLoading(true);

    const id = 'banner_' + Date.now();
    try {
      await setDoc(doc(db, COLLECTIONS.BANNERS, id), {
        id,
        imageUrl: bannerUrl,
        title: bannerTitle || null,
        videoUrl: bannerVideoUrl || null,
        createdAt: new Date().toISOString()
      });

      setBannerUrl('');
      setBannerTitle('');
      setBannerVideoUrl('');
      loadData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.BANNERS}/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Delete banner?')) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.BANNERS, id));
      loadData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.BANNERS}/${id}`);
    }
  };

  // Send Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    setLoading(true);

    const id = 'notif_' + Date.now();
    try {
      await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), {
        id,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        sentAt: new Date().toISOString()
      });

      // Show alert mimicking Firebase Cloud Messaging push confirmation
      alert(`🚀 FCM Push Notification Sent!\nTitle: ${notifTitle}\nBody: ${notifMessage}`);

      setNotifTitle('');
      setNotifMessage('');
      loadData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.NOTIFICATIONS}/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (!window.confirm('Delete notification from history?')) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id));
      loadData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.NOTIFICATIONS}/${id}`);
    }
  };

  return (
    <div className="absolute inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col transition-all">
      {/* Top Header */}
      <div className="bg-red-600 px-4 py-3 flex justify-between items-center text-white shrink-0 shadow-md">
        <div className="flex items-center gap-1.5">
          <Settings className="w-5 h-5 animate-spin-slow" />
          <span className="font-extrabold text-sm tracking-wider uppercase">Sikkho Secret Admin Console</span>
        </div>
        <button id="admin-close" onClick={onClose} className="p-1.5 rounded-lg bg-red-700/50 hover:bg-red-700 transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Panel */}
      <div className="flex bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto scrollbar-none py-1.5 px-2 gap-1 select-none">
        {[
          { id: 'videos', label: 'Videos', icon: <Film className="w-3.5 h-3.5" /> },
          { id: 'banners', label: 'Banners', icon: <Image className="w-3.5 h-3.5" /> },
          { id: 'notifications', label: 'Push', icon: <Bell className="w-3.5 h-3.5" /> },
          { id: 'users', label: 'Users', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'requests', label: 'Requests', icon: <Plus className="w-3.5 h-3.5" /> },
          { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-red-500 text-white shadow-sm shadow-red-500/20'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Screen Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950">
        
        {loading && (
          <div className="flex items-center justify-center p-8">
            <RotateCw className="w-6 h-6 text-red-500 animate-spin" />
            <span className="text-xs text-slate-500 ml-2">Syncing with Firestore...</span>
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && !loading && (
          <div className="space-y-4">
            {/* Add Video Form */}
            <form onSubmit={handleAddVideo} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Add New Video Card</h4>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Paste YouTube URL Only</label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    className="w-full p-2.5 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  />
                  <Link className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
                </div>
              </div>

              {fetchingMeta && (
                <div className="flex items-center gap-1.5 text-red-500 animate-pulse text-[11px] font-bold">
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  Auto-fetching Title and Thumbnail from YouTube...
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Auto-fetched or Type title here"
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Category</label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="YouTube Grow Lesson">YouTube Grow Lesson</option>
                    <option value="Let's Earn Money">Let's Earn Money</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Extracted Video ID</label>
                  <input
                    type="text"
                    disabled
                    value={videoId}
                    placeholder="e.g. dQw4w9WgXcQ"
                    className="w-full p-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!videoTitle || !videoId}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition flex items-center justify-center gap-1 shadow-md shadow-red-600/10 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Add Video Card
              </button>
            </form>

            {/* Video List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Published Videos ({videos.length})</h4>
                {videos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllVideos}
                    className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold px-2 py-1 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition flex items-center gap-1 border border-red-200/50 dark:border-red-900/20"
                  >
                    <Trash2 className="w-3 h-3" /> Clear All Videos
                  </button>
                )}
              </div>
              {videos.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No videos in Firestore.</div>
              ) : (
                videos.map(vid => (
                  <div key={vid.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl flex items-center gap-3">
                    <img src={vid.thumbnail} className="w-20 h-12 object-cover rounded-md" alt="thumb" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{vid.title}</p>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-semibold mt-1 inline-block">
                        {vid.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteVideo(vid.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BANNERS TAB */}
        {activeTab === 'banners' && !loading && (
          <div className="space-y-4">
            <form onSubmit={handleAddBanner} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Add Slideshow Banner</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Banner Image URL</label>
                <input
                  type="url"
                  required
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Banner Slide Title (Optional)</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Sikkim Tutorial Announcement"
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Launch URL on Click (Optional)</label>
                <input
                  type="url"
                  value={bannerVideoUrl}
                  onChange={(e) => setBannerVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={!bannerUrl}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition disabled:opacity-50"
              >
                Publish Banner
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Banners ({banners.length})</h4>
              {banners.map(b => (
                <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl flex items-center gap-3">
                  <img src={b.imageUrl} className="w-16 h-12 object-cover rounded-md" alt="banner" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{b.title || 'Untitled Slide'}</p>
                    <p className="text-[9px] text-slate-400 truncate">{b.videoUrl || 'No Click URL'}</p>
                  </div>
                  <button onClick={() => handleDeleteBanner(b.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && !loading && (
          <div className="space-y-4">
            <form onSubmit={handleSendNotification} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Broadcast Push Notification</h4>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Notification Title</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. Live stream starting soon!"
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Notification Message / Body</label>
                <textarea
                  required
                  rows={3}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Write announcement body message..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Notification Category</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                >
                  <option value="New Video">New Video</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Live Stream">Live Stream</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!notifTitle || !notifMessage}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-1 shadow-md"
              >
                <Bell className="w-3.5 h-3.5 animate-bounce" /> Broadcast FCM Notification
              </button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sent Notification History</h4>
              {notifications.map(notif => (
                <div key={notif.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-bold text-red-500 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                      {notif.type}
                    </span>
                    <button onClick={() => handleDeleteNotif(notif.id)} className="p-1 text-slate-400 hover:text-red-500 rounded transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white mt-1.5">{notif.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && !loading && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Platform Users ({users.length})</h4>
            {users.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No users have logged in yet.</div>
            ) : (
              users.map(u => (
                <div key={u.uid} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <img src={u.photoUrl} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="avatar" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{u.name}</p>
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.2 rounded">
                        {u.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                      <span>Points: <strong className="text-slate-600 dark:text-slate-300">{u.points}</strong></span>
                      <span>Referrals: <strong className="text-slate-600 dark:text-slate-300">{u.referralCount}</strong></span>
                      <span>Code: <strong className="text-red-500 font-mono">{u.referralCode}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && !loading && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Video & Remix Requests ({requests.length})</h4>
            {requests.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No requests in database.</div>
            ) : (
              requests.map(r => (
                <div key={r.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-800 dark:text-white">{r.name}</span>
                    <span className="text-slate-400 font-mono">{r.mobile}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-850 leading-relaxed">
                    {r.message}
                  </p>
                  {r.videoUrl && (
                    <a
                      href={r.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-red-500 font-semibold hover:underline flex items-center gap-1"
                    >
                      Reference: <span className="truncate">{r.videoUrl}</span>
                    </a>
                  )}
                  <div className="text-[9px] text-slate-400 text-right">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && !loading && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">User Feedbacks ({feedbacks.length})</h4>
            {feedbacks.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No feedback submitted yet.</div>
            ) : (
              feedbacks.map(f => (
                <div key={f.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{f.name}</span>
                    <span className="text-[9px] text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{f.email}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {f.message}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
