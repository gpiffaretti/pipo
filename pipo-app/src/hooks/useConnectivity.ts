import { useState, useEffect } from 'react';
import { connectivityService } from '../services/connectivityService';

export function useConnectivity(): boolean {
  const [isConnected, setIsConnected] = useState(connectivityService.isConnected);

  useEffect(() => {
    const removeListener = connectivityService.addListener((connected) => {
      setIsConnected(connected);
    });

    return removeListener;
  }, []);

  return isConnected;
}
