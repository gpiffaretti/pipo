import { v4 as uuidv4 } from 'uuid';
import {
  enqueueMessage,
  dequeueMessage,
  getQueuedMessages,
  incrementQueueRetry,
  getFailedQueueItems,
  updateMessageStatus,
} from '../db/queries';
import { connectivityService } from './connectivityService';
import { QueuedMessage } from '../types';

type QueueEventListener = (event: 'processing' | 'completed' | 'failed', messageId: string) => void;

class MessageQueueService {
  private processing = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<QueueEventListener> = new Set();

  start(): void {
    connectivityService.addListener((isConnected) => {
      if (isConnected) {
        this.processQueue();
      }
    });

    this.intervalId = setInterval(() => {
      if (connectivityService.isConnected) {
        this.processQueue();
      }
    }, 10000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  addListener(listener: QueueEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async enqueue(messageId: string, chatId: string): Promise<void> {
    const item: QueuedMessage = {
      id: uuidv4(),
      messageId,
      chatId,
      retryCount: 0,
      maxRetries: 5,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
    };
    await enqueueMessage(item);

    if (connectivityService.isConnected) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const items = await getQueuedMessages();

      for (const item of items) {
        if (!connectivityService.isConnected) break;

        this.notifyListeners('processing', item.messageId);

        try {
          // In phases 0-3 there's no backend, so we simulate a successful send
          await this.simulateSend(item);
          await updateMessageStatus(item.messageId, 'sent');
          await dequeueMessage(item.id);
          this.notifyListeners('completed', item.messageId);
        } catch {
          await incrementQueueRetry(item.id);
          const failed = await getFailedQueueItems();
          const isFailed = failed.some((f) => f.id === item.id);
          if (isFailed) {
            await updateMessageStatus(item.messageId, 'failed');
            await dequeueMessage(item.id);
            this.notifyListeners('failed', item.messageId);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async simulateSend(_item: QueuedMessage): Promise<void> {
    // Simulate network delay
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  private notifyListeners(event: 'processing' | 'completed' | 'failed', messageId: string): void {
    this.listeners.forEach((listener) => listener(event, messageId));
  }
}

export const messageQueueService = new MessageQueueService();
