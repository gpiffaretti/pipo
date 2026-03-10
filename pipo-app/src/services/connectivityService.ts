import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type ConnectivityListener = (isConnected: boolean) => void;

class ConnectivityService {
  private listeners: Set<ConnectivityListener> = new Set();
  private _isConnected: boolean = true;
  private unsubscribe: (() => void) | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  start(): void {
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this._isConnected;
      this._isConnected = state.isConnected ?? false;

      if (wasConnected !== this._isConnected) {
        this.notifyListeners();
      }
    });
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  addListener(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this._isConnected));
  }
}

export const connectivityService = new ConnectivityService();
