import React, { useState, useEffect } from 'react';
import { Bookmark, SortOption } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import BookmarkList from './components/BookmarkList';
import { Youtube, Search, AlertCircle, ExternalLink } from 'lucide-react';

declare var chrome: any;

function App() {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>("Loading...");
  const [allBookmarks, setAllBookmarks, isLoaded] = useLocalStorage<Bookmark[]>('yt-bookmarks', []);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.TIMESTAMP);
  const [activeTabUrl, setActiveTabUrl] = useState<string>('');
  
  // Initialize Popup
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      // Get active tab info
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
        const tab = tabs[0];
        if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
            setActiveTabUrl(tab.url);
            
            // Ask content script for details
            chrome.tabs.sendMessage(tab.id!, { type: 'GET_VIDEO_DATA' }, (response: any) => {
                if (chrome.runtime.lastError) {
                   // Content script might not be loaded yet or page refreshed
                   const urlParams = new URLSearchParams(new URL(tab.url!).search);
                   const vId = urlParams.get('v');
                   if (vId) setCurrentVideoId(vId);
                   setCurrentVideoTitle(tab.title || "Unknown Video");
                } else if (response) {
                    setCurrentVideoId(response.videoId);
                    setCurrentVideoTitle(response.title);
                }
            });
        } else {
            setCurrentVideoId(null);
        }
      });
    }
  }, []);

  const handleDeleteBookmark = (id: string) => {
    setAllBookmarks((prev) => prev.filter(b => b.id !== id));
  };

  const handleJumpToTimestamp = (timestamp: number) => {
    // If we are on the correct video, just seek
    // If on a different page, open new tab or redirect
    
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
            const tab = tabs[0];
            if (tab.id) {
                // Check if current tab is the correct video
                if (tab.url && currentVideoId && tab.url.includes(currentVideoId)) {
                     chrome.tabs.sendMessage(tab.id, { type: 'JUMP_TO_TIMESTAMP', timestamp });
                } else {
                     // Need to navigate or find correct bookmark logic (if clicking generic list)
                     // For now, only show bookmarks for current video, so this logic is simple
                }
            }
        });
    }
  };

  // Filter bookmarks for current video only
  const currentBookmarks = allBookmarks.filter(b => b.videoId === currentVideoId);

  if (!isLoaded) return <div className="p-4 bg-dark-900 text-white">Loading...</div>;

  return (
    <div className="w-[350px] min-h-[400px] bg-dark-900 text-gray-100 font-sans border border-dark-700">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-900 border-b border-brand-700 px-4 py-3 shadow-md">
        <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-full text-brand-600">
                <Youtube className="w-4 h-4 fill-current" />
            </div>
            <span className="text-base font-bold text-white tracking-wide">YTMark</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {currentVideoId ? (
            <>
                <div className="mb-4">
                    <h2 className="text-sm font-semibold text-white line-clamp-2 leading-tight">
                        {currentVideoTitle.replace(' - YouTube', '')}
                    </h2>
                    <span className="text-[10px] text-brand-400 bg-brand-900/30 px-1.5 py-0.5 rounded mt-1 inline-block border border-brand-500/20">
                        Active Video
                    </span>
                </div>

                <BookmarkList
                    bookmarks={currentBookmarks}
                    onDelete={handleDeleteBookmark}
                    onJump={handleJumpToTimestamp}
                    sortBy={sortOption}
                    onSortChange={setSortOption}
                />
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="p-4 bg-dark-800 rounded-full">
                    <Youtube className="w-8 h-8 text-gray-500" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-300">No active video detected</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                        Open a YouTube video to view or add bookmarks.
                    </p>
                </div>
                <a 
                    href="https://www.youtube.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Open YouTube <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        )}
      </main>
      
      {/* Footer / Instructions */}
      <footer className="bg-dark-800 p-3 text-[10px] text-gray-500 border-t border-dark-700 flex justify-between">
          <span>Version 1.0</span>
          <span>Click bookmark icon in player to save</span>
      </footer>
    </div>
  );
}

export default App;