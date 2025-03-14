import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { getVideoData, saveVideoPosition, clearVideoData } from '../utils/storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type VideoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Video'>;

const VideoScreen: React.FC = () => {
  const [videoId, setVideoId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [initialPosition, setInitialPosition] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const positionInterval = useRef<NodeJS.Timeout>();
  const playerRef = useRef<any>(null);
  const lastPosition = useRef<number>(0);
  const isFocused = useIsFocused();
  const hasInitialized = useRef(false);
  const shouldAutoplay = useRef(true);
  const initializationTimeout = useRef<NodeJS.Timeout>();
  const [currentPosition, setCurrentPosition] = useState(0);

  const navigation = useNavigation<VideoScreenNavigationProp>();
  const { width: screenWidth } = Dimensions.get('window');
  const playerHeight = screenWidth * 0.5625; // 16:9 aspect ratio

  useEffect(() => {
    if (isFocused) {
      console.log('Screen focused, resuming playback...');
      shouldAutoplay.current = true;
      hasInitialized.current = false;
      loadVideoData();
    } else {
      console.log('Screen unfocused, saving position...');
      saveCurrentPosition();
      shouldAutoplay.current = false;
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    }

    return () => {
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, [isFocused]);

  useEffect(() => {
    return () => {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
      saveCurrentPosition();
    };
  }, []);

  const saveCurrentPosition = async () => {
    if (playerRef.current) {
      try {
        const currentTime = await playerRef.current.getCurrentTime();
        lastPosition.current = currentTime;
        await saveVideoPosition(currentTime);
        console.log('Saved position:', currentTime);
      } catch (err) {
        console.error('Error saving position:', err);
      }
    }
  };

  const loadVideoData = async () => {
    try {
      setLoading(true);
      setPlayerReady(false);
      const data = await getVideoData();
      console.log('Video data loaded:', data);
      
      if (data?.videoId) {
        console.log('Setting video ID:', data.videoId);
        setVideoId(data.videoId);
        const resumePosition = Math.max(data.position || 0, lastPosition.current);
        setInitialPosition(resumePosition);
        setIsPlaying(true);
        hasInitialized.current = false;
        console.log('Resuming from position:', resumePosition);
      } else {
        console.error('No valid video ID found in data');
        setError('No valid video ID found');
        navigation.goBack();
      }
    } catch (err) {
      console.error('Error loading video data:', err);
      setError('Failed to load video data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const initializePlayer = async () => {
    console.log('Initializing player...');
    if (playerRef.current) {
      try {
        // First ensure we're at position 0
        await playerRef.current.seekTo(0, true);
        
        // Then seek to the actual position
        if (initialPosition > 0) {
          await playerRef.current.seekTo(initialPosition, true);
          console.log('Seeked to position:', initialPosition);
        }
        
        if (shouldAutoplay.current) {
          console.log('Setting autoplay to true');
          setIsPlaying(true);
          // Force play state after a short delay
          setTimeout(() => {
            if (shouldAutoplay.current) {
              setIsPlaying(true);
            }
          }, 500);
        }
      } catch (err) {
        console.error('Error during player initialization:', err);
      }
    }
  };

  const handleVideoReady = () => {
    console.log('Video player ready, current play state:', isPlaying);
    setPlayerReady(true);
    
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // Clear any existing timeout
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
      // Set new timeout for initialization
      initializationTimeout.current = setTimeout(() => {
        initializePlayer();
      }, 1000);
    }

    if (!positionInterval.current) {
      positionInterval.current = setInterval(async () => {
        if (playerRef.current) {
          try {
            const currentTime = await playerRef.current.getCurrentTime();
            lastPosition.current = currentTime;
            await saveVideoPosition(currentTime);
          } catch (err) {
            console.error('Error saving position:', err);
          }
        }
      }, 2000);
    }
  };

  const handleVideoError = (error: any) => {
    console.error('YouTube player error:', error);
    setError(`Video playback error: ${error}`);
  };

  const handleEdit = async () => {
    await saveCurrentPosition();
    await clearVideoData();
    navigation.navigate('Home');
  };

  const handleGifPage = async () => {
    await saveCurrentPosition();
    navigation.navigate('GIF');
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStateChange = (state: string) => {
    console.log('Video state changed:', state);
    switch (state) {
      case 'ended':
        setIsPlaying(false);
        shouldAutoplay.current = false;
        break;
      case 'playing':
        if (!isPlaying) setIsPlaying(true);
        if (playerRef.current) {
          playerRef.current.getCurrentTime().then((time: number) => {
            lastPosition.current = time;
            setCurrentPosition(time);
            console.log('Updated last position:', time);
          });
        }
        break;
      case 'buffering':
        // Keep current play state during buffering
        break;
      case 'paused':
        if (isPlaying) setIsPlaying(false);
        if (playerRef.current) {
          playerRef.current.getCurrentTime().then((time: number) => {
            setCurrentPosition(time);
          });
        }
        break;
      case 'unstarted':
        // Initialize if needed
        if (shouldAutoplay.current && !hasInitialized.current) {
          if (initializationTimeout.current) {
            clearTimeout(initializationTimeout.current);
          }
          initializationTimeout.current = setTimeout(() => {
            initializePlayer();
          }, 500);
        }
        break;
      default:
        console.log('Unhandled player state:', state);
    }
  };

  useEffect(() => {
    const positionUpdateInterval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        playerRef.current.getCurrentTime().then((time: number) => {
          setCurrentPosition(time);
        });
      }
    }, 1000);

    return () => {
      clearInterval(positionUpdateInterval);
    };
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <View style={styles.mainContent}>
          {videoId && (
            <>
              <View style={styles.playerWrapper}>
                <YoutubePlayer
                  ref={playerRef}
                  height={playerHeight}
                  width={screenWidth}
                  play={isPlaying && playerReady}
                  videoId={videoId}
                  onReady={handleVideoReady}
                  onError={handleVideoError}
                  onChangeState={handleStateChange}
                  webViewProps={{
                    androidLayerType: 'hardware',
                    renderToHardwareTextureAndroid: true,
                  }}
                  initialPlayerParams={{
                    preventFullScreen: false,
                    controls: true,
                    start: initialPosition,
                    modestbranding: true,
                    showClosedCaptions: true,
                    rel: false,
                  }}
                />
              </View>
              {!playerReady && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#FF0000" />
                  <Text style={styles.loadingText}>Preparing player...</Text>
                </View>
              )}
              <View style={styles.positionContainer}>
                <Text style={styles.positionText}>
                  Current Position: {formatTime(currentPosition)}
                </Text>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleEdit}
                >
                  <Text style={styles.buttonText}>Edit Video URL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.gifButton]}
                  onPress={handleGifPage}
                >
                  <Text style={styles.buttonText}>Take a Break</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  playerWrapper: {
    width: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  error: {
    color: '#FF0000',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#000000',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gifButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  positionContainer: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  positionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
});

export default VideoScreen;