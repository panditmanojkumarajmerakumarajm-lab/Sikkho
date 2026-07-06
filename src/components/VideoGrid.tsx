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

const CATEGORIES = ['All', 'YouTube Grow Lesson', "Let's Earn Money"];

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
        {filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No matching videos</p>
            <p className="text-[10px] text-slate-400 max-w-[200px] mt-1">Try typing another query or clear the filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {filteredVideos.map((vid, idx) => {
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
        )}
      </div>

    </div>
  );
}
