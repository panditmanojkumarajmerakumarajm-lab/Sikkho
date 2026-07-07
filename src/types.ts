export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  mobile?: string;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  points: number;
  badge: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  createdAt: string;
  lastActive: string;
}

export interface Video {
  id: string;
  videoUrl: string;
  videoId: string;
  title: string;
  thumbnail: string;
  category: string;
  uploadedAt: string;
  views: number;
  likesCount?: number;
  dislikesCount?: number;
  sharesCount?: number;
}

export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  createdAt: string;
}

export interface VideoInteraction {
  id: string;
  userId: string;
  videoId: string;
  type: 'like' | 'dislike' | null;
  updatedAt: string;
}

export interface BannerSlide {
  id: string;
  imageUrl: string;
  title?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface VideoRequest {
  id: string;
  name: string;
  mobile: string;
  videoUrl?: string;
  message: string;
  createdAt: string;
}

export interface FeedbackMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'New Video' | 'Announcement' | 'Live Stream';
  sentAt: string;
}

export interface AppConfig {
  subscriberGoal: number;
  currentSubscribers: number;
}
