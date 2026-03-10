import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('../src/navigation/AppNavigator', () => ({
  AppNavigator: () => {
    const { Text } = require('react-native');
    return <Text>Pipo App</Text>;
  },
}));

jest.mock('../src/hooks/useDatabase', () => ({
  useDatabase: () => ({ isReady: true }),
}));

jest.mock('../src/services/connectivityService', () => ({
  connectivityService: {
    start: jest.fn(),
    stop: jest.fn(),
    isConnected: true,
    addListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('../src/services/messageQueue', () => ({
  messageQueueService: {
    start: jest.fn(),
    stop: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('../src/services/mediaService', () => ({
  mediaService: {
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('App', () => {
  it('renders without crashing', async () => {
    const { findByText } = render(<App />);
    const text = await findByText('Pipo App');
    expect(text).toBeTruthy();
  });
});
