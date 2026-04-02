import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Local photo storage service for before/after progress photos.
 * Stores photos locally using expo-file-system with a JSON manifest.
 *
 * Security: validates file size, image type, and caps total photo count.
 */

const PHOTOS_DIR = FileSystem.documentDirectory + 'progress_photos/';
const MANIFEST_KEY = '@progress_photo_manifest';
const MAX_PHOTOS = 50;
const MAX_FILE_SIZE_MB = 10;

const ensureDir = async () => {
  if (Platform.OS === 'web') return; // No file system on web
  const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
};

const getManifest = async () => {
  try {
    const json = await AsyncStorage.getItem(MANIFEST_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
};

const saveManifest = async (manifest) => {
  await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest));
};

const photoStorageService = {
  /**
   * Save a photo from a URI (camera or gallery) to local storage.
   * @param {string} sourceUri - The source URI from ImagePicker
   * @param {string} label - 'before' | 'after' | custom label
   * @param {string} notes - Optional notes
   * @returns {{ id, uri, date, label, notes }}
   */
  savePhoto: async (sourceUri, label = '', notes = '') => {
    if (!sourceUri) throw new Error('No image URI provided');

    // Sanitize label and notes
    const safeLabel = String(label || '').slice(0, 50).replace(/[<>]/g, '');
    const safeNotes = String(notes || '').slice(0, 200).replace(/[<>]/g, '');

    const manifest = await getManifest();
    if (manifest.length >= MAX_PHOTOS) {
      throw new Error(`Maximum ${MAX_PHOTOS} photos reached. Delete some to add more.`);
    }

    const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const date = new Date().toISOString();
    let finalUri = sourceUri;

    if (Platform.OS !== 'web') {
      await ensureDir();

      // Validate file size
      try {
        const fileInfo = await FileSystem.getInfoAsync(sourceUri);
        if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          throw new Error(`File too large (max ${MAX_FILE_SIZE_MB}MB)`);
        }
      } catch (e) {
        if (e.message.includes('too large')) throw e;
        // getInfoAsync may fail for some URIs, continue
      }

      const ext = sourceUri.split('.').pop()?.toLowerCase() || 'jpg';
      const allowedExts = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
      const safeExt = allowedExts.includes(ext) ? ext : 'jpg';
      const fileName = `${id}.${safeExt}`;
      finalUri = PHOTOS_DIR + fileName;

      await FileSystem.copyAsync({ from: sourceUri, to: finalUri });
    }

    const entry = { id, uri: finalUri, date, label: safeLabel, notes: safeNotes };
    manifest.push(entry);
    await saveManifest(manifest);

    return entry;
  },

  /**
   * Get all photos sorted by date (newest first)
   */
  getPhotos: async () => {
    const manifest = await getManifest();
    return [...manifest].sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  /**
   * Delete a photo by ID
   */
  deletePhoto: async (id) => {
    if (!id) return;
    const manifest = await getManifest();
    const photo = manifest.find(p => p.id === id);
    if (!photo) return;

    // Delete file on native
    if (Platform.OS !== 'web' && photo.uri) {
      try {
        const info = await FileSystem.getInfoAsync(photo.uri);
        if (info.exists) {
          await FileSystem.deleteAsync(photo.uri, { idempotent: true });
        }
      } catch { /* ignore */ }
    }

    await saveManifest(manifest.filter(p => p.id !== id));
  },

  /**
   * Get photo count
   */
  getCount: async () => {
    const manifest = await getManifest();
    return manifest.length;
  },
};

export default photoStorageService;

