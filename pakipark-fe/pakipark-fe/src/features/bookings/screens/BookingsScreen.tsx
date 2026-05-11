import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BookingDetails, type BookingDetail } from '@features/bookings/components/BookingDetails';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

type BookingStatus = 'active' | 'completed' | 'cancelled';
type FilterTab = 'all' | BookingStatus;

interface Booking {
  id: string;
  ref: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  date: string;
  time: string;
  vehicle: string;
  total: number;
  status: BookingStatus;
}

const INITIAL_BOOKINGS: Booking[] = [
  { id: '1', ref: 'PKP-2026-0001', name: 'Juan Dela Cruz', location: 'Ayala Center',       address: 'Ayala Ave, Makati',      phone: '+63 912 345 6789', date: 'March 15, 2026', time: '10:00 AM - 2:00 PM', vehicle: 'Toyota Vios (ABC 1234)',        total: 200, status: 'active'    },
  { id: '2', ref: 'PKP-2026-0002', name: 'Maria Santos',   location: 'SM North EDSA',      address: 'North Ave, Quezon City', phone: '+63 917 234 5678', date: 'March 15, 2026', time: '1:00 PM - 5:00 PM',  vehicle: 'Honda Civic (XYZ 7890)',        total: 180, status: 'active'    },
  { id: '3', ref: 'PKP-2026-0003', name: 'Pedro Reyes',    location: 'Robinsons Galleria',  address: 'EDSA, Quezon City',      phone: '+63 918 345 6789', date: 'March 14, 2026', time: '9:00 AM - 12:00 PM', vehicle: 'Mitsubishi Montero (DEF 4567)', total: 150, status: 'completed' },
  { id: '4', ref: 'PKP-2026-0004', name: 'Anna Lopez',     location: 'SM Mall of Asia',    address: 'Bay City, Pasay',        phone: '+63 919 456 7890', date: 'March 13, 2026', time: '2:00 PM - 6:00 PM',  vehicle: 'Ford Ranger (GHI 0123)',        total: 220, status: 'completed' },
];

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'active',    label: 'Active'    },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = {
    active:    { bg: '#F0FDF4', text: '#166534', dot: '#10B981', label: 'Active'    },
    completed: { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Completed' },
    cancelled: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Cancelled' },
  }[status];
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg }]}> 
      <View style={[s.badgeDot, { backgroundColor: cfg.dot }]} />
      <Text style={[s.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

export function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selected, setSelected] = useState<BookingDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filtered = bookings.filter((b) => filter === 'all' || b.status === filter);

  const openDetails = (b: Booking) => {
    setSelected({
      id: b.id, reference: b.ref, name: b.name,
      location: b.location, address: b.address,
      spot: b.ref.split('-')[2] ?? 'A-01',
      date: b.date, time: b.time, vehicle: b.vehicle,
      phone: b.phone,
      status: b.status, type: 'Fixed', amount: b.total,
      payment: 'GCash',
    });
    setDetailsOpen(true);
  };

  const handleCancel = (id: string) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  };

  return (
    <>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Booking Management</Text>
        <Text style={s.pageSubtitle}>View and manage all parking reservations</Text>

        <View style={s.filterRow}>
          <Ionicons name="filter-outline" size={16} color="#8FA0B4" />
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.map((b) => (
          <View key={b.id} style={s.card}>
            <View style={s.cardTopRow}>
              <View style={s.cardNameRow}>
                <Text style={s.cardName}>{b.name}</Text>
                <Text style={s.cardRef}> {b.ref}</Text>
              </View>
              <StatusBadge status={b.status} />
            </View>

            <View style={s.infoRow}><Ionicons name="location-outline" size={14} color={colors.orange} /><Text style={s.infoText}>{b.location}</Text></View>
            <View style={s.infoRow}><Ionicons name="call-outline" size={14} color="#8FA0B4" /><Text style={s.infoText}>{b.phone}</Text></View>
            <View style={s.divider} />
            <View style={s.infoRow}><View style={s.infoIconBubble}><Ionicons name="calendar-outline" size={14} color={colors.orange} /></View><Text style={s.infoText}>{b.date}</Text></View>
            <View style={s.infoRow}><View style={s.infoIconBubble}><Ionicons name="time-outline" size={14} color={colors.orange} /></View><Text style={s.infoText}>{b.time}</Text></View>
            <View style={s.infoRow}><View style={s.infoIconBubble}><Ionicons name="car-outline" size={14} color={colors.orange} /></View><Text style={s.infoText}>{b.vehicle}</Text></View>

            <View style={s.cardFooter}>
              <View>
                <Text style={s.totalLabel}>TOTAL</Text>
                <Text style={s.totalValue}>P{b.total}</Text>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.detailsBtn} onPress={() => openDetails(b)} accessibilityLabel="View Details">
                  <Text style={s.detailsBtnText}>View Details</Text>
                </TouchableOpacity>
                {b.status === 'active' && (
                  <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancel(b.id)} accessibilityLabel="Cancel">
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <BookingDetails
        booking={selected}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onCancel={handleCancel}
      />
    </>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md, paddingBottom: 32 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A2B3C' },
  pageSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginTop: -9 },

  filterRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  filterBtn: { minHeight: 25,
  borderRadius: 999,
  backgroundColor: '#EEF1F5',
  borderWidth: 1.5,
  borderColor: '#CBD5E1',
  paddingHorizontal: 15,
  paddingVertical: 6,
  alignItems: 'center',
  justifyContent: 'center'},
  filterBtnActive: {  backgroundColor: colors.orange,
  borderColor: colors.orange, },
  filterText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  filterTextActive: { color: '#fff' },

  card: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, gap: 10, shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 3, borderWidth: 1, borderColor: '#E5EAF1' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' },
  cardName: { fontSize: 15, fontWeight: '800', color: colors.navy },
  cardRef: { fontSize: 11, color: colors.muted, fontWeight: '500' },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconBubble: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF3EA', alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 13, color: colors.text, flexShrink: 1 },
  divider: { height: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: '#E7ECF2', marginVertical: 4 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  totalLabel: { fontSize: 10, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.navy },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  detailsBtn: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  detailsBtnText: { fontSize: 13, fontWeight: '700', color: colors.navy },
  cancelBtn: { borderWidth: 1.5, borderColor: '#FDA4AF', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
});
