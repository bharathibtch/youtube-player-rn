import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, TextInput, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { saveVideoUrl, getUrlHistory, extractVideoId } from '../utils/storage';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HistoryItem {
  url: string;
  timestamp: string;
  videoId: string;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const urlHistory = await getUrlHistory();
      setHistory(urlHistory);
    } catch (err) {
      console.log('Error loading history:', err);
    }
  };

  const handleSave = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL or video ID');
      return;
    }

    try {
      const videoId = extractVideoId(url);
      if (!videoId) {
        setError('Invalid YouTube URL or video ID');
        return;
      }

      await saveVideoUrl(url);
      setUrl('');
      setError('');
      navigation.navigate('Video');
    } catch (err) {
      setError('Failed to save URL');
    }
  };

  const handleHistoryItemPress = async (historyUrl: string) => {
    try {
      await saveVideoUrl(historyUrl);
      navigation.navigate('Video');
    } catch (err) {
      setError('Failed to load video');
    }
  };

  const formatVideoUrl = (url: string, videoId: string): string => {
    if (url.includes('youtu.be/')) {
      return `youtu.be/${videoId}`;
    }
    return `Video ID: ${videoId}`;
  };

  return (
    <ImageBackground
      source={{ uri: 'https://i.imgur.com/6YQ9Z3P.jpg' }}
      style={styles.background}
      blurRadius={3}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>YouTube Player</Text>
          <Text style={styles.subtitle}>Watch and Resume Videos Seamlessly</Text>
          
          <View style={styles.formContainer}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="Enter YouTube URL or Video ID"
              placeholderTextColor="#999"
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save & Play</Text>
            </TouchableOpacity>
          </View>

          {history.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Recent Videos</Text>
              {history.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => handleHistoryItemPress(item.url)}
                >
                  <Text style={styles.historyUrl} numberOfLines={1}>
                    {formatVideoUrl(item.url, item.videoId)}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButton: {
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    color: '#FF0000',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    textAlign: 'center',
  },
  historyContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 15,
  },
  historyTitle: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 15,
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  historyUrl: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
  },
  historyDate: {
    color: '#cccccc',
    fontSize: 12,
  },
});

export default HomeScreen;