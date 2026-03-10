import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConnectivity } from '../hooks/useConnectivity';

export function ConnectivityBanner() {
  const isConnected = useConnectivity();

  if (isConnected) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
