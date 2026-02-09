/* eslint-env jest */

import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-screens', () => {
  const { View } = require('react-native');

  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(),
    Screen: View,
    ScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderLeftView: View,
    ScreenStackHeaderRightView: View,
    ScreenStackHeaderCenterView: View,
    ScreenStackHeaderSubview: View,
    NativeScreen: View,
  };
});
