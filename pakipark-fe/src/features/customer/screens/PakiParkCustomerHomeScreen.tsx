import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

import * as MediaLibrary from 'expo-media-library';

import {
  COLORS,
  mascotMyBookings,
  mascotParkNow,
  mascotRateReview,
  STORAGE_KEYS,
  tutorialSteps,
} from '@features/customer/data';
import { CustomerProfile } from '@features/customer/components/CustomerProfile';
import { EPass } from '../components/EPass';
import { CustomerHeader, QuickActionCard, RecentBookings as RecentBookingsList, VehicleManagement } from '@features/customer/components/HeaderSections';
import { LocationModal, RateAndReviewModal, TutorialModal, VehicleModal, FAQModal } from '@features/customer/components/CustomerModals';
import { MyBookings } from '@features/customer/components/MyBookings';
import { BookingFlow } from '@features/customer/components/BookingFlow';
import type { RootStackParamList } from '@navigation/types';
import type { AppTab, Booking, LocationItem, NotificationItem, TutorialTargetKey, Vehicle, VehicleFormData } from '@features/customer/types';
import { formatNowTime, saveStoredJson, showMessage } from '@features/customer/utils';
import { backendApi, getSavedUser, saveSession } from '../../../lib/api';
import type { ApiUser } from '../../../lib/api';

type ConfirmedBookingModalData = Booking & {
  bookingId?: string;
  bookingPlate?: string;
  durationHours?: number;
  paymentLabel?: string;
  reviewDate?: string;
};
function mapPaymentMethodLabel(label?: string): 'gcash' | 'maya' | 'card' {
  if (!label) return 'gcash';
  const val = label.toLowerCase();
  if (val === 'maya' || val === 'paymaya') return 'maya';
  if (val === 'card' || val === 'credit/debit card') return 'card';
  return 'gcash';
}

function mapBackendNotifications(notifications: any[]): NotificationItem[] {
  return (notifications || []).map((n: any) => {
    let type: NotificationItem['type'] = 'info';
    if (n.type.includes('confirm')) {
      type = 'confirmed';
    } else if (n.type.includes('fail')) {
      type = 'failed';
    } else if (n.type.includes('complete') || n.type.includes('review')) {
      type = 'completed';
    }

    return {
      id: n.id.toString(),
      type,
      title: n.title,
      message: n.message || n.body,
      time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: n.isRead,
    };
  });
}

export function PakiParkCustomerHomeScreen({ onLogoutToAuth }: Readonly<{ onLogoutToAuth?: () => void }>) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [confirmedBookingModal, setConfirmedBookingModal] = useState<ConfirmedBookingModalData | null>(null);
  const receiptRef = useRef<View>(null);
  const [isSharingModal, setIsSharingModal] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [bookingLocation, setBookingLocation] = useState<string | null>(null);
  const [bookinglocation_id, setBookinglocation_id] = useState<string | null>(null);
  const [bookingAddress, setBookingAddress] = useState<string>('');

  const [editingCarIndex, setEditingCarIndex] = useState<number | null>(null);
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [profile, setProfile] = useState({ name: '', profilePic: null as string | null });
  const [fullUser, setFullUser] = useState<ApiUser | null>(null);
  const [cars, setCars] = useState<Vehicle[]>([]);
  const [bookingsState, setBookingsState] = useState<Booking[]>([]);
  const bookings = bookingsState;
  const [parkingLocations, setParkingLocations] = useState<LocationItem[]>([]);
  const [carFormData, setCarFormData] = useState<VehicleFormData>({
    brand: '',
    model: '',
    color: '',
    plate_number: '',
    type: 'sedan',
    orDoc: null,
    crDoc: null,
    orDocFile: null,
    crDocFile: null,
  });

  const handleSaveReceipt = async () => {
    if (isSharingModal) return;
    setIsSharingModal(true);
    try {
      console.log('[handleSaveReceipt] Requesting permissions...');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showMessage('Permission needed', 'Please allow access to save the receipt to your gallery.');
        setIsSharingModal(false);
        return;
      }

      if (!receiptRef.current) {
        console.error('[handleSaveReceipt] receiptRef.current is null!');
        showMessage('Error', 'Receipt view is not ready.');
        setIsSharingModal(false);
        return;
      }




      console.log('[handleSaveReceipt] Capturing view...');
      console.log('[handleSaveReceipt] Waiting for layout...');
      await new Promise(resolve => setTimeout(resolve, 500));

      let uri;
      try {
        console.log('[handleSaveReceipt] Trying ViewShot capture...');
        uri = await (receiptRef.current as any).capture();
        console.log('[handleSaveReceipt] capture success:', uri);
      } catch (e: any) {
        console.log('[handleSaveReceipt] capture failed:', e.message);
        throw e;
      }

      let realUri = uri;

      console.log('[handleSaveReceipt] Saving to library...');
      await MediaLibrary.saveToLibraryAsync(realUri as string);
      console.log('[handleSaveReceipt] Saved successfully');
      showMessage('Success', 'Receipt saved to your gallery!');
    } catch (err) {
      console.error('Error saving receipt:', err);
      showMessage('Error', 'Unable to save the receipt.');
    } finally {
      setIsSharingModal(false);
    }
  };

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
    if (!showTutorial || !activeTutorialTarget || activeTutorialTarget === 'none') return;
    const ref = targetRefs.current[activeTutorialTarget];
    if (!ref?.measureInWindow) return;

    const handleMeasure = (x: number, y: number, width: number, height: number) => {
      setSpotlightLayouts((prev) => ({ ...prev, [activeTutorialTarget]: { x, y, width, height } }));
    };

    const timer = setTimeout(() => {
      ref.measureInWindow(handleMeasure);
    }, 100);

    return () => clearTimeout(timer);
  }, [showTutorial, activeTutorialTarget, tutorialStepIndex]);
  // ----------------------------------------

  useEffect(() => {
    void (async () => {
      const savedUser = await getSavedUser();

      const tutorialValue = await AsyncStorage.getItem(STORAGE_KEYS.tutorial);



      setShowTutorial(!tutorialValue);

      if (savedUser) {
        setProfile({
          name: `${savedUser.first_name || ''} ${savedUser.last_name || ''}`.trim() || savedUser.full_name?.trim() || savedUser.email?.split('@')[0] || '',
          profilePic: savedUser.profile_photo_url || savedUser.profile_picture || null,
        });
        setFullUser(savedUser);
      }

      try {
        const me = await backendApi.getMe().catch(e => {
          console.warn('Failed to load user profile:', e);
          return null;
        });

        if (me) {
          await saveSession(me);
          setFullUser(me);
          setProfile({
            name: `${me.first_name || ''} ${me.last_name || ''}`.trim() || me.full_name?.trim() || me.email?.split('@')[0] || '',
            profilePic: me.profile_photo_url || me.profile_picture || null,
          });
        }

        const [backendCars, backendBookings, backendLocations] = await Promise.all([
          backendApi.getVehicles().catch(() => null),
          backendApi.getBookings().catch(() => null),
          backendApi.getLocations().catch(() => null),
        ]);

        if (backendCars) {
          setCars(backendCars);
        }

        if (backendBookings) {
          setBookingsState(backendBookings);
        }

        if (backendCars) {
          setCars(backendCars);
        }

        if (backendBookings) {
          setBookingsState(backendBookings);
        }

        if (backendLocations) {
          setParkingLocations(backendLocations);
        }

        if (me) {
          try {
            const notifRes = await backendApi.getNotifications(1, 50);
            if (notifRes?.notifications) {
              setNotifications(mapBackendNotifications(notifRes.notifications));
            }
          } catch (e) {
            console.warn('Failed to load notifications', e);
          }
        }
      } catch (err: any) {
        console.warn('Backend Sync failed:', err.message);
      }
    })();
  }, []);

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
    const cleanPlate = carFormData.plate_number.trim().toUpperCase();
    const plateRegex = /^[A-Z0-9]{6,8}$/;
    if (!plateRegex.test(cleanPlate)) {
      throw new Error('Plate number must contain 6 to 8 letters and numbers only.');
    }
    if (!carFormData.brand.trim() || !carFormData.model.trim() || !carFormData.color.trim()) {
      throw new Error('Please fill in brand, model, and color.');
    }

    const existingVehicle = editingCarIndex === null ? null : cars[editingCarIndex];
    const existingVehicleId = existingVehicle?.id || existingVehicle?._id;

    try {
      if (existingVehicleId) {
        await backendApi.updateVehicle(existingVehicleId, carFormData);
      } else {
        await backendApi.createVehicle(carFormData);
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to save vehicle. Please try again.');
    }

    try {
      const freshCars = await backendApi.getVehicles();
      if (freshCars && freshCars.length > 0) setCars(freshCars);
    } catch {
    }
    setShowVehicleModal(false);
    setEditingCarIndex(null);
    setCarFormData({ brand: '', model: '', color: '', plate_number: '', type: 'sedan', orDoc: null, crDoc: null, orDocFile: null, crDocFile: null });
    showMessage('Vehicle Saved', 'Vehicle saved successfully.');
  }, [carFormData, editingCarIndex, cars]);

  const deleteCar = useCallback(async (index: number) => {
    if (cars.length <= 1) {
      return showMessage('Cannot Delete', 'You must have at least one vehicle.');
    }

    try {
      const car = cars[index];
      const vehicleId = car?.id || car?._id;

      if (vehicleId) {
        await backendApi.deleteVehicle(vehicleId);
      }

      setCars((current) => current.filter((_, carIndex) => carIndex !== index));
      setSelectedCarIndex((current) => (current >= cars.length - 1 ? 0 : current));
      showMessage('Vehicle Deleted', 'Vehicle deleted successfully.');
    } catch (err: any) {
      showMessage('Error Deleting Vehicle', err.message || 'An unexpected error occurred.');
    }
  }, [cars]);

  const handleLocationSelect = useCallback((locationItem: LocationItem) => {
    const locName = locationItem.name;
    const locAddress = locationItem.address || `${locName} Area`;

    setShowLocationModal(false);
    setBookinglocation_id(locationItem.id);
    setBookingLocation(locName);
    setBookingAddress(locAddress);
  }, []);

  /**
   * handleBeforePayment — Called by BookingFlow BEFORE opening the PayMongo
   * checkout URL. Creates a 'payment_pending' booking via the secure RPC
   * and returns the new booking ID so the checkout session can reference it.
   */
  const handleBeforePayment = useCallback(async (newBookingDetails: any): Promise<string> => {
    // Prefer vehicleId passed directly from BookingFlow (from its own selectedCar state).
    // Fall back to resolving from the parent's cars array only if not provided.
    const vehicleId =
      newBookingDetails.vehicleId ||
      (cars[selectedCarIndex] ?? cars[0])?.id ||
      (cars[selectedCarIndex] ?? cars[0])?._id;

    if (!vehicleId) throw new Error('Please add a vehicle before booking.');

    const location_id = bookinglocation_id || parkingLocations.find((item) => item.name === bookingLocation)?.id;
    if (!location_id) throw new Error('Please choose a valid parking location.');

    const result = await backendApi.createPendingBooking({
      vehicleId,
      locationId: location_id,
      date: newBookingDetails.reviewDate || new Date().toISOString().split('T')[0],
      timeSlot: newBookingDetails.timeSlot || newBookingDetails.time || '10:00 - 11:00',
      amount: newBookingDetails.amount || 50,
      paymentMethod: mapPaymentMethodLabel(newBookingDetails.paymentLabel),
      spot: newBookingDetails.spot,
      parkingSlotType: newBookingDetails.parkingSlotType || 'regular',
    });

    // The RPC returns { success, booking_id, reference }
    const bookingId =
      result?.booking_id ??
      result?.id ??
      result?._id ??
      result?.booking?.id ??
      result?.booking?._id ??
      result?.data?.booking_id ??
      result?.data?.id ??
      result?.data?._id;

    if (!bookingId) {
      console.log('createPendingBooking response:', result);
      throw new Error('Failed to create pending booking: backend did not return a booking id.');
    }

    return String(bookingId);

  }, [bookingLocation, bookinglocation_id, cars, parkingLocations, selectedCarIndex]);

  /**
   * handleBookingConfirm — Called by BookingFlow AFTER payment is verified.
   * At this point, the booking already exists and payment status has been
   * updated via the backend webhook or verify endpoint. We just refresh
   * the bookings list and display the receipt.
   */
  const handleBookingConfirm = useCallback(async (newBookingDetails: any) => {
    const activeCar = cars[selectedCarIndex] ?? cars[0];
    if (!activeCar) return showMessage('No Vehicle', 'Please add a vehicle first.');

    const activeCarAny = activeCar as any;

    const selectedPlate =
      newBookingDetails.vehiclePlateNumber ||
      newBookingDetails.bookingPlate ||
      activeCarAny.plate_number ||
      activeCarAny.plateNumber ||
      activeCarAny.vehiclePlateNumber ||
      activeCarAny.plate ||
      '';

    const selectedLocationName =
      newBookingDetails.locationName ||
      newBookingDetails.location ||
      bookingLocation ||
      selectedLocation ||
      'Parking Location';

    const selectedLocationAddress =
      newBookingDetails.locationAddress ||
      newBookingDetails.address ||
      bookingAddress ||
      selectedLocationName;

    try {
      const [newBookings, notifRes] = await Promise.all([
        backendApi.getBookings(),
        backendApi.getNotifications(1, 50),
      ]);

      if (newBookings && newBookings.length > 0) setBookingsState(newBookings);

      if (notifRes?.notifications?.length) {
        setNotifications(mapBackendNotifications(notifRes.notifications));
      }

      const latestBooking = newBookings?.[0];

      const newBooking: ConfirmedBookingModalData = latestBooking
        ? {
          ...latestBooking,

          // Force the E-Pass to use the real location selected in the current flow.
          location: selectedLocationName,
          locationName: selectedLocationName,
          address: selectedLocationAddress,
          locationAddress: selectedLocationAddress,

          // Force the E-Pass to use the current selected vehicle plate.
          vehiclePlateNumber: selectedPlate,
          bookingPlate: selectedPlate,

          // Preserve values from the payment flow.
          durationHours: newBookingDetails.durationHours,
          paymentLabel: newBookingDetails.paymentLabel || latestBooking.payment,
          reviewDate: newBookingDetails.reviewDate,

          // Keep amount/time/date from the live flow when available.
          amount: newBookingDetails.amount ?? latestBooking.amount,
          date: newBookingDetails.reviewDate || latestBooking.date,
          time: newBookingDetails.timeSlot || newBookingDetails.time || latestBooking.time,
        }
        : {
          ...newBookingDetails,
          location: selectedLocationName,
          locationName: selectedLocationName,
          address: selectedLocationAddress,
          locationAddress: selectedLocationAddress,
          vehiclePlateNumber: selectedPlate,
          bookingPlate: selectedPlate,
        };

      setSelectedLocation(selectedLocationName);
      setBookingLocation(null);
      setBookinglocation_id(null);
      setActiveTab('home');
      setConfirmedBookingModal(newBooking);
    } catch (err: any) {
      showMessage('Booking Error', err.message || 'An unexpected error occurred.');
    }
  }, [
    bookingAddress,
    bookingLocation,
    cars,
    selectedCarIndex,
    selectedLocation,
  ]);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await backendApi.markNotificationRead(id);
      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (err) {
      console.warn('Failed to mark read', err);
    }
  }, []);

  const confirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    void backendApi.logout();

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
    // The modal already saved the review to Supabase — just push a local notification
    pushNotification({
      type: 'completed',
      title: 'Review Submitted',
      message: `Thanks for rating your parking experience ${data.rating} out of 5.`,
    });
    showMessage('Thank You', 'Your feedback has been saved.');
  }, [pushNotification]);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        bookingLocation ? { backgroundColor: COLORS.surface } : null
      ]}
      edges={['top']}
    >
      <View style={styles.screen}>
        {bookingLocation ? (
          <BookingFlow
            location_id={bookinglocation_id!}
            location={bookingLocation}
            address={bookingAddress}
            cars={cars}
            onBack={() => setBookingLocation(null)}
            onBeforePayment={handleBeforePayment}
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
                      profile_picture={profile.profilePic}
                      unreadCount={unreadCount}
                      notifications={notifications}
                      onGuidePress={() => setShowTutorial(true)}
                      onFAQPress={() => setShowFAQModal(true)}
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
                        setCarFormData({ brand: '', model: '', color: '', plate_number: '', type: 'sedan', orDoc: null, crDoc: null, orDocFile: null, crDocFile: null });
                        setShowVehicleModal(true);
                      }}
                      onEdit={(index) => {
                        const car = cars[index];
                        if (!car) {
                          return;
                        }
                        setEditingCarIndex(index);
                        setCarFormData({ ...car, orDocFile: null, crDocFile: null });
                        setShowVehicleModal(true);
                      }}
                      onDelete={deleteCar}
                    />
                  </View>

                  <RecentBookingsList
                    items={bookings.slice(0, 3).map((booking) => ({
                      loc: booking.location,
                      date: `${booking.date} - ${booking.time}`,
                      price: String(booking.amount),
                    }))}
                    onViewAll={() => setActiveTab('bookings')}
                  />

                  {selectedLocation ? (
                    <View style={styles.locationBanner}>
                      <Text style={styles.locationBannerLabel}>Last Selected Location</Text>
                      <Text style={styles.locationBannerValue}>{selectedLocation}</Text>
                    </View>
                  ) : null}
                </>
              ) : null}

              {activeTab === 'bookings' ? <MyBookings bookings={bookings} setBookings={setBookings} driverName={profile.name} /> : null}
            </ScrollView>

            <View style={styles.bottomNav}>
              {[
                { id: 'home' as const, label: 'Home', icon: 'home-outline' as const },
                { id: 'bookings' as const, label: 'Bookings', icon: 'calendar-outline' as const },
              ].map((item) => {
                const active = activeTab === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setActiveTab(item.id)}
                    style={styles.navItem}
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
      <LocationModal visible={showLocationModal} locations={parkingLocations} onClose={() => setShowLocationModal(false)} onSelect={handleLocationSelect} />
      <VehicleModal visible={showVehicleModal} formData={carFormData} setFormData={setCarFormData} isEditing={editingCarIndex !== null} onClose={() => setShowVehicleModal(false)} onSave={saveCar} />
      <RateAndReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={submitReview}
        locations={parkingLocations}
        recentCompletedBooking={bookings.find((b) => b.status === 'completed') ?? null}
      />
      <CustomerProfile
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={fullUser}
        bookings={bookings}
        onUserUpdated={(updatedUser) => {
          setFullUser(updatedUser);
          setProfile({
            name: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.full_name?.trim() || updatedUser.email?.split('@')[0] || '',
            profilePic: updatedUser.profile_photo_url || updatedUser.profile_picture || null,
          });
        }}
      />
      <Modal
        visible={Boolean(confirmedBookingModal)}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmedBookingModal(null)}
      >
        <View style={styles.confirmedOverlay}>
          <View style={styles.confirmedSheet}>
            <View style={styles.confirmedHandle} />
            <ScrollView contentContainerStyle={styles.confirmedContent} showsVerticalScrollIndicator={false}>
              <View style={styles.confirmedIconWrap}>
                <Ionicons name="checkmark-circle" size={40} color="#00B977" />
              </View>
              <Text style={styles.confirmedTitle}>Booking Confirmed!</Text>
              <Text style={styles.confirmedSub}>
                Reservation for {confirmedBookingModal?.bookingPlate ?? 'your vehicle'} is all set.
              </Text>

              {confirmedBookingModal && (
                <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1 }} style={styles.confirmedPassWrapper}>
                  <EPass booking={confirmedBookingModal as any} driverName={profile.name} />
                </ViewShot>
              )}
            </ScrollView>

            <SafeAreaView style={styles.confirmedActions} edges={['bottom']}>
              <Pressable
                style={[styles.confirmedShareBtn, isSharingModal ? { opacity: 0.7 } : null]}
                onPress={handleSaveReceipt}
                accessibilityLabel="Save receipt"
                disabled={isSharingModal}
              >
                {isSharingModal ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Ionicons name="download-outline" size={18} color="#111827" />
                )}
                <Text style={styles.confirmedShareText}>{isSharingModal ? 'Saving...' : 'Save Receipt'}</Text>
              </Pressable>
              <Pressable
                style={styles.confirmedHomeBtn}
                onPress={() => setConfirmedBookingModal(null)}
                accessibilityLabel="Back to home"
              >
                <Text style={styles.confirmedHomeText}>Back to Home</Text>
              </Pressable>
            </SafeAreaView>
          </View>
        </View>
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
      <FAQModal visible={showFAQModal} onClose={() => setShowFAQModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  heading: { fontSize: 13, fontWeight: '800', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 30 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickItem: { flex: 1 },
  locationBanner: { backgroundColor: '#FFF3EA', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#FDE0CC' },
  locationBannerLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase' },
  locationBannerValue: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  confirmedOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  confirmedSheet: { width: '100%', maxHeight: '92%', backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  confirmedHandle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginTop: 12, marginBottom: 16 },
  confirmedContent: { paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center' },
  confirmedIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E9FFF4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  confirmedTitle: { color: '#0F172A', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  confirmedSub: { color: '#64748B', fontSize: 14, fontWeight: '500', marginBottom: 20, textAlign: 'center' },
  confirmedPassWrapper: { width: '100%', borderRadius: 24, overflow: 'hidden' },
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
  confirmedActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F1F5F9' },
  confirmedShareBtn: { flex: 1, height: 52, borderRadius: 12, backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmedShareText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  confirmedHomeBtn: { flex: 1, height: 52, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  confirmedHomeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
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
