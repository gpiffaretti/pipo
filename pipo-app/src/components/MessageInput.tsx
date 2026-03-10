import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onTakePhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
}

export function MessageInput({
  onSendText,
  onPickImage,
  onPickVideo,
  onTakePhoto,
  onStartRecording,
  onStopRecording,
  isRecording,
}: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText('');
  };

  const handleAttachment = () => {
    const options = ['Take Photo', 'Photo from Gallery', 'Video from Gallery', 'Cancel'];
    const cancelIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) onTakePhoto();
          else if (buttonIndex === 1) onPickImage();
          else if (buttonIndex === 2) onPickVideo();
        }
      );
    } else {
      Alert.alert('Attach Media', 'Choose an option', [
        { text: 'Take Photo', onPress: onTakePhoto },
        { text: 'Photo from Gallery', onPress: onPickImage },
        { text: 'Video from Gallery', onPress: onPickVideo },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const showSend = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.attachButton} onPress={handleAttachment}>
        <Text style={styles.attachIcon}>+</Text>
      </TouchableOpacity>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor="#8e8e93"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
        />
      </View>

      {showSend ? (
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={handleMicPress}
        >
          <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d0d0d0',
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  attachIcon: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '300',
    marginTop: -1,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 20,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    marginBottom: 2,
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    marginBottom: 2,
  },
  micButtonRecording: {
    backgroundColor: '#e53935',
  },
  micIcon: {
    fontSize: 20,
  },
});
