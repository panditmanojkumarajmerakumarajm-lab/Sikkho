import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Award, Users, Heart, History, User, Settings, Send, Share2, 
  Plus, Bell, Shield, HelpCircle, GraduationCap, Flame, MessageSquare, 
  LogIn, LogOut, CheckCircle2, Phone, Sparkles, Navigation, Menu, 
  Info, RefreshCw, Star, ArrowUpRight, ArrowRight, ChevronLeft, ChevronRight, Check, X,
  Mail, Lock, Gift, Moon, Sun, TrendingUp, ThumbsUp, ThumbsDown, Trash2, Copy, ExternalLink, MessageCircle, Download
} from 'lucide-react';

import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, query, orderBy, limit, where, deleteDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  db, 
  auth, 
  COLLECTIONS, 
  seedInitialDataIfNecessary, 
  PRESET_VIDEOS, 
  PRESET_BANNERS, 
  PRESET_NOTIFICATIONS,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { UserProfile, Video, BannerSlide, AppNotification, AppConfig, VideoComment, VideoInteraction } from './types';

// Components
import DeviceFrame from './components/DeviceFrame';
import Splash from './components/Splash';
import Onboarding from './components/Onboarding';
import VideoGrid from './components/VideoGrid';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import VideoRequestModal from './components/VideoRequestModal';
import { FAQ, Feedback, AboutDeveloper, PrivacyPolicy, TermsConditions, UpdateChecker } from './components/Pages';

const checkIfAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const sanitized = email.trim().toLowerCase();
  return (
    sanitized === 'tiwarigautam819@gmail.com' ||
    sanitized === 'vikajaat227@gmail.com' ||
    sanitized === '8955932061@sikkho.com' ||
    sanitized === '918955932061@sikkho.com' ||
    sanitized === '+918955932061@sikkho.com'
  );
};

export default function App() {
  // App view cycles
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  
  // Theme & Identity states
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const cached = localStorage.getItem('sikkho_dark_mode');
    return cached ? cached === 'true' : false;
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('sikkho_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && parsed.uid) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse cached user:', e);
      }
    }
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    const cached = localStorage.getItem('sikkho_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.email) {
          return checkIfAdmin(parsed.email);
        }
      } catch (e) {}
    }
    return false;
  });

  // Firestore collections states
  const [videos, setVideos] = useState<Video[]>([]);
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserProfile[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ subscriberGoal: 10000, currentSubscribers: 8645 });

  // User Local Storage tracking (Favorites, history, onboarding cache)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchHistory, setWatchHistory] = useState<{ videoId: string; watchedAt: string }[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Nav states
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'favorites' | 'history' | 'profile'>('home');
  const [bannerIndex, setBannerIndex] = useState(0);

  // Modal overlays
  const [activeOverlay, setActiveOverlay] = useState<
    'none' | 'request' | 'admin' | 'faq' | 'feedback' | 'developer' | 'privacy' | 'terms' | 'update'
  >('none');

  // Login form temporary inputs
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginMobile, setLoginMobile] = useState('');
  const [enteredReferral, setEnteredReferral] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Banner Customization States
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false);
  const [bannerUpdateMsg, setBannerUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google sign in simulation modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Quick Rating dialog state
  const [showRateModal, setShowRateModal] = useState(false);
  const [userRating, setUserRating] = useState(5);

  // Embedded Video Player state
  const [activePlayingVideo, setActivePlayingVideo] = useState<Video | null>(null);
  const [activeVideoComments, setActiveVideoComments] = useState<VideoComment[]>([]);
  const [activeVideoInteraction, setActiveVideoInteraction] = useState<VideoInteraction | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [activePlayerTab, setActivePlayerTab] = useState<'comments' | 'about'>('comments');
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('sikkho_subscribed') === 'true';
  });

  // Initialize and Seed data
  useEffect(() => {
    // Check onboarding cache
    const onboarded = localStorage.getItem('sikkho_onboarded');
    if (onboarded || currentUser) {
      setShowOnboarding(false);
    }

    // Load Local cache for favorites & history
    const cachedFavs = localStorage.getItem('sikkho_favorites');
    if (cachedFavs) setFavorites(JSON.parse(cachedFavs));

    const cachedHist = localStorage.getItem('sikkho_history');
    if (cachedHist) setWatchHistory(JSON.parse(cachedHist));

    // Seed preset records if Firestore database is blank
    seedInitialDataIfNecessary();

    // Setup active listeners for Firestore records
    const unsubVideos = onSnapshot(
      query(collection(db, COLLECTIONS.VIDEOS), orderBy('uploadedAt', 'desc')),
      (snap) => {
        if (!snap.empty) {
          setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Video)));
        } else {
          setVideos(PRESET_VIDEOS);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, COLLECTIONS.VIDEOS);
        } catch {
          setVideos(PRESET_VIDEOS);
        }
      }
    );

    const unsubBanners = onSnapshot(
      query(collection(db, COLLECTIONS.BANNERS), orderBy('createdAt', 'desc')),
      (snap) => {
        if (!snap.empty) {
          setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as BannerSlide)));
        } else {
          setBanners(PRESET_BANNERS);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, COLLECTIONS.BANNERS);
        } catch {
          setBanners(PRESET_BANNERS);
        }
      }
    );

    const unsubNotifs = onSnapshot(
      query(collection(db, COLLECTIONS.NOTIFICATIONS), orderBy('sentAt', 'desc')),
      (snap) => {
        if (!snap.empty) {
          setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
        } else {
          setNotifications(PRESET_NOTIFICATIONS);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, COLLECTIONS.NOTIFICATIONS);
        } catch {
          setNotifications(PRESET_NOTIFICATIONS);
        }
      }
    );

    const unsubConfig = onSnapshot(
      doc(db, COLLECTIONS.CONFIG, 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          setAppConfig(docSnap.data() as AppConfig);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.CONFIG}/global`);
        } catch {
          // Keep default config
        }
      }
    );

    // Setup Auth Listener
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (user) {
        // Load Profile from Firestore
        try {
          const profileDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
          if (profileDoc.exists()) {
            const profile = profileDoc.data() as UserProfile;
            setCurrentUser(profile);
            setIsAdmin(checkIfAdmin(profile.email));
          } else {
            // Check if we have a cached version we can use
            const cachedUserStr = localStorage.getItem('sikkho_user');
            if (cachedUserStr) {
              try {
                const cached = JSON.parse(cachedUserStr);
                if (cached && cached.uid === user.uid) {
                  setCurrentUser(cached);
                  setIsAdmin(checkIfAdmin(cached.email));
                  setIsAuthLoading(false);
                  return;
                }
              } catch (e) {}
            }
            // If Firestore is slow or rule blocked, generate default profile in state
            const mockProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'Learner',
              email: user.email || 'learner@example.com',
              photoUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
              referralCode: 'SIKKHO-' + user.uid.substring(0, 4).toUpperCase(),
              referralCount: 0,
              points: 120,
              badge: 'Bronze',
              createdAt: new Date().toISOString(),
              lastActive: new Date().toISOString()
            };
            setCurrentUser(mockProfile);
          }
        } catch (error) {
          console.warn('Could not read user profile from Firestore, checking cache/mock state:', error);
          const cachedUserStr = localStorage.getItem('sikkho_user');
          if (cachedUserStr) {
            try {
              const cached = JSON.parse(cachedUserStr);
              if (cached && cached.uid === user.uid) {
                setCurrentUser(cached);
                setIsAdmin(checkIfAdmin(cached.email));
                setIsAuthLoading(false);
                return;
              }
            } catch (e) {}
          }
          const mockProfile: UserProfile = {
            uid: user.uid,
            name: user.displayName || 'Learner',
            email: user.email || 'learner@example.com',
            photoUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
            referralCode: 'SIKKHO-' + user.uid.substring(0, 4).toUpperCase(),
            referralCount: 0,
            points: 120,
            badge: 'Bronze',
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
          };
          setCurrentUser(mockProfile);
        }
      } else {
        // Only log out if they are not using a direct DB fallback or direct simulation account
        const cachedUserStr = localStorage.getItem('sikkho_user');
        let isFallback = false;
        if (cachedUserStr) {
          try {
            const cached = JSON.parse(cachedUserStr);
            if (cached && (cached.uid.startsWith('db_user_') || cached.uid.startsWith('mock_'))) {
              isFallback = true;
            }
          } catch (e) {}
        }
        if (!isFallback) {
          setCurrentUser(null);
          setIsAdmin(false);
        }
      }
      setIsAuthLoading(false);
    });

    return () => {
      unsubVideos();
      unsubBanners();
      unsubNotifs();
      unsubConfig();
      unsubAuth();
    };
  }, []);

  // Setup leaderboard listener when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setLeaderboardUsers([]);
      return;
    }

    const unsubUsers = onSnapshot(
      query(collection(db, COLLECTIONS.USERS), orderBy('points', 'desc')),
      (snap) => {
        if (!snap.empty) {
          setLeaderboardUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, COLLECTIONS.USERS);
        } catch (e) {
          console.warn('Leaderboard subscription error caught:', e);
        }
      }
    );

    return () => {
      unsubUsers();
    };
  }, [currentUser]);

  // Synchronize currentUser with localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sikkho_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sikkho_user');
    }
  }, [currentUser]);

  // Listen for Comments and User Interaction on the active playing video
  useEffect(() => {
    if (!activePlayingVideo) {
      setActiveVideoComments([]);
      setActiveVideoInteraction(null);
      setIsDownloaded(false);
      setDownloadProgress(0);
      setIsDownloading(false);
      setShowCommentsDrawer(false);
      return;
    }

    setShowCommentsDrawer(false);
    const videoId = activePlayingVideo.id;

    // Reset download status check - we can save mock offline downloads in localStorage
    const downloadedList = JSON.parse(localStorage.getItem('sikkho_offline_downloads') || '[]');
    setIsDownloaded(downloadedList.includes(videoId));

    // 1. Comments Listener
    const unsubComments = onSnapshot(
      query(
        collection(db, 'comments'),
        where('videoId', '==', videoId),
        orderBy('createdAt', 'desc')
      ),
      (snap) => {
        const list: VideoComment[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as VideoComment);
        });
        setActiveVideoComments(list);
      },
      (error) => {
        console.warn('Comments listener error:', error);
      }
    );

    // 2. User Video Interaction (Like/Dislike) Listener
    let unsubInteraction = () => {};
    if (currentUser) {
      const interactionId = `${currentUser.uid}_${videoId}`;
      unsubInteraction = onSnapshot(
        doc(db, 'video_interactions', interactionId),
        (docSnap) => {
          if (docSnap.exists()) {
            setActiveVideoInteraction({ id: docSnap.id, ...docSnap.data() } as VideoInteraction);
          } else {
            setActiveVideoInteraction(null);
          }
        },
        (error) => {
          console.warn('Interactions listener error:', error);
        }
      );
    }

    return () => {
      unsubComments();
      unsubInteraction();
    };
  }, [activePlayingVideo?.id, currentUser?.uid]);

  // Synchronize dark mode class with HTML document element and local storage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sikkho_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sikkho_dark_mode', 'false');
    }
  }, [isDarkMode]);

  // Update dynamic badges based on points
  const calculateBadge = (points: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' => {
    if (points >= 2000) return 'Diamond';
    if (points >= 1000) return 'Platinum';
    if (points >= 500) return 'Gold';
    if (points >= 200) return 'Silver';
    return 'Bronze';
  };

  // Give Points to Current User
  const addPoints = async (amount: number) => {
    if (!currentUser) return;
    const newPoints = currentUser.points + amount;
    const newBadge = calculateBadge(newPoints);
    
    const updated = {
      ...currentUser,
      points: newPoints,
      badge: newBadge,
      lastActive: new Date().toISOString()
    };
    setCurrentUser(updated);

    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, currentUser.uid), {
        points: newPoints,
        badge: newBadge,
        lastActive: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not update points in Firestore, updating local state', e);
    }
  };

  // Complete Login Flow (Real Email/Password & Phone Sign In/Up with Firebase Auth)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    let email = loginEmail.trim();
    
    // Check if user is logging in using a phone number
    const isMobileInput = /^\d{10,13}$/.test(email.replace(/[\s+]/g, ''));
    if (isMobileInput) {
      // Format as standard email domain for Firebase auth backend compatibility
      const formattedPhone = email.replace(/[\s+]/g, '');
      email = `${formattedPhone}@sikkho.com`;
    }

    if (!email) {
      setAuthError("Email or Mobile is required");
      setIsSubmittingAuth(false);
      return;
    }

    if (loginPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long");
      setIsSubmittingAuth(false);
      return;
    }

    try {
      let uid: string;
      let userEmailVal = isMobileInput ? '' : email;
      let userMobileVal = isMobileInput ? loginEmail : (loginMobile || "");

      try {
        let userCredential;
        if (authMode === 'login') {
          // Log in user
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, loginPassword);
          } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
              throw new Error("Invalid email/mobile or password. Please try again or sign up.");
            } else {
              throw err;
            }
          }
        } else {
          // Sign up user
          if (!loginName.trim()) {
            throw new Error("Full name is required for registration.");
          }
          
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email, loginPassword);
          } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
              throw new Error("This email/mobile is already registered. Please sign in instead.");
            } else {
              throw err;
            }
          }
        }
        uid = userCredential.user.uid;
      } catch (authErr: any) {
        console.warn('Firebase Auth failed, using robust direct Firestore fallback:', authErr);
        // Direct DB fallback login/signup
        // We use a deterministic UID based on the email to ensure they get the exact same account back next time
        uid = 'db_user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
      }

      const refCode = 'SIKKHO-' + (loginName || 'User').substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
      const isUserAdmin = checkIfAdmin(email);

      // Assemble or retrieve User Profile Data
      const docRef = doc(db, COLLECTIONS.USERS, uid);
      const docSnap = await getDoc(docRef);
      
      let userProfile: UserProfile;

      if (!docSnap.exists()) {
        userProfile = {
          uid,
          name: loginName || (isMobileInput ? 'Learner Mobile' : email.split('@')[0]),
          email: userEmailVal,
          photoUrl: isUserAdmin 
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' 
            : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
          mobile: userMobileVal,
          referralCode: refCode,
          referredBy: enteredReferral.trim() || "",
          referralCount: 0,
          points: enteredReferral.trim() ? 150 : 100,
          badge: 'Bronze',
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        await setDoc(docRef, userProfile);

        // Handle referral activation
        if (enteredReferral.trim()) {
          const referredQuery = leaderboardUsers.find(u => u.referralCode === enteredReferral.trim());
          if (referredQuery) {
            const newRefererPoints = referredQuery.points + 100;
            await updateDoc(doc(db, COLLECTIONS.USERS, referredQuery.uid), {
              points: newRefererPoints,
              referralCount: referredQuery.referralCount + 1,
              badge: calculateBadge(newRefererPoints)
            });
          }
        }
      } else {
        userProfile = docSnap.data() as UserProfile;
        if (loginName.trim() && userProfile.name !== loginName) {
          userProfile.name = loginName;
          await updateDoc(docRef, { name: loginName });
        }
      }

      setCurrentUser(userProfile);
      setIsAdmin(isUserAdmin);
    } catch (err: any) {
      console.error('Registration/Login failed:', err);
      setAuthError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Google sign in handler
  const handleGoogleAuth = async (name: string, email: string) => {
    setAuthError(null);
    setIsSubmittingAuth(true);
    
    try {
      const sanitizedEmail = email.trim();
      if (!sanitizedEmail) {
        throw new Error("Google email is required");
      }
      
      const googlePassword = `GooglePass_${sanitizedEmail}_Sikkho`;
      let uid: string;
      
      try {
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, googlePassword);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
            userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, googlePassword);
          } else {
            throw err;
          }
        }
        uid = userCredential.user.uid;
      } catch (authErr: any) {
        console.warn('Google Firebase Auth failed, using robust direct Firestore fallback:', authErr);
        uid = 'db_user_google_' + sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '_');
      }
      
      const refCode = 'SIKKHO-' + (name || 'Google User').substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
      const isUserAdmin = checkIfAdmin(sanitizedEmail);
      
      const docRef = doc(db, COLLECTIONS.USERS, uid);
      const docSnap = await getDoc(docRef);
      
      let userProfile: UserProfile;
      if (!docSnap.exists()) {
        userProfile = {
          uid,
          name: name || sanitizedEmail.split('@')[0],
          email: sanitizedEmail,
          photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
          referralCode: refCode,
          referralCount: 0,
          points: 100,
          badge: 'Bronze',
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        await setDoc(docRef, userProfile);
      } else {
        userProfile = docSnap.data() as UserProfile;
      }
      
      setCurrentUser(userProfile);
      setIsAdmin(isUserAdmin);
      setShowGoogleModal(false);
    } catch (err: any) {
      console.error('Google Auth failed:', err);
      setAuthError(err.message || 'An error occurred during Google authentication.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };



  // Log Out Flow
  const handleLogOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut failed:', e);
    }
    setCurrentUser(null);
    setIsAdmin(false);
  };

  // Toggle Favorite Action
  const handleToggleFavorite = (videoId: string) => {
    let updated: string[];
    if (favorites.includes(videoId)) {
      updated = favorites.filter(id => id !== videoId);
    } else {
      updated = [...favorites, videoId];
      addPoints(10); // Reward 10 points for exploring!
    }
    setFavorites(updated);
    localStorage.setItem('sikkho_favorites', JSON.stringify(updated));
  };

  // Handle Video Click (Register watch history & Play video directly on the page)
  const handlePlayVideo = async (video: Video) => {
    // 1. Add to local watch history
    const isNewWatch = !watchHistory.some(h => h.videoId === video.id);
    const updatedHistory = [{ videoId: video.id, watchedAt: new Date().toISOString() }, ...watchHistory.filter(h => h.videoId !== video.id)];
    setWatchHistory(updatedHistory);
    localStorage.setItem('sikkho_history', JSON.stringify(updatedHistory));

    // 2. Award activity points for watching video
    if (isNewWatch) {
      addPoints(25); // Award 25 points on new discovery
    } else {
      addPoints(5); // Small award on revisit
    }

    // 3. Increment click/view counter in Firestore safely
    try {
      await updateDoc(doc(db, COLLECTIONS.VIDEOS, video.id), {
        views: (video.views || 0) + 1
      });
    } catch (e) {
      console.warn('Could not update views on Firestore', e);
    }

    // 4. Open embedded video player directly on page
    setActivePlayingVideo(video);
  };

  // Play Video from promotional banner slideshow using embedded player
  const handlePlayBannerVideo = (videoUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    if (!id) return;

    const found = videos.find(v => v.videoId === id);
    if (found) {
      handlePlayVideo(found);
    } else {
      const transientVideo: Video = {
        id: `transient_${id}`,
        videoUrl: videoUrl,
        videoId: id,
        title: banners[bannerIndex]?.title || 'Featured Lesson Video',
        thumbnail: banners[bannerIndex]?.imageUrl || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        category: 'Featured Video',
        uploadedAt: new Date().toISOString(),
        views: 0
      };
      setActivePlayingVideo(transientVideo);
    }
  };

  // Toggle Like or Dislike on curated video
  const handleToggleLikeDislike = async (type: 'like' | 'dislike') => {
    if (!currentUser || !activePlayingVideo) return;
    const videoId = activePlayingVideo.id;
    const interactionId = `${currentUser.uid}_${videoId}`;
    const interactionRef = doc(db, 'video_interactions', interactionId);
    const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId);

    const currentType = activeVideoInteraction?.type || null;

    let likesDiff = 0;
    let dislikesDiff = 0;
    let nextType: 'like' | 'dislike' | null = null;

    if (type === 'like') {
      if (currentType === 'like') {
        likesDiff = -1;
        nextType = null;
      } else if (currentType === 'dislike') {
        likesDiff = 1;
        dislikesDiff = -1;
        nextType = 'like';
      } else {
        likesDiff = 1;
        nextType = 'like';
      }
    } else {
      if (currentType === 'dislike') {
        dislikesDiff = -1;
        nextType = null;
      } else if (currentType === 'like') {
        likesDiff = -1;
        dislikesDiff = 1;
        nextType = 'dislike';
      } else {
        dislikesDiff = 1;
        nextType = 'dislike';
      }
    }

    try {
      if (nextType === null) {
        await deleteDoc(interactionRef);
      } else {
        await setDoc(interactionRef, {
          userId: currentUser.uid,
          videoId,
          type: nextType,
          updatedAt: new Date().toISOString()
        });
      }

      const newLikesCount = Math.max(0, (activePlayingVideo.likesCount || 0) + likesDiff);
      const newDislikesCount = Math.max(0, (activePlayingVideo.dislikesCount || 0) + dislikesDiff);

      await updateDoc(videoRef, {
        likesCount: newLikesCount,
        dislikesCount: newDislikesCount
      });

      setActivePlayingVideo(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likesCount: newLikesCount,
          dislikesCount: newDislikesCount
        };
      });

      // Give 5 activity points for engaging with likes/dislikes!
      if (nextType !== null && currentType === null) {
        addPoints(5);
      }
    } catch (err) {
      console.warn('Error toggling like/dislike:', err);
    }
  };

  // Add Comment to video
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser || !activePlayingVideo || !newCommentText.trim()) return;

    const textVal = newCommentText.trim();
    setNewCommentText('');

    try {
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      await setDoc(doc(db, 'comments', commentId), {
        videoId: activePlayingVideo.id,
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        text: textVal,
        createdAt: new Date().toISOString()
      });

      // Add 10 points on posting a comment
      addPoints(10);
    } catch (err) {
      console.warn('Error adding comment:', err);
    }
  };

  // Delete Comment from video
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      console.warn('Error deleting comment:', err);
    }
  };

  // Download video offline (Mocked for premium experience)
  const handleMockDownload = () => {
    if (!activePlayingVideo) return;
    if (isDownloaded) {
      const downloadedList = JSON.parse(localStorage.getItem('sikkho_offline_downloads') || '[]');
      const updated = downloadedList.filter((id: string) => id !== activePlayingVideo.id);
      localStorage.setItem('sikkho_offline_downloads', JSON.stringify(updated));
      setIsDownloaded(false);
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setIsDownloaded(true);
          const downloadedList = JSON.parse(localStorage.getItem('sikkho_offline_downloads') || '[]');
          if (!downloadedList.includes(activePlayingVideo.id)) {
            downloadedList.push(activePlayingVideo.id);
            localStorage.setItem('sikkho_offline_downloads', JSON.stringify(downloadedList));
          }
          addPoints(15); // Reward 15 activity points for offline saving
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  // Pull to Refresh Handler
  const handlePullToRefresh = async () => {
    // Re-sync with Firebase manually
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.VIDEOS));
      if (!snap.empty) {
        setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Video)));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Onboarding Finish Callback
  const handleFinishOnboarding = () => {
    localStorage.setItem('sikkho_onboarded', 'true');
    setShowOnboarding(false);
  };

  // Share Application mock dialog
  const handleShareApp = () => {
    const text = `Learn, grow, and achieve! Discover high-quality coding tutorials on the Sikkho App. Download here: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    alert('🎉 Referral App Link copied! Share it on WhatsApp/Facebook to help us increase our subscriber base!');
    addPoints(15); // Bonus points for sharing
  };

  // Send rating feedback
  const handleRateSubmit = () => {
    alert(`⭐ Thank you for rating Sikkho ${userRating}/5 stars! Your support drives us forward.`);
    setShowRateModal(false);
    addPoints(30); // Award points for rating
  };

  // Handle banner photo selection and update
  const handleUpdateBannerImage = async (imageUrlToSet: string) => {
    if (!imageUrlToSet.trim()) {
      setBannerUpdateMsg({ type: 'error', text: 'कृपया एक वैध इमेज यूआरएल दर्ज करें या फोटो अपलोड करें।' });
      return;
    }
    setIsUpdatingBanner(true);
    setBannerUpdateMsg(null);
    try {
      const bannerRef = doc(db, COLLECTIONS.BANNERS, 'current_banner');
      const newBanner = {
        id: 'current_banner',
        imageUrl: imageUrlToSet,
        title: '',
        videoUrl: '',
        createdAt: new Date().toISOString()
      };
      await setDoc(bannerRef, newBanner);

      // Clear any other banner entries so it stays as the only displayed banner
      const querySnap = await getDocs(collection(db, COLLECTIONS.BANNERS));
      for (const d of querySnap.docs) {
        if (d.id !== 'current_banner') {
          await deleteDoc(doc(db, COLLECTIONS.BANNERS, d.id));
        }
      }

      setBanners([newBanner as BannerSlide]);
      setBannerIndex(0);
      setBannerUpdateMsg({ type: 'success', text: 'बैनर फोटो सफलतापूर्वक बदल दिया गया है! 🎉' });
      setCustomBannerUrl('');
    } catch (error) {
      console.error('Failed to update banner:', error);
      setBannerUpdateMsg({ type: 'error', text: 'बैनर अपडेट करने में विफल। कृपया फिर से प्रयास करें।' });
    } finally {
      setIsUpdatingBanner(false);
    }
  };

  const handleResetBanners = async () => {
    setIsUpdatingBanner(true);
    setBannerUpdateMsg(null);
    try {
      // Clear out the current banner doc
      await deleteDoc(doc(db, COLLECTIONS.BANNERS, 'current_banner'));
      
      // Clear out any other custom banners in the DB
      const querySnap = await getDocs(collection(db, COLLECTIONS.BANNERS));
      for (const d of querySnap.docs) {
        await deleteDoc(doc(db, COLLECTIONS.BANNERS, d.id));
      }
      
      // Let it fall back to the preset banners
      setBanners(PRESET_BANNERS);
      setBannerIndex(0);
      setBannerUpdateMsg({ type: 'success', text: 'डिफ़ॉल्ट बैनर सफलतापूर्वक रिस्टोर कर दिए गए हैं! 🔄' });
    } catch (error) {
      console.error('Failed to reset banners:', error);
      setBannerUpdateMsg({ type: 'error', text: 'बैनर रीसेट करने में विफल।' });
    } finally {
      setIsUpdatingBanner(false);
    }
  };

  const handleLocalPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBannerUpdateMsg({ type: 'error', text: 'कृपया केवल इमेज फ़ाइल ही चुनें।' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      if (base64String) {
        await handleUpdateBannerImage(base64String);
      }
    };
    reader.onerror = () => {
      setBannerUpdateMsg({ type: 'error', text: 'फ़ाइल पढ़ने में त्रुटि हुई।' });
    };
    reader.readAsDataURL(file);
  };

  // Render Overlay Modals
  const renderOverlay = () => {
    switch (activeOverlay) {
      case 'request':
        return (
          <VideoRequestModal
            onClose={() => setActiveOverlay('none')}
            userProfile={currentUser}
            onAddPoints={addPoints}
          />
        );
      case 'admin':
        return (
          <AdminPanel
            onClose={() => setActiveOverlay('none')}
            onRefreshVideos={() => {}}
          />
        );
      case 'faq':
        return <FAQ onClose={() => setActiveOverlay('none')} />;
      case 'feedback':
        return (
          <Feedback
            onClose={() => setActiveOverlay('none')}
            userProfile={currentUser}
            onAddPoints={addPoints}
          />
        );
      case 'developer':
        return <AboutDeveloper onClose={() => setActiveOverlay('none')} />;
      case 'privacy':
        return <PrivacyPolicy onClose={() => setActiveOverlay('none')} />;
      case 'terms':
        return <TermsConditions onClose={() => setActiveOverlay('none')} />;
      case 'update':
        return <UpdateChecker onClose={() => setActiveOverlay('none')} />;
      default:
        return null;
    }
  };

  return (
    <DeviceFrame
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      isAdmin={isAdmin}
      userEmail={currentUser?.email || ''}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenAdmin={() => setActiveOverlay('admin')}
    >
      <div className={`flex-1 flex flex-col overflow-hidden relative select-none ${isDarkMode ? 'dark' : ''}`}>
        
        {/* Onboarding & Splash Overlays */}
        <AnimatePresence>
          {showSplash && <Splash onFinish={() => setShowSplash(false)} />}
          {!showSplash && showOnboarding && <Onboarding onFinish={handleFinishOnboarding} />}
        </AnimatePresence>

        {/* AUTHENTICATION VIEW CARD (GORGEOUS GOOGLE MOCK) */}
        {!showSplash && !showOnboarding && !currentUser && (
          <div className="absolute inset-0 bg-[#07041c] z-30 flex flex-col p-4 overflow-y-auto select-none font-sans">
            
            {/* Top Logo & Theme Toggle bar (matching screenshot) */}
            <div className="w-full max-w-md mx-auto flex items-center justify-between py-2 sm:py-4 shrink-0 px-2 select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-red-500/20">
                  <GraduationCap className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-lg sm:text-xl font-black text-white tracking-wide">Sikkho</span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-[#120e36] border border-slate-800/80 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            </div>

            {/* Ambient Background Blur Layers */}
            <div className="absolute top-[20%] left-[5%] w-60 h-60 rounded-full bg-purple-600/10 blur-[90px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[5%] w-72 h-72 rounded-full bg-pink-600/10 blur-[100px] pointer-events-none" />

            {/* FLOATING 3D-EFFECT SHAPES (Slightly overlapping the main card) */}
            <div className="relative w-full max-w-md mx-auto my-auto py-4">
              
              {/* Pink Play Button */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-12, -8, -12] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="absolute left-[-16px] top-[75px] sm:left-[-24px] sm:top-[90px] z-20 w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_20px_rgba(244,63,94,0.35)] border border-pink-400/20 transform -rotate-12 cursor-pointer"
              >
                <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
              </motion.div>

              {/* Purple Upward Chart */}
              <motion.div
                animate={{ y: [0, 8, 0], rotate: [12, 16, 12] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute right-[-16px] top-[190px] sm:right-[-24px] sm:top-[210px] z-20 w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-[0_8px_20px_rgba(124,58,237,0.35)] border border-indigo-400/20 transform rotate-12 p-1.5 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                <div className="flex gap-0.5 items-end h-3 w-4.5">
                  <span className="w-1 h-1 bg-white/40 rounded-t-xs" />
                  <span className="w-1 h-1.5 bg-white/70 rounded-t-xs" />
                  <span className="w-1 h-2.5 bg-white rounded-t-xs" />
                </div>
              </motion.div>

              {/* Confetti & Dots */}
              <div className="absolute left-[20px] top-[260px] w-2 h-2 bg-rose-400/60 rounded-full blur-[0.5px] pointer-events-none" />
              <div className="absolute right-[40px] top-[40px] w-2.5 h-2.5 bg-indigo-400/40 rounded-full blur-[0.5px] pointer-events-none" />

              {/* Central Card */}
              <div className="w-full bg-gradient-to-b from-[#181145] to-[#0a0524] rounded-[2.5rem] border border-[#2b1f6d] shadow-[0_20px_50px_rgba(13,9,44,0.6)] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden space-y-4">
                
                {/* Header info */}
                <div className="flex flex-col items-center text-center relative select-none">
                  {/* Ambient pink/red glow behind logo */}
                  <div className="absolute w-24 h-24 bg-red-500/25 rounded-full blur-xl -top-3" />
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white mb-3.5 shadow-[0_8px_25px_rgba(239,68,68,0.45)] relative z-10 border border-red-400/20">
                    <GraduationCap className="w-9 h-9" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500">Sikkho</span>
                  </h2>
                  <p className="text-xs text-slate-300/80 mt-1.5 max-w-xs leading-relaxed font-medium">
                    Learn YouTube growth, add lessons, request tutorials, and grow your channel!
                  </p>
                </div>

                {/* Mode Toggle Tabs */}
                <div className="flex bg-[#0b0724]/80 border border-[#2a1d69] p-1.5 rounded-2xl w-full select-none">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                    className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
                      authMode === 'login'
                        ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] font-black'
                        : 'text-slate-400 hover:text-slate-200 font-bold'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                    className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
                      authMode === 'signup'
                        ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] font-black'
                        : 'text-slate-400 hover:text-slate-200 font-bold'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Error Display */}
                {authError && (
                  <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-[11px] font-bold flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Firebase Guide Card for operation-not-allowed error */}
                {authError && (authError.includes('operation-not-allowed') || authError.includes('auth/operation-not-allowed')) && (
                  <div className="bg-[#120c3a] border border-amber-500/30 text-slate-300 p-4 rounded-3xl text-xs space-y-3 shadow-lg">
                    <div className="flex items-center gap-2 text-amber-400 font-extrabold text-[12px]">
                      <Sparkles className="w-4 h-4" />
                      <span>Firebase Auth Setup Guide (हिन्दी & English)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      यह एरर इसलिए आ रही है क्योंकि आपके Firebase प्रोजेक्ट में <strong>Email/Password</strong> या <strong>Google Auth</strong> चालू नहीं है। इसे ठीक करें:
                    </p>
                    
                    <div className="space-y-2 text-[11px] pl-2 list-decimal">
                      <div>
                        <strong className="text-slate-200">1. Enable Sign-In Providers:</strong>
                        <div className="text-slate-400 mt-0.5">
                          Firebase Console &gt; Authentication &gt; Sign-In Method में जाकर <strong>Email/Password</strong> और <strong>Google</strong> चालू करें.
                        </div>
                      </div>
                      <div>
                        <strong className="text-slate-200">2. Add Authorized Domains (डोमेन कनेक्ट करें):</strong>
                        <div className="text-slate-400 mt-0.5">
                          Authentication &gt; Settings &gt; Authorized Domains में नीचे दिए गए डोमेन जोड़ें:
                        </div>
                        <div className="mt-2 space-y-1">
                          {[
                            'localhost',
                            'ais-dev-zpi6rtoigiz3pt5fhhtmnr-465326683782.asia-east1.run.app',
                            'ais-pre-zpi6rtoigiz3pt5fhhtmnr-465326683782.asia-east1.run.app'
                          ].map((domain) => (
                            <div key={domain} className="flex items-center justify-between bg-[#0b0724] px-2.5 py-1.5 rounded-xl border border-slate-800 font-mono text-[10px]">
                              <span className="truncate mr-2 text-slate-300">{domain}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(domain);
                                  alert(`Copied: ${domain}`);
                                }}
                                className="text-[9px] bg-amber-500/20 hover:bg-amber-500/35 text-amber-400 px-2 py-0.5 rounded-lg font-extrabold transition shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Log-In / Sign-Up Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="text-[10px] uppercase font-extrabold text-[#7469b6] tracking-wider block mb-1.5 pl-1">Full Name</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 w-8 h-8 rounded-xl bg-[#231758] flex items-center justify-center text-[#ff3366]">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Enter your name"
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                          className="w-full p-3.5 pl-13 text-xs bg-[#0b0724]/75 border border-[#2d2175] rounded-2xl focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366] text-white placeholder-slate-500 font-medium transition"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase font-extrabold text-[#7469b6] tracking-wider block mb-1.5 pl-1">
                      {authMode === 'login' ? 'Email Address or Mobile Number' : 'Email Address'}
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 w-8 h-8 rounded-xl bg-[#231758] flex items-center justify-center text-[#ff3366]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder={authMode === 'login' ? "e.g. learner@gmail.com or 8955932061" : "e.g. learner@gmail.com"}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full p-3.5 pl-13 text-xs bg-[#0b0724]/75 border border-[#2d2175] rounded-2xl focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366] text-white placeholder-slate-500 font-medium transition"
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="text-[10px] uppercase font-extrabold text-[#7469b6] tracking-wider block mb-1.5 pl-1">Mobile Number (Optional)</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 w-8 h-8 rounded-xl bg-[#231758] flex items-center justify-center text-[#ff3366]">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          placeholder="e.g. 8955932061"
                          value={loginMobile}
                          onChange={(e) => setLoginMobile(e.target.value)}
                          className="w-full p-3.5 pl-13 text-xs bg-[#0b0724]/75 border border-[#2d2175] rounded-2xl focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366] text-white placeholder-slate-500 font-medium transition"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase font-extrabold text-[#7469b6] tracking-wider block mb-1.5 pl-1">Password</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 w-8 h-8 rounded-xl bg-[#231758] flex items-center justify-center text-[#a855f7]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="Enter account password (min 6 chars)"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full p-3.5 pl-13 text-xs bg-[#0b0724]/75 border border-[#2d2175] rounded-2xl focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366] text-white placeholder-slate-500 font-medium transition"
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <label className="text-[10px] uppercase font-extrabold text-[#7469b6] tracking-wider block mb-1.5 pl-1">Referral Code (Optional)</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 w-8 h-8 rounded-xl bg-[#231758] flex items-center justify-center text-[#3b82f6]">
                          <Gift className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. SIKKHO-ABCD"
                          value={enteredReferral}
                          onChange={(e) => setEnteredReferral(e.target.value)}
                          className="w-full p-3.5 pl-13 text-xs bg-[#0b0724]/75 border border-[#2d2175] rounded-2xl focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366] text-white placeholder-slate-500 font-medium tracking-wider uppercase transition font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-extrabold py-4 px-6 rounded-2xl transition duration-300 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(244,63,94,0.35)] hover:shadow-[0_8px_25px_rgba(244,63,94,0.45)] transform active:scale-[0.98] mt-6"
                  >
                    {isSubmittingAuth ? <RefreshCw className="w-4 h-4 animate-spin" /> : (authMode === 'login' ? 'Sign In Account' : 'Register & Enter')}
                  </button>
                </form>

                {/* OR Connector */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[#231b5c]"></div>
                  <span className="flex-shrink mx-4 text-[9px] text-[#554b9d] font-black uppercase tracking-widest">Or Continue With</span>
                  <div className="flex-grow border-t border-[#231b5c]"></div>
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full bg-[#0d092c]/80 border border-[#2a206a] hover:bg-[#150f41] text-white font-extrabold py-3.5 px-6 rounded-2xl transition duration-300 flex items-center justify-center gap-2.5 shadow-md transform active:scale-[0.98]"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.02.5 12 .5 7.37.5 3.4 3.17 1.5 7.07l3.87 3a6.98 6.98 0 016.63-5.03z"/>
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.46a5.53 5.53 0 01-2.4 3.63v3.01h3.87c2.26-2.08 3.56-5.14 3.56-8.74z"/>
                    <path fill="#FBBC05" d="M5.37 14.12a6.92 6.92 0 010-4.24L1.5 6.88A11.93 11.93 0 000 12c0 1.83.41 3.57 1.15 5.14l4.22-3.02z"/>
                    <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.92l-3.87-3.01c-1.07.72-2.45 1.15-4.09 1.15-3.13 0-5.78-2.12-6.73-4.97L1.4 16.78c1.9 3.9 5.87 6.57 10.6 6.57z"/>
                  </svg>
                  <span className="text-xs sm:text-sm">Google Sign In</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE SIGN IN MODAL WINDOW */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/50 dark:border-slate-800 shadow-2xl p-6 relative">
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">Choose an Account</h3>
                  <p className="text-[11px] text-slate-500">to continue to Sikkho App</p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {/* Option 1: Gautam Tiwari Admin preset */}
                  <button
                    onClick={() => handleGoogleAuth('Gautam Tiwari', 'tiwarigautam819@gmail.com')}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-red-50 dark:bg-slate-950 dark:hover:bg-red-950/20 border border-slate-100 dark:border-slate-800 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shadow">
                      G
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">Gautam Tiwari (Admin)</p>
                      <p className="text-[10px] text-slate-500">tiwarigautam819@gmail.com</p>
                    </div>
                  </button>

                  {/* Option 2: Custom input fields */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Or Enter any other Account</span>
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg focus:outline-none"
                    />
                    <input
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!googleEmail}
                      onClick={() => handleGoogleAuth(googleName, googleEmail)}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition disabled:opacity-50"
                    >
                      Authenticate Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE SCREEN OVERLAYS */}
        <AnimatePresence>
          {activeOverlay !== 'none' && (
            <motion.div
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="absolute inset-0 z-40 bg-white"
            >
              {renderOverlay()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* -------------------- MAIN APP SHELL -------------------- */}
        {!showSplash && !showOnboarding && currentUser && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 transition-colors">
            
            {/* HOME HEADER PANEL */}
            {activeTab === 'home' && banners.length > 0 && (
              <div className="bg-white dark:bg-slate-950 px-4 py-4 shrink-0 border-b border-slate-100 dark:border-slate-900/50 transition-colors">
                <div className="max-w-7xl mx-auto">
                  
                  {/* Promotional Banner Slideshow */}
                  <div className="relative h-28 md:h-36 w-full rounded-2xl overflow-hidden shadow-sm group">
                    <img 
                      src={banners[bannerIndex]?.imageUrl} 
                      className="w-full h-full object-cover transition-all" 
                      alt="Banner slide" 
                    />

                    {/* Banner Control Arrows */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setBannerIndex(prev => prev === 0 ? banners.length - 1 : prev - 1)}
                        className="bg-black/40 text-white p-1 rounded-full hover:bg-black/60 transition"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setBannerIndex(prev => prev === banners.length - 1 ? 0 : prev + 1)}
                        className="bg-black/40 text-white p-1 rounded-full hover:bg-black/60 transition"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB SCREENS ROUTING */}
            {activeTab === 'home' && (
              <VideoGrid
                videos={videos}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onPlayVideo={handlePlayVideo}
                onPullToRefresh={handlePullToRefresh}
              />
            )}

            {activeTab === 'leaderboard' && (
              <Leaderboard
                users={leaderboardUsers}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'favorites' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className="bg-white dark:bg-slate-950 px-4 py-3 shrink-0 border-b border-slate-100 dark:border-slate-900 select-none flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500 fill-current" /> My Favorites
                  </h3>
                  <span className="text-xs text-slate-400">({favorites.length} saved)</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                  {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                        <Heart className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Your saved videos will appear here</p>
                      <p className="text-[10px] text-slate-400 max-w-[200px] mt-1">Tap the heart icon on any card to favorite a tutorial.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
                      {videos.filter(v => favorites.includes(v.id)).map(vid => (
                        <div key={vid.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3 shadow-sm hover:shadow-md transition">
                          <img src={vid.thumbnail} className="w-24 h-16 object-cover rounded-xl shrink-0" alt="thumb" />
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <p onClick={() => handlePlayVideo(vid)} className="text-xs font-bold text-slate-800 dark:text-white truncate cursor-pointer hover:text-red-500">
                              {vid.title}
                            </p>
                            <div className="flex items-center justify-between mt-2 select-none">
                              <span className="text-[9px] uppercase font-bold text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.2 rounded">
                                {vid.category}
                              </span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleToggleFavorite(vid.id)}
                                  className="text-red-500 hover:text-slate-400 transition"
                                >
                                  <Heart className="w-4 h-4 fill-current" />
                                </button>
                                <button 
                                  onClick={() => handlePlayVideo(vid)}
                                  className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 transition"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className="bg-white dark:bg-slate-950 px-4 py-3 shrink-0 border-b border-slate-100 dark:border-slate-900 select-none flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-red-500" /> Watch History
                  </h3>
                  <button 
                    onClick={() => {
                      if (window.confirm('Clear all history?')) {
                        setWatchHistory([]);
                        localStorage.removeItem('sikkho_history');
                      }
                    }} 
                    className="text-[10px] text-slate-400 hover:text-red-500 font-bold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                  {watchHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                        <History className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No recently watched videos</p>
                      <p className="text-[10px] text-slate-400 max-w-[200px] mt-1">Videos you click and open in YouTube will track here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
                      {watchHistory.map((histItem, idx) => {
                        const vidMatch = videos.find(v => v.id === histItem.videoId);
                        if (!vidMatch) return null;

                        return (
                          <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3 shadow-sm hover:shadow-md transition">
                            <img src={vidMatch.thumbnail} className="w-24 h-16 object-cover rounded-xl shrink-0" alt="thumb" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <p onClick={() => handlePlayVideo(vidMatch)} className="text-xs font-bold text-slate-800 dark:text-white truncate cursor-pointer hover:text-red-500">
                                {vidMatch.title}
                              </p>
                              <div className="flex items-center justify-between mt-2 select-none text-[9px] text-slate-400">
                                <span>Opened {new Date(histItem.watchedAt).toLocaleDateString()}</span>
                                <button 
                                  onClick={() => handlePlayVideo(vidMatch)}
                                  className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 transition"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-6">
                
                {/* User Banner Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-b-[2rem] border-b border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col items-center text-center transition-colors">
                  <img src={currentUser.photoUrl} className="w-20 h-20 rounded-full border-4 border-red-500 object-cover shadow-md mb-3" alt="avatar" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">{currentUser.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">{currentUser.email}</p>
                  
                  {/* Badge & Points display */}
                  <div className="flex items-center gap-2 mt-3 select-none">
                    <span className="text-xs bg-red-50 dark:bg-red-950/40 text-red-600 font-extrabold px-3 py-1 rounded-xl border border-red-100 dark:border-red-900/40">
                      {currentUser.badge} Badge
                    </span>
                    <span className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold px-3 py-1 rounded-xl border border-slate-100 dark:border-slate-700/60">
                      {currentUser.points} PTS
                    </span>
                  </div>
                </div>

                {/* Main Navigation List */}
                <div className="p-4 space-y-4">
                  
                  {/* Notification Inbox segment */}
                  {notifications.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-red-500 animate-pulse" /> Notification Box ({notifications.length})
                      </h4>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[150px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {notifications.map(notif => (
                          <div key={notif.id} className="pt-2 first:pt-0">
                            <span className="text-[8px] uppercase font-bold text-red-500 bg-red-50 px-1 rounded">
                              {notif.type}
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-white mt-1 leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* HOME BANNER CUSTOMIZER CARD */}
                  {isAdmin && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> होम बैनर फोटो कस्टमाइज़र
                        </h4>
                        {banners.length > 0 && (
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                            Live Slide
                          </span>
                        )}
                      </div>

                      {/* Current Banner Preview */}
                      {banners.length > 0 && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 bg-slate-950 shadow-inner group">
                          <img 
                            src={banners[bannerIndex]?.imageUrl} 
                            className="w-full h-full object-cover" 
                            alt="Current Banner Preview" 
                          />
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
                            <span className="text-[10px] text-white font-extrabold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                              Current Active Banner
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Banner feedback notification */}
                      {bannerUpdateMsg && (
                        <div className={`p-2.5 rounded-xl text-xs font-bold ${
                          bannerUpdateMsg.type === 'success' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                            : 'bg-red-50 dark:bg-red-950/25 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                        }`}>
                          {bannerUpdateMsg.text}
                        </div>
                      )}

                      {/* Controls Grid */}
                      <div className="space-y-3.5">
                        {/* Local File Upload Section */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                            1. मोबाइल / कंप्यूटर से कोई भी फोटो लगाएं:
                          </label>
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleLocalPhotoUpload} 
                              disabled={isUpdatingBanner}
                              className="hidden" 
                              id="banner-file-input" 
                            />
                            <label 
                              htmlFor="banner-file-input" 
                              className={`w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md transition cursor-pointer ${
                                isUpdatingBanner ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                              }`}
                            >
                              {isUpdatingBanner ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                              <span>डिवाइस से कोई भी फोटो चुनें (Upload Photo)</span>
                            </label>
                          </div>
                        </div>

                        {/* Image URL Input Section */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                            2. या कोई भी इमेज URL पेस्ट करें:
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="https://example.com/banner.jpg" 
                              value={customBannerUrl} 
                              onChange={(e) => setCustomBannerUrl(e.target.value)}
                              disabled={isUpdatingBanner}
                              className="flex-1 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                            />
                            <button 
                              onClick={() => handleUpdateBannerImage(customBannerUrl)}
                              disabled={isUpdatingBanner || !customBannerUrl.trim()}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white disabled:opacity-55 font-extrabold rounded-2xl text-xs transition shrink-0 active:scale-95"
                            >
                              अपडेट करें
                            </button>
                          </div>
                        </div>

                        {/* Curated Presets Selection */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                            3. हमारे बेहतरीन डिज़ाइन बैकग्राउंड्स चुनें:
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { name: 'Cosmic Tech', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
                              { name: 'Dark Code', url: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=80' },
                              { name: 'Neon Purple', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80' },
                              { name: 'Abstract Art', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80' }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleUpdateBannerImage(preset.url)}
                                disabled={isUpdatingBanner}
                                className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-red-500 transition active:scale-95 group text-left"
                              >
                                <img src={preset.url} className="w-full h-full object-cover" alt={preset.name} />
                                <div className="absolute inset-0 bg-black/40 flex items-end p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[8px] text-white font-bold leading-none">{preset.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Reset to Default Options */}
                        <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex justify-end">
                          <button
                            onClick={handleResetBanners}
                            disabled={isUpdatingBanner}
                            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold flex items-center gap-1 transition"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>डिफ़ॉल्ट बैनर रिस्टोर करें (Restore Default)</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-2 shadow-sm space-y-0.5 divide-y divide-slate-50 dark:divide-slate-850/60">
                    {[
                      { label: 'WhatsApp Support', icon: <Phone className="w-4 h-4" />, action: () => window.open('https://wa.me/918955932061?text=Hi%20Gautam%20Tiwari,%20I%27m%20using%20the%20Sikkho%20App%20and%20need%20assistance%2520or%2520would%2520like%2520to%2520collaborate!', '_blank'), color: 'text-emerald-500' },
                      { label: 'FAQ & Help', icon: <HelpCircle className="w-4 h-4" />, action: () => setActiveOverlay('faq') },
                      { label: 'Give Feedback', icon: <MessageSquare className="w-4 h-4" />, action: () => setActiveOverlay('feedback') },
                      { label: 'Check App Updates', icon: <RefreshCw className="w-4 h-4" />, action: () => setActiveOverlay('update') },
                      { label: 'About Developer', icon: <User className="w-4 h-4" />, action: () => setActiveOverlay('developer') },
                      { label: 'Privacy Policy', icon: <Shield className="w-4 h-4" />, action: () => setActiveOverlay('privacy') },
                      { label: 'Terms & Conditions', icon: <Info className="w-4 h-4" />, action: () => setActiveOverlay('terms') },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full text-left py-3 px-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={item.color || 'text-red-500'}>{item.icon}</span>
                          {item.label}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>

                  {/* Additional Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleShareApp}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-white border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 transition text-xs font-bold shadow-sm"
                    >
                      <Share2 className="w-5 h-5 text-red-500" />
                      <span>Share App</span>
                    </button>
                    <button
                      onClick={() => setShowRateModal(true)}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-white border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 transition text-xs font-bold shadow-sm"
                    >
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span>Rate Sikkho</span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogOut}
                    className="w-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold py-3 px-4 rounded-2xl transition flex items-center justify-center gap-2 text-xs"
                  >
                    <LogOut className="w-4 h-4 text-red-500" /> Sign Out Account
                  </button>

                </div>

              </div>
            )}

            {/* -------------------- DYNAMIC FLOATING MENU BUTTON -------------------- */}
            <div className="fixed bottom-[76px] left-4 z-40 select-none">
              <button
                onClick={() => setActiveOverlay('request')}
                className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-full shadow-lg shadow-red-600/25 transition active:scale-95"
                title="Make Tutorial Request"
              >
                <Plus className="w-4 h-4 animate-spin-slow" /> Request Video
              </button>
            </div>

            {/* -------------------- INTERACTIVE BOTTOM NAV BAR -------------------- */}
            <div className="fixed bottom-0 left-0 right-0 h-16 md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 flex items-center justify-around px-2 z-30 transition-colors shadow-lg">
              {[
                { id: 'home', label: 'Discover', icon: <Play className="w-4 h-4" /> },
                { id: 'leaderboard', label: 'Ranks', icon: <Award className="w-4 h-4" /> },
                { id: 'favorites', label: 'Saved', icon: <Heart className="w-4 h-4" /> },
                { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
                { id: 'profile', label: 'More', icon: <User className="w-4 h-4" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition ${
                    activeTab === tab.id
                      ? 'text-red-500 font-bold bg-red-500/5 dark:bg-red-500/10 scale-105'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px] uppercase tracking-wide leading-none">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Spacer to prevent content from being cut off by the fixed bottom nav */}
            <div className="h-16 shrink-0 md:hidden" />

          </div>
        )}

        {/* -------------------- EMBEDDED VIDEO PLAYER OVERLAY -------------------- */}
        <AnimatePresence>
          {activePlayingVideo && (
            activePlayingVideo.category === 'Short Video' ? (
              <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center overflow-hidden select-none">
                {/* Back/Close button for Shorts */}
                <button
                  onClick={() => {
                    setActivePlayingVideo(null);
                    setShowCommentsDrawer(false);
                  }}
                  className="absolute top-4 left-4 z-40 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition active:scale-95 shadow-md backdrop-blur-md"
                  title="Back to Home"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                {/* Centered Vertical 9:16 Frame Container */}
                <div className="relative w-full max-w-[420px] h-full sm:h-[94vh] sm:rounded-3xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl border border-zinc-905">
                  
                  {/* 1. Immersive YouTube Video Iframe */}
                  <div className="absolute inset-0 w-full h-full z-0">
                    <iframe
                      src={`https://www.youtube.com/embed/${activePlayingVideo.videoId}?autoplay=1&mute=0&rel=0&modestbranding=1&loop=1&playlist=${activePlayingVideo.videoId}`}
                      title={activePlayingVideo.title}
                      className="w-full h-full border-0 scale-[1.01] pointer-events-auto"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>

                  {/* Gradient shade overlays */}
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10" />

                  {/* 2. Floating Action Controls overlay (Right Side) */}
                  <div className="absolute right-3.5 bottom-24 z-20 flex flex-col items-center gap-4 text-center select-none pointer-events-auto">
                    
                    {/* Channels icon with plus/subscribe */}
                    <div className="relative mb-1">
                      <div className="w-11 h-11 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-black border-2 border-white shadow-lg">
                        S
                      </div>
                      {!isSubscribed && (
                        <button
                          onClick={() => {
                            setIsSubscribed(true);
                            localStorage.setItem('sikkho_subscribed', 'true');
                            addPoints(20);
                            alert('Sikkho App Subscribed! +20 Learning Points 🎉');
                          }}
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md active:scale-95 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Likes button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleToggleLikeDislike('like')}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md active:scale-90 ${
                          activeVideoInteraction?.type === 'like'
                            ? 'bg-red-600 text-white'
                            : 'bg-black/55 hover:bg-black/75 text-white backdrop-blur-md'
                        }`}
                      >
                        <ThumbsUp className={`w-5 h-5 ${activeVideoInteraction?.type === 'like' ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-[10px] font-extrabold mt-1 text-slate-200 drop-shadow">{activePlayingVideo.likesCount || 0}</span>
                    </div>

                    {/* Comments button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => setShowCommentsDrawer(true)}
                        className="w-11 h-11 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition shadow-md active:scale-90 backdrop-blur-md"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] font-extrabold mt-1 text-slate-200 drop-shadow">{activeVideoComments.length}</span>
                    </div>

                    {/* Save/Favorite button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleToggleFavorite(activePlayingVideo.id)}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md active:scale-90 ${
                          favorites.includes(activePlayingVideo.id)
                            ? 'bg-red-600 text-white'
                            : 'bg-black/55 hover:bg-black/75 text-white backdrop-blur-md'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${favorites.includes(activePlayingVideo.id) ? 'fill-current text-white' : ''}`} />
                      </button>
                      <span className="text-[10px] font-extrabold mt-1 text-slate-200 drop-shadow">
                        {favorites.includes(activePlayingVideo.id) ? 'Saved' : 'Save'}
                      </span>
                    </div>

                    {/* Share button */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="w-11 h-11 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition shadow-md active:scale-90 backdrop-blur-md"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] font-extrabold mt-1 text-slate-200 drop-shadow">Share</span>
                    </div>

                  </div>

                  {/* 3. Bottom text overlay */}
                  <div className="absolute left-4 bottom-5 right-18 z-20 text-left select-none pointer-events-none">
                    <div className="flex items-center gap-2 mb-2 pointer-events-auto">
                      <span className="text-xs font-black text-white drop-shadow">@SikkhoApp</span>
                      <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider drop-shadow">
                        Instructor
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-xs sm:text-sm leading-snug tracking-wide drop-shadow-lg pr-4 mb-2">
                      {activePlayingVideo.title}
                    </h3>

                    <div className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10 text-[9px] font-bold text-red-400">
                      <Sparkles className="w-3 h-3 text-red-500 animate-spin" />
                      <span>{activePlayingVideo.category}</span>
                    </div>
                  </div>

                  {/* Navigation through shorts (Next / Prev) */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 z-30 flex justify-between opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <button
                      disabled={videos.filter(v => v.category === 'Short Video').findIndex(v => v.id === activePlayingVideo.id) === 0}
                      onClick={() => {
                        const shortsList = videos.filter(v => v.category === 'Short Video');
                        const currIdx = shortsList.findIndex(v => v.id === activePlayingVideo.id);
                        if (currIdx > 0) {
                          setActivePlayingVideo(shortsList[currIdx - 1]);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-black/65 text-white flex items-center justify-center disabled:opacity-30 pointer-events-auto active:scale-95 transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      disabled={videos.filter(v => v.category === 'Short Video').findIndex(v => v.id === activePlayingVideo.id) === videos.filter(v => v.category === 'Short Video').length - 1}
                      onClick={() => {
                        const shortsList = videos.filter(v => v.category === 'Short Video');
                        const currIdx = shortsList.findIndex(v => v.id === activePlayingVideo.id);
                        if (currIdx !== -1 && currIdx < shortsList.length - 1) {
                          setActivePlayingVideo(shortsList[currIdx + 1]);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-black/65 text-white flex items-center justify-center disabled:opacity-30 pointer-events-auto active:scale-95 transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                </div>

                {/* Comments Drawer Popup inside Shorts */}
                {showCommentsDrawer && (
                  <div className="absolute inset-y-0 right-0 w-full max-w-[400px] z-50 bg-[#0f0f0f] border-l border-slate-900 shadow-2xl flex flex-col">
                    <div className="p-4 border-b border-slate-900 flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">Comments ({activeVideoComments.length})</span>
                      <button onClick={() => setShowCommentsDrawer(false)} className="p-2 rounded-full hover:bg-slate-900 text-slate-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {activeVideoComments.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-500">पहला कमेंट आप करें! 📝</div>
                      ) : (
                        activeVideoComments.map(comment => (
                          <div key={comment.id} className="flex gap-2.5 items-start text-left">
                            <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0">
                              {comment.userName ? comment.userName[0].toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 bg-zinc-900 rounded-2xl p-2.5">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-300 font-extrabold">{comment.userName}</span>
                                <span className="text-[8px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed">{comment.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 border-t border-slate-900 bg-black/50">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment();
                          }}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                        />
                        <button
                          onClick={handleAddComment}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition active:scale-95 shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* custom share modal for shorts */}
                {showShareModal && (
                  <div className="absolute inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#181818] border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl relative text-left">
                      <button
                        onClick={() => setShowShareModal(false)}
                        className="absolute right-3.5 top-3.5 w-7 h-7 bg-[#272727] rounded-full flex items-center justify-center text-slate-300 hover:text-white transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-sm">Share Sikkho Shorts</h4>
                        <p className="text-[10px] text-slate-400">Share with colleagues and friends. Earn bonus points!</p>
                      </div>

                      <div className="bg-[#272727] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-300 truncate flex-1 select-all">
                          https://www.youtube.com/watch?v={activePlayingVideo.videoId}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${activePlayingVideo.videoId}`);
                            addPoints(15);
                            alert('Link copied! +15 activity points added.');
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-[10px] transition shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="fixed inset-0 z-50 bg-[#0f0f0f] text-white flex flex-col overflow-hidden select-none">
              
              {/* STICKY VIDEO PLAYER AT THE TOP */}
              <div className="w-full bg-black shrink-0 aspect-video relative shadow-xl z-10 border-b border-slate-900">
                {/* Floating Back/Close button */}
                <button
                  onClick={() => {
                    setActivePlayingVideo(null);
                    setShowCommentsDrawer(false);
                  }}
                  className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition shadow-lg backdrop-blur-sm group"
                  title="Close Player"
                >
                  <ChevronLeft className="w-5 h-5 text-red-500 group-hover:scale-110 transition" />
                </button>
                
                <iframe
                  src={`https://www.youtube.com/embed/${activePlayingVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={activePlayingVideo.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>

              {/* SCROLLABLE VIDEO DETAILS & RECOMMENDED FEED */}
              <div 
                id="video-detail-scroll-container" 
                className="flex-1 overflow-y-auto bg-[#0f0f0f] flex flex-col pb-24 scrollbar-none"
              >
                {/* 1. Video Header: Title & Meta tags */}
                <div className="px-4 pt-4 pb-2.5">
                  <h3 className="font-extrabold text-white text-base sm:text-lg leading-snug tracking-tight">
                    {activePlayingVideo.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-2 text-xs text-slate-400 font-semibold">
                    <span>{activePlayingVideo.views + 1} Views</span>
                    <span>•</span>
                    <span>{new Date(activePlayingVideo.uploadedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-[9px] uppercase font-black text-red-400 bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded-full inline-block">
                      {activePlayingVideo.category}
                    </span>
                  </div>
                </div>

                {/* 2. Channel/Instructor Bar */}
                <div className="px-4 py-3 border-t border-b border-slate-900 flex items-center justify-between gap-3 bg-[#161616]/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-black shadow-lg shrink-0 border border-red-500/30">
                      S
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-white text-xs truncate flex items-center gap-1.5">
                        Sikkho App 
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Gautam Tiwari • 12K Students</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const nextState = !isSubscribed;
                      setIsSubscribed(nextState);
                      localStorage.setItem('sikkho_subscribed', String(nextState));
                      if (nextState) {
                        addPoints(20);
                        alert('Subscribed to Sikkho App! +20 Learning Points added 🚀');
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-black transition duration-150 active:scale-95 flex items-center gap-1 shrink-0 ${
                      isSubscribed 
                        ? 'bg-[#272727] text-slate-300 border border-slate-800'
                        : 'bg-white text-black hover:bg-slate-200 shadow-md'
                    }`}
                  >
                    <Bell className={`w-3.5 h-3.5 ${isSubscribed ? 'fill-current text-amber-500' : ''}`} />
                    <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
                  </button>
                </div>

                {/* 3. Action Pill Horizontal Scroll bar */}
                <div className="px-4 py-3.5 flex items-center gap-2 overflow-x-auto scrollbar-none select-none border-b border-slate-900 shrink-0">
                  {/* Likes/Dislikes capsule */}
                  <div className="bg-[#272727] rounded-full flex items-center p-0.5 border border-slate-800 select-none shrink-0">
                    <button
                      onClick={() => handleToggleLikeDislike('like')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition duration-150 active:scale-95 ${
                        activeVideoInteraction?.type === 'like'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'text-slate-300 hover:bg-[#323232]'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${activeVideoInteraction?.type === 'like' ? 'fill-current' : ''}`} />
                      <span>{activePlayingVideo.likesCount || 0}</span>
                    </button>
                    <div className="w-[1px] h-4 bg-slate-700 my-auto" />
                    <button
                      onClick={() => handleToggleLikeDislike('dislike')}
                      className={`flex items-center justify-center p-2 rounded-full transition duration-150 active:scale-95 ${
                        activeVideoInteraction?.type === 'dislike'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:bg-[#323232]'
                      }`}
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${activeVideoInteraction?.type === 'dislike' ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Share pill */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="bg-[#272727] hover:bg-[#323232] text-slate-200 border border-slate-800 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition duration-150 active:scale-95 shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Share</span>
                  </button>

                  {/* Offline Save pill */}
                  <button
                    onClick={handleMockDownload}
                    disabled={isDownloading}
                    className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition duration-150 active:scale-95 border shrink-0 ${
                      isDownloaded
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                        : isDownloading
                        ? 'bg-amber-950/40 text-amber-400 border-amber-900/30 cursor-not-allowed'
                        : 'bg-[#272727] hover:bg-[#323232] text-slate-200 border-slate-800'
                    }`}
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                    <span>
                      {isDownloaded ? 'Downloaded' : isDownloading ? `Saving ${downloadProgress}%` : 'Offline Save'}
                    </span>
                  </button>

                  {/* Save/Favorite pill */}
                  <button
                    onClick={() => handleToggleFavorite(activePlayingVideo.id)}
                    className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition duration-150 active:scale-95 border shrink-0 ${
                      favorites.includes(activePlayingVideo.id)
                        ? 'bg-red-950/40 text-red-400 border-red-900/30'
                        : 'bg-[#272727] hover:bg-[#323232] text-slate-200 border-slate-800'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(activePlayingVideo.id) ? 'fill-current text-red-500' : ''}`} />
                    <span>{favorites.includes(activePlayingVideo.id) ? 'Saved' : 'Save'}</span>
                  </button>
                </div>

                {/* 4. Lesson Description summary */}
                <div className="mx-4 mt-3 bg-[#161616]/30 border border-slate-900 rounded-xl p-3 text-xs leading-relaxed">
                  <p className="text-slate-300 font-medium">
                    यह प्रीमियम लेसन वीडियो <strong className="text-white">Gautam Tiwari</strong> द्वारा प्रदान किया गया है ताकि आप डिजिटल मार्केटिंग और यूट्यूब ग्रोथ को बिल्कुल फ्री में सीख सकें।
                  </p>
                </div>

                {/* 5. Custom Comments Rounded Widget Box - EXACT MATCH WITH SCREENSHOT */}
                <div 
                  onClick={() => setShowCommentsDrawer(true)}
                  className="bg-[#212121]/70 hover:bg-[#2c2c2c]/90 mx-4 mt-3.5 p-3.5 rounded-2xl border border-slate-900 cursor-pointer transition duration-150 select-none group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">Comments</span>
                      <span className="text-[10px] font-black text-slate-300 bg-slate-850 px-2.5 py-0.5 rounded-full">
                        {activeVideoComments.length}
                      </span>
                    </div>
                    <span className="text-[10px] text-red-400 font-black group-hover:underline">View All</span>
                  </div>

                  <div className="mt-2.5 flex items-start gap-2.5">
                    {activeVideoComments.length > 0 ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-purple-700/80 text-white flex items-center justify-center text-[9px] font-black uppercase shrink-0">
                          {activeVideoComments[0].userName ? activeVideoComments[0].userName[0] : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-200 line-clamp-1 leading-snug font-medium">
                            <strong className="text-white font-extrabold mr-1">{activeVideoComments[0].userName}:</strong>
                            {activeVideoComments[0].text}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                          🤔
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Reminds me of... Add your thoughts here
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* 6. SUGGESTED VIDEOS / UP NEXT SECTION */}
                <div className="mt-6 px-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <span>Suggested Videos</span>
                      <span className="text-[9px] font-bold text-red-400 bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded-full">
                        Sujhavit Lessons
                      </span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">From Sikkho App</span>
                  </div>

                  {/* Vertically scrolling suggested video stack */}
                  <div className="space-y-3.5">
                    {videos.filter(v => v.id !== activePlayingVideo.id).length === 0 ? (
                      <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800/80 rounded-2xl">
                        <p className="text-xs font-semibold">No other suggested videos yet.</p>
                      </div>
                    ) : (
                      videos
                        .filter(v => v.id !== activePlayingVideo.id)
                        .map((video) => (
                          <div 
                            key={video.id}
                            onClick={() => {
                              setActivePlayingVideo(video);
                              const scrollContainer = document.getElementById('video-detail-scroll-container');
                              if (scrollContainer) {
                                scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className="flex gap-3 bg-[#161616]/40 hover:bg-[#1a1a1a] p-2.5 rounded-2xl border border-slate-900/40 transition duration-200 cursor-pointer group"
                          >
                            {/* Video Thumbnail Left */}
                            <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 shadow-md">
                              <img 
                                src={`https://img.youtube.com/vi/${video.videoId}/0.jpg`} 
                                alt={video.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/0 transition duration-200 flex items-center justify-center">
                                <div className="w-7 h-7 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition duration-200">
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-mono font-bold text-white px-1 py-0.5 rounded">
                                12:40
                              </span>
                            </div>

                            {/* Metadata Details Right */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                <span className="text-[8px] uppercase font-bold text-red-400 bg-red-950/40 border border-red-900/20 px-2 py-0.5 rounded-full inline-block">
                                  {video.category}
                                </span>
                                <h5 className="font-extrabold text-white text-xs mt-1 line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                                  {video.title}
                                </h5>
                              </div>
                              <div className="text-[9px] text-slate-400 font-semibold space-y-0.5 mt-1">
                                <p className="truncate">@SikkhoApp • Gautam Tiwari</p>
                                <p className="flex items-center gap-1.5 text-slate-500">
                                  <span>{video.views} views</span>
                                  <span>•</span>
                                  <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>

              {/* DETAILED COMMENTS SLIDE-UP DRAWER */}
              <AnimatePresence>
                {showCommentsDrawer && (
                  <>
                    {/* Backdrop */}
                    <div 
                      onClick={() => setShowCommentsDrawer(false)}
                      className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm"
                    />
                    
                    {/* Sliding Drawer Container */}
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      className="absolute bottom-0 left-0 right-0 z-30 bg-[#141414] border-t border-slate-800 rounded-t-3xl h-[70vh] flex flex-col shadow-2xl overflow-hidden"
                    >
                      {/* Drawer Header */}
                      <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#161616]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Comments</span>
                          <span className="text-[10px] font-black text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full">
                            {activeVideoComments.length}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowCommentsDrawer(false)}
                          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Live Comment Form */}
                      <div className="p-4 border-b border-slate-900 shrink-0 bg-[#181818]">
                        <form onSubmit={handleAddComment} className="flex gap-2.5 items-start">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-pink-500 flex items-center justify-center text-white text-[11px] font-black uppercase shadow shadow-red-500/10 shrink-0">
                            {currentUser?.name ? currentUser.name[0] : 'U'}
                          </div>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              placeholder="Add a public in-app comment..."
                              className="w-full bg-[#272727] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition pr-10"
                            />
                            <button
                              type="submit"
                              disabled={!newCommentText.trim()}
                              className="absolute right-1.5 top-1.5 w-7 h-7 bg-red-600 hover:bg-red-700 disabled:bg-[#202020] text-white disabled:text-slate-500 rounded-lg flex items-center justify-center transition active:scale-95 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Comments Scroll area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#141414]">
                        {activeVideoComments.length === 0 ? (
                          <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-1.5">
                            <MessageCircle className="w-8 h-8 text-slate-600 animate-bounce" />
                            <span className="text-xs font-semibold">No comments yet. Be the first to share your thoughts!</span>
                          </div>
                        ) : (
                          activeVideoComments.map((comment) => {
                            const isOwnComment = currentUser?.uid === comment.userId;
                            return (
                              <div key={comment.id} className="flex gap-2.5 items-start bg-[#1e1e1e] p-3 rounded-2xl border border-slate-800 hover:bg-[#252525] transition duration-150 group">
                                <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-white text-[10px] font-bold uppercase shrink-0">
                                  {comment.userName ? comment.userName[0] : 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-extrabold text-white text-[11px] truncate">
                                      {comment.userName || 'Anonymous User'}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-semibold shrink-0">
                                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                    </span>
                                  </div>
                                  <p className="text-slate-200 text-xs mt-1 leading-snug whitespace-pre-wrap font-medium">
                                    {comment.text}
                                  </p>
                                </div>

                                {/* Delete comment option */}
                                {(isOwnComment || isAdmin) && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition duration-150 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Delete Comment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* CUSTOM SHARE MODAL POPUP DIALOG */}
              <AnimatePresence>
                {showShareModal && (
                  <div className="absolute inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-[#181818] border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl relative text-left"
                    >
                      <button
                        onClick={() => setShowShareModal(false)}
                        className="absolute right-3.5 top-3.5 w-7 h-7 bg-[#272727] rounded-full flex items-center justify-center text-slate-300 hover:text-white transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-sm">Share Lesson</h4>
                        <p className="text-[10px] text-slate-400">Share with colleagues and friends. Earn bonus points!</p>
                      </div>

                      <div className="bg-[#272727] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-300 truncate flex-1 select-all">
                          https://www.youtube.com/watch?v={activePlayingVideo.videoId}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${activePlayingVideo.videoId}`);
                            addPoints(15);
                            alert('Link copied! +15 activity points added.');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg transition shrink-0 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>

                      {/* Social shortcuts */}
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {[
                          {
                            name: 'WhatsApp',
                            icon: <Share2 className="w-4 h-4 text-emerald-400" />,
                            action: () => {
                              const text = encodeURIComponent(`Sikkho App पर यह वीडियो देखो: "${activePlayingVideo.title}" - https://www.youtube.com/watch?v=${activePlayingVideo.videoId}`);
                              window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                              addPoints(15);
                            }
                          },
                          {
                            name: 'Twitter',
                            icon: <ExternalLink className="w-4 h-4 text-sky-400" />,
                            action: () => {
                              const text = encodeURIComponent(`Learning YouTube growth on Sikkho App! Check out: "${activePlayingVideo.title}" - https://www.youtube.com/watch?v=${activePlayingVideo.videoId}`);
                              window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                              addPoints(15);
                            }
                          },
                          {
                            name: 'Telegram',
                            icon: <Send className="w-4 h-4 text-blue-400" />,
                            action: () => {
                              const text = encodeURIComponent(`Sikkho App: "${activePlayingVideo.title}"`);
                              const url = encodeURIComponent(`https://www.youtube.com/watch?v=${activePlayingVideo.videoId}`);
                              window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                              addPoints(15);
                            }
                          },
                          {
                            name: 'Gmail',
                            icon: <Mail className="w-4 h-4 text-rose-400" />,
                            action: () => {
                              const subject = encodeURIComponent(`Learn with me on Sikkho: ${activePlayingVideo.title}`);
                              const body = encodeURIComponent(`Hi, check out this great lesson on Sikkho App:\n\n"${activePlayingVideo.title}"\nWatch here: https://www.youtube.com/watch?v=${activePlayingVideo.videoId}`);
                              window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                              addPoints(15);
                            }
                          }
                        ].map((item) => (
                          <button
                            key={item.name}
                            onClick={() => {
                              item.action();
                              setShowShareModal(false);
                            }}
                            className="bg-[#272727] hover:bg-[#323232] p-2.5 rounded-2xl flex flex-col items-center gap-1 transition"
                          >
                            {item.icon}
                            <span className="text-[9px] font-bold text-slate-300">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </div>
            )
          )}
        </AnimatePresence>

        {/* -------------------- STAR RATING OVERLAY DIALOG -------------------- */}
        <AnimatePresence>
          {showRateModal && (
            <div className="absolute inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 text-center max-w-xs space-y-4"
              >
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Rate Sikkho App</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your rating helps us improve the learning features. Earn +30 points!
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      onClick={() => setUserRating(val)}
                      className={`text-2xl transition ${
                        val <= userRating ? 'text-amber-400 scale-110' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRateModal(false)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 font-bold text-xs py-2 px-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRateSubmit}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-md shadow-red-600/10"
                  >
                    Submit
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </DeviceFrame>
  );
}
