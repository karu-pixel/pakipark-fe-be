import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Step {
  stepLabel: string;
  title: string;
  description: string;
  iconName: string;
  targetTab?: string;
  mascot: string;
  spotlightHelp?: boolean;
}

interface AdminTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onStepChange?: (step: number) => void;
  spotlightRect?: { x: number; y: number; width: number; height: number } | null;
}

const STEPS: Step[] = [
  {
    stepLabel: 'STEP 1 OF 5',
    title: 'WELCOME, ADMIN!',
    description: 'This guide will walk you through the PakiPark Admin System. Manage slots, bookings, and analytics all in one place.',
    iconName: 'grid-outline',
    mascot: 'https://i.imgur.com/eX4KbNU.png',
    },
   {
    stepLabel: 'STEP 2 OF 5', title: 'DASHBOARD OVERVIEW',
    description: 'Monitor real-time stats like total revenue, active users, and slot occupancy at a glance.',
    iconName: 'grid-outline', targetTab: 'dashboard', mascot: 'https://i.imgur.com/ztSn8jC.png',
  },
  {
    stepLabel: 'STEP 3 OF 5', title: 'PARKING MANAGEMENT',
    description: "Parking slot customization is only available on the full website. Use the 'Open Website to Customize Parking' button to manage your layout and slots.",
    iconName: 'car-outline', targetTab: 'parking', mascot: 'https://i.imgur.com/YDKZb5h.png',
  },
  {
    stepLabel: 'STEP 4 OF 5', title: 'BOOKING MANAGEMENT',
    description: 'Handle customer reservations, approve pending requests, or track history here.',
    iconName: 'list-outline', targetTab: 'bookings', mascot: 'https://i.imgur.com/GQMKhl9.png',
  },
  {
  stepLabel: 'STEP 5 OF 5',
  title: "YOU'RE ALL SET!",
  description: 'Access the guide anytime via the "Guide" button in the header. Ready to manage PakiPark?',
  iconName: 'help-circle-outline',
  targetTab: 'dashboard',
  mascot: 'https://i.imgur.com/eX4KbNU.png',
  spotlightHelp: true,
},
];

export function AdminTutorial({ isOpen, onClose, onNavigate, onStepChange, spotlightRect }: AdminTutorialProps) {
  const [step, setStep] = useState(0);
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const onNavigateRef = useRef(onNavigate);
  const onStepChangeRef = useRef(onStepChange);

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    onNavigateRef.current = onNavigate;
    onStepChangeRef.current = onStepChange;
  }, [onNavigate, onStepChange]);

  useEffect(() => {
    if (isOpen) { setStep(0); onStepChangeRef.current?.(0); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    onStepChangeRef.current?.(step);
    if (current.targetTab) onNavigateRef.current(current.targetTab);
    mascotAnim.setValue(0);
    Animated.spring(mascotAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 7 }).start();
  }, [step, isOpen, current.targetTab, mascotAnim]);

  const handleNext = () => {
    if (!isLast) setStep((s) => s + 1);
  };
  const handlePrev = () => { if (step > 0) setStep((s) => s - 1); };

  const spotlight = spotlightRect
    ? {
        left: Math.max(0, spotlightRect.x - 8),
        top: Math.max(0, spotlightRect.y - 8),
        width: spotlightRect.width + 16,
        height: spotlightRect.height + 16,
      }
    : null;
  const cardTop = spotlight ? spotlight.top > 260 : step === 0 || current.spotlightHelp;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {spotlight ? (
          <>
            <View pointerEvents="none" style={[s.spotlightScrim, { left: 0, top: 0, right: 0, height: spotlight.top }]} />
            <View pointerEvents="none" style={[s.spotlightScrim, { left: 0, top: spotlight.top + spotlight.height, right: 0, bottom: 0 }]} />
            <View pointerEvents="none" style={[s.spotlightScrim, { left: 0, top: spotlight.top, width: spotlight.left, height: spotlight.height }]} />
            <View pointerEvents="none" style={[s.spotlightScrim, { left: spotlight.left + spotlight.width, top: spotlight.top, right: 0, height: spotlight.height }]} />
          </>
        ) : (
          <View style={s.fullScrim} pointerEvents="none" />
        )}

        <View style={[s.cardWrap, cardTop ? s.cardWrapTop : s.cardWrapBottom]} pointerEvents="box-none">
          <View style={s.container}>
            <Animated.View style={[s.mascotWrap, {
              transform: [
                { scale: mascotAnim },
                { translateY: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
              opacity: mascotAnim,
            }]}>
              <Image source={{ uri: current.mascot }} style={s.mascot} resizeMode="contain" />
            </Animated.View>

            <View style={s.header}>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` as any }]} />
              </View>
              <View style={s.stepBadge}><Text style={s.stepBadgeText}>{current.stepLabel}</Text></View>
              <Text style={s.headerTitle}>{current.title}</Text>
            </View>

            <View style={s.body}>
              <View style={s.descRow}>
                <View style={s.iconWrap}>
                  <Ionicons name={current.iconName as any} size={24} color="#EE6B20" />
                </View>
                <Text style={s.description}>{current.description}</Text>
              </View>
              <View style={s.dots}>
                {STEPS.map((_, i) => (
                  <View key={i} style={[s.dot, i === step ? s.dotActive : i < step ? s.dotPast : s.dotInactive]} />
                ))}
              </View>
              <View style={s.divider} />
              <View style={s.actions}>
                <TouchableOpacity style={[s.prevBtn, step === 0 && s.hidden]} onPress={handlePrev}>
                  <Ionicons name="chevron-back" size={22} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}><Text style={s.skipText}>Skip</Text></TouchableOpacity>
                <TouchableOpacity style={[s.nextBtn, isLast && s.finishBtn]} onPress={isLast ? onClose : handleNext}>
                  <Text style={s.nextBtnText}>{isLast ? 'FINISH' : 'NEXT'}</Text>
                  {!isLast && <Ionicons name="chevron-forward" size={16} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fullScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,25,40,0.75)' },
  spotlightScrim: { position: 'absolute', backgroundColor: 'rgba(15,25,40,0.75)' },
  cardWrap: { position: 'absolute', left: 16, right: 16 },
  cardWrapTop: { top: 76 },
  cardWrapBottom: { bottom: 88 },
  container: {
    borderRadius: 24, overflow: 'visible',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
    elevation: 14,
  },
  mascotWrap: { alignItems: 'center', zIndex: 10, marginBottom: -10 },
  mascot: { width: 110, height: 110 },
  header: {
    backgroundColor: '#1E3D5A',
    paddingTop: 16, paddingBottom: 20, paddingHorizontal: 24,
    alignItems: 'center', gap: 10,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
  },
  progressTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressFill: { height: 4, backgroundColor: '#EE6B20' },
  stepBadge: { backgroundColor: '#EE6B20', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 5 },
  stepBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: 0.5 },
  body: {
    backgroundColor: '#fff',
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, gap: 16,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  descRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFF3E8', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  description: { flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 22, fontWeight: '500' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: '#EE6B20' },
  dotPast: { width: 8, backgroundColor: '#FDBA74' },
  dotInactive: { width: 8, backgroundColor: '#E5E7EB' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prevBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
  skipText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EE6B20', borderRadius: 999, paddingHorizontal: 28, paddingVertical: 12 },
  finishBtn: { backgroundColor: '#16A34A' },
  nextBtnText: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
