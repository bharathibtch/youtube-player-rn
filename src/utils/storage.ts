import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  VIDEO_URL: 'videoUrl',
  VIDEO_POSITION: 'videoPosition',
  LAST_PLAYED: 'lastPlayed',
  URL_HISTORY: 'urlHistory'
} as const;

interface HistoryItem {
  url: string;
  timestamp: string;
  title?: string;
  videoId: string;
}

const extractVideoId = (input: string): string | null => {
  // Case 1: If input is already a valid video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Case 2: Full YouTube URLs
  const patterns = [
    // Standard youtube.com patterns
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    
    // Mobile m.youtube.com patterns
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /m\.youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /m\.youtube\.com\/\?v=([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      console.log('Extracted video ID:', match[1], 'from URL:', input);
      return match[1];
    }
  }
  
  // Case 3: Try to extract from URL with query parameters
  try {
    const url = new URL(input);
    const videoId = url.searchParams.get('v');
    if (videoId && videoId.length === 11) {
      console.log('Extracted video ID from URL params:', videoId);
      return videoId;
    }
  } catch (err) {
    // Not a valid URL, continue to next case
  }

  console.log('Could not extract video ID from:', input);
  return null;
};

const formatYouTubeUrl = (input: string): string => {
  const videoId = extractVideoId(input);
  if (!videoId) {
    throw new Error('Invalid YouTube URL or video ID');
  }
  return `https://youtube.com/watch?v=${videoId}`;
};

export const saveVideoUrl = async (input: string): Promise<void> => {
  const videoId = extractVideoId(input);
  if (!videoId) {
    throw new Error('Invalid YouTube URL or video ID');
  }

  const formattedUrl = formatYouTubeUrl(input);
  await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_URL, formattedUrl);
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_PLAYED, new Date().toISOString());
  
  // Add to history with video ID
  const history = await getUrlHistory();
  const newHistory = [
    { 
      url: formattedUrl, 
      videoId,
      timestamp: new Date().toISOString() 
    },
    ...history.filter(item => item.videoId !== videoId)
  ].slice(0, 10); // Keep only last 10 items
  
  await AsyncStorage.setItem(STORAGE_KEYS.URL_HISTORY, JSON.stringify(newHistory));
};

export const saveVideoPosition = async (position: number): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.VIDEO_POSITION, position.toString());
};

export const getVideoData = async () => {
  const [url, position, lastPlayed] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.VIDEO_URL),
    AsyncStorage.getItem(STORAGE_KEYS.VIDEO_POSITION),
    AsyncStorage.getItem(STORAGE_KEYS.LAST_PLAYED)
  ]);

  if (url) {
    const videoId = extractVideoId(url);
    return {
      url: url,
      videoId: videoId,
      position: position ? parseFloat(position) : 0,
      lastPlayed: lastPlayed ? new Date(lastPlayed) : null
    };
  }

  return null;
};

export const getUrlHistory = async (): Promise<HistoryItem[]> => {
  const history = await AsyncStorage.getItem(STORAGE_KEYS.URL_HISTORY);
  return history ? JSON.parse(history) : [];
};

export const clearVideoData = async (): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.VIDEO_URL),
    AsyncStorage.removeItem(STORAGE_KEYS.VIDEO_POSITION),
    AsyncStorage.removeItem(STORAGE_KEYS.LAST_PLAYED)
  ]);
};

// Export for use in other components
export { extractVideoId };