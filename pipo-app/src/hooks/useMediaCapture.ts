import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { mediaService } from '../services/mediaService';

interface MediaResult {
  uri: string;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

export function useMediaCapture() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

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

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission needed', 'Audio recording permission is required');
      }
    })();
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async (): Promise<MediaResult | null> => {
    try {
      await audioRecorder.stop();

      await setAudioModeAsync({
        allowsRecording: false,
      });

      const uri = audioRecorder.uri;
      if (!uri) return null;

      return {
        uri,
        mimeType: 'audio/m4a',
        duration: recorderState.durationMillis
          ? recorderState.durationMillis / 1000
          : undefined,
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      return null;
    }
  }, [audioRecorder, recorderState.durationMillis]);

  return {
    pickImage,
    pickVideo,
    takePhoto,
    startRecording,
    stopRecording,
    isRecording: recorderState.isRecording,
  };
}
