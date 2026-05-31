import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Dimensions,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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
    stepLabel: 'STEP 1 OF 4',
    title: 'WELCOME, ADMIN!',
    description:
      'This guide will walk you through the PakiPark Admin System. Manage bookings and monitor your parking operations anytime, anywhere.',
    iconName: 'grid-outline',
    mascot: 'https://i.imgur.com/eX4KbNU.png',
  },
  {
    stepLabel: 'STEP 2 OF 4',
    title: 'DASHBOARD OVERVIEW',
    description:
      'Monitor real-time stats like total revenue, active users, and slot occupancy at a glance.',
    iconName: 'grid-outline',
    targetTab: 'dashboard',
    mascot: 'https://i.imgur.com/ztSn8jC.png',
  },
  {
    stepLabel: 'STEP 3 OF 4',
    title: 'BOOKING MANAGEMENT',
    description:
      'Manage customer reservations, monitor booking activity, and track parking history here.',
    iconName: 'car-outline',
    targetTab: 'bookings',
    mascot: 'https://i.imgur.com/YDKZb5h.png',
  },
  {
    stepLabel: 'STEP 4 OF 4',
    title: "YOU'RE ALL SET!",
    description:
      'Access the guide anytime via the "Guide" button in the header. Ready to manage PakiPark?',
    iconName: 'help-circle-outline',
    targetTab: 'dashboard',
    mascot: 'https://i.imgur.com/eX4KbNU.png',
    spotlightHelp: true,
  },
];

// ─── Easing presets ────────────────────────────────────────────────────────────
const SPRING_CONFIG = { tension: 120, friction: 10, useNativeDriver: true };
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN_OUT = Easing.inOut(Easing.cubic);

// ─── Spotlight padding ────────────────────────────────────────────────────────────
const SPOT_PAD = 8;

export function AdminTutorial({
  isOpen,
  onClose,
  onNavigate,
  onStepChange,
  spotlightRect,
}: AdminTutorialProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const onNavigateRef = useRef(onNavigate);
  const onStepChangeRef = useRef(onStepChange);
  useEffect(() => {
    onNavigateRef.current = onNavigate;
    onStepChangeRef.current = onStepChange;
  }, [onNavigate, onStepChange]);

  // ── Animated values ───────────────────────────────────────────────────────────
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const cardEntrance = useRef(new Animated.Value(0)).current;   // 0→1 on open
  const progressAnim = useRef(new Animated.Value(0)).current;   // 0→1 tracks step/%

  // Spotlight animated position/size
  const spotLeft   = useRef(new Animated.Value(0)).current;
  const spotTop    = useRef(new Animated.Value(0)).current;
  const spotWidth  = useRef(new Animated.Value(0)).current;
  const spotHeight = useRef(new Animated.Value(0)).current;
  const spotOpacity = useRef(new Animated.Value(0)).current;

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  // ── Modal open / reset ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDirection('next');
      onStepChangeRef.current?.(0);
      cardEntrance.setValue(0);
      contentOpacity.setValue(1);
      contentTranslateX.setValue(0);
      progressAnim.setValue(1 / STEPS.length);
      mascotAnim.setValue(0);
      spotOpacity.setValue(0);
      // Entrance spring for the whole card
      Animated.spring(cardEntrance, { toValue: 1, ...SPRING_CONFIG }).start();
      Animated.spring(mascotAnim, { toValue: 1, ...SPRING_CONFIG }).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Step navigation side-effects ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    onStepChangeRef.current?.(step);
    if (current.targetTab) onNavigateRef.current(current.targetTab);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (step + 1) / STEPS.length,
      duration: 350,
      easing: EASE_IN_OUT,
      useNativeDriver: false,      // width interpolation needs JS driver
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, isOpen]);

  // ── Spotlight follow ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (!spotlightRect) {
      Animated.timing(spotOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }
    const target = {
      l: Math.max(0, spotlightRect.x - SPOT_PAD),
      t: Math.max(0, spotlightRect.y - SPOT_PAD),
      w: spotlightRect.width + SPOT_PAD * 2,
      h: spotlightRect.height + SPOT_PAD * 2,
    };
    // Parallel spring for position/size
    Animated.parallel([
      Animated.spring(spotLeft,   { toValue: target.l, tension: 80, friction: 9, useNativeDriver: false }),
      Animated.spring(spotTop,    { toValue: target.t, tension: 80, friction: 9, useNativeDriver: false }),
      Animated.spring(spotWidth,  { toValue: target.w, tension: 80, friction: 9, useNativeDriver: false }),
      Animated.spring(spotHeight, { toValue: target.h, tension: 80, friction: 9, useNativeDriver: false }),
      Animated.timing(spotOpacity, { toValue: 1, duration: 300, easing: EASE_OUT, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlightRect, isOpen]);

  // ── Content slide-fade between steps ─────────────────────────────────────────
  const animateContentTransition = useCallback(
    (nextStep: number, dir: 'next' | 'prev') => {
      const slideOut = dir === 'next' ? -28 : 28;
      const slideIn  = dir === 'next' ?  28 : -28;

      // Phase 1: fade + slide out current content
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 160,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateX, {
          toValue: slideOut,
          duration: 160,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Commit step change
        setStep(nextStep);
        contentTranslateX.setValue(slideIn);
        // Phase 2: fade + slide in new content
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 200,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(contentTranslateX, {
            toValue: 0,
            duration: 200,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
        ]).start();
        // Also bounce mascot in
        mascotAnim.setValue(0);
        Animated.spring(mascotAnim, { toValue: 1, ...SPRING_CONFIG }).start();
      });
    },
    [contentOpacity, contentTranslateX, mascotAnim],
  );

  const handleNext = useCallback(() => {
    if (isLast) { onClose(); return; }
    setDirection('next');
    animateContentTransition(step + 1, 'next');
  }, [isLast, step, onClose, animateContentTransition]);

  const handlePrev = useCallback(() => {
    if (step === 0) return;
    setDirection('prev');
    animateContentTransition(step - 1, 'prev');
  }, [step, animateContentTransition]);

  // ── Spotlight geometry (animated) ─────────────────────────────────────────────
  const hasSpotlight = !!spotlightRect;
  const cardTop = spotlightRect
    ? Math.max(0, spotlightRect.y - SPOT_PAD) > 260
    : step === 0 || current.spotlightHelp;

  // ── Derived animated styles ───────────────────────────────────────────────────
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const cardScale = cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const cardOpacity = cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

        {/* ── Overlay / Spotlight ─────────────────────────────────────────── */}
        {hasSpotlight ? (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: spotOpacity }]}
          >
            {/* Top scrim */}
            <Animated.View
              style={[s.scrim, { left: 0, top: 0, right: 0, height: spotTop }]}
            />
            {/* Bottom scrim */}
            <Animated.View
              style={[s.scrim, {
                left: 0,
                top: Animated.add(spotTop, spotHeight),
                right: 0,
                bottom: 0,
              }]}
            />
            {/* Left scrim */}
            <Animated.View
              style={[s.scrim, {
                left: 0,
                top: spotTop,
                width: spotLeft,
                height: spotHeight,
              }]}
            />
            {/* Right scrim */}
            <Animated.View
              style={[s.scrim, {
                left: Animated.add(spotLeft, spotWidth),
                top: spotTop,
                right: 0,
                height: spotHeight,
              }]}
            />
            {/* Spotlight hole border glow */}
            <Animated.View
              pointerEvents="none"
              style={[s.spotGlow, {
                left: spotLeft,
                top: spotTop,
                width: spotWidth,
                height: spotHeight,
              }]}
            />
          </Animated.View>
        ) : (
          <View style={s.fullScrim} pointerEvents="none" />
        )}

        {/* ── Tutorial Card ───────────────────────────────────────────────── */}
        <Animated.View
          style={[
            s.cardWrap,
            cardTop ? s.cardWrapTop : s.cardWrapBottom,
            { opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
          pointerEvents="box-none"
        >
          {/* Mascot */}
          <Animated.View
            style={[s.mascotWrap, {
              opacity: mascotAnim,
              transform: [
                { scale: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                { translateY: mascotAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
              ],
            }]}
          >
            <Image source={{ uri: current.mascot }} style={s.mascot} resizeMode="contain" />
          </Animated.View>

          {/* Card shell */}
          <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
              {/* Progress track */}
              <View style={s.progressTrack}>
                <Animated.View style={[s.progressFill, { width: progressWidth }]} />
              </View>

              {/* Animated content wrapper */}
              <Animated.View
                style={[s.headerContent, {
                  opacity: contentOpacity,
                  transform: [{ translateX: contentTranslateX }],
                }]}
              >
                <View style={s.stepBadge}>
                  <Text style={s.stepBadgeText}>{current.stepLabel}</Text>
                </View>
                <Text style={s.headerTitle}>{current.title}</Text>
              </Animated.View>
            </View>

            {/* Body */}
            <View style={s.body}>
              <Animated.View
                style={{
                  opacity: contentOpacity,
                  transform: [{ translateX: contentTranslateX }],
                }}
              >
                <View style={s.descRow}>
                  <View style={s.iconWrap}>
                    <Ionicons name={current.iconName as any} size={24} color="#EE6B20" />
                  </View>
                  <Text style={s.description}>{current.description}</Text>
                </View>
              </Animated.View>

              {/* Step dots */}
              <View style={s.dots}>
                {STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      s.dot,
                      i === step ? s.dotActive : i < step ? s.dotPast : s.dotInactive,
                    ]}
                  />
                ))}
              </View>

              <View style={s.divider} />

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.prevBtn, step === 0 && s.hidden]}
                  onPress={handlePrev}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={22} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Text style={s.skipText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.nextBtn, isLast && s.finishBtn]}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={s.nextBtnText}>{isLast ? 'FINISH' : 'NEXT'}</Text>
                  {!isLast && <Ionicons name="chevron-forward" size={16} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  // ── Overlay ────────────────────────────────────────────────────────────────
  fullScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 18, 32, 0.78)',
  },
  scrim: {
    position: 'absolute',
    backgroundColor: 'rgba(10, 18, 32, 0.78)',
  },
  spotGlow: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(238, 107, 32, 0.6)',
    shadowColor: '#EE6B20',
    shadowOpacity: 0.65,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  cardWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  cardWrapTop: { top: 76 },
  cardWrapBottom: { bottom: 92 },

  container: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 18,
  },

  // ── Mascot ─────────────────────────────────────────────────────────────────
  mascotWrap: {
    alignItems: 'center',
    zIndex: 10,
    marginBottom: -12,
  },
  mascot: { width: 116, height: 116 },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#1E3D5A',
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#EE6B20',
    borderRadius: 2,
  },
  stepBadge: {
    backgroundColor: '#EE6B20',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 5,
    shadowColor: '#EE6B20',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.6,
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
    gap: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#EE6B20',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontWeight: '500',
  },

  // ── Dots ───────────────────────────────────────────────────────────────────
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: '#EE6B20' },
  dotPast: { width: 8, backgroundColor: '#FDBA74' },
  dotInactive: { width: 8, backgroundColor: '#E5E7EB' },

  // ── Divider + Actions ──────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prevBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  hidden: { opacity: 0 },
  skipText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EE6B20',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
    shadowColor: '#EE6B20',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  finishBtn: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
