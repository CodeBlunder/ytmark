// This script runs on youtube.com pages
// It handles button injection and interacting with the video player

declare var chrome: any;

interface Bookmark {
  id: string;
  videoId: string;
  videoTitle: string;
  timestamp: number;
  createdAt: number;
  note?: string;
}

(() => {
    let currentVideoId: string | null = null;
    
    const getYouTubeVideoId = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    };

    const formatTimeSimple = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    const generateId = () => Math.random().toString(36).substring(2, 9);

    const addBookmark = async () => {
        const video = document.querySelector('video');
        const videoId = getYouTubeVideoId();
        const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') as HTMLElement;
        const title = titleElement ? titleElement.innerText : document.title;

        if (video && videoId) {
            const currentTime = video.currentTime;
            
            const newBookmark: Bookmark = {
                id: generateId(),
                videoId: videoId,
                videoTitle: title.replace(' - YouTube', ''),
                timestamp: currentTime,
                createdAt: Date.now(),
                note: `Mark at ${formatTimeSimple(currentTime)}`
            };

            // Get existing bookmarks
            chrome.storage.local.get(['yt-bookmarks'], (result: any) => {
                const bookmarks = result['yt-bookmarks'] || [];
                const updatedBookmarks = [newBookmark, ...bookmarks];
                chrome.storage.local.set({ 'yt-bookmarks': updatedBookmarks }, () => {
                    showFeedback(formatTimeSimple(currentTime));
                });
            });
        }
    };

    const showFeedback = (time: string) => {
        const btn = document.querySelector('.ytmark-btn');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<span style="color:#4ade80;">✓ ${time}</span>`;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }
    };

    const injectButton = () => {
        const controls = document.querySelector('.ytp-right-controls');
        if (controls && !document.querySelector('.ytmark-btn')) {
            const btn = document.createElement('button');
            btn.className = 'ytp-button ytmark-btn';
            btn.title = 'Add Bookmark (YTMark)';
            btn.style.verticalAlign = 'top';
            // SVG Icon
            btn.innerHTML = `
                <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" fill="#fff">
                    <path d="M25,28l-7-3l-7,3V10c0-1.1,0.9-2,2-2h10c1.1,0,2,0.9,2,2V28z" fill="none" stroke="currentColor" stroke-width="2"></path>
                    <path d="M12,28l6-2.5L24,28V10H12V28z" fill="currentColor" opacity="0.9"></path>
                </svg>
            `;
            
            btn.addEventListener('click', addBookmark);
            controls.insertBefore(btn, controls.firstChild);
        }
    };

    // Listen for messages from Popup
    chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
        if (message.type === 'JUMP_TO_TIMESTAMP') {
            const video = document.querySelector('video');
            if (video) {
                video.currentTime = message.timestamp;
                video.play();
            }
        }
        if (message.type === 'GET_VIDEO_DATA') {
            const videoId = getYouTubeVideoId();
            const video = document.querySelector('video');
            const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') as HTMLElement;
            
            if (videoId && video) {
                sendResponse({
                    videoId,
                    title: titleElement ? titleElement.innerText : document.title,
                    currentTime: video.currentTime
                });
            } else {
                sendResponse(null);
            }
        }
        return true;
    });

    // Handle YouTube's SPA navigation
    const observer = new MutationObserver((mutations) => {
        if (!document.querySelector('.ytmark-btn')) {
            injectButton();
        }
        
        // Check if video changed
        const newVideoId = getYouTubeVideoId();
        if (newVideoId !== currentVideoId) {
            currentVideoId = newVideoId;
            injectButton();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial check
    injectButton();
    currentVideoId = getYouTubeVideoId();

})();