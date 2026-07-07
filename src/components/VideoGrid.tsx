import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Heart, Play, Eye, Flame, RefreshCcw, ArrowRight } from 'lucide-react';
import { Video } from '../types';

interface VideoGridProps {
  videos: Video[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPlayVideo: (video: Video) => void;
  onPullToRefresh: () => Promise<void>;
}

const CATEGORIES = ['All', 'YouTube Grow Lesson', "Let's Earn Money", 'Short Video', 'Music by Gautam', 'Music by Arvind'];

export default function VideoGrid({ 
  videos, 
  favorites, 
  onToggleFavorite, 
  onPlayVideo,
  onPullToRefresh
}: VideoGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onPullToRefresh();
    setRefreshing(false);
  };

  // Filter and search
  const filteredVideos = videos.filter(vid => {
    const matchesSearch = vid.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          vid.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || vid.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Search Bar & Category Scroller Segment */}
      <div className="px-4 pt-3 pb-2 shrink-0 space-y-3 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 transition-colors">
        {/* Search Input */}
        <div className="relative">
          <input
            id="video-search-input"
            type="text"
            placeholder="Search tutorials, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 dark:text-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Categories Chip Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 select-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Pull to Refresh Header indicator */}
      <div className="flex justify-center shrink-0">
        <button 
          id="pull-to-refresh"
          onClick={handleRefresh}
          className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 font-bold py-1.5 select-none"
        >
          <RefreshCcw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Pull to Refresh'}
        </button>
      </div>

      {/* Videos scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
        {/* YouTube Shorts Horizontal Shelf: Only when category is All */}
        {activeCategory === 'All' && videos.filter(v => v.category === 'Short Video').length > 0 && (
          <div className="mb-8 max-w-7xl mx-auto text-left">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                  <Flame className="w-4 h-4 fill-current animate-pulse" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
                    Sikkho Shorts
                  </h3>
                  <p className="text-[9px] text-slate-400 font-semibold">मज़ेदार और छोटे वीडियो यहाँ देखें</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCategory('Short Video')}
                className="text-[9px] text-red-600 dark:text-red-400 hover:underline font-black flex items-center gap-0.5 uppercase tracking-wider"
              >
                See All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Horizontal Scroll of Shorts */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none select-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {videos
                .filter(v => v.category === 'Short Video')
                .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((vid) => {
                  const isFav = favorites.includes(vid.id);
                  return (
                    <div
                      key={vid.id}
                      onClick={() => onPlayVideo(vid)}
                      className="w-[115px] sm:w-[135px] shrink-0 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-850 shadow-sm hover:shadow-md transition duration-200 group flex flex-col cursor-pointer relative"
                    >
                      <div className="relative aspect-[9/16] w-full overflow-hidden bg-slate-950">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(vid.id);
                          }}
                          className={`absolute top-2 right-2 p-1 rounded-lg transition z-10 ${
                            isFav 
                              ? 'bg-red-600 text-white shadow-sm' 
                              : 'bg-black/40 text-slate-300 hover:text-white backdrop-blur-sm'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </div>
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 space-y-0.5">
                          <h4 className="text-[10px] font-extrabold text-white line-clamp-2 leading-tight drop-shadow-md">
                            {vid.title}
                          </h4>
                          <p className="text-[8px] font-semibold text-slate-300 flex items-center gap-0.5 drop-shadow-sm">
                            <Eye className="w-2.5 h-2.5 text-red-500" />
                            {vid.views || 0} views
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Regular videos grid & Dedicated Shorts Grid */}
        {activeCategory === 'Short Video' ? (
          /* Dedicated Shorts Vertical 9:16 Gallery */
          filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Shorts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 max-w-7xl mx-auto">
              {filteredVideos.map((vid, idx) => {
                const isFav = favorites.includes(vid.id);
                return (
                  <motion.div
                    key={vid.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    onClick={() => onPlayVideo(vid)}
                    className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-850 shadow-sm hover:shadow-md transition duration-200 group flex flex-col cursor-pointer relative"
                  >
                    <div className="relative aspect-[9/16] w-full overflow-hidden bg-slate-950">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                      <div className="absolute top-2.5 left-2.5 bg-red-600 text-white font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                        <Flame className="w-2.5 h-2.5 fill-current animate-pulse" />
                        <span>Sikkho Shorts</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(vid.id);
                        }}
                        className={`absolute top-2.5 right-2.5 p-1.5 rounded-xl transition z-10 ${
                          isFav 
                            ? 'bg-red-600 text-white shadow-sm' 
                            : 'bg-black/40 text-slate-300 hover:text-white backdrop-blur-sm'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                        <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-left space-y-0.5">
                        <h4 className="text-[11px] font-extrabold text-white line-clamp-2 leading-tight drop-shadow-md">
                          {vid.title}
                        </h4>
                        <p className="text-[9px] font-semibold text-slate-300 flex items-center gap-1 drop-shadow-sm">
                          <Eye className="w-3 h-3 text-red-500" />
                          {vid.views || 0} views
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          /* Regular 16:9 Landscape Grid */
          filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No matching videos</p>
              <p className="text-[10px] text-slate-400 max-w-[200px] mt-1">Try typing another query or clear the filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
              {filteredVideos
                // Filter out short videos from the main home listing if they have their own shelf above
                .filter(vid => activeCategory !== 'All' || vid.category !== 'Short Video')
                .map((vid, idx) => {
                  const isFav = favorites.includes(vid.id);

                  return (
                    <motion.div
                      key={vid.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-850 shadow-sm hover:shadow-md transition duration-200 group flex flex-col"
                    >
                      {/* Thumbnail Layer with click event */}
                      <div className="relative aspect-video w-full overflow-hidden cursor-pointer" onClick={() => onPlayVideo(vid)}>
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Category chip overlay */}
                        <span className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          {vid.category}
                        </span>

                        {/* Play Button Icon Overlay */}
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Video Info Segment */}
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5 cursor-pointer" onClick={() => onPlayVideo(vid)}>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
                            {vid.title}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/60 mt-auto select-none">
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              {vid.views || 0} views
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Favorite Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(vid.id);
                              }}
                              className={`p-1.5 rounded-xl transition ${
                                isFav 
                                  ? 'bg-red-50 text-red-500 dark:bg-red-950/20' 
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                              }`}
                              title={isFav ? 'Remove Favorite' : 'Save Favorite'}
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                            </button>

                            {/* Launch Button */}
                            <button
                              onClick={() => onPlayVideo(vid)}
                              className="bg-slate-50 hover:bg-red-50 dark:bg-slate-800 hover:dark:bg-red-950/20 text-slate-500 hover:text-red-500 p-1.5 rounded-xl transition flex items-center gap-1 text-[10px] font-bold"
                            >
                              Watch <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )
        )}
      </div>

    </div>
  );
}
