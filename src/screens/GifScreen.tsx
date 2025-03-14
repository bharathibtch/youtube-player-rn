import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'GIF'>;

const GifScreen: React.FC<Props> = ({ navigation }) => {
  const handleBack = () => {
    navigation.navigate('Video');
  };

  return (
    <View style={styles.container}>
      <View style={styles.gifContainer}>
        <Image
          source={{ uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDM3YTM5MzU5ZmQ5NDY3ZjM4YzM1YjYxODFiYzM4YmFiZDM0NjE2YiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/JIX9t2j0ZTN9S/giphy.gif' }}
          style={styles.gif}
          resizeMode="contain"
        />
        <Text style={styles.caption}>Time for a quick break! 😄</Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleBack}
      >
        <Text style={styles.buttonText}>Back to Video</Text>
      </TouchableOpacity>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gifContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gif: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 15,
    marginBottom: 20,
  },
  caption: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default GifScreen;