import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  availableLocations,
  COLORS,
  defaultCars,
  initialBookings,
  mascotMyBookings,
  mascotParkNow,
  mascotRateReview,
  recentBookings,
  STORAGE_KEYS,
  tutorialSteps,
} from '@features/customer/data';
import { CustomerSettings } from '@features/customer/components/CustomerSettings';
import { CustomerProfile } from '@features/customer/components/CustomerProfile';
import { CustomerHeader, QuickActionCard, RecentBookings as RecentBookingsList, VehicleManagement } from '@features/customer/components/HeaderSections';
import { LocationModal, RateAndReviewModal, TutorialModal, VehicleModal } from '@features/customer/components/CustomerModals';
import { MyBookings } from '@features/customer/components/MyBookings';
import { BookingFlow } from '@features/customer/components/BookingFlow'; 
import type { RootStackParamList } from '@navigation/types';
import type { AppTab, Booking, NotificationItem, TutorialTargetKey, Vehicle, VehicleFormData } from '@features/customer/types';
import { formatNowTime, getStoredJson, saveStoredJson, showMessage } from '@features/customer/utils';

type ConfirmedBookingModalData = Booking & {
  bookingId?: string;
  bookingPlate?: string;
  durationHours?: number;
  paymentLabel?: string;
  reviewDate?: string;
};

export function PakiParkCustomerHomeScreen({ onLogoutToAuth }: { onLogoutToAuth?: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [confirmedBookingModal, setConfirmedBookingModal] = useState<ConfirmedBookingModalData | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [bookingLocation, setBookingLocation] = useState<string | null>(null);
  const [bookingAddress, setBookingAddress] = useState<string>(''); 

  const [editingCarIndex, setEditingCarIndex] = useState<number | null>(null);
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [profile, setProfile] = useState({ name: 'Guest User', profilePic: null as string | null });
  const [cars, setCars] = useState<Vehicle[]>(defaultCars);
  const [bookings, setBookingsState] = useState<Booking[]>(initialBookings);
  const [carFormData, setCarFormData] = useState<VehicleFormData>({
    brand: '',
    model: '',
    color: '',
    plateNumber: '',
    type: 'sedan',
    orDoc: null,
    crDoc: null,
  });

  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [spotlightLayouts, setSpotlightLayouts] = useState<Partial<Record<TutorialTargetKey, { x: number; y: number; width: number; height: number }>>>({});
  const scrollViewRef = useRef<ScrollView | null>(null);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const activeTutorialTarget = tutorialSteps[tutorialStepIndex]?.targetKey ?? 'none';
  const spotlightRect = useMemo(
    () => (showTutorial && activeTutorialTarget !== 'none' ? spotlightLayouts[activeTutorialTarget] ?? null : null),
    [activeTutorialTarget, showTutorial, spotlightLayouts],
  );

  // --- NEW SPOTLIGHT MEASUREMENT SYSTEM ---
  const targetRefs = useRef<Record<string, View | null>>({});

  const captureRef = useCallback(
    (key: TutorialTargetKey) => (el: any) => {
      if (el) targetRefs.current[key] = el;
    },
    []
  );

  useEffect(() => {
    if (showTutorial) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [showTutorial]);

  useEffect(() => {
    if (showTutorial && activeTutorialTarget && activeTutorialTarget !== 'none') {
      const ref = targetRefs.current[activeTutorialTarget];
      if (ref && ref.measureInWindow) {
        // Slight delay ensures the layout has actually rendered before measuring
        setTimeout(() => {
          ref.measureInWindow((x, y, width, height) => {
            setSpotlightLayouts((prev) => ({ ...prev, [activeTutorialTarget]: { x, y, width, height } }));
          });
        }, 100);
      }
    }
  }, [showTutorial, activeTutorialTarget, tutorialStepIndex]);
  // ----------------------------------------

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [tutorialValue, storedNotifications] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.tutorial),
        getStoredJson<NotificationItem[]>(STORAGE_KEYS.notifications, []),
      ]);

      setShowTutorial(!tutorialValue);
      setNotifications(storedNotifications);

      if (user) {
        // Fetch real data from Supabase
        const [profileRes, carsRes, bookingsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('vehicles').select('*').eq('user_id', user.id),
          supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);

        if (profileRes.data) {
          setProfile({
            name: profileRes.data.full_name || user.email?.split('@')[0] || 'User',
            profilePic: profileRes.data.avatar_url || null,
          });
        }

        if (carsRes.data && carsRes.data.length > 0) {
          setCars(carsRes.data.map(car => ({
            ...car,
            plateNumber: (car as any).plate_number,
            type: (car as any).vehicle_type,
          })) as Vehicle[]);
        }

        if (bookingsRes.data) {
          setBookingsState(bookingsRes.data.map(booking => ({
            ...booking,
            id: String(booking.id),
            price: `₱${booking.amount}`,
          })) as Booking[]);
        }
      }
    })();
  }, []);

  useEffect(() => {
    void saveStoredJson(STORAGE_KEYS.notifications, notifications);
  }, [notifications]);

  useEffect(() => {
    void saveStoredJson(STORAGE_KEYS.cars, cars);
  }, [cars]);

  const setBookings = useCallback((updater: (current: Booking[]) => Booking[]) => {
    setBookingsState((current) => updater(current));
  }, []);

  const pushNotification = useCallback((input: Omit<NotificationItem, 'id' | 'time' | 'read'>) => {
    setNotifications((current) => [{ ...input, id: Date.now().toString(), read: false, time: formatNowTime() }, ...current]);
  }, []);

  const finishTutorial = useCallback(() => {
    setShowTutorial(false);
    void AsyncStorage.setItem(STORAGE_KEYS.tutorial, 'true');
  }, []);

  const saveCar = useCallback(async () => {
    const cleanPlate = carFormData.plateNumber.trim().toUpperCase();
    const plateRegex = /^[A-Z0-9]{2,4}[ ]?[0-9]{3,4}$|^[A-Z0-9]{1,8}$/;
    if (!cleanPlate || cleanPlate.length < 4 || cleanPlate.length > 8 || !plateRegex.test(cleanPlate)) {
      return showMessage('Invalid Plate Number', 'Please enter a valid plate number.');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const payload = {
        user_id: user.id,
        brand: carFormData.brand,
        model: carFormData.model,
        color: carFormData.color,
        plate_number: cleanPlate,
        vehicle_type: carFormData.type,
      };

      let result;
      if (editingCarIndex !== null && (cars[editingCarIndex] as any).id) {
        // Update existing car (assuming 'id' exists from Supabase)
        result = await supabase
          .from('vehicles')
          .update(payload)
          .eq('id', (cars[editingCarIndex] as any).id);
      } else {
        // Insert new car
        result = await supabase
          .from('vehicles')
          .insert(payload)
          .select();
      }

      if (result.error) throw result.error;

      // Refresh cars list
      const { data: updatedCars } = await supabase.from('vehicles').select('*').eq('user_id', user.id);
      if (updatedCars) {
        setCars(updatedCars.map(car => ({
          ...car,
          plateNumber: (car as any).plate_number,
          type: (car as any).vehicle_type,
        })) as Vehicle[]);
      }

      setShowVehicleModal(false);
      setEditingCarIndex(null);
      setCarFormData({ brand: '', model: '', color: '', plateNumber: '', type: 'sedan', orDoc: null, crDoc: null });
      showMessage('Vehicle Saved', 'Vehicle saved successfully.');
    } catch (err: any) {
      showMessage('Error Saving Vehicle', err.message || 'An unexpected error occurred.');
    }
  }, [carFormData, editingCarIndex, cars]);

  const deleteCar = useCallback(async (index: number) => {
    if (cars.length <= 1) {
      return showMessage('Cannot Delete', 'You must have at least one vehicle.');
    }

    try {
      const car = cars[index];
      if (car && (car as any).id) {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', (car as any).id);
        
        if (error) throw error;
      }

      setCars((current) => current.filter((_, carIndex) => carIndex !== index));
      setSelectedCarIndex((current) => (current >= cars.length - 1 ? 0 : current));
      showMessage('Vehicle Deleted', 'Vehicle deleted successfully.');
    } catch (err: any) {
      showMessage('Error Deleting Vehicle', err.message || 'An unexpected error occurred.');
    }
  }, [cars]);

  const handleLocationSelect = useCallback((locationItem: any) => {
    const locName = typeof locationItem === 'string' ? locationItem : locationItem.name;
    const locAddress = typeof locationItem === 'string' ? `${locationItem} Area` : (locationItem.address || `${locName} Area`);
    
    setShowLocationModal(false);
    setBookingLocation(locName); 
    setBookingAddress(locAddress); 
  }, []);

  const handleBookingConfirm = useCallback(async (newBookingDetails: any) => {
    const activeCar = cars[selectedCarIndex] ?? cars[0] ?? defaultCars[0]!;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // We need to resolve location_id and vehicle_id. 
      // For now, we'll use a simplified payload matching the Supabase schema.
      const payload = {
        user_id: user.id,
        // location_id: ... // In a real app, this would be passed from BookingFlow
        // vehicle_id: (activeCar as any).id,
        reference: `PKP-${Date.now().toString().slice(-8)}`,
        spot: 'A-01', // Mock spot for now
        date: new Date().toISOString().split('T')[0],
        time_slot: newBookingDetails.time || '10:00 AM - 11:00 AM',
        amount: newBookingDetails.amount || 50,
        status: 'active',
      };

      const { data: insertedBooking, error } = await supabase
        .from('bookings')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      pushNotification({
        type: 'confirmed',
        title: 'Booking Confirmed',
        message: `Your fixed booking at ${bookingLocation} for ${activeCar.brand} ${activeCar.model} (${activeCar.plateNumber}) is confirmed.`,
      });

      const newBooking: Booking = {
        ...insertedBooking,
        id: String(insertedBooking.id),
        time: (insertedBooking as any).time_slot,
        price: `₱${insertedBooking.amount}`,
      } as Booking;

      setBookingsState((current) => [newBooking, ...current]);
      setSelectedLocation(bookingLocation); 
      setBookingLocation(null); 
      setActiveTab('home'); 
      setConfirmedBookingModal(newBooking);
    } catch (err: any) {
      showMessage('Booking Error', err.message || 'An unexpected error occurred.');
    }
  }, [bookingLocation, cars, pushNotification, selectedCarIndex]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const confirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);

    if (onLogoutToAuth) {
      onLogoutToAuth();
      return;
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      }),
    );
  }, [navigation, onLogoutToAuth]);

  const submitReview = useCallback((data: { rating: number; comment: string; selectedTags: string[] }) => {
    pushNotification({
      type: 'completed',
      title: 'Review Submitted',
      message: `Thanks for rating your parking experience ${data.rating} out of 5.`,
    });
    showMessage('Thank You', 'Your feedback has been submitted.');
  }, [pushNotification]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        {bookingLocation ? (
          <BookingFlow 
            location={bookingLocation} 
            address={bookingAddress}
            cars={cars} 
            onBack={() => setBookingLocation(null)}
            onConfirm={handleBookingConfirm}
          />
        ) : (
          <>
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
              {activeTab === 'home' ? (
                <>
                  <View ref={captureRef('guide')}>
                    <CustomerHeader
                      userName={profile.name}
                      profilePicture={profile.profilePic}
                      unreadCount={unreadCount}
                      notifications={notifications}
                      onGuidePress={() => setShowTutorial(true)}
                      onReservePress={() => setShowLocationModal(true)}
                      onProfilePress={() => setShowProfileModal(true)}
                      onLogoutPress={() => setShowLogoutConfirm(true)}
                      onNotificationPress={markNotificationRead}
                      reserveTutorialRef={captureRef('reserveCta')}
                      tutorialButtonRef={captureRef('tutorialButton')}
                    />
                  </View>

                  <View>
                    <Text style={styles.heading}>Quick Actions</Text>
                    <View style={styles.quickRow}>
                      <View ref={captureRef('reserve')} style={styles.quickItem}>
                        <QuickActionCard title="Park Now" subtitle="Find a spot" mascot={mascotParkNow} onPress={() => setShowLocationModal(true)} variant="primary" />
                      </View>
                      <View ref={captureRef('bookings')} style={styles.quickItem}>
                        <QuickActionCard title="Bookings" subtitle="View history" mascot={mascotMyBookings} onPress={() => setActiveTab('bookings')} variant="dark" />
                      </View>
                      <View ref={captureRef('review')} style={styles.quickItem}>
                        <QuickActionCard title="Reviews" subtitle="Rate us" mascot={mascotRateReview} onPress={() => setShowReviewModal(true)} variant="light" />
                      </View>
                    </View>
                  </View>

                  <View ref={captureRef('vehicles')}>
                    <VehicleManagement
                      cars={cars}
                      selectedCarIndex={selectedCarIndex}
                      onSelect={setSelectedCarIndex}
                      onAdd={() => {
                        setEditingCarIndex(null);
                        setCarFormData({ brand: '', model: '', color: '', plateNumber: '', type: 'sedan', orDoc: null, crDoc: null });
                        setShowVehicleModal(true);
                      }}
                      onEdit={(index) => {
                        const car = cars[index];
                        if (!car) {
                          return;
                        }
                        setEditingCarIndex(index);
                        setCarFormData(car);
                        setShowVehicleModal(true);
                      }}
                      onDelete={deleteCar}
                    />
                  </View>

                  <RecentBookingsList items={recentBookings} onViewAll={() => setActiveTab('bookings')} />

                  {selectedLocation ? (
                    <View style={styles.locationBanner}>
                      <Text style={styles.locationBannerLabel}>Last Selected Location</Text>
                      <Text style={styles.locationBannerValue}>{selectedLocation}</Text>
                    </View>
                  ) : null}
                </>
              ) : null}

              {activeTab === 'bookings' ? <MyBookings bookings={bookings} setBookings={setBookings} /> : null}
              {activeTab === 'settings' ? <CustomerSettings /> : null}
            </ScrollView>

            <View style={styles.bottomNav}>
              {[
                { id: 'home' as const, label: 'Home', icon: 'home-outline' as const },
                { id: 'bookings' as const, label: 'Bookings', icon: 'calendar-outline' as const },
                { id: 'settings' as const, label: 'Settings', icon: 'settings-outline' as const },
              ].map((item) => {
                const active = activeTab === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setActiveTab(item.id)}
                    style={styles.navItem}
                    ref={item.id === 'settings' ? captureRef('settings') : undefined}
                  >
                    <View style={[styles.navIconWrap, active ? styles.navIconWrapActive : styles.navIconWrapInactive]}>
                      <Ionicons name={item.icon} size={active ? 22 : 20} color={active ? '#FFFFFF' : COLORS.subtle} />
                    </View>
                    <Text style={[styles.navLabel, active ? styles.navLabelActive : null]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>

      <TutorialModal
        visible={showTutorial}
        steps={tutorialSteps}
        onClose={finishTutorial}
        onStepChange={setTutorialStepIndex}
        spotlightRect={spotlightRect}
      />
      <LocationModal visible={showLocationModal} locations={availableLocations} onClose={() => setShowLocationModal(false)} onSelect={handleLocationSelect} />
      <VehicleModal visible={showVehicleModal} formData={carFormData} setFormData={setCarFormData} isEditing={editingCarIndex !== null} onClose={() => setShowVehicleModal(false)} onSave={saveCar} />
      <RateAndReviewModal visible={showReviewModal} onClose={() => setShowReviewModal(false)} onSubmit={submitReview} />
      <CustomerProfile
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onManageVehicles={() => {
          setShowProfileModal(false);
          setActiveTab('home');
        }}
      />
      <Modal
        visible={Boolean(confirmedBookingModal)}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmedBookingModal(null)}
      >
        <SafeAreaView style={styles.confirmedOverlay}>
          <View style={styles.confirmedSheet}>
            <View style={styles.confirmedHandle} />
            <ScrollView contentContainerStyle={styles.confirmedContent} showsVerticalScrollIndicator={false}>
              <View style={styles.confirmedIconWrap}>
                <Ionicons name="checkmark-circle-outline" size={30} color="#00B977" />
              </View>
              <Text style={styles.confirmedTitle}>Booking Confirmed!</Text>
              <Text style={styles.confirmedSub}>
                Reservation for {confirmedBookingModal?.bookingPlate ?? 'your vehicle'} is all set.
              </Text>

              <View style={styles.confirmedPass}>
                <View style={styles.confirmedPassTop}>
                  <View>
                    <Text style={styles.confirmedPassKicker}>PakiPark E-Pass</Text>
                    <Text style={styles.confirmedPassTitle}>Fixed Slot</Text>
                    <View style={styles.confirmedLocationRow}>
                      <Ionicons name="location-outline" size={12} color="#AFC3D4" />
                      <Text style={styles.confirmedLocation}>{confirmedBookingModal?.location}</Text>
                    </View>
                    <View style={styles.confirmedIdPill}>
                      <Text style={styles.confirmedIdLabel}>Booking ID</Text>
                      <Text style={styles.confirmedIdValue}>{confirmedBookingModal?.bookingId ?? confirmedBookingModal?.reference}</Text>
                    </View>
                  </View>
                  <View style={styles.confirmedCarIcon}>
                    <Ionicons name="car-sport-outline" size={16} color={COLORS.primary} />
                  </View>
                </View>

                <View style={styles.confirmedCutRow}>
                  {Array.from({ length: 24 }, (_, index) => (
                    <View key={index} style={styles.confirmedCutDot} />
                  ))}
                </View>

                <View style={styles.confirmedPassBody}>
                  <View style={styles.confirmedInfoGrid}>
                    <View style={styles.confirmedInfo}>
                      <Text style={styles.confirmedInfoLabel}>Driver Name</Text>
                      <Text style={styles.confirmedInfoValue}>{profile.name}</Text>
                    </View>
                    <View style={styles.confirmedInfoRight}>
                      <Text style={styles.confirmedInfoLabel}>Plate Number</Text>
                      <Text style={styles.confirmedInfoAccent}>{confirmedBookingModal?.bookingPlate}</Text>
                    </View>
                    <View style={styles.confirmedInfo}>
                      <Text style={styles.confirmedInfoLabel}>Date</Text>
                      <Text style={styles.confirmedInfoValue}>{confirmedBookingModal?.reviewDate ?? confirmedBookingModal?.date}</Text>
                    </View>
                    <View style={styles.confirmedInfoRight}>
                      <Text style={styles.confirmedInfoLabel}>Time Slot</Text>
                      <Text style={styles.confirmedInfoValue}>{confirmedBookingModal?.time}</Text>
                    </View>
                    <View style={styles.confirmedInfo}>
                      <Text style={styles.confirmedInfoLabel}>Duration</Text>
                      <Text style={styles.confirmedInfoValue}>{confirmedBookingModal?.durationHours ?? 1} hrs</Text>
                    </View>
                    <View style={styles.confirmedInfoRight}>
                      <Text style={styles.confirmedInfoLabel}>Amount Paid</Text>
                      <Text style={styles.confirmedInfoAccent}>₱{confirmedBookingModal?.amount ?? 0}</Text>
                    </View>
                  </View>

                  <View style={styles.confirmedBarcodeBox}>
                    <View style={styles.confirmedBarcode}>
                      {Array.from({ length: 42 }, (_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.confirmedBarcodeLine,
                            { width: index % 5 === 0 ? 3 : index % 2 === 0 ? 2 : 1 },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.confirmedBarcodeMeta}>
                      {confirmedBookingModal?.bookingId ?? confirmedBookingModal?.reference} - {confirmedBookingModal?.bookingPlate}
                    </Text>
                    <Text style={styles.confirmedPresentText}>Present to Attendant</Text>
                  </View>

                  <View style={styles.confirmedMiniRow}>
                    <View style={styles.confirmedMiniCard}>
                      <View style={styles.confirmedMiniTitleRow}>
                        <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                        <Text style={styles.confirmedMiniLabel}>Duration</Text>
                      </View>
                      <Text style={styles.confirmedMiniValue}>{confirmedBookingModal?.durationHours ?? 1} Hours Reserved</Text>
                    </View>
                    <View style={styles.confirmedMiniCard}>
                      <Text style={styles.confirmedMiniLabel}>Payment</Text>
                      <Text style={styles.confirmedMiniValue}>{confirmedBookingModal?.paymentLabel ?? 'Pay at Counter'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.confirmedActions}>
              <Pressable
                style={styles.confirmedShareBtn}
                onPress={() => showMessage('Share Unavailable', 'Sharing options are not available yet.')}
                accessibilityLabel="Share booking"
              >
                <Ionicons name="share-social-outline" size={18} color="#111827" />
                <Text style={styles.confirmedShareText}>Share</Text>
              </Pressable>
              <Pressable
                style={styles.confirmedHomeBtn}
                onPress={() => setConfirmedBookingModal(null)}
                accessibilityLabel="Back to home"
              >
                <Text style={styles.confirmedHomeText}>Back to Home</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={styles.logoutOverlay}>
          <View style={styles.logoutCard}>
            <Image source={require('../../../../assets/logoutMascot.png')} style={styles.logoutMascot} resizeMode="contain" />
            <Text style={styles.logoutTitle}>Leaving PakiPark?</Text>
            <Text style={styles.logoutSub}>Are you sure you want to log out of your customer account?</Text>
            <Pressable style={styles.logoutConfirmBtn} onPress={confirmLogout} accessibilityLabel="Yes, Log Me Out">
              <Text style={styles.logoutConfirmText}>Yes, Log Me Out</Text>
            </Pressable>
            <Pressable style={styles.logoutCancelBtn} onPress={() => setShowLogoutConfirm(false)} accessibilityLabel="Stay Logged In">
              <Text style={styles.logoutCancelText}>Stay Logged In</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: {
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 180,
  gap: 16,
},
  heading: { fontSize: 13, fontWeight: '800', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 30 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickItem: { flex: 1 },
  locationBanner: { backgroundColor: '#FFF3EA', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#FDE0CC' },
  locationBannerLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase' },
  locationBannerValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  confirmedOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)', justifyContent: 'flex-end', paddingHorizontal: 6 },
  confirmedSheet: { height: '84%', backgroundColor: COLORS.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  confirmedHandle: { alignSelf: 'center', width: 32, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB', marginTop: 10, marginBottom: 18 },
  confirmedContent: { paddingHorizontal: 14, paddingBottom: 14, alignItems: 'center' },
  confirmedIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E9FFF4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  confirmedTitle: { color: '#153B5C', fontSize: 18, fontWeight: '900', marginBottom: 3 },
  confirmedSub: { color: '#8796AE', fontSize: 12, fontWeight: '700', marginBottom: 16 },
  confirmedPass: { width: '100%', backgroundColor: COLORS.surface, borderRadius: 18, overflow: 'hidden', elevation: 2 },
  confirmedPassTop: { minHeight: 126, backgroundColor: '#234766', padding: 18, flexDirection: 'row', justifyContent: 'space-between' },
  confirmedPassKicker: { color: '#8CA6BC', fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  confirmedPassTitle: { color: COLORS.primary, fontSize: 20, fontWeight: '900', marginTop: 12 },
  confirmedLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  confirmedLocation: { color: '#AFC3D4', fontSize: 10, fontWeight: '800' },
  confirmedIdPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#315570', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 },
  confirmedIdLabel: { color: '#AFC3D4', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  confirmedIdValue: { color: COLORS.primary, fontSize: 10, fontWeight: '900' },
  confirmedCarIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#315570', alignItems: 'center', justifyContent: 'center' },
  confirmedCutRow: { height: 12, marginTop: -6, flexDirection: 'row', justifyContent: 'space-between' },
  confirmedCutDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.surface },
  confirmedPassBody: { padding: 18, paddingTop: 14 },
  confirmedInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 13 },
  confirmedInfo: { width: '50%' },
  confirmedInfoRight: { width: '50%', alignItems: 'flex-end' },
  confirmedInfoLabel: { color: '#C5CDD8', fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  confirmedInfoValue: { color: '#153B5C', fontSize: 12, fontWeight: '900', marginTop: 5 },
  confirmedInfoAccent: { color: COLORS.primary, fontSize: 12, fontWeight: '900', marginTop: 5 },
  confirmedBarcodeBox: { backgroundColor: '#F8FAFC', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', marginTop: 16 },
  confirmedBarcode: { width: '92%', height: 36, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: 1 },
  confirmedBarcodeLine: { height: 36, backgroundColor: '#0F172A' },
  confirmedBarcodeMeta: { color: '#A5AFBE', fontSize: 7, fontWeight: '900', letterSpacing: 1.2, marginTop: 8 },
  confirmedPresentText: { color: COLORS.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  confirmedMiniRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  confirmedMiniCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 },
  confirmedMiniTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confirmedMiniLabel: { color: COLORS.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  confirmedMiniValue: { color: '#153B5C', fontSize: 11, fontWeight: '900', marginTop: 6 },
  confirmedActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, backgroundColor: COLORS.background },
  confirmedShareBtn: { flex: 1, height: 56, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: '#E5EAF1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmedShareText: { color: '#111827', fontSize: 13, fontWeight: '900' },
  confirmedHomeBtn: { flex: 1, height: 56, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  confirmedHomeText: { color: COLORS.surface, fontSize: 13, fontWeight: '900' },
  logoutOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoutCard: { backgroundColor: COLORS.surface, borderRadius: 36, padding: 26, paddingTop: 96, alignItems: 'center', gap: 12, width: '100%', maxWidth: 360 },
  logoutMascot: { position: 'absolute', top: -122, width: 220, height: 220 },
  logoutTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', lineHeight: 30 },
  logoutSub: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  logoutConfirmBtn: { width: '100%', height: 54, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  logoutConfirmText: { fontSize: 16, fontWeight: '900', color: COLORS.surface },
  logoutCancelBtn: { width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' },
  logoutCancelText: { fontSize: 14, fontWeight: '800', color: COLORS.muted },
 bottomNav: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: COLORS.surface,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  borderWidth: 1,
  borderColor: COLORS.border,
  paddingVertical: 14,
  paddingHorizontal: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 8,
},
  navItem: { flex: 1, alignItems: 'center', gap: 6 },
  navIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: { backgroundColor: COLORS.primary },
  navIconWrapInactive: { backgroundColor: '#F8FAFC' },
  navLabel: { fontSize: 10, color: COLORS.subtle, fontWeight: '700' },
  navLabelActive: { color: COLORS.navy },
});
