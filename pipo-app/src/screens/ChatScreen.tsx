import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChatMessages } from '../hooks/useDatabase';
import { useMediaCapture } from '../hooks/useMediaCapture';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { ConnectivityBanner } from '../components/ConnectivityBanner';
import { mediaService } from '../services/mediaService';
import { Message, RootStackParamList } from '../types';

type Props = {
  route: RouteProp<RootStackParamList, 'Chat'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
};

export function ChatScreen({ route }: Props) {
  const { chatId } = route.params;
  const { messages, loading, sendMessage, retryMessage } = useChatMessages(chatId);
  const { pickImage, pickVideo, takePhoto, startRecording, stopRecording, isRecording } =
    useMediaCapture();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendText = useCallback(
    (text: string) => {
      sendMessage(text, 'text');
    },
    [sendMessage]
  );

  const handlePickImage = useCallback(async () => {
    const result = await pickImage();
    if (!result) return;

    const messageId = `msg-${Date.now()}`;
    await sendMessage('', 'photo', {
      id: messageId,
      mediaLocalUri: result.uri,
      compressedLocalUri: result.uri,
      mediaMimeType: result.mimeType,
      mediaWidth: result.width,
      mediaHeight: result.height,
    });

    await mediaService.createAttachmentForMessage(
      messageId,
      result.uri,
      result.mimeType,
      result.width,
      result.height
    );
    mediaService.processUploadQueue();
  }, [pickImage, sendMessage]);

  const handlePickVideo = useCallback(async () => {
    const result = await pickVideo();
    if (!result) return;

    const messageId = `msg-${Date.now()}`;
    await sendMessage('' , 'video', {
      id: messageId,
      mediaLocalUri: result.uri,
      mediaMimeType: result.mimeType,
      mediaWidth: result.width,
      mediaHeight: result.height,
      mediaDuration: result.duration,
    });

    await mediaService.createAttachmentForMessage(
      messageId,
      result.uri,
      result.mimeType,
      result.width,
      result.height,
      result.duration
    );
    mediaService.processUploadQueue();
  }, [pickVideo, sendMessage]);

  const handleTakePhoto = useCallback(async () => {
    const result = await takePhoto();
    if (!result) return;

    const messageId = `msg-${Date.now()}`;
    await sendMessage('', 'photo', {
      id: messageId,
      mediaLocalUri: result.uri,
      compressedLocalUri: result.uri,
      mediaMimeType: result.mimeType,
      mediaWidth: result.width,
      mediaHeight: result.height,
    });

    await mediaService.createAttachmentForMessage(
      messageId,
      result.uri,
      result.mimeType,
      result.width,
      result.height
    );
    mediaService.processUploadQueue();
  }, [takePhoto, sendMessage]);

  const handleStartRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    const result = await stopRecording();
    if (!result) return;

    const messageId = `msg-${Date.now()}`;
    await sendMessage('', 'audio', {
      id: messageId,
      mediaLocalUri: result.uri,
      mediaMimeType: result.mimeType,
      mediaDuration: result.duration,
    });

    await mediaService.createAttachmentForMessage(
      messageId,
      result.uri,
      result.mimeType,
      undefined,
      undefined,
      result.duration
    );
    mediaService.processUploadQueue();
  }, [stopRecording, sendMessage]);

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} onRetry={retryMessage} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ConnectivityBanner />
      <View style={styles.chatBackground}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />
      </View>
      <MessageInput
        onSendText={handleSendText}
        onPickImage={handlePickImage}
        onPickVideo={handlePickVideo}
        onTakePhoto={handleTakePhoto}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        isRecording={isRecording}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE5DD',
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  messageList: {
    paddingVertical: 8,
  },
});
