import { useCallback } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useState, useRef } from 'react';
import { mediaService } from '../services/mediaService';

interface MediaResult {
  uri: string;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

export function useMediaCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const pickImage = useCallback(async (): Promise<MediaResult | null> => {
    try {
      const result = await mediaService.pickImage();
      if (result.canceled || !result.assets[0]) return null;
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }, []);

  const pickVideo = useCallback(async (): Promise<MediaResult | null> => {
    try {
      const result = await mediaService.pickVideo();
      if (result.canceled || !result.assets[0]) return null;
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        mimeType: asset.mimeType || 'video/mp4',
        width: asset.width,
        height: asset.height,
        duration: asset.duration ? asset.duration / 1000 : undefined,
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
      return null;
    }
  }, []);

  const takePhoto = useCallback(async (): Promise<MediaResult | null> => {
    try {
      const result = await mediaService.takePhoto();
      if (result.canceled || !result.assets[0]) return null;
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Audio recording permission is required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<MediaResult | null> => {
    try {
      if (!recordingRef.current) return null;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();

      recordingRef.current = null;
      setIsRecording(false);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (!uri) return null;

      return {
        uri,
        mimeType: 'audio/m4a',
        duration: status.durationMillis ? status.durationMillis / 1000 : undefined,
      };
    } catch (error) {
      setIsRecording(false);
      recordingRef.current = null;
      Alert.alert('Error', 'Failed to stop recording');
      return null;
    }
  }, []);

  return {
    pickImage,
    pickVideo,
    takePhoto,
    startRecording,
    stopRecording,
    isRecording,
  };
}
