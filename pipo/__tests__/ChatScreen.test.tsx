/**
 * @format
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ChatScreen from '../src/screens/ChatScreen';

const route = { params: { chatId: 'chat-1' } };

describe('ChatScreen', () => {
  test('matches snapshot', () => {
    const { getByText } = render(
      <ChatScreen navigation={{} as never} route={route as never} />,
    );

    const snapshot = {
      header: 'Chat chat-1',
      placeholders: ['Audio message', 'Photo', 'Video'],
      text: 'First laugh today. She giggled for five minutes straight.',
      timestamps: ['9:12 AM', '9:13 AM', '9:20 AM', '9:40 AM'],
    };

    expect(getByText(snapshot.header)).toBeTruthy();
    expect(getByText(snapshot.text)).toBeTruthy();
    snapshot.placeholders.forEach((label) => {
      expect(getByText(label)).toBeTruthy();
    });
    snapshot.timestamps.forEach((time) => {
      expect(getByText(time)).toBeTruthy();
    });

    expect(snapshot).toMatchInlineSnapshot(`
{
  "header": "Chat chat-1",
  "placeholders": [
    "Audio message",
    "Photo",
    "Video",
  ],
  "text": "First laugh today. She giggled for five minutes straight.",
  "timestamps": [
    "9:12 AM",
    "9:13 AM",
    "9:20 AM",
    "9:40 AM",
  ],
}
`);
  });

  test('renders message type placeholders', () => {
    const { getByText } = render(
      <ChatScreen navigation={{} as never} route={route as never} />,
    );

    expect(
      getByText('First laugh today. She giggled for five minutes straight.'),
    ).toBeTruthy();
    expect(getByText('Audio message')).toBeTruthy();
    expect(getByText('Photo')).toBeTruthy();
    expect(getByText('Video')).toBeTruthy();
  });
});
