import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, quickTags, mascotRateReview } from '@features/customer/data';
import type { Booking, LocationItem, TutorialStep, VehicleFormData, VehicleType } from '@features/customer/types';
import { showMessage } from '@features/customer/utils';
import { backendApi, type ReviewStats } from '../../../lib/api';

const ratingMascotMap = {
  1: require('../../../../assets/1.png'),
  2: require('../../../../assets/2.png'),
  3: require('../../../../assets/3.png'),
  4: require('../../../../assets/4.png'),
  5: require('../../../../assets/5.png'),
} as const;

const SPRING_CFG = { tension: 120, friction: 10, useNativeDriver: true };
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IO = Easing.inOut(Easing.cubic);
const SPOT_PAD = 8;

export function TutorialModal({
  visible,
  steps,
  onClose,
  onStepChange,
  spotlightRect,
}: Readonly<{
  visible: boolean;
  steps: TutorialStep[];
  onClose: () => void;
  onStepChange?: (index: number) => void;
  spotlightRect?: { x: number; y: number; width: number; height: number } | null;
}>) {
  const [index, setIndex] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const onStepChangeRef = useRef(onStepChange);
  useEffect(() => { onStepChangeRef.current = onStepChange; }, [onStepChange]);

  // Animated values
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTX = useRef(new Animated.Value(0)).current;
  const cardEntrance = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spotL = useRef(new Animated.Value(0)).current;
  const spotT = useRef(new Animated.Value(0)).current;
  const spotW = useRef(new Animated.Value(0)).current;
  const spotH = useRef(new Animated.Value(0)).current;
  const spotOp = useRef(new Animated.Value(0)).current;

  const step = steps[index]!;
  const last = index === steps.length - 1;

  // Open reset
  useEffect(() => {
    if (!visible) return;
    setIndex(0);
    onStepChangeRef.current?.(0);
    cardEntrance.setValue(0);
    contentOpacity.setValue(1);
    contentTX.setValue(0);
    progressAnim.setValue(1 / steps.length);
    mascotAnim.setValue(0);
    spotOp.setValue(0);
    Animated.spring(cardEntrance, { toValue: 1, ...SPRING_CFG }).start();
    Animated.spring(mascotAnim, { toValue: 1, ...SPRING_CFG }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Step change
  useEffect(() => {
    if (!visible) return;
    onStepChangeRef.current?.(index);
    Animated.timing(progressAnim, {
      toValue: (index + 1) / steps.length,
      duration: 350, easing: EASE_IO, useNativeDriver: false,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, visible]);

  // Spotlight follow
  useEffect(() => {
    if (!visible) return;
    if (!spotlightRect) {
      Animated.timing(spotOp, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }
    const t = {
      l: Math.max(0, spotlightRect.x - SPOT_PAD),
      t: Math.max(0, spotlightRect.y - SPOT_PAD),
      w: Math.min(screenWidth, spotlightRect.width + SPOT_PAD * 2),
      h: Math.min(screenHeight, spotlightRect.height + SPOT_PAD * 2),
    };
    Animated.parallel([
      Animated.spring(spotL, { toValue: t.l, tension: 80, friction: 9, useNativeDriver: false }),
      Animated.spring(spotT, { toValue: t.t, tension: 80, friction: 9, useNativeDriver: false }),
      Animated.spring(spotW, { toValue: t.w, tension: 80, friction: 9, useNativeDriver: false }),
      Animated.spring(spotH, { toValue: t.h, tension: 80, friction: 9, useNativeDriver: false }),
      Animated.timing(spotOp, { toValue: 1, duration: 300, easing: EASE_OUT, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlightRect, visible]);

  // Content transition
  const animateTransition = useCallback((next: number, dir: 'next' | 'prev') => {
    const out = dir === 'next' ? -28 : 28;
    const inV = dir === 'next' ? 28 : -28;
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 160, easing: EASE_IO, useNativeDriver: true }),
      Animated.timing(contentTX, { toValue: out, duration: 160, easing: EASE_IO, useNativeDriver: true }),
    ]).start(() => {
      setIndex(next);
      contentTX.setValue(inV);
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 200, easing: EASE_OUT, useNativeDriver: true }),
        Animated.timing(contentTX, { toValue: 0, duration: 200, easing: EASE_OUT, useNativeDriver: true }),
      ]).start();
      mascotAnim.setValue(0);
      Animated.spring(mascotAnim, { toValue: 1, ...SPRING_CFG }).start();
    });
  }, [contentOpacity, contentTX, mascotAnim]);

  const handleNext = useCallback(() => {
    if (last) { onClose(); return; }
    animateTransition(index + 1, 'next');
  }, [last, index, onClose, animateTransition]);

  const handlePrev = useCallback(() => {
    if (index === 0) return;
    animateTransition(index - 1, 'prev');
  }, [index, animateTransition]);

  if (!visible) return null;

  const hasSpot = !!spotlightRect;
  // Compact mode for steps where space is tight (quick action cards in middle of screen)
  const isCompact = step.targetKey === 'bookings' || step.targetKey === 'review';

  // Place card on the opposite side from the spotlight to avoid covering it
  const CARD_GAP = isCompact ? 10 : 16;
  let cardPositionStyle: any = {};
  if (spotlightRect) {
    const spotMidY = spotlightRect.y + spotlightRect.height / 2;
    if (spotMidY > screenHeight / 2) {
      // Spotlight in bottom half → card above it
      cardPositionStyle = { bottom: screenHeight - spotlightRect.y + SPOT_PAD + CARD_GAP };
    } else {
      // Spotlight in top half → card below it
      cardPositionStyle = { top: spotlightRect.y + spotlightRect.height + SPOT_PAD + CARD_GAP };
    }
  } else {
    // No spotlight (welcome / last step) → center-top area
    cardPositionStyle = index === 0 || step.targetKey === 'tutorialButton'
      ? { top: 76 }
      : { bottom: 92 };
  }

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const cardScale = cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const cardOpacity = cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Overlay */}
        {hasSpot ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: spotOp }]}>
            <Animated.View style={[styles.tScrim, { left: 0, top: 0, right: 0, height: spotT }]} />
            <Animated.View style={[styles.tScrim, { left: 0, top: Animated.add(spotT, spotH), right: 0, bottom: 0 }]} />
            <Animated.View style={[styles.tScrim, { left: 0, top: spotT, width: spotL, height: spotH }]} />
            <Animated.View style={[styles.tScrim, { left: Animated.add(spotL, spotW), top: spotT, right: 0, height: spotH }]} />
            <Animated.View pointerEvents="none" style={[styles.tSpotGlow, { left: spotL, top: spotT, width: spotW, height: spotH }]} />
          </Animated.View>
        ) : (
          <View style={styles.tFullScrim} pointerEvents="none" />
        )}

        {/* Card */}
        <Animated.View
          style={[
            styles.tCardWrap,
            cardPositionStyle,
            { opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
          pointerEvents="box-none"
        >
          {/* Mascot — hidden in compact mode */}
          {!isCompact && (
            <Animated.View style={[styles.tMascotWrap, {
              opacity: mascotAnim,
              transform: [
                { scale: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                { translateY: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
              ],
            }]}>
              <Image source={{ uri: step.mascot }} style={styles.tMascot} resizeMode="contain" />
            </Animated.View>
          )}

          <View style={styles.tContainer}>
            {/* Header */}
            <View style={[styles.tHeader, isCompact && styles.tHeaderCompact]}>
              <View style={styles.tProgressTrack}>
                <Animated.View style={[styles.tProgressFill, { width: progressWidth }]} />
              </View>
              <Animated.View style={[styles.tHeaderContent, { opacity: contentOpacity, transform: [{ translateX: contentTX }] }]}>
                <View style={styles.tStepBadge}>
                  <Text style={styles.tStepBadgeText}>STEP {index + 1} OF {steps.length}</Text>
                </View>
                <Text style={[styles.tHeaderTitle, isCompact && { fontSize: 16 }]}>{step.title}</Text>
              </Animated.View>
            </View>

            {/* Body */}
            <View style={[styles.tBody, isCompact && styles.tBodyCompact]}>
              <Animated.View style={{ opacity: contentOpacity, transform: [{ translateX: contentTX }] }}>
                <Text style={[styles.tDescription, isCompact && { fontSize: 12, lineHeight: 18 }]}>{step.description}</Text>
              </Animated.View>

              <View style={styles.tDots}>
                {steps.map((s, i) => (
                  <View key={i} style={[styles.tDot, i === index ? styles.tDotActive : i < index ? styles.tDotPast : styles.tDotInactive]} />
                ))}
              </View>

              <View style={styles.tDivider} />

              <View style={styles.tActions}>
                <Pressable style={[styles.tPrevBtn, index === 0 && styles.tHidden]} onPress={handlePrev}>
                  <Ionicons name="chevron-back" size={22} color="#9CA3AF" />
                </Pressable>
                <Pressable onPress={onClose}><Text style={styles.tSkipText}>Skip</Text></Pressable>
                <Pressable style={[styles.tNextBtn, last && styles.tFinishBtn, isCompact && { paddingHorizontal: 20, paddingVertical: 10 }]} onPress={handleNext}>
                  <Text style={styles.tNextBtnText}>{last ? 'FINISH' : 'NEXT'}</Text>
                  {!last && <Ionicons name="chevron-forward" size={16} color="#fff" />}
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function LocationModal({
  visible,
  locations,
  onClose,
  onSelect,
}: Readonly<{
  visible: boolean;
  locations: LocationItem[];
  onClose: () => void;
  onSelect: (location: LocationItem) => void;
}>) {
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
              <Pressable key={location.id} onPress={() => onSelect(location)} style={styles.locationCard}>
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
}: Readonly<{
  visible: boolean;
  formData: VehicleFormData;
  setFormData: (value: VehicleFormData) => void;
  isEditing: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}>) {
  const [saving, setSaving] = useState(false);
  const [docErrors, setDocErrors] = useState<{ or?: string; cr?: string }>({});
  const [fieldErrors, setFieldErrors] = useState<{ plate_number?: string }>({});

  const vehicleTypes: { value: VehicleType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { value: 'sedan', label: 'Sedan', icon: 'car-side' },
    { value: 'suv', label: 'SUV', icon: 'car-estate' },
    { value: 'truck', label: 'Truck', icon: 'truck-outline' },
    { value: 'motorcycle', label: 'Motorcycle', icon: 'motorbike' },
  ];

  // Reset errors when modal becomes visible
  useEffect(() => {
    if (visible) {
      setDocErrors({});
      setFieldErrors({});
    }
  }, [visible]);

  const pickDocument = async (field: 'orDoc' | 'crDoc') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      // Validate file size (5 MB)
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        showMessage('File Too Large', 'Maximum file size is 5 MB.');
        return;
      }

      const fileObj = {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || 'application/octet-stream',
        size: asset.size ?? undefined,
      };

      if (field === 'orDoc') {
        setFormData({ ...formData, orDocFile: fileObj });
        setDocErrors((prev) => ({ ...prev, or: undefined }));
      } else {
        setFormData({ ...formData, crDocFile: fileObj });
        setDocErrors((prev) => ({ ...prev, cr: undefined }));
      }
    } catch {
      showMessage('Error', 'Could not open the file picker. Please try again.');
    }
  };

  const handleSave = async () => {
    // Validate plate number (6-8 alphanumeric, no spaces/special chars)
    const plateRegex = /^[A-Z0-9]{6,8}$/;
    if (!plateRegex.test(formData.plate_number)) {
      setFieldErrors({ plate_number: 'Plate number must contain 6 to 8 letters and numbers only.' });
      return;
    }
    setFieldErrors({});

    // Validate required docs for new vehicles
    if (!isEditing) {
      const errors: { or?: string; cr?: string } = {};
      if (!formData.orDocFile) errors.or = 'OR document is required';
      if (!formData.crDocFile) errors.cr = 'CR document is required';
      if (Object.keys(errors).length > 0) {
        setDocErrors(errors);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave();
    } catch (err: any) {
      Alert.alert('Could Not Save Vehicle', err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocTextContent = (
    docFile: VehicleFormData['orDocFile'] | VehicleFormData['crDocFile'],
    hasExisting: boolean
  ) => {
    if (docFile) {
      const sizeStr = docFile.size ? `(${formatFileSize(docFile.size)})` : '';
      return (
        <Text style={styles.uploadFileName} numberOfLines={1}>
          {docFile.name} {sizeStr}
        </Text>
      );
    }
    if (hasExisting) {
      return (
        <Text style={styles.uploadFileName} numberOfLines={1}>Uploaded — tap to replace</Text>
      );
    }
    return <Text style={styles.uploadHint}>PDF, JPG, PNG or WEBP · Max 5 MB</Text>;
  };

  const renderDocCard = (
    field: 'orDoc' | 'crDoc',
    label: string,
    docFile: VehicleFormData['orDocFile'] | VehicleFormData['crDocFile'],
    existingUrl: string | null,
    error?: string,
  ) => {
    const hasFile = !!docFile;
    const hasExisting = !!existingUrl && !hasFile;
    const isReady = hasFile || hasExisting;

    const iconName = isReady ? 'check-circle' : 'file-upload-outline';

    let iconColor = '#94A3B8';
    if (isReady) {
      iconColor = COLORS.success;
    } else if (error) {
      iconColor = '#E53E3E';
    }

    return (
      <Pressable
        onPress={() => !saving && void pickDocument(field)}
        style={[
          styles.uploadCard,
          error ? styles.uploadCardError : null,
          (!error && isReady) ? styles.uploadCardReady : null,
        ]}
      >
        <View
          style={[
            styles.uploadIconWrap,
            isReady ? styles.uploadIconWrapReady : null,
          ]}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={22}
            color={iconColor}
          />
        </View>
        <View style={styles.uploadTextWrap}>
          <View style={styles.uploadLabelRow}>
            <Text
              style={[
                styles.uploadTitle,
                isReady ? styles.uploadTitleReady : null,
                (!isReady && error) ? styles.uploadTitleError : null,
              ]}
            >
              {label}
            </Text>
            {!isReady && !isEditing && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>REQUIRED</Text>
              </View>
            )}
            {isEditing && hasExisting && !hasFile && (
              <View style={styles.existingBadge}>
                <Text style={styles.existingBadgeText}>EXISTING</Text>
              </View>
            )}
          </View>
          {getDocTextContent(docFile, hasExisting)}
          {error ? <Text style={styles.uploadError}>{error}</Text> : null}
        </View>
      </Pressable>
    );
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
            <Pressable onPress={onClose} style={styles.close} disabled={saving}>
              <Ionicons name="close" size={22} color={COLORS.subtle} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <View style={styles.row}>
              <View style={styles.flexOne}>
                <Text style={styles.label}>Brand</Text>
                <TextInput
                  value={formData.brand}
                  onChangeText={(value) => setFormData({ ...formData, brand: value })}
                  style={styles.vehicleInput}
                  placeholder="Toyota"
                  placeholderTextColor="#C4CAD4"
                  editable={!saving}
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
                  editable={!saving}
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
                  editable={!saving}
                />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.label}>Plate No.</Text>
                <TextInput
                  value={formData.plate_number}
                  onChangeText={(value) => {
                    const filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                    setFormData({ ...formData, plate_number: filtered });
                    if (fieldErrors.plate_number) setFieldErrors({});
                  }}
                  style={[styles.vehicleInput, fieldErrors.plate_number ? styles.inputError : null]}
                  placeholder="LMN4567"
                  placeholderTextColor="#C4CAD4"
                  autoCapitalize="characters"
                  editable={!saving}
                />
                {fieldErrors.plate_number ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.plate_number}</Text>
                ) : null}
              </View>
            </View>
            <View>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.typeGrid}>
                {vehicleTypes.map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => !saving && setFormData({ ...formData, type: item.value })}
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

            {/* Documents section */}
            <View>
              <View style={styles.docHeaderRow}>
                <Text style={styles.label}>Documents</Text>
                {!isEditing && (
                  <Text style={styles.docRequiredNote}>Both required to add vehicle</Text>
                )}
              </View>
              <View style={styles.docStack}>
                {renderDocCard('orDoc', 'Official Receipt (OR)', formData.orDocFile, formData.orDoc, docErrors.or)}
                {renderDocCard('crDoc', 'Certificate of Registration (CR)', formData.crDocFile, formData.crDoc, docErrors.cr)}
              </View>
            </View>

            {/* Upload progress note */}
            {saving && (
              <View style={styles.uploadingBanner}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.uploadingText}>
                  Uploading documents to secure storage…
                </Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.vehicleFooter}>
            <Pressable onPress={onClose} style={styles.vehicleCancelButton} disabled={saving}>
              <Text style={styles.vehicleCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSave()}
              style={[styles.vehicleSaveButton, saving && styles.vehicleSaveDisabled]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>{isEditing ? 'Save Changes' : 'Add Vehicle'}</Text>
              )}
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
  locations = [],
  recentCompletedBooking,
}: Readonly<{
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; comment: string; selectedTags: string[] }) => void;
  locations?: LocationItem[];
  recentCompletedBooking?: Booking | null;
}>) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Determine context: prefer a pre-selected completed booking
  const bookingContext = recentCompletedBooking ?? null;
  const contextLocationId = bookingContext?.location_id ?? selectedLocationId ?? undefined;
  const contextBookingId = bookingContext ? String(bookingContext.id) : undefined;
  const contextRef = bookingContext?.reference ?? null;
  const contextLocation = bookingContext?.location ?? locations.find((l) => l.id === selectedLocationId)?.name ?? null;

  // Reset form + load fresh data when modal opens
  useEffect(() => {
    if (!visible) {
      setRating(0);
      setComment('');
      setSelectedTags([]);
      setSelectedLocationId(null);
      setStats(null);
      setAlreadyReviewed(false);
      return;
    }

    // Fetch live stats
    setLoadingStats(true);
    backendApi.getReviewStats(contextLocationId)
      .then((s) => setStats(s))
      .catch(() => { })
      .finally(() => setLoadingStats(false));

    // Check for duplicate review on this booking
    if (contextBookingId) {
      setCheckingDuplicate(true);
      backendApi.getMyReviews()
        .then((reviews) => {
          const dupe = reviews.some((r) => r.bookingId === contextBookingId);
          setAlreadyReviewed(dupe);
        })
        .catch(() => { })
        .finally(() => setCheckingDuplicate(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const submit = async () => {
    if (rating === 0) {
      showMessage('Rating Required', 'Please select a star rating to continue.');
      return;
    }
    if (alreadyReviewed) {
      showMessage('Already Reviewed', 'You have already submitted a review for this booking.');
      return;
    }

    setSubmitting(true);
    try {
      await backendApi.submitReview({
        rating,
        comment: comment.trim() || undefined,
        locationId: contextLocationId,
        bookingId: contextBookingId,
      });

      // Refresh stats after successful submit
      try {
        const updated = await backendApi.getReviewStats(contextLocationId);
        setStats(updated);
      } catch { /* non-fatal */ }

      onSubmit({ rating, comment, selectedTags });
      onClose();
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not save your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  let selectedMascot: any = { uri: mascotRateReview };
  if (rating >= 1 && rating <= 5) {
    selectedMascot = ratingMascotMap[rating as keyof typeof ratingMascotMap];
  }

  const renderHeaderSubtitle = () => {
    if (contextRef) {
      return <Text style={styles.reviewReference}>Ref: {contextRef}</Text>;
    }
    if (contextLocation) {
      return <Text style={styles.reviewReference}>{contextLocation}</Text>;
    }
    return <Text style={styles.reviewReference}>Share your parking experience</Text>;
  };

  const renderImpactCard = () => {
    const averageRatingText = stats?.averageRating != null && stats.averageRating > 0
      ? stats.averageRating.toFixed(1)
      : '—';

    return (
      <View style={styles.reviewImpactCard}>
        <View style={styles.reviewImpactOrb} />
        <View style={styles.reviewImpactTitleRow}>
          <Ionicons name="shield-checkmark-outline" size={17} color={COLORS.primary} />
          <Text style={styles.reviewImpactTitle}>Your Impact</Text>
        </View>
        <View style={styles.reviewStatsRow}>
          <View style={styles.reviewStatCard}>
            {loadingStats ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.reviewStatValue}>{stats?.totalReviews ?? 0}</Text>
            )}
            <Text style={styles.reviewStatLabel}>Reviews</Text>
          </View>
          <View style={styles.reviewStatCard}>
            {loadingStats ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.reviewStatValue}>{averageRatingText}</Text>
            )}
            <Text style={styles.reviewStatLabel}>Avg Rating</Text>
          </View>
        </View>
        <Text style={styles.reviewImpactQuote}>
          {'"Your reviews help thousands of drivers find safe and reliable parking spots."'}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.reviewScreen}>
        <View style={[styles.reviewHeader, { paddingTop: insets.top + 12 }]}>
          <View style={styles.reviewHeaderIcon}>
            <Ionicons name="chatbox-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.reviewHeaderTitle}>Rate &amp; Review</Text>
            {renderHeaderSubtitle()}
          </View>
          <Pressable onPress={onClose} style={styles.reviewClose}>
            <Ionicons name="close" size={22} color={COLORS.subtle} />
          </Pressable>
        </View>
        <View style={styles.reviewBody}>
          {checkingDuplicate ? (
            <View style={styles.reviewLoadingWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.reviewLoadingText}>Checking your reviews…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>

              {/* Already reviewed notice */}
              {alreadyReviewed && (
                <View style={styles.reviewAlreadyBanner}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                  <Text style={styles.reviewAlreadyText}>You've already reviewed this booking. Thank you! 🎉</Text>
                </View>
              )}

              {/* Location picker — shown when no booking context and multiple locations exist */}
              {!bookingContext && locations.length > 0 && (
                <View style={styles.reviewFormCard}>
                  <Text style={styles.reviewLabel}>Which location are you reviewing?</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {locations.map((loc) => (
                      <Pressable
                        key={loc.id}
                        onPress={() => setSelectedLocationId(loc.id)}
                        style={[
                          styles.reviewLocChip,
                          selectedLocationId === loc.id && styles.reviewLocChipActive,
                        ]}
                      >
                        <Ionicons name="location-outline" size={13} color={selectedLocationId === loc.id ? COLORS.primary : '#6F819B'} />
                        <Text style={[styles.reviewLocText, selectedLocationId === loc.id && styles.reviewLocTextActive]}>
                          {loc.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

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
                      <Pressable key={star} onPress={() => !alreadyReviewed && setRating(star)} hitSlop={8}>
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
                      onPress={() => !alreadyReviewed && toggleTag(tag)}
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
                  editable={!alreadyReviewed}
                  style={[styles.reviewTextArea, alreadyReviewed && { opacity: 0.5 }]}
                  placeholder="Tell us about the parking conditions..."
                  placeholderTextColor={COLORS.subtle}
                />
                <View style={styles.reviewFooter}>
                  <Pressable onPress={onClose} style={styles.reviewCancelButton}>
                    <Text style={styles.reviewCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={submit}
                    style={[styles.reviewSubmitButton, (submitting || alreadyReviewed) && { opacity: 0.6 }]}
                    disabled={submitting || alreadyReviewed}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={COLORS.surface} />
                    ) : (
                      <>
                        <Text style={styles.reviewSubmitText}>
                          {alreadyReviewed ? 'Already Submitted' : 'Submit Review'}
                        </Text>
                        {!alreadyReviewed && <Ionicons name="paper-plane-outline" size={15} color={COLORS.surface} />}
                      </>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Live stats card — replaces hardcoded values */}
              {renderImpactCard()}

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
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FAQItem({ question, answer }: Readonly<{ question: string; answer: string }>) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.faqItemCard,
        expanded && styles.faqItemCardExpanded
      ]}
    >
      <View style={styles.faqQuestionRow}>
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={expanded ? COLORS.primary : '#6F819B'}
        />
      </View>
      {expanded && (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswerText}>{answer}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function FAQModal({
  visible,
  onClose,
}: Readonly<{
  visible: boolean;
  onClose: () => void;
}>) {
  const faqs = [
    {
      question: 'How do I make a parking reservation?',
      answer: 'Log in to your PakiPark account, navigate to \'Find Parking\', choose your preferred location and time slot, select your vehicle, then confirm the reservation.',
    },
    {
      question: 'How much does parking cost?',
      answer: 'The first 2 hours of every session are FREE. Overtime is billed at ₱15 per hour, rounded up to the next full hour (ceiling billing).',
    },
    {
      question: 'Can I cancel or modify my reservation?',
      answer: 'You can cancel an upcoming reservation from the My Bookings section before the reservation start time. Once the grace period begins, cancellation is no longer available.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept digital payments via GCash and Maya.',
    },
    {
      question: 'What is the 15-minute grace period?',
      answer: 'You have a 15-minute window before your reserved time slot to check in. If you do not check in, your reservation will be automatically forfeited.',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.faqHeaderTitleWrap}>
              <View style={styles.faqHeaderIconWrap}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>FAQs</Text>
                <Text style={styles.sheetSubtitle}>Find quick answers about PakiPark</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={22} color={COLORS.subtle} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.faqScrollContent} showsVerticalScrollIndicator={false}>
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function AdminFAQModal({
  visible,
  onClose,
}: Readonly<{
  visible: boolean;
  onClose: () => void;
}>) {
  const faqs = [
    {
      question: 'How do I manage incoming reservations?',
      answer: 'As an admin, you can view real-time reservation statuses, check-in customers, and process check-outs through the Smart Parking Dashboard.',
    },
    {
      question: 'How do I update facility hours?',
      answer: 'Administrators can configure the operating hours for each specific location in the \'Advanced Parking Layout Config\', setting separate schedules for each day of the week.',
    },
    {
      question: 'How do I handle a no-show customer?',
      answer: 'If a customer doesn\'t arrive within the 15-minute grace period after their reservation starts, the system will automatically mark them as \'no-show\' and free up the slot.',
    },
    {
      question: 'Is there an audit log of transactions?',
      answer: 'Yes, all successful payments, check-ins, and check-outs are recorded permanently in the Transaction and Activity Logs for security and dispute resolution.',
    },
    {
      question: 'Can I add custom parking slots?',
      answer: 'Yes, you can add VIP, PWD, or Standard slots, assign them to specific floors and rows, and toggle their active status via the configuration dashboard.',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.faqHeaderTitleWrap}>
              <View style={styles.faqHeaderIconWrap}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>FAQs</Text>
                <Text style={styles.sheetSubtitle}>Find quick answers about PakiPark</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={22} color={COLORS.subtle} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.faqScrollContent} showsVerticalScrollIndicator={false}>
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  tFullScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 18, 32, 0.78)' },
  tScrim: { position: 'absolute', backgroundColor: 'rgba(10, 18, 32, 0.78)' },
  tSpotGlow: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(238, 107, 32, 0.6)', shadowColor: '#EE6B20', shadowOpacity: 0.65, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  tCardWrap: { position: 'absolute', left: 16, right: 16 },
  tContainer: { borderRadius: 26, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 28, shadowOffset: { width: 0, height: 8 }, elevation: 18 },
  tMascotWrap: { alignItems: 'center', zIndex: 10, marginBottom: -12 },
  tMascot: { width: 116, height: 116 },
  tHeader: { backgroundColor: '#1E3D5A', paddingTop: 20, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center', gap: 10, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  tHeaderCompact: { paddingTop: 14, paddingBottom: 14, gap: 6 },
  tHeaderContent: { alignItems: 'center', gap: 10, width: '100%' },
  tProgressTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2 },
  tProgressFill: { height: 4, backgroundColor: '#EE6B20', borderRadius: 2 },
  tStepBadge: { backgroundColor: '#EE6B20', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 5, shadowColor: '#EE6B20', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  tStepBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1.2 },
  tHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 0.6 },
  tBody: { backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 22, paddingBottom: 20, gap: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  tBodyCompact: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, gap: 10 },
  tDescription: { fontSize: 14, color: '#4B5563', lineHeight: 22, fontWeight: '500' },
  tDots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tDot: { height: 8, borderRadius: 4 },
  tDotActive: { width: 24, backgroundColor: '#EE6B20' },
  tDotPast: { width: 8, backgroundColor: '#FDBA74' },
  tDotInactive: { width: 8, backgroundColor: '#E5E7EB' },
  tDivider: { height: 1, backgroundColor: '#F3F4F6' },
  tActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tPrevBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F3F4F6' },
  tHidden: { opacity: 0 },
  tSkipText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tNextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EE6B20', borderRadius: 999, paddingHorizontal: 28, paddingVertical: 12, shadowColor: '#EE6B20', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  tFinishBtn: { backgroundColor: '#16A34A', shadowColor: '#16A34A' },
  tNextBtnText: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

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
  vehicleInput: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: '700', color: COLORS.text },
  inputError: { borderColor: '#E53E3E', backgroundColor: '#FFF5F5' },
  fieldErrorText: { fontSize: 10, color: '#E53E3E', fontWeight: '700', marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { width: '23%', minWidth: 72, borderWidth: 1, borderColor: '#E5EAF1', backgroundColor: '#F8FAFC', borderRadius: 16, alignItems: 'center', paddingVertical: 12, gap: 4 },
  typeChipActive: { borderColor: COLORS.primary, backgroundColor: '#FFF7F2' },
  typeText: { fontSize: 10, fontWeight: '700', color: '#7B8794' },
  typeTextActive: { color: COLORS.primary },
  uploadCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D9DEE7',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: '#FBFCFD',
  },
  uploadCardReady: {
    borderStyle: 'solid',
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  uploadCardError: {
    borderStyle: 'solid',
    borderColor: '#E53E3E',
    backgroundColor: '#FFF5F5',
  },
  uploadIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  uploadIconWrapReady: { backgroundColor: '#DCFCE7' },
  uploadTextWrap: { flex: 1, gap: 3 },
  uploadLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  uploadTitle: { fontSize: 12, fontWeight: '700', color: '#7B8794' },
  uploadTitleReady: { color: '#166534' },
  uploadTitleError: { color: '#E53E3E' },
  uploadFileName: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  uploadHint: { fontSize: 10, color: '#B0BAC7', fontWeight: '600' },
  uploadError: { fontSize: 10, color: '#E53E3E', fontWeight: '700', marginTop: 2 },
  uploadFile: { fontSize: 10, color: COLORS.success, textAlign: 'center' },
  requiredBadge: {
    backgroundColor: '#FFF3EA',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  requiredBadgeText: { fontSize: 8, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  existingBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  existingBadgeText: { fontSize: 8, fontWeight: '900', color: '#2563EB', letterSpacing: 0.5 },
  docHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  docRequiredNote: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  docStack: { gap: 10 },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FDE0CC',
  },
  uploadingText: { fontSize: 12, color: COLORS.primary, fontWeight: '700', flex: 1 },
  vehicleSaveDisabled: { opacity: 0.65 },
  fullscreen: { flex: 1, backgroundColor: '#F8FAFC' },
  reviewScreen: { flex: 1, backgroundColor: COLORS.surface },
  reviewBody: { flex: 1, backgroundColor: '#EFF4FA' },
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
  // Review modal extras
  reviewLoadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  reviewLoadingText: { color: '#8A9AB3', fontSize: 13, fontWeight: '700' },
  reviewAlreadyBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#A7F3D0' },
  reviewAlreadyText: { flex: 1, color: '#065F46', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  reviewLocChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#DCE4EE', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.surface },
  reviewLocChipActive: { borderColor: COLORS.primary, backgroundColor: '#FFF3EA' },
  reviewLocText: { color: '#6F819B', fontSize: 12, fontWeight: '700' },
  reviewLocTextActive: { color: COLORS.primary },
  faqScrollContent: { padding: 20, gap: 12, paddingBottom: 40 },
  faqItemCard: { backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F6', padding: 16 },
  faqItemCardExpanded: { borderColor: COLORS.primary, backgroundColor: '#FFF7F2' },
  faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  faqQuestionText: { fontSize: 14, fontWeight: '800', color: COLORS.text, flex: 1 },
  faqAnswerContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  faqAnswerText: { fontSize: 13, color: COLORS.muted, lineHeight: 18, fontWeight: '600' },
  faqHeaderTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqHeaderIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF3EA', alignItems: 'center', justifyContent: 'center' },
});
