import React from 'react';
import { Bookmark, SortOption } from '../types';
import { formatTime, formatDate } from '../utils';
import { Play, Trash2, Clock, Calendar } from 'lucide-react';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  onJump: (timestamp: number) => void;
  sortBy: SortOption;
  onSortChange: (option: SortOption) => void;
}

const BookmarkList: React.FC<BookmarkListProps> = ({ 
  bookmarks, 
  onDelete, 
  onJump, 
  sortBy,
  onSortChange
}) => {
  
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    if (sortBy === SortOption.NEWEST) return b.createdAt - a.createdAt;
    if (sortBy === SortOption.OLDEST) return a.createdAt - b.createdAt;
    if (sortBy === SortOption.TIMESTAMP) return a.timestamp - b.timestamp;
    return 0;
  });

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-center px-4 border border-dashed border-dark-700 rounded-xl bg-dark-800/50">
        <Clock className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm font-medium text-gray-400">No bookmarks yet</p>
        <p className="text-xs mt-1 text-gray-600">Click the bookmark icon on the video player to save moments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Saved Moments
        </h3>
        <select 
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-dark-800 text-[10px] text-gray-300 border border-dark-700 rounded px-1.5 py-0.5 outline-none focus:border-brand-500"
        >
            <option value={SortOption.TIMESTAMP}>Time</option>
            <option value={SortOption.NEWEST}>Newest</option>
            <option value={SortOption.OLDEST}>Oldest</option>
        </select>
      </div>

      <div className="space-y-2">
        {sortedBookmarks.map((bookmark) => {
            return (
            <div 
                key={bookmark.id}
                className="group relative p-3 rounded-lg bg-dark-800 border border-dark-700 hover:border-brand-500/50 transition-all duration-200"
            >
                <div className="flex justify-between items-start gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => onJump(bookmark.timestamp)}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-900/30 text-brand-500 flex items-center gap-1 border border-brand-500/10">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            {formatTime(bookmark.timestamp)}
                        </span>
                        <span className="text-[10px] text-gray-600">
                            {formatDate(bookmark.createdAt)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-200 font-medium line-clamp-1 hover:text-brand-500 transition-colors">
                        {bookmark.note || bookmark.videoTitle}
                    </p>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bookmark.id);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Bookmark"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );
};

export default BookmarkList;