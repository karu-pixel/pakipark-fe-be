import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  TextInput,
  Share,
  Linking,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

import { EPass } from '../../customer/components/EPass';
import { COLORS } from '../../customer/data';
import { backendApi, getSavedUser } from '../../../lib/api';
import type { Booking } from '@features/customer/types';

type BookingStatus = 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled' | 'payment_pending' | 'no_show';

const FILTERS: BookingStatus[] = ['all', 'upcoming', 'active', 'completed', 'cancelled', 'payment_pending', 'no_show'];

const isReservationStatus = (status: string) => ['upcoming', 'payment_pending'].includes(String(status || '').toLowerCase());

function StatusChip({ status }: Readonly<{ status: string }>) {
  let config: { bg: string; color: string; label: string; icon: any } = { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled', icon: 'close-circle-outline' };
  
  const rawStatus = String(status || '').toLowerCase();
  if (rawStatus === 'active') {
    config = { bg: '#DDFBEA', color: '#14964B', label: 'Active', icon: 'checkmark-circle-outline' };
  } else if (rawStatus === 'completed') {
    config = { bg: '#E8ECF2', color: '#5B6678', label: 'Completed', icon: 'checkmark-circle-outline' };
  } else if (rawStatus === 'upcoming') {
    config = { bg: '#FFF3EA', color: '#F15A24', label: 'Upcoming', icon: 'time-outline' };
  } else if (rawStatus === 'payment_pending') {
    config = { bg: '#FEF3C7', color: '#B45309', label: 'Payment Pending', icon: 'wallet-outline' };
  } else if (rawStatus === 'no_show' || rawStatus === 'no show') {
    config = { bg: '#F3F4F6', color: '#374151', label: 'No Show', icon: 'alert-circle-outline' };
  }

  return (
    <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.statusChipText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// Checkout billing modal shown after checkOutBooking succeeds
function CheckoutModal({
  visible,
  data,
  onClose,
}: Readonly<{
  visible: boolean;
  data: { reference: string; totalCharged: number; overtimeHours: number; rate: number } | null;
  onClose: () => void;
}>) {
  if (!data) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.coOverlay}>
        <View style={styles.coCard}>
          <View style={styles.coIconWrap}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          </View>
          <Text style={styles.coTitle}>Check-Out Complete</Text>
          <Text style={styles.coRef}>{data.reference}</Text>
          
          <View style={styles.coDivider} />
          
          <View style={styles.coDetailsRow}>
            <Text style={styles.coDetailLabel}>Overtime Hours</Text>
            <Text style={styles.coDetailValue}>
              {data.overtimeHours > 0 ? `${data.overtimeHours.toFixed(1)} hrs` : 'None'}
            </Text>
          </View>
          <View style={styles.coDetailsRow}>
            <Text style={styles.coDetailLabel}>Hourly Rate</Text>
            <Text style={styles.coDetailValue}>₱{data.rate}/hr</Text>
          </View>
          <View style={styles.coDetailsRow}>
            <Text style={styles.coDetailLabel}>Total Charged</Text>
            <Text style={styles.coAmount}>₱{(data.totalCharged || 0).toLocaleString()}</Text>
          </View>

          <Pressable style={styles.coBtn} onPress={onClose}>
            <Text style={styles.coBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AdminBookingDetailsModal({
  booking,
  visible,
  onClose,
  onCheckIn,
  onCheckOut,
  onNoShow,
  actioningId,
}: Readonly<{
  booking: Booking | null;
  visible: boolean;
  onClose: () => void;
  onCheckIn: (id: string) => Promise<void>;
  onCheckOut: (id: string, ref: string) => Promise<void>;
  onNoShow: (id: string) => void;
  actioningId: string | null;
}>) {
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);

  const fetchLatestBooking = async (bookingId: string) => {
    try {
      const fresh = await backendApi.getBooking(bookingId);
      if (fresh) {
        setLatestBooking(fresh);
      }
    } catch (error) {
      console.warn('[AdminBookingDetailsModal] Failed to fetch latest booking:', error);
    }
  };

  useEffect(() => {
    if (visible && booking?.id) {
      setLatestBooking(booking);
      void fetchLatestBooking(booking.id);
    } else if (!visible) {
      setLatestBooking(null);
    }
  }, [visible, booking?.id]);

  const receiptRef = useRef<View>(null);
  const [isSharingModal, setIsSharingModal] = useState(false);

  if (!visible || !booking) return null;

  const currentBooking = latestBooking || booking;
  const plate = currentBooking.vehiclePlateNumber || (currentBooking as any).vehiclePlate || 'TBD';
  const driverName = (currentBooking as any).userName || (currentBooking as any).userId?.name || (currentBooking as any).customerName || 'Customer';

  const handleSaveReceipt = async () => {
    if (isSharingModal) return;
    setIsSharingModal(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save the receipt to your gallery.');
        setIsSharingModal(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      const uri = await (receiptRef.current as any).capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Receipt saved to your gallery!');
    } catch (err) {
      console.error('Error saving receipt:', err);
      Alert.alert('Error', 'Unable to save the receipt.');
    } finally {
      setIsSharingModal(false);
    }
  };

  const shareBooking = async () => {
    await Share.share({ message: `Parking booking at ${currentBooking.locationName || currentBooking.location} on ${currentBooking.date} (${currentBooking.time}) | Ref: ${currentBooking.reference}` });
  };

  const openMaps = async () => {
    const query = encodeURIComponent(`${currentBooking.locationName || currentBooking.location}, ${currentBooking.locationAddress || currentBooking.address}`);
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const isActioning = actioningId === currentBooking.id;

  let iconName: any = 'checkmark-circle-outline';
  let iconColor = '#00B977';
  let titleText = 'Booking Confirmed';
  let subText = `Reservation for ${plate} is active.`;
  let iconWrapBg = '#E9FFF4';

  if (currentBooking.status === 'completed') {
    iconName = 'checkmark-done-circle-outline';
    iconColor = '#5B6678';
    titleText = 'Booking Completed';
    subText = `Reservation for ${plate} is completed.`;
    iconWrapBg = '#EEF1F5';
  } else if (currentBooking.status === 'cancelled') {
    iconName = 'close-circle-outline';
    iconColor = '#DC2626';
    titleText = 'Booking Cancelled';
    subText = `Reservation for ${plate} was cancelled.`;
    iconWrapBg = '#FEE2E2';
  } else if ((currentBooking.status as string) === 'upcoming') {
    iconName = 'time-outline';
    iconColor = '#F15A24';
    titleText = 'Booking Upcoming';
    subText = `Reservation for ${plate} is scheduled.`;
    iconWrapBg = '#FFF3EA';
  } else if ((currentBooking.status as string) === 'payment_pending') {
    iconName = 'wallet-outline';
    iconColor = '#B45309';
    titleText = 'Payment Pending';
    subText = `Reservation for ${plate} is awaiting payment.`;
    iconWrapBg = '#FEF3C7';
  } else if ((currentBooking.status as string) === 'no_show') {
    iconName = 'alert-circle-outline';
    iconColor = '#6B7280';
    titleText = 'No Show';
    subText = `Customer did not arrive for ${plate}.`;
    iconWrapBg = '#F3F4F6';
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.confirmedOverlay}>
        <SafeAreaView style={styles.confirmedSheet}>
          <View style={styles.confirmedHandle} />

          <ScrollView
            contentContainerStyle={styles.confirmedContent}
            showsVerticalScrollIndicator={false}
            bounces
          >
            <View style={[styles.confirmedIconWrap, { backgroundColor: iconWrapBg }]}>
              <Ionicons name={iconName} size={30} color={iconColor} />
            </View>
            <Text style={styles.confirmedTitle}>{titleText}</Text>
            <Text style={styles.confirmedSub}>{subText}</Text>

            <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1 }} style={{ width: '100%' }}>
              <EPass
                booking={{
                  ...currentBooking,
                  paymentLabel: currentBooking.payment || 'GCash'
                }}
                driverName={driverName}
              />
            </ViewShot>
          </ScrollView>

          <View style={styles.confirmedActions}>
            {(isReservationStatus(currentBooking.status as string) || currentBooking.status === 'active') && (
              <Pressable
                style={[styles.confirmedBtnPrimary, { flex: 2, backgroundColor: '#2563EB' }, isActioning && { opacity: 0.7 }]}
                onPress={async () => {
                  await onCheckOut(currentBooking.id, currentBooking.reference);
                  onClose();
                }}
                disabled={isActioning}
              >
                {isActioning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmedBtnPrimaryText}>Check Out</Text>}
              </Pressable>
            )}

            <Pressable
              style={styles.confirmedShareBtn}
              onPress={handleSaveReceipt}
              disabled={isSharingModal}
            >
              {isSharingModal ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Ionicons name="download-outline" size={16} color="#111827" />
              )}
              <Text style={styles.confirmedShareText}>{isSharingModal ? 'Saving' : 'Save'}</Text>
            </Pressable>

            <Pressable
              style={styles.confirmedHomeBtn}
              onPress={onClose}
            >
              <Text style={styles.confirmedHomeText}>Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{ reference: string; totalCharged: number; overtimeHours: number; rate: number } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    getSavedUser().then((u) => {
      if (u?.role === 'admin' || u?.role === 'teller' || u?.role === 'business_partner') {
        setIsStaff(true);
      }
    });
  }, []);

  const fetchBookings = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const user = await getSavedUser();
      const staff = user?.role === 'admin' || user?.role === 'teller' || user?.role === 'business_partner';
      const data = staff ? await backendApi.getAllBookings() : await backendApi.getBookings();
      console.log('[ADMIN BOOKINGS RESPONSE]', data);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchBookings(); }, [fetchBookings]);

  const onRefresh = useCallback(() => { setRefreshing(true); void fetchBookings(false); }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const query = searchQuery.toLowerCase();
    const customerName = (b as any).userName || (b as any).userId?.name || (b as any).customerName || '';
    const matchesSearch =
      b.location.toLowerCase().includes(query) ||
      b.reference.toLowerCase().includes(query) ||
      customerName.toLowerCase().includes(query) ||
      (b.vehiclePlateNumber || '').toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const handleCheckIn = useCallback(async (id: string) => {
    setActioningId(id);
    try {
      await backendApi.updateBookingStatus(id, 'active');
      await fetchBookings(false);
      Alert.alert('Checked In', 'Booking is now marked as active.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Check-in failed');
    } finally {
      setActioningId(null);
    }
  }, [fetchBookings]);

  const handleCheckOut = useCallback(async (id: string, reference: string) => {
    setActioningId(id);
    try {
      const booking = bookings.find((item) => item.id === id);
      if (booking?.status !== 'active') {
        await backendApi.updateBookingStatus(id, 'cancelled', 'Cancelled by business partner');
        await fetchBookings(false);
        Alert.alert('Reservation Cancelled', 'The booking reservation has been cancelled.');
        return;
      }

      const result: any = await backendApi.checkOutBooking(id);
      await fetchBookings(false);
      setCheckoutData({
        reference,
        totalCharged:  result?.totalCharged  ?? result?.data?.totalCharged  ?? 0,
        overtimeHours: result?.overtimeHours ?? result?.data?.overtimeHours ?? 0,
        rate:          result?.ratePerHour   ?? result?.data?.ratePerHour   ?? 15,
      });
      setCheckoutOpen(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Check-out failed');
    } finally {
      setActioningId(null);
    }
  }, [bookings, fetchBookings]);

  const handleNoShow = useCallback((id: string) => {
    Alert.alert('Mark No-Show', 'Mark this booking as no-show?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark No-Show', style: 'destructive',
        onPress: async () => {
          setActioningId(id);
          try {
            await backendApi.updateBookingStatus(id, 'no_show', 'Customer did not arrive');
            await fetchBookings(false);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not update booking');
          } finally {
            setActioningId(null);
          }
        },
      },
    ]);
  }, [fetchBookings]);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#F15A24" />
        <Text style={styles.stateText}>Loading bookings…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
        <Text style={styles.stateTitle}>Could not load bookings</Text>
        <Text style={styles.stateText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void fetchBookings()}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F15A24']} tintColor="#F15A24" />
        }
      >
        <View>
          <Text style={styles.pageTitle}>{isStaff ? 'All Bookings' : 'My Bookings'}</Text>
          <Text style={styles.pageSubtitle}>Track and manage parking reservations</Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={COLORS.subtle} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by customer, plate, or reference..."
              style={styles.searchInput}
              placeholderTextColor={COLORS.subtle}
            />
          </View>
          <View style={styles.filterBar}>
            <Ionicons name="filter-outline" size={17} color="#8A9AB3" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={[styles.filterChip, filter === f ? styles.filterChipActive : null]}
                >
                  <Text style={[styles.filterText, filter === f ? styles.filterTextActive : null]}>
                    {f === 'all' ? 'All' : f === 'no_show' ? 'No Show' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="location-outline" size={32} color={COLORS.subtle} />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
            </View>
          ) : (
            filtered.map((booking) => {
              const customerName = (booking as any).userName || (booking as any).userId?.name || (booking as any).customerName || '';
              const isActioning = actioningId === booking.id;
              return (
                <Pressable
                  key={booking.id}
                  onPress={() => { setSelected(booking); setDetailsOpen(true); }}
                  style={({ pressed }) => [styles.bookingCard, pressed ? styles.bookingCardActive : null]}
                >
                  <View style={styles.bookingTop}>
                    <View style={styles.flexOne}>
                      <View style={styles.bookingTitleRow}>
                        <Text style={styles.bookingTitle}>{booking.locationName || booking.location}</Text>
                      </View>
                      <View style={styles.bookingAddressRow}>
                        <Ionicons name="location-outline" size={12} color={COLORS.subtle} />
                        <Text style={styles.bookingAddress}>{booking.locationAddress || booking.address}</Text>
                      </View>
                      <Text style={styles.bookingRef}>{booking.reference}</Text>
                    </View>
                    <StatusChip status={booking.status} />
                  </View>
                  <View style={styles.bookingDivider} />
                  <View style={styles.bookingDetailsGrid}>
                    <View style={styles.bookingDetailCell}>
                      <Text style={styles.bookingDetailLabel}>Customer</Text>
                      <Text style={styles.bookingDetailValue}>{customerName || 'Customer'}</Text>
                    </View>
                    <View style={styles.bookingDetailCell}>
                      <Text style={styles.bookingDetailLabel}>Spot</Text>
                      <Text style={styles.bookingDetailValue}>{booking.slotLabel || booking.spot}</Text>
                    </View>
                    <View style={styles.bookingDetailCell}>
                      <Text style={styles.bookingDetailLabel}>Date</Text>
                      <Text style={styles.bookingDetailValue}>{booking.date}</Text>
                    </View>
                    <View style={styles.bookingDetailCell}>
                      <Text style={styles.bookingDetailLabel}>Time</Text>
                      <Text style={styles.bookingDetailValue}>{booking.time}</Text>
                    </View>
                    <View style={styles.bookingVehicleRow}>
                      <Ionicons name="car-sport-outline" size={13} color={COLORS.primary} />
                      <Text style={styles.bookingVehicleText}>{booking.vehiclePlateNumber || 'Plate TBD'}</Text>
                    </View>
                  </View>
                  <View style={styles.bookingBottom}>
                    <View>
                      <Text style={styles.bookingTotalLabel}>Total ({booking.payment || 'GCash'})</Text>
                      <Text style={styles.bookingPrice}>{booking.price}</Text>
                    </View>
                    <View style={styles.bottomButtons}>
                      <Pressable onPress={() => { setSelected(booking); setDetailsOpen(true); }} style={styles.detailsInline}>
                        <Text style={styles.detailsInlineText}>Details</Text>
                      </Pressable>

                      {(isReservationStatus(booking.status as string) || booking.status === 'active') && (
                        <Pressable
                          style={[styles.actionInline, { backgroundColor: '#EAF3FF', borderColor: '#2563EB' }]}
                          onPress={() => handleCheckOut(booking.id, booking.reference)}
                          disabled={isActioning}
                        >
                          {isActioning ? <ActivityIndicator size="small" color="#2563EB" /> : <Text style={[styles.actionInlineText, { color: '#2563EB' }]}>Check Out</Text>}
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <AdminBookingDetailsModal
        booking={selected}
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onNoShow={handleNoShow}
        actioningId={actioningId}
      />

      <CheckoutModal
        visible={checkoutOpen}
        data={checkoutData}
        onClose={() => { setCheckoutOpen(false); setCheckoutData(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  flexOne: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 30, fontWeight: '800', color: COLORS.text },
  pageSubtitle: { fontSize: 14, color: COLORS.muted },
  
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, backgroundColor: '#F8FAFC' },
  stateTitle: { fontSize: 16, fontWeight: '700', color: '#1A2B3C' },
  stateText: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  retryBtn: { marginTop: 8, backgroundColor: '#F15A24', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  searchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E6EF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 13, borderWidth: 1, borderColor: '#DCE3EC', paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 13, color: COLORS.text },
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  filterRow: { gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#EEF1F5' },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterText: { color: COLORS.muted, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: COLORS.surface },

  list: { gap: 12 },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', padding: 28, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  emptyText: { fontSize: 12, color: COLORS.muted },

  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    padding: 16,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookingCardActive: {
    backgroundColor: '#FFFDFC',
    borderColor: '#FDBA8C',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  bookingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookingTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  bookingAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  bookingAddress: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  bookingRef: { fontSize: 10, color: COLORS.subtle, marginTop: 5, fontWeight: '700' },
  
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' },
  statusChipText: { fontSize: 11, fontWeight: '900' },
  
  bookingDivider: { height: 1, backgroundColor: '#EEF1F5' },
  bookingDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  bookingDetailCell: { width: '50%', gap: 4 },
  bookingDetailLabel: { color: '#99A6BA', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  bookingDetailValue: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  bookingVehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%' },
  bookingVehicleText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },

  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingTotalLabel: { color: '#99A6BA', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  bookingPrice: { fontSize: 23, fontWeight: '900', color: COLORS.primary },
  
  bottomButtons: { flexDirection: 'row', gap: 8 },
  detailsInline: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: '#D7E0EA', borderRadius: 999, paddingHorizontal: 17, paddingVertical: 9 },
  detailsInlineText: { color: COLORS.text, fontWeight: '900', fontSize: 12 },

  actionInline: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  actionInlineText: { fontSize: 12, fontWeight: '900' },

  // EPass Modal Sheet
  confirmedOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)', justifyContent: 'flex-end' },
  confirmedSheet: { maxHeight: '92%', width: '100%', backgroundColor: COLORS.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', marginTop: 'auto' },
  confirmedHandle: { alignSelf: 'center', width: 32, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB', marginTop: 10, marginBottom: 18 },
  confirmedContent: { paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center' },
  confirmedIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  confirmedTitle: { color: '#153B5C', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  confirmedSub: { color: '#8796AE', fontSize: 12, fontWeight: '700', marginBottom: 16 },
  confirmedActions: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderTopWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  
  confirmedBtnPrimary: { backgroundColor: '#F15A24', borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' },
  confirmedBtnPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  
  confirmedBtnSecondary: { backgroundColor: '#F1F5F9', borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' },
  confirmedBtnSecondaryText: { color: '#475569', fontSize: 13, fontWeight: '900' },

  confirmedShareBtn: { flex: 0.8, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmedShareText: { color: '#111827', fontSize: 12, fontWeight: '900' },
  confirmedHomeBtn: { flex: 0.8, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  confirmedHomeText: { color: '#111827', fontSize: 12, fontWeight: '900' },

  // Checkout modal
  coOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  coCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', gap: 12, width: '100%', maxWidth: 340, shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 },
  coIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  coTitle: { fontSize: 22, fontWeight: '900', color: '#1A2B3C' },
  coRef: { fontSize: 14, fontWeight: '800', color: '#F15A24' },
  coDivider: { height: 1, backgroundColor: '#E2E8F0', width: '100%', marginVertical: 8 },
  coDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  coDetailLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  coDetailValue: { fontSize: 13, color: '#1E293B', fontWeight: '800' },
  coAmount: { fontSize: 20, fontWeight: '900', color: '#1E3A8A' },
  coBtn: { width: '100%', backgroundColor: '#F15A24', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  coBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
