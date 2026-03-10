import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UploadProgressBarProps {
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export function UploadProgressBar({ progress, status }: UploadProgressBarProps) {
  if (status === 'completed') return null;

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Waiting to upload...';
      case 'uploading':
        return `Uploading ${Math.round(progress * 100)}%`;
      case 'failed':
        return 'Upload failed';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.round(progress * 100)}%` },
            status === 'failed' && styles.barFailed,
          ]}
        />
      </View>
      <Text style={[styles.statusText, status === 'failed' && styles.failedText]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  barBackground: {
    height: 3,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#25D366',
    borderRadius: 2,
  },
  barFailed: {
    backgroundColor: '#e53935',
  },
  statusText: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 2,
  },
  failedText: {
    color: '#e53935',
  },
});
