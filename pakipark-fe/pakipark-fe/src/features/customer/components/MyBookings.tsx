import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Modal, PanResponder, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '@features/customer/data';
import type { Booking, BookingStatus } from '@features/customer/types';
import { showMessage } from '@features/customer/utils';

function StatusChip({ status }: { status: Booking['status'] }) {
  const config =
    status === 'active'
      ? { bg: '#DDFBEA', color: '#14964B', label: 'Active', icon: 'checkmark-circle-outline' as const }
      : status === 'completed'
        ? { bg: '#E8ECF2', color: '#5B6678', label: 'Completed', icon: 'checkmark-circle-outline' as const }
        : { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled', icon: 'close-circle' as const };

  return (
    <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.statusChipText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function BookingDetailsModal({
  booking,
  visible,
  onClose,
  onCancel,
}: {
  booking: Booking | null;
  visible: boolean;
  onClose: () => void;
  onCancel: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const handlePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -18) {
          setExpanded(true);
        }

        if (gestureState.dy > 18) {
          setExpanded(false);
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setExpanded(false);
    }
  }, [visible]);

  if (!visible || !booking) return null;

  const plateMatch = booking.vehicle.match(/\(([^)]+)\)/);
  const plate = plateMatch ? plateMatch[1] : booking.vehicle;
  const vehicleLabel = booking.vehicle.replace(/\s*\([^)]*\)/, '');

  const shareReceipt = async () => {
    await Share.share({
      message: `PAKIPARK RECEIPT\nRef No.: ${booking.reference}\nLocation: ${booking.location}\nDate: ${booking.date}\nTime: ${booking.time}\nVehicle: ${booking.vehicle}\nAmount Paid: P${booking.amount}`,
    });
  };

  const shareBooking = async () => {
    await Share.share({ message: `My parking booking at ${booking.location} on ${booking.date} (${booking.time}) ? Ref: ${booking.reference}` });
  };

  const openMaps = async () => {
    const query = encodeURIComponent(`${booking.location}, ${booking.address}`);
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const openSupport = async () => {
    await Linking.openURL(`mailto:support@pakipark.com?subject=${encodeURIComponent(`Booking Support - ${booking.reference}`)}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <SafeAreaView style={[styles.detailSheet, expanded ? styles.detailSheetExpanded : styles.detailSheetPeek]}>
          <View style={styles.detailHandleHitArea} {...handlePanResponder.panHandlers}>
            <View style={styles.detailHandle} />
          </View>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>Booking Details</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={22} color={COLORS.subtle} /></Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.detailContent}
          onScroll={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;

            if (offsetY > 8) {
              setExpanded(true);
              return;
            }

            if (offsetY < -12) {
              setExpanded(false);
            }
          }}
          bounces
          scrollEventThrottle={16}
        >
          <View style={[styles.banner, booking.status === 'cancelled' ? styles.bannerCancelled : booking.status === 'completed' ? styles.bannerCompleted : null]}>
            <View>
              <Text style={styles.bannerLabel}>Status</Text>
              <Text style={styles.bannerValue}>{booking.status === 'active' ? 'Upcoming' : booking.status === 'completed' ? 'Completed' : 'Cancelled'}</Text>
            </View>
            <View>
              <Text style={styles.bannerLabel}>Ref No.</Text>
              <Text style={styles.bannerRef}>{booking.reference}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailTitleRow}>
              <Text style={styles.cardTitle}>{booking.location}</Text>
              <View style={[styles.detailTypeBadge, booking.type === 'Flexible' ? styles.detailTypeBadgeFlexible : null]}>
                <Text style={[styles.detailTypeBadgeText, booking.type === 'Flexible' ? styles.detailTypeBadgeFlexibleText : null]}>
                  {booking.type}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{booking.address}</Text>
            <View style={styles.miniGrid}>
              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Spot Number</Text>
                <Text style={styles.miniValue}>{booking.spot}</Text>
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Schedule</Text>
                <Text style={styles.cardInfo}>{booking.date}</Text>
                <Text style={styles.cardInfo}>{booking.time}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.detailCard, styles.flexOne]}>
              <Text style={styles.miniLabel}>Vehicle</Text>
              <Text style={styles.plate}>{plate}</Text>
              <Text style={styles.cardSub}>{vehicleLabel}</Text>
            </View>
            <View style={[styles.amountCard, styles.flexOne]}>
              <Text style={styles.amountLabel}>Amount Paid</Text>
              <Text style={styles.amountValue}>P{booking.amount}</Text>
              <Text style={styles.amountSuccess}>Transaction Success</Text>
            </View>
          </View>

          <View style={styles.entryPassCard}>
            <Text style={styles.entryPassTitle}>Digital Entry Pass</Text>
            <View style={styles.entryBarcodeBox}>
              <View style={styles.entryBarcode}>
                {Array.from({ length: 48 }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.entryBarcodeLine,
                      { width: index % 5 === 0 ? 3 : index % 2 === 0 ? 2 : 1 },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.entryBarcodeMeta}>{booking.reference}</Text>
            </View>
            <Text style={styles.entryPassHelp}>
              Scan this barcode at the parking kiosk or present it to the security personnel.
            </Text>
          </View>

          {booking.status === 'active' ? (
            <Pressable onPress={() => onCancel(booking.id)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <View style={styles.actionBar}>
          <Pressable onPress={() => void shareReceipt()} style={styles.actionButton}>
            <Ionicons name="download-outline" size={16} color={COLORS.muted} />
            <Text style={styles.actionText}>Receipt</Text>
          </Pressable>
          <Pressable onPress={() => void shareBooking()} style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={16} color={COLORS.muted} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
          <Pressable onPress={() => void openMaps()} style={styles.actionPrimary}>
            <Ionicons name="navigate" size={16} color={COLORS.surface} />
            <Text style={styles.actionPrimaryText}>Maps</Text>
          </Pressable>
          <Pressable onPress={() => void openSupport()} style={styles.actionButton}>
            <Ionicons name="headset-outline" size={16} color={COLORS.muted} />
            <Text style={styles.actionText}>Support</Text>
          </Pressable>
        </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function MyBookings({
  bookings,
  setBookings,
}: {
  bookings: Booking[];
  setBookings: (updater: (current: Booking[]) => Booking[]) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<BookingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesFilter = activeFilter === 'all' || booking.status === activeFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch = booking.location.toLowerCase().includes(query) || booking.reference.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, bookings, searchQuery]);

  const cancelBooking = (id: string) => {
    setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status: 'cancelled' } : booking)));
    setSelectedBooking((current) => (current?.id === id ? { ...current, status: 'cancelled' } : current));
    showMessage('Booking Updated', 'Booking cancelled successfully.');
  };

  const filters: BookingStatus[] = ['all', 'active', 'completed', 'cancelled'];

  return (
    <View style={styles.page}>
      <View>
        <Text style={styles.pageTitle}>My Bookings</Text>
        <Text style={styles.pageSubtitle}>Track and manage your parking reservations</Text>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={COLORS.subtle} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by location or reference..."
            style={styles.searchInput}
            placeholderTextColor={COLORS.subtle}
          />
        </View>
        <View style={styles.filterBar}>
          <Ionicons name="filter-outline" size={17} color="#8A9AB3" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filters.map((filter) => (
              <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filterChip, activeFilter === filter ? styles.filterChipActive : null]}>
                <Text style={[styles.filterText, activeFilter === filter ? styles.filterTextActive : null]}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <View style={styles.list}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="location-outline" size={32} color={COLORS.subtle} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <Pressable
              key={booking.id}
              onPress={() => { setSelectedBooking(booking); setDetailsOpen(true); }}
              style={({ pressed }) => [styles.bookingCard, pressed ? styles.bookingCardActive : null]}
            >
              <View style={styles.bookingTop}>
                <View style={styles.flexOne}>
                  <View style={styles.bookingTitleRow}>
                    <Text style={styles.bookingTitle}>{booking.location}</Text>
                  </View>
                  <View style={styles.bookingAddressRow}>
                    <Ionicons name="location-outline" size={12} color={COLORS.subtle} />
                    <Text style={styles.bookingAddress}>{booking.address}</Text>
                  </View>
                  <Text style={styles.bookingRef}>{booking.reference}</Text>
                </View>
                <StatusChip status={booking.status} />
              </View>
              <View style={styles.bookingDivider} />
              <View style={styles.bookingDetailsGrid}>
                <View style={styles.bookingDetailCell}>
                  <Text style={styles.bookingDetailLabel}>Spot</Text>
                  <Text style={styles.bookingDetailValue}>{booking.spot}</Text>
                </View>
                <View style={styles.bookingDetailCell}>
                  <Text style={styles.bookingDetailLabel}>Date</Text>
                  <Text style={styles.bookingDetailValue}>{booking.date}</Text>
                </View>
                <View style={styles.bookingDetailWide}>
                  <Text style={styles.bookingDetailLabel}>Time</Text>
                  <Text style={styles.bookingDetailValue}>{booking.time}</Text>
                </View>
                <View style={styles.bookingVehicleRow}>
                  <Ionicons name="car-sport-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.bookingVehicleText}>{booking.vehicle}</Text>
                </View>
              </View>
              <View style={styles.bookingBottom}>
                <View>
                  <Text style={styles.bookingTotalLabel}>Total</Text>
                  <Text style={styles.bookingPrice}>{booking.price}</Text>
                </View>
                <View style={styles.bottomButtons}>
                  {booking.status === 'active' ? (
                    <Pressable onPress={() => cancelBooking(booking.id)} style={styles.cancelInline}>
                      <Text style={styles.cancelInlineText}>Cancel</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => { setSelectedBooking(booking); setDetailsOpen(true); }} style={styles.detailsInline}>
                    <Text style={styles.detailsInlineText}>Details</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <BookingDetailsModal booking={selectedBooking} visible={detailsOpen} onClose={() => setDetailsOpen(false)} onCancel={cancelBooking} />
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  page: { gap: 16 },
  pageTitle: { fontSize: 30, fontWeight: '800', color: COLORS.text },
  pageSubtitle: { fontSize: 14, color: COLORS.muted },
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
  bookingDetailWide: { width: '100%', gap: 4 },
  bookingDetailLabel: { color: '#99A6BA', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  bookingDetailValue: { color: COLORS.text, fontSize: 13, fontWeight: '900' },
  bookingVehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%' },
  bookingVehicleText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  cardInfo: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingTotalLabel: { color: '#99A6BA', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  bookingPrice: { fontSize: 23, fontWeight: '900', color: COLORS.primary },
  bottomButtons: { flexDirection: 'row', gap: 8 },
  cancelInline: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: '#FDA4AF', borderRadius: 999, paddingHorizontal: 17, paddingVertical: 9 },
  cancelInlineText: { color: COLORS.danger, fontWeight: '900', fontSize: 12 },
  detailsInline: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: '#D7E0EA', borderRadius: 999, paddingHorizontal: 17, paddingVertical: 9 },
  detailsInlineText: { color: COLORS.text, fontWeight: '900', fontSize: 12 },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)', justifyContent: 'flex-end' },
  detailSheet: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  detailSheetPeek: { height: '58%' },
  detailSheetExpanded: { height: '92%' },
  detailHandleHitArea: { height: 24, alignItems: 'center', justifyContent: 'center' },
  detailHandle: { width: 42, height: 4, borderRadius: 999, backgroundColor: '#D1D5DB' },
  detailScreen: { flex: 1, backgroundColor: '#F8FAFC' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  detailContent: { padding: 16, gap: 14, paddingBottom: 22 },
  banner: { backgroundColor: COLORS.success, borderRadius: 22, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerCompleted: { backgroundColor: COLORS.navy },
  bannerCancelled: { backgroundColor: COLORS.danger },
  bannerLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  bannerValue: { fontSize: 24, fontWeight: '800', color: COLORS.surface },
  bannerRef: { fontSize: 14, fontWeight: '800', color: COLORS.surface, marginTop: 4 },
  detailCard: { backgroundColor: COLORS.surface, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 12 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  detailTypeBadge: { backgroundColor: '#EAF3FF', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4 },
  detailTypeBadgeFlexible: { backgroundColor: '#FFF3EA' },
  detailTypeBadgeText: { color: '#2563EB', fontSize: 9, fontWeight: '900' },
  detailTypeBadgeFlexibleText: { color: COLORS.primary },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.muted },
  miniGrid: { flexDirection: 'row', gap: 12 },
  miniCard: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, gap: 4 },
  miniLabel: { fontSize: 10, color: COLORS.subtle, fontWeight: '800', textTransform: 'uppercase' },
  miniValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  infoRow: { flexDirection: 'row', gap: 12 },
  plate: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  amountCard: { backgroundColor: COLORS.navy, borderRadius: 24, padding: 18, gap: 6 },
  amountLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' },
  amountValue: { fontSize: 28, fontWeight: '800', color: COLORS.surface },
  amountSuccess: { fontSize: 10, color: '#4ADE80', fontWeight: '800', textTransform: 'uppercase' },
  entryPassCard: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: '#DDE5EF', padding: 16, alignItems: 'center' },
  entryPassTitle: { color: '#9AA7B8', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 14 },
  entryBarcodeBox: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center' },
  entryBarcode: { width: '90%', height: 50, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: 1 },
  entryBarcodeLine: { height: 50, backgroundColor: '#153B5C' },
  entryBarcodeMeta: { color: '#A5AFBE', fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 8 },
  entryPassHelp: { color: '#8B99AD', fontSize: 11, fontWeight: '600', lineHeight: 17, textAlign: 'center', marginTop: 12 },
  cancelButton: { borderWidth: 2, borderColor: '#FECACA', borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  cancelButtonText: { color: COLORS.danger, fontWeight: '800', fontSize: 14 },
  actionBar: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border, padding: 16 },
  actionButton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  actionPrimary: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  actionText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  actionPrimaryText: { color: COLORS.surface, fontSize: 10, fontWeight: '700' },
});
