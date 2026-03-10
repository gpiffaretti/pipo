import { formatDuration, formatFileSize, getMessagePreview } from '../../src/utils/formatters';

describe('formatDuration', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3661)).toBe('61:01');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });
  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });
  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
  it('formats gigabytes', () => {
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });
});

describe('getMessagePreview', () => {
  it('returns text content for text messages', () => {
    expect(getMessagePreview({ type: 'text', content: 'Hello world' })).toBe('Hello world');
  });
  it('returns emoji label for audio', () => {
    expect(getMessagePreview({ type: 'audio', content: '' })).toBe('🎵 Voice note');
  });
  it('returns emoji label for photo', () => {
    expect(getMessagePreview({ type: 'photo', content: '' })).toBe('📷 Photo');
  });
  it('returns emoji label for video', () => {
    expect(getMessagePreview({ type: 'video', content: '' })).toBe('🎥 Video');
  });
});
