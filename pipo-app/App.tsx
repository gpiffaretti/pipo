import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useDatabase } from './src/hooks/useDatabase';
import { connectivityService } from './src/services/connectivityService';
import { messageQueueService } from './src/services/messageQueue';
import { mediaService } from './src/services/mediaService';

function AppContent() {
  const { isReady } = useDatabase();

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  const [servicesReady, setServicesReady] = useState(false);

  useEffect(() => {
    async function initServices() {
      connectivityService.start();
      messageQueueService.start();
      await mediaService.initialize();
      setServicesReady(true);
    }

    initServices();

    return () => {
      connectivityService.stop();
      messageQueueService.stop();
    };
  }, []);

  if (!servicesReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppContent />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
