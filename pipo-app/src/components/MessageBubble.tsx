import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Message } from '../types';
import { formatTimestamp, formatDuration } from '../utils/formatters';

const CURRENT_USER_ID = 'user-1';

interface MessageBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
  onMediaPress?: (message: Message) => void;
}

export function MessageBubble({ message, onRetry, onMediaPress }: MessageBubbleProps) {
  const isOwn = message.senderId === CURRENT_USER_ID;

  const renderStatusIcon = () => {
    if (!isOwn) return null;
    switch (message.status) {
      case 'pending':
        return <Text style={styles.statusIcon}>🕐</Text>;
      case 'sent':
        return <Text style={styles.statusIcon}>✓</Text>;
      case 'failed':
        return (
          <TouchableOpacity onPress={() => onRetry?.(message.id)}>
            <Text style={[styles.statusIcon, styles.failedIcon]}>⚠️ Tap to retry</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (message.type) {
      case 'photo':
        return (
          <TouchableOpacity onPress={() => onMediaPress?.(message)} activeOpacity={0.8}>
            <View style={styles.mediaContainer}>
              {message.mediaLocalUri || message.compressedLocalUri || message.mediaUri ? (
                <Image
                  source={{ uri: message.compressedLocalUri || message.mediaLocalUri || message.mediaUri }}
                  style={[
                    styles.mediaImage,
                    message.mediaWidth && message.mediaHeight
                      ? { aspectRatio: message.mediaWidth / message.mediaHeight }
                      : undefined,
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <Text style={styles.mediaPlaceholderText}>📷</Text>
                </View>
              )}
              {message.content ? (
                <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                  {message.content}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );

      case 'video':
        return (
          <TouchableOpacity onPress={() => onMediaPress?.(message)} activeOpacity={0.8}>
            <View style={styles.mediaContainer}>
              <View style={styles.videoPlaceholder}>
                <Text style={styles.playIcon}>▶</Text>
                {message.mediaDuration != null && (
                  <Text style={styles.durationText}>
                    {formatDuration(message.mediaDuration)}
                  </Text>
                )}
              </View>
              {message.content ? (
                <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                  {message.content}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );

      case 'audio':
        return (
          <TouchableOpacity onPress={() => onMediaPress?.(message)} activeOpacity={0.8}>
            <View style={styles.audioContainer}>
              <View style={styles.audioPlayButton}>
                <Text style={styles.audioPlayIcon}>▶</Text>
              </View>
              <View style={styles.audioWaveform}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.audioBar,
                      { height: 4 + Math.random() * 16 },
                      isOwn ? styles.audioBarOwn : styles.audioBarOther,
                    ]}
                  />
                ))}
              </View>
              {message.mediaDuration != null && (
                <Text style={[styles.audioDuration, isOwn && styles.ownMessageText]}>
                  {formatDuration(message.mediaDuration)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );

      default:
        return (
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {renderContent()}
        <View style={styles.metaRow}>
          <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>
            {formatTimestamp(message.createdAt)}
          </Text>
          {renderStatusIcon()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginVertical: 1,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
    minWidth: 80,
  },
  ownBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#1a1a1a',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#8e8e93',
  },
  ownTimestamp: {
    color: '#7cb342',
  },
  statusIcon: {
    fontSize: 11,
    color: '#7cb342',
  },
  failedIcon: {
    color: '#e53935',
    fontSize: 12,
  },
  mediaContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 2,
  },
  mediaImage: {
    width: 220,
    minHeight: 150,
    borderRadius: 6,
  },
  mediaPlaceholder: {
    width: 220,
    height: 150,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPlaceholderText: {
    fontSize: 40,
  },
  videoPlaceholder: {
    width: 220,
    height: 150,
    backgroundColor: '#2c2c2c',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 36,
    color: '#fff',
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 200,
  },
  audioPlayButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  audioPlayIcon: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 2,
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 1.5,
    height: 30,
  },
  audioBar: {
    width: 2.5,
    borderRadius: 2,
  },
  audioBarOwn: {
    backgroundColor: '#7cb342',
  },
  audioBarOther: {
    backgroundColor: '#8e8e93',
  },
  audioDuration: {
    fontSize: 11,
    color: '#8e8e93',
    marginLeft: 6,
  },
});
