import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Image, useWindowDimensions } from 'react-native';

import { COLORS, quickTags, mascotRateReview } from '@features/customer/data';
import type { LocationItem, TutorialStep, VehicleFormData, VehicleType } from '@features/customer/types';
import { showMessage } from '@features/customer/utils';

const ratingMascotMap = {
  1: require('../../../../assets/1.png'),
  2: require('../../../../assets/2.png'),
  3: require('../../../../assets/3.png'),
  4: require('../../../../assets/4.png'),
  5: require('../../../../assets/5.png'),
} as const;

export function TutorialModal({
  visible,
  steps,
  onClose,
  onStepChange,
  spotlightRect,
}: {
  visible: boolean;
  steps: TutorialStep[];
  onClose: () => void;
  onStepChange?: (index: number) => void;
  spotlightRect?: { x: number; y: number; width: number; height: number } | null;
}) {
  const [index, setIndex] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      onStepChange?.(index);
    }
  }, [index, onStepChange, visible]);

  if (!visible) return null;
  const step = steps[index]!;
  const last = index === steps.length - 1;

  const isSpotlightTop = spotlightRect && spotlightRect.y < 350;
  const tutorialCardOffset = spotlightRect
    ? step.targetKey === 'bookings' || step.targetKey === 'review'
      ? styles.tutorialCardBottom
      : isSpotlightTop
        ? { marginTop: 220 }
        : { marginBottom: 220 }
    : null;

  const PADDING = 8;
  const spotlight = spotlightRect
    ? {
        left: Math.max(0, spotlightRect.x - PADDING),
        top: Math.max(0, spotlightRect.y - PADDING),
        width: Math.min(screenWidth, spotlightRect.width + PADDING * 2),
        height: Math.min(screenHeight, spotlightRect.height + PADDING * 2),
      }
    : null;

  if (spotlight) {
    spotlight.width = Math.max(0, Math.min(spotlight.width, screenWidth - spotlight.left));
    spotlight.height = Math.max(0, Math.min(spotlight.height, screenHeight - spotlight.top));
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.tutorialOverlay}>
        {spotlight ? (
          <>
            <View
              pointerEvents="none"
              style={[styles.spotlightScrim, { left: 0, top: 0, right: 0, height: spotlight.top }]}
            />
            <View
              pointerEvents="none"
              style={[styles.spotlightScrim, { left: 0, top: spotlight.top + spotlight.height, right: 0, bottom: 0 }]}
            />
            <View
              pointerEvents="none"
              style={[styles.spotlightScrim, { left: 0, top: spotlight.top, width: spotlight.left, height: spotlight.height }]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.spotlightScrim,
                { left: spotlight.left + spotlight.width, top: spotlight.top, right: 0, height: spotlight.height },
              ]}
            />
          </>
        ) : (
          <View style={styles.fullScrim} />
        )}

        <View
          style={[
            styles.tutorialCardWrap,
            tutorialCardOffset,
          ]}
          pointerEvents="box-none"
        >
          <Image source={{ uri: step.mascot }} style={styles.floatingMascot} resizeMode="contain" />

          <View style={styles.newTutorialCard} pointerEvents="auto">
            <Pressable onPress={onClose} style={styles.newCloseBtn}>
              <Ionicons name="close" size={18} color="#C8D0DA" />
            </Pressable>

            <Text style={styles.newStepPill}>Step {index + 1} / {steps.length}</Text>
            <View style={styles.newDotsRow}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.newDot,
                    i === index ? styles.newDotActive : styles.newDotInactive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.newTitle}>{step.title}</Text>
            <Text style={styles.newDescription}>{step.description}</Text>

            <View style={styles.newDivider} />

            <View style={styles.newNavRow}>
              {index > 0 ? (
                <Pressable onPress={() => setIndex((current) => Math.max(0, current - 1))} style={styles.newBackBtn}>
                  <Text style={styles.newBackText}>Back</Text>
                </Pressable>
              ) : (
                <View style={styles.newBackSpacer} />
              )}

              {last ? (
                <Pressable onPress={onClose} style={styles.newGotItBtn}>
                  <Text style={styles.newGotItText}>Got it! 🎉</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => setIndex((current) => current + 1)} style={styles.newGotItBtn}>
                  <Text style={styles.newGotItText}>Next</Text>
                  <Ionicons name="arrow-forward" size={15} color={COLORS.surface} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function LocationModal({
  visible,
  locations,
  onClose,
  onSelect,
}: {
  visible: boolean;
  locations: LocationItem[];
  onClose: () => void;
  onSelect: (location: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Select Location</Text>
              <Text style={styles.sheetSubtitle}>Choose a parking facility near you</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={22} color={COLORS.subtle} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {locations.map((location) => (
              <Pressable key={location.id} onPress={() => onSelect(location.name)} style={styles.locationCard}>
                <View style={styles.locationIcon}>
                  <Ionicons name="location" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.flexOne}>
                  <Text style={styles.locationTitle}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  <Text style={styles.locationDistance}>{location.distance}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function VehicleModal({
  visible,
  formData,
  setFormData,
  isEditing,
  onClose,
  onSave,
}: {
  visible: boolean;
  formData: VehicleFormData;
  setFormData: (value: VehicleFormData) => void;
  isEditing: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const vehicleTypes: { value: VehicleType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { value: 'sedan', label: 'Sedan', icon: 'car-side' },
    { value: 'suv', label: 'SUV', icon: 'car-estate' },
    { value: 'truck', label: 'Truck', icon: 'truck-outline' },
    { value: 'motorcycle', label: 'Motorcycle', icon: 'motorbike' },
  ];

  const uploadDocument = async (field: 'orDoc' | 'crDoc') => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: false,
    });
    if (result.canceled || !result.assets[0]) return;
    setFormData({ ...formData, [field]: result.assets[0].name });
    showMessage('Document Selected', `${field === 'orDoc' ? 'OR' : 'CR'} selected successfully.`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.vehicleSheet}>
          <View style={styles.dragHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.vehicleSheetTitle}>{isEditing ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
              <Text style={styles.vehicleSheetSubtitle}>
                {isEditing ? 'Update your vehicle details' : 'Register a new vehicle to your account'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={22} color={COLORS.subtle} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <View style={styles.row}>
              <View style={styles.flexOne}>
                <Text style={styles.label}>Brand</Text>
                <TextInput
                  value={formData.brand}
                  onChangeText={(value) => setFormData({ ...formData, brand: value })}
                  style={styles.vehicleInput}
                  placeholder="Toyota"
                  placeholderTextColor="#C4CAD4"
                />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.label}>Model</Text>
                <TextInput
                  value={formData.model}
                  onChangeText={(value) => setFormData({ ...formData, model: value })}
                  style={styles.vehicleInput}
                  placeholder="Vios"
                  placeholderTextColor="#C4CAD4"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flexOne}>
                <Text style={styles.label}>Color</Text>
                <TextInput
                  value={formData.color}
                  onChangeText={(value) => setFormData({ ...formData, color: value })}
                  style={styles.vehicleInput}
                  placeholder="Silver"
                  placeholderTextColor="#C4CAD4"
                />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.label}>Plate No.</Text>
                <TextInput
                  value={formData.plateNumber}
                  onChangeText={(value) => setFormData({ ...formData, plateNumber: value.toUpperCase() })}
                  style={styles.vehicleInput}
                  placeholder="ABC 1234"
                  placeholderTextColor="#C4CAD4"
                />
              </View>
            </View>
            <View>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.typeGrid}>
                {vehicleTypes.map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setFormData({ ...formData, type: item.value })}
                    style={[styles.typeChip, formData.type === item.value ? styles.typeChipActive : null]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={formData.type === item.value ? COLORS.primary : '#5D83B3'}
                    />
                    <Text style={[styles.typeText, formData.type === item.value ? styles.typeTextActive : null]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.label}>Documents</Text>
              <View style={styles.row}>
              <Pressable onPress={() => void uploadDocument('orDoc')} style={styles.uploadCard}>
                <MaterialCommunityIcons
                  name={formData.orDoc ? 'check-circle' : 'upload'}
                  size={20}
                  color={formData.orDoc ? COLORS.success : '#94A3B8'}
                />
                <Text style={styles.uploadTitle}>{formData.orDoc ? 'OR Uploaded' : 'Upload OR'}</Text>
                {formData.orDoc ? <Text style={styles.uploadFile}>{formData.orDoc}</Text> : null}
              </Pressable>
              <Pressable onPress={() => void uploadDocument('crDoc')} style={styles.uploadCard}>
                <MaterialCommunityIcons
                  name={formData.crDoc ? 'check-circle' : 'upload'}
                  size={20}
                  color={formData.crDoc ? COLORS.success : '#94A3B8'}
                />
                <Text style={styles.uploadTitle}>{formData.crDoc ? 'CR Uploaded' : 'Upload CR'}</Text>
                {formData.crDoc ? <Text style={styles.uploadFile}>{formData.crDoc}</Text> : null}
              </Pressable>
              </View>
            </View>
          </ScrollView>
          <View style={styles.vehicleFooter}>
            <Pressable onPress={onClose} style={styles.vehicleCancelButton}>
              <Text style={styles.vehicleCancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onSave} style={styles.vehicleSaveButton}>
              <Text style={styles.primaryText}>{isEditing ? 'Save Changes' : 'Add Vehicle'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function RateAndReviewModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; comment: string; selectedTags: string[] }) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment('');
      setSelectedTags([]);
    }
  }, [visible]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  const tagIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Safe Area': 'shield-checkmark-outline',
    'Easy to Find': 'location-outline',
    'Friendly Staff': 'people-outline',
    'Quick Entry': 'flash-outline',
    'Spacious Slot': 'time-outline',
  };

  const submit = () => {
    if (rating === 0) {
      showMessage('Rating Required', 'Please select a star rating to continue.');
      return;
    }
    onSubmit({ rating, comment, selectedTags });
    onClose();
  };

  const selectedMascot = ratingMascotMap[rating as keyof typeof ratingMascotMap] ?? { uri: mascotRateReview };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.reviewScreen}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewHeaderIcon}>
            <Ionicons name="chatbox-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.reviewHeaderTitle}>Rate & Review</Text>
            <Text style={styles.reviewReference}>Ref: PKS-2024-001</Text>
          </View>
          <Pressable onPress={onClose} style={styles.reviewClose}>
            <Ionicons name="close" size={22} color={COLORS.subtle} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewFormCard}>
            <View style={styles.reviewPromptHeader}>
              <View style={styles.reviewAccent} />
              <View style={styles.flexOne}>
                <Text style={styles.reviewQuestion}>Rate Us, PakiPark</Text>
                <Text style={styles.reviewHelp}>Your review helps other drivers find safe, reliable parking.</Text>
              </View>
            </View>

            <View style={styles.reviewRatingBox}>
              <Image source={selectedMascot} style={styles.reviewRatingMascot} resizeMode="contain" />
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setRating(star)} hitSlop={8}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? COLORS.primary : '#DCE4EE'}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.reviewRatingLabel}>
                {rating === 0 ? 'Tap to Rate' : ['Awful', 'Average', 'Good', 'Great', 'Exceptional'][rating - 1]}
              </Text>
            </View>

            <Text style={styles.reviewLabel}>What stood out?</Text>
            <View style={styles.tagsWrap}>
              {quickTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.reviewTagChip, selectedTags.includes(tag) ? styles.reviewTagChipActive : null]}
                >
                  <Ionicons
                    name={tagIcons[tag] ?? 'checkmark-circle-outline'}
                    size={13}
                    color={selectedTags.includes(tag) ? COLORS.primary : '#6F819B'}
                  />
                  <Text style={[styles.reviewTagText, selectedTags.includes(tag) ? styles.reviewTagTextActive : null]}>{tag}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.reviewFeedbackHeader}>
              <Text style={styles.reviewLabel}>Written Feedback</Text>
              <Text style={styles.reviewCounter}>{comment.length}/500</Text>
            </View>
            <TextInput
              value={comment}
              onChangeText={(value) => setComment(value.slice(0, 500))}
              multiline
              style={styles.reviewTextArea}
              placeholder="Tell us about the parking conditions..."
              placeholderTextColor={COLORS.subtle}
            />
            <View style={styles.reviewFooter}>
              <Pressable onPress={onClose} style={styles.reviewCancelButton}>
                <Text style={styles.reviewCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={submit} style={styles.reviewSubmitButton}>
                <Text style={styles.reviewSubmitText}>Submit Review</Text>
                <Ionicons name="paper-plane-outline" size={15} color={COLORS.surface} />
              </Pressable>
            </View>
          </View>

          <View style={styles.reviewImpactCard}>
            <View style={styles.reviewImpactOrb} />
            <View style={styles.reviewImpactTitleRow}>
              <Ionicons name="shield-checkmark-outline" size={17} color={COLORS.primary} />
              <Text style={styles.reviewImpactTitle}>Your Impact</Text>
            </View>
            <View style={styles.reviewStatsRow}>
              <View style={styles.reviewStatCard}>
                <Text style={styles.reviewStatValue}>12</Text>
                <Text style={styles.reviewStatLabel}>Reviews</Text>
              </View>
              <View style={styles.reviewStatCard}>
                <Text style={styles.reviewStatValue}>4.8</Text>
                <Text style={styles.reviewStatLabel}>Avg Rating</Text>
              </View>
            </View>
            <Text style={styles.reviewImpactQuote}>
              {'"Your reviews help thousands of drivers find safe and reliable parking spots."'}
            </Text>
          </View>

          <View style={styles.reviewCommunityCard}>
            <View style={styles.reviewCommunityIcon}>
              <Ionicons name="people-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.reviewCommunityTitle}>Community Note</Text>
              <Text style={styles.reviewCommunityText}>Feedback is moderated to ensure safety and accuracy.</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  tutorialOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,25,40,0.75)' },
  spotlightScrim: { position: 'absolute', backgroundColor: 'rgba(15,25,40,0.75)' },

  tutorialCardWrap: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'visible',
    width: '100%',
    paddingHorizontal: 12,
  },
  tutorialCardBottom: { position: 'absolute', left: 0, right: 0, bottom: 70 },
  floatingMascot: {
    position: 'absolute',
    top: -82,
    width: 122,
    height: 122,
    zIndex: 20,
  },
  newTutorialCard: {
    width: '100%',
    maxWidth: 296,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 34,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 15,
    overflow: 'visible',
  },
  newCloseBtn: { position: 'absolute', top: 32, right: 18, padding: 4, zIndex: 10 },
  newStepPill: { alignSelf: 'flex-start', color: COLORS.primary, backgroundColor: '#FFF3EA', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  newTitle: { fontSize: 15, fontWeight: '900', color: COLORS.navy, marginBottom: 8 },
  newDescription: { fontSize: 12, color: '#6F7E91', fontWeight: '700', marginBottom: 18, lineHeight: 19 },
  newDivider: { height: 1, backgroundColor: '#EDF1F5', marginBottom: 14 },
  newNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newBackBtn: { minHeight: 38, justifyContent: 'center', paddingRight: 12 },
  newBackText: { color: '#9AA5B4', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  newBackSpacer: { width: 44 },
  newDotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center', marginBottom: 12 },
  newDot: { height: 5, borderRadius: 999 },
  newDotActive: { width: 20, backgroundColor: COLORS.primary },
  newDotInactive: { width: 5, backgroundColor: '#E1E7EF' },
  newGotItBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: COLORS.primary, borderRadius: 12, shadowColor: COLORS.primary, shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  newGotItText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(15,25,40,0.46)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderRadius: 28, maxHeight: '88%', overflow: 'hidden' },
  vehicleSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '72%',
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  dragHandle: { alignSelf: 'center', width: 46, height: 4, borderRadius: 999, backgroundColor: '#E5E7EB', marginTop: 2, marginBottom: 2 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  sheetSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  vehicleSheetTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, lineHeight: 22 },
  vehicleSheetSubtitle: { fontSize: 13, color: '#7B8794', marginTop: 2, fontWeight: '600' },
  close: { padding: 4 },
  sheetContent: { padding: 20, gap: 12 },
  locationCard: { flexDirection: 'row', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  locationIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFF3EA', alignItems: 'center', justifyContent: 'center' },
  locationTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  locationAddress: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  locationDistance: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginTop: 6 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 12, color: '#98A2B3', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  vehicleInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D9DEE7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text, fontWeight: '600' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { width: '23%', minWidth: 72, borderWidth: 1, borderColor: '#E5EAF1', backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center', paddingVertical: 12, gap: 4 },
  typeChipActive: { borderColor: COLORS.primary, backgroundColor: '#FFF7F2' },
  typeText: { fontSize: 10, fontWeight: '700', color: '#7B8794' },
  typeTextActive: { color: COLORS.primary },
  uploadCard: { flex: 1, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D9DEE7', borderRadius: 16, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 18, gap: 6, backgroundColor: '#FBFCFD' },
  uploadTitle: { fontSize: 11, fontWeight: '700', color: '#7B8794' },
  uploadFile: { fontSize: 10, color: COLORS.success, textAlign: 'center' },
  fullscreen: { flex: 1, backgroundColor: '#F8FAFC' },
  reviewScreen: { flex: 1, backgroundColor: '#EFF4FA' },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3EC',
  },
  reviewHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFF3EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewHeaderTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900', lineHeight: 21 },
  reviewReference: { color: '#7C91AE', fontSize: 11, fontWeight: '700', marginTop: 2 },
  reviewClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  reviewContent: { padding: 16, gap: 16, paddingBottom: 28 },
  reviewFormCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    padding: 18,
    gap: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  reviewPromptHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  reviewAccent: { width: 3, height: 42, borderRadius: 999, backgroundColor: COLORS.primary },
  reviewQuestion: { color: COLORS.text, fontSize: 19, fontWeight: '900', lineHeight: 24 },
  reviewHelp: { color: '#7C91AE', fontSize: 12, fontWeight: '700', marginTop: 4 },
  reviewRatingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    paddingHorizontal: 18,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  reviewRatingMascot: { width: 132, height: 132, marginBottom: 0 },
  starRow: { flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: -4 },
  reviewRatingLabel: { color: COLORS.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4, marginTop: -4 },
  reviewLabel: { fontSize: 11, color: '#8A9AB3', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
  reviewTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#DCE4EE',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
  },
  reviewTagChipActive: { borderColor: COLORS.primary, backgroundColor: '#FFF3EA' },
  reviewTagText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  reviewTagTextActive: { color: COLORS.primary },
  reviewFeedbackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewCounter: { color: '#8A9AB3', fontSize: 10, fontWeight: '900' },
  reviewTextArea: {
    minHeight: 112,
    textAlignVertical: 'top',
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewFooter: { flexDirection: 'row', gap: 12, paddingTop: 8 },
  reviewCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  reviewCancelText: { color: '#8A9AB3', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.4 },
  reviewSubmitButton: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  reviewSubmitText: { color: COLORS.surface, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  reviewImpactCard: {
    position: 'relative',
    backgroundColor: '#1C4669',
    borderRadius: 18,
    padding: 18,
    paddingBottom: 20,
    gap: 16,
    overflow: 'hidden',
  },
  reviewImpactOrb: {
    position: 'absolute',
    top: -34,
    right: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  reviewImpactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewImpactTitle: { color: COLORS.surface, fontSize: 15, fontWeight: '900' },
  reviewStatsRow: { flexDirection: 'row', gap: 12, zIndex: 1 },
  reviewStatCard: {
    flex: 1,
    minHeight: 66,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewStatValue: { color: COLORS.primary, fontSize: 24, fontWeight: '900', lineHeight: 28 },
  reviewStatLabel: { color: '#D5E7FF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 },
  reviewImpactQuote: { color: COLORS.surface, fontSize: 12, fontWeight: '800', fontStyle: 'italic', lineHeight: 18, zIndex: 1 },
  reviewCommunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E1EC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  reviewCommunityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF3EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCommunityTitle: { color: COLORS.text, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6 },
  reviewCommunityText: { color: COLORS.text, fontSize: 12, fontWeight: '600', lineHeight: 16, marginTop: 2 },
  cardBody: { backgroundColor: COLORS.surface, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 14 },
  ratingBox: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, alignItems: 'center', gap: 10 },
  ratingLabel: { fontSize: 11, fontWeight: '800', color: COLORS.text, textTransform: 'uppercase' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: COLORS.surface },
  tagChipActive: { borderColor: COLORS.navy, backgroundColor: COLORS.navy },
  tagText: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  tagTextActive: { color: COLORS.surface },
  textArea: { minHeight: 110, textAlignVertical: 'top', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14, color: COLORS.text, fontSize: 14 },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 14, marginTop: 2 },
  primaryButtonFlex: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: COLORS.surface, fontSize: 14, fontWeight: '800' },
  secondaryButton: { flex: 1, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: COLORS.muted, fontSize: 14, fontWeight: '800' },
  vehicleFooter: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, backgroundColor: COLORS.surface },
  vehicleCancelButton: { flex: 1, borderWidth: 1, borderColor: '#D9DEE7', borderRadius: 14, paddingVertical: 14, alignItems: 'center', backgroundColor: COLORS.surface },
  vehicleCancelText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  vehicleSaveButton: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
});
