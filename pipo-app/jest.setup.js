// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Recording: {
      createAsync: jest.fn().mockResolvedValue({
        recording: {
          stopAndUnloadAsync: jest.fn(),
          getURI: jest.fn().mockReturnValue('file://mock-audio.m4a'),
          getStatusAsync: jest.fn().mockResolvedValue({ durationMillis: 5000 }),
        },
      }),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => {
  const mockFile = {
    uri: 'file://mock',
    exists: true,
    size: 1024,
    copy: jest.fn(),
  };
  const mockDirectory = {
    uri: 'file://mock-dir',
    exists: true,
    create: jest.fn(),
  };
  return {
    Paths: {
      document: mockDirectory,
      cache: mockDirectory,
    },
    File: jest.fn().mockReturnValue(mockFile),
    Directory: jest.fn().mockReturnValue(mockDirectory),
  };
});

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({
    uri: 'file://mock-compressed.jpg',
    width: 800,
    height: 600,
  }),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));
