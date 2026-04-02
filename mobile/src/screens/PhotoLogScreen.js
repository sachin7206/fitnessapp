import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, Platform, Modal, ActivityIndicator, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../config/theme';
import photoStorageService from '../services/photoStorageService';
import { useTranslation } from '../i18n';

const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const PhotoLogScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const LABEL_OPTIONS = [t('photos.before'), t('photos.after'), t('photos.progress'), t('photos.front'), t('photos.side'), t('photos.back')];
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState('Progress');
  const [notes, setNotes] = useState('');

  const loadPhotos = async () => {
    try {
      const data = await photoStorageService.getPhotos();
      setPhotos(data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadPhotos(); }, []);
  useFocusEffect(useCallback(() => { loadPhotos(); }, []));

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      const msg = t('photos.photoPermission');
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t('common.permissionRequired'), msg);
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    if (!await requestPermission()) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets?.[0]) {
      await savePhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const msg = t('photos.cameraPermission');
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t('common.permissionRequired'), msg);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets?.[0]) {
      await savePhoto(result.assets[0].uri);
    }
  };

  const savePhoto = async (uri) => {
    try {
      await photoStorageService.savePhoto(uri, selectedLabel, notes);
      setAddModalVisible(false);
      setNotes('');
      setSelectedLabel('Progress');
      await loadPhotos();
      const msg = t('photos.saved');
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t('photos.savedTitle'), msg);
    } catch (e) {
      const msg = e.message || t('photos.failedSave');
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert(t('common.error'), msg);
    }
  };

  const handleDelete = (photo) => {
    const doDelete = async () => {
      await photoStorageService.deletePhoto(photo.id);
      await loadPhotos();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(t('photos.deleteConfirm'))) doDelete();
    } else {
      Alert.alert(t('photos.deletePhoto'), t('photos.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const toggleCompareSelect = (photo) => {
    setSelectedForCompare(prev => {
      if (prev.find(p => p.id === photo.id)) {
        return prev.filter(p => p.id !== photo.id);
      }
      if (prev.length >= 2) {
        return [prev[1], photo]; // Replace oldest selection
      }
      return [...prev, photo];
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('photos.title')}</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📸 {t('photos.title')}</Text>
        <TouchableOpacity onPress={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}>
          <Text style={[styles.compareBtnText, compareMode && { color: colors.primary }]}>
            {compareMode ? t('common.done') : t('common.compare')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Compare view */}
        {compareMode && selectedForCompare.length === 2 && (
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>{t('photos.beforeAfter')}</Text>
            <View style={styles.compareRow}>
              {selectedForCompare.map((photo, i) => (
                <View key={photo.id} style={styles.compareItem}>
                  <Image source={{ uri: photo.uri }} style={styles.compareImage} />
                  <Text style={styles.compareLabel}>{photo.label || 'Photo'}</Text>
                  <Text style={styles.compareDate}>{formatDate(photo.date)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {compareMode && selectedForCompare.length < 2 && (
          <View style={styles.compareHint}>
            <Text style={styles.compareHintText}>
              {t('photos.tapToCompare')} ({selectedForCompare.length}/2 {t('photos.selected')})
            </Text>
          </View>
        )}

        {/* Photo grid */}
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>{t('photos.noPhotos')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('photos.noPhotosDesc')}
            </Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map((photo) => {
              const isSelected = selectedForCompare.find(p => p.id === photo.id);
              return (
                <TouchableOpacity
                  key={photo.id}
                  style={[styles.photoCard, isSelected && styles.photoCardSelected]}
                  onPress={() => compareMode ? toggleCompareSelect(photo) : null}
                  onLongPress={() => !compareMode && handleDelete(photo)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoLabel}>{photo.label || 'Photo'}</Text>
                    <Text style={styles.photoDate}>{formatDate(photo.date)}</Text>
                    {photo.notes ? <Text style={styles.photoNotes} numberOfLines={1}>{photo.notes}</Text> : null}
                  </View>
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>

      {/* Add Photo FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.fabText}>+ 📸</Text>
      </TouchableOpacity>

      {/* Add Photo Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('photos.addPhoto')}</Text>

            {/* Label selection */}
            <Text style={styles.modalLabel}>{t('photos.label')}:</Text>
            <View style={styles.labelRow}>
              {LABEL_OPTIONS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, selectedLabel === l && styles.labelChipActive]}
                  onPress={() => setSelectedLabel(l)}
                >
                  <Text style={[styles.labelChipText, selectedLabel === l && styles.labelChipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.modalLabel}>{t('photos.notesOptional')}:</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={(txt) => setNotes(txt.slice(0, 200))}
              placeholder={t('photos.notesPlaceholder')}
              maxLength={200}
              multiline
            />

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={takePhoto}>
                <Text style={styles.modalBtnText}>📷 {t('common.camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={pickFromGallery}>
                <Text style={styles.modalBtnText}>🖼️ {t('common.gallery')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalCancel} onPress={() => setAddModalVisible(false)}>
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.xxl + spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backButton: { padding: spacing.xs },
  backText: { ...typography.body, color: colors.text.inverse, fontWeight: '600' },
  headerTitle: { ...typography.h3, color: colors.text.inverse },
  compareBtnText: { ...typography.bodySmall, color: colors.text.inverse, fontWeight: '700' },
  content: { flex: 1, padding: spacing.lg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Compare
  compareCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    marginBottom: spacing.lg, ...shadows.md,
  },
  compareTitle: { ...typography.body, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  compareRow: { flexDirection: 'row', gap: spacing.sm },
  compareItem: { flex: 1, alignItems: 'center' },
  compareImage: { width: '100%', aspectRatio: 3 / 4, borderRadius: borderRadius.md, backgroundColor: '#F3F4F6' },
  compareLabel: { ...typography.bodySmall, fontWeight: '700', marginTop: spacing.xs },
  compareDate: { ...typography.caption, color: colors.text.secondary },
  compareHint: {
    backgroundColor: colors.primary + '10', borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.md, alignItems: 'center',
  },
  compareHintText: { ...typography.body, color: colors.primary, fontWeight: '600' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },

  // Photo grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoCard: {
    width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.md,
    overflow: 'hidden', ...shadows.sm, marginBottom: spacing.sm, position: 'relative',
  },
  photoCardSelected: { borderWidth: 3, borderColor: colors.primary },
  photoImage: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#F3F4F6' },
  photoInfo: { padding: spacing.sm },
  photoLabel: { ...typography.bodySmall, fontWeight: '700', color: colors.text.primary },
  photoDate: { ...typography.caption, color: colors.text.secondary },
  photoNotes: { ...typography.caption, color: colors.text.light, marginTop: 2 },
  selectedBadge: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28,
    borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  selectedBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 60, height: 60,
    borderRadius: 30, backgroundColor: colors.primary, justifyContent: 'center',
    alignItems: 'center', ...shadows.lg, elevation: 8,
  },
  fabText: { fontSize: 18, color: '#fff', fontWeight: '800' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, paddingBottom: spacing.xxl,
  },
  modalTitle: { ...typography.h3, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md },
  modalLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  labelChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  labelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  labelChipText: { fontSize: 13, color: colors.text.secondary, fontWeight: '600' },
  labelChipTextActive: { color: '#fff' },
  notesInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, fontSize: 14, minHeight: 60, textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center',
  },
  modalBtnText: { ...typography.button, color: '#fff', fontWeight: '700' },
  modalCancel: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  modalCancelText: { ...typography.body, color: colors.text.secondary },
});

export default PhotoLogScreen;

