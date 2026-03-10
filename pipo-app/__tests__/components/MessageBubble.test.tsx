import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageBubble } from '../../src/components/MessageBubble';
import { Message } from '../../src/types';

const baseMessage: Message = {
  id: 'msg-1',
  chatId: 'chat-1',
  senderId: 'user-1',
  content: 'Hello world',
  type: 'text',
  status: 'sent',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
};

describe('MessageBubble', () => {
  it('renders text message content', () => {
    const { getByText } = render(<MessageBubble message={baseMessage} />);
    expect(getByText('Hello world')).toBeTruthy();
  });

  it('renders sent status icon for own messages', () => {
    const { getByText } = render(<MessageBubble message={baseMessage} />);
    expect(getByText('✓')).toBeTruthy();
  });

  it('renders pending status icon', () => {
    const pendingMessage = { ...baseMessage, status: 'pending' as const };
    const { getByText } = render(<MessageBubble message={pendingMessage} />);
    expect(getByText('🕐')).toBeTruthy();
  });

  it('renders audio message with play button', () => {
    const audioMessage: Message = {
      ...baseMessage,
      type: 'audio',
      content: '',
      mediaDuration: 15,
    };
    const { getByText } = render(<MessageBubble message={audioMessage} />);
    expect(getByText('▶')).toBeTruthy();
  });

  it('renders video message with play icon', () => {
    const videoMessage: Message = {
      ...baseMessage,
      type: 'video',
      content: 'Check this out',
      mediaDuration: 30,
    };
    const { getByText } = render(<MessageBubble message={videoMessage} />);
    expect(getByText('▶')).toBeTruthy();
    expect(getByText('0:30')).toBeTruthy();
  });
});
