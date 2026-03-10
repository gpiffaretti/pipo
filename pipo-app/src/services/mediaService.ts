import * as ImagePicker from 'expo-image-picker';
import { Paths, File, Directory } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { v4 as uuidv4 } from 'uuid';
import { createMediaAttachment, updateMediaUploadStatus, getPendingMediaUploads } from '../db/queries';
import { MediaAttachment } from '../types';
import { connectivityService } from './connectivityService';

type UploadProgressListener = (attachmentId: string, progress: number) => void;

class MediaService {
  private uploadListeners: Set<UploadProgressListener> = new Set();
  private processing = false;
  private mediaDir!: Directory;
  private compressedDir!: Directory;

  async initialize(): Promise<void> {
    this.mediaDir = new Directory(Paths.document, 'media/');
    if (!this.mediaDir.exists) {
      this.mediaDir.create({ intermediates: true });
    }
    this.compressedDir = new Directory(Paths.document, 'media/compressed/');
    if (!this.compressedDir.exists) {
      this.compressedDir.create({ intermediates: true });
    }
  }

  addUploadListener(listener: UploadProgressListener): () => void {
    this.uploadListeners.add(listener);
    return () => {
      this.uploadListeners.delete(listener);
    };
  }

  async pickImage(): Promise<ImagePicker.ImagePickerResult> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Media library permission not granted');
    }
    return ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
  }

  async pickVideo(): Promise<ImagePicker.ImagePickerResult> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Media library permission not granted');
    }
    return ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      allowsEditing: false,
    });
  }

  async takePhoto(): Promise<ImagePicker.ImagePickerResult> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera permission not granted');
    }
    return ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
  }

  async takeVideo(): Promise<ImagePicker.ImagePickerResult> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera permission not granted');
    }
    return ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      quality: 1,
      allowsEditing: false,
    });
  }

  async saveOriginalLocally(sourceUri: string, mimeType: string): Promise<string> {
    const extension = mimeType.split('/')[1] || 'bin';
    const filename = `${uuidv4()}.${extension}`;
    const sourceFile = new File(sourceUri);
    const destFile = new File(this.mediaDir, filename);
    sourceFile.copy(destFile);
    return destFile.uri;
  }

  async compressImage(originalUri: string): Promise<{ uri: string; width: number; height: number }> {
    const result = await ImageManipulator.manipulateAsync(
      originalUri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    const filename = `${uuidv4()}_compressed.jpg`;
    const tempFile = new File(result.uri);
    const destFile = new File(this.compressedDir, filename);
    tempFile.copy(destFile);
    return { uri: destFile.uri, width: result.width, height: result.height };
  }

  getFileSize(uri: string): number {
    const file = new File(uri);
    return file.exists ? file.size : 0;
  }

  async createAttachmentForMessage(
    messageId: string,
    sourceUri: string,
    mimeType: string,
    width?: number,
    height?: number,
    duration?: number
  ): Promise<MediaAttachment> {
    const localOriginalUri = await this.saveOriginalLocally(sourceUri, mimeType);
    const originalSize = this.getFileSize(localOriginalUri);

    let localCompressedUri: string | null = null;
    let compressedSize: number | null = null;
    let compressedWidth = width ?? null;
    let compressedHeight = height ?? null;

    if (mimeType.startsWith('image/')) {
      const compressed = await this.compressImage(localOriginalUri);
      localCompressedUri = compressed.uri;
      compressedSize = this.getFileSize(compressed.uri);
      compressedWidth = compressed.width;
      compressedHeight = compressed.height;
    }

    const attachment: MediaAttachment = {
      id: uuidv4(),
      messageId,
      originalStorageKey: null,
      compressedStorageKey: null,
      localOriginalUri,
      localCompressedUri,
      mimeType,
      originalSizeBytes: originalSize,
      compressedSizeBytes: compressedSize,
      width: compressedWidth,
      height: compressedHeight,
      durationSeconds: duration ?? null,
      uploadStatus: 'pending',
      uploadProgress: 0,
      createdAt: Date.now(),
    };

    await createMediaAttachment(attachment);
    return attachment;
  }

  async processUploadQueue(): Promise<void> {
    if (this.processing || !connectivityService.isConnected) return;
    this.processing = true;

    try {
      const pending = await getPendingMediaUploads();
      for (const attachment of pending) {
        if (!connectivityService.isConnected) break;

        try {
          await updateMediaUploadStatus(attachment.id, 'uploading', 0);
          this.notifyProgress(attachment.id, 0);

          // Simulate upload progress (no backend in phases 0-3)
          for (let progress = 0.1; progress <= 1; progress += 0.1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            this.notifyProgress(attachment.id, progress);
          }

          await updateMediaUploadStatus(attachment.id, 'completed', 1);
          this.notifyProgress(attachment.id, 1);
        } catch {
          await updateMediaUploadStatus(attachment.id, 'failed', 0);
          this.notifyProgress(attachment.id, 0);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private notifyProgress(attachmentId: string, progress: number): void {
    this.uploadListeners.forEach((listener) => listener(attachmentId, progress));
  }
}

export const mediaService = new MediaService();
