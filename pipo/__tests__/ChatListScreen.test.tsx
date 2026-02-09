/**
 * @format
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ChatListScreen from '../src/screens/ChatListScreen';

const navigation = { navigate: jest.fn() };

describe('ChatListScreen', () => {
  test('matches snapshot', () => {
    const { getByText } = render(
      <ChatListScreen navigation={navigation as never} route={{} as never} />,
    );

    const snapshot = {
      titles: ['Luna', 'Weekend Highlights', 'Milo'],
      previews: [
        'First steps video',
        'Photo from the beach',
        'Voice note: bedtime story',
      ],
      timestamps: ['9:42 AM', 'Yesterday', 'Mon'],
    };

    snapshot.titles.forEach((title) => {
      expect(getByText(title)).toBeTruthy();
    });
    snapshot.previews.forEach((preview) => {
      expect(getByText(preview)).toBeTruthy();
    });
    snapshot.timestamps.forEach((timestamp) => {
      expect(getByText(timestamp)).toBeTruthy();
    });

    expect(snapshot).toMatchInlineSnapshot(`
{
  "previews": [
    "First steps video",
    "Photo from the beach",
    "Voice note: bedtime story",
  ],
  "timestamps": [
    "9:42 AM",
    "Yesterday",
    "Mon",
  ],
  "titles": [
    "Luna",
    "Weekend Highlights",
    "Milo",
  ],
}
`);
  });
});
