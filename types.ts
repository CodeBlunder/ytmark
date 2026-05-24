export interface Bookmark {
  id: string;
  videoId: string;
  videoTitle: string;
  timestamp: number; // in seconds
  createdAt: number; // Date.now()
  note?: string;
}

export enum SortOption {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  TIMESTAMP = 'TIMESTAMP'
}

export type ExtensionMessage = 
  | { type: 'JUMP_TO_TIMESTAMP'; timestamp: number }
  | { type: 'GET_VIDEO_DATA' }
  | { type: 'VIDEO_DATA_RESPONSE'; videoId: string; title: string; currentTime: number }
  | { type: 'BOOKMARK_SAVED' };
