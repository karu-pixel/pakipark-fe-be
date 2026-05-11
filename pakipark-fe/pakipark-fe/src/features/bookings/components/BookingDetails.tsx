import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

export interface BookingDetail {
  id: string;
  reference: string;
  name: string;
  location: string;
  address: string;
  spot: string;
  date: string;
  time: string;
  vehicle: string;
  phone: string;
  status: 'active' | 'completed' | 'cancelled';
  type: string;
  amount: number;
  payment?: string;
}

interface BookingDetailsProps {
  booking: BookingDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (id: string) => void;
}

const STATUS_CFG = {
  active:    { label: 'Active',    dot: '#10B981', text: '#065F46', bg: '#D1FAE5' },
  completed: { label: 'Completed', dot: '#3B82F6', text: '#1E40AF', bg: '#DBEAFE' },
  cancelled: { label: 'Cancelled', dot: '#EF4444', text: '#991B1B', bg: '#FEE2E2' },
};

export function BookingDetails({ booking, isOpen, onClose, onCancel }: BookingDetailsProps) {
  const [exporting, setExporting] = useState<'idle' | 'loading' | 'done'>('idle');
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOpen) setExporting('idle');
  }, [isOpen]);

  useEffect(() => {
    if (exporting === 'loading') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [exporting, spinAnim]);

  const handleExport = () => {
    if (exporting !== 'idle') return;
    setExporting('loading');
    setTimeout(() => setExporting('done'), 2200);
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (!booking) return null;
  const st = STATUS_CFG[booking.status];

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />

        <View style={s.sheet}>
          <View style={s.header}>
            <View style={s.headerOrb} />
            <View style={s.headerTop}>
              <View style={s.receiptIconWrap}>
                <Ionicons name="receipt-outline" size={18} color="#fff" />
              </View>
              <View>
                <Text style={s.receiptLabel}>PAKIPARK RECEIPT</Text>
                <Text style={s.receiptRef}>{booking.reference}</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose} accessibilityLabel="Close">
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            <Text style={s.name}>{booking.name}</Text>
            <Text style={s.phone}>{booking.phone}</Text>

            <View style={[s.statusPill, { backgroundColor: st.bg }]}> 
              <View style={[s.statusDot, { backgroundColor: st.dot }]} />
              <Text style={[s.statusText, { color: st.text }]}>{st.label}</Text>
            </View>
          </View>

          <View style={s.tearRow}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={s.tearCircle} />
            ))}
          </View>

          <View style={s.body}>
            {[
              { icon: 'location-outline',  label: 'LOCATION',  value: booking.location  },
              { icon: 'calendar-outline',  label: 'DATE',      value: booking.date      },
              { icon: 'time-outline',      label: 'TIME SLOT', value: booking.time      },
              { icon: 'car-outline',       label: 'VEHICLE',   value: booking.vehicle   },
              { icon: 'card-outline',      label: 'PAYMENT',   value: booking.payment ?? 'GCash' },
            ].map((row) => (
              <View key={row.label} style={s.infoRow}>
                <View style={s.infoLeft}>
                  <Ionicons name={row.icon as any} size={15} color={colors.orange} />
                  <Text style={s.infoLabel}>{row.label}</Text>
                </View>
                <Text style={s.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.footer}>
            <View style={s.footerDivider} />
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={s.totalValue}>₱{booking.amount}</Text>
            </View>

            {exporting === 'loading' && (
              <View style={s.generatingBanner}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="reload-outline" size={16} color="#fff" />
                </Animated.View>
                <Text style={s.generatingText}>Generating receipt PDF...</Text>
              </View>
            )}

            {exporting === 'done' && (
              <View style={s.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={s.successText}>Receipt downloaded successfully!</Text>
              </View>
            )}

            <View style={s.footerBtns}>
              <TouchableOpacity style={s.closeFooterBtn} onPress={onClose} accessibilityLabel="Close">
                <Text style={s.closeFooterText}>CLOSE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.exportBtn, exporting === 'loading' && s.exportBtnLoading]}
                onPress={handleExport}
                accessibilityLabel="Export Receipt"
              >
                {exporting === 'loading' ? (
                  <>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="reload-outline" size={16} color="rgba(255,255,255,0.8)" />
                    </Animated.View>
                    <Text style={s.exportText}>EXPORTING...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color="#fff" />
                    <Text style={s.exportText}>EXPORT RECEIPT</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.64)',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },

  header: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#214767',
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 31,
    gap: 10,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  headerOrb: {
    position: 'absolute',
    top: -48,
    right: -34,
    width: 138,
    height: 138,
    borderRadius: 69,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 1,
  },
  receiptIconWrap: {
    width: 33, height: 33, borderRadius: 9,
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  receiptLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.62)', letterSpacing: 0.6 },
  receiptRef: { fontSize: 12, fontWeight: '900', color: '#fff' },
  closeBtn: {
    marginLeft: 'auto' as any,
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 25, fontWeight: '900', color: '#fff', marginTop: 8, zIndex: 1 },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.74)', fontWeight: '600', zIndex: 1 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
    marginTop: 7, zIndex: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '900' },

  tearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    marginTop: -9,
    marginHorizontal: -8,
    zIndex: 10,
    overflow: 'visible',
  },
  tearCircle: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#F3F4F6',
    paddingTop: 4,
    marginBottom: -8,
  },

  body: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 27,
    paddingTop: 23,
    paddingBottom: 16,
    gap: 18,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  infoLabel: { fontSize: 11, fontWeight: '900', color: '#6B7280', letterSpacing: 1.1 },
  infoValue: { fontSize: 14, fontWeight: '900', color: '#19364F', textAlign: 'right', flex: 1, marginLeft: spacing.md },

  footer: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 27,
    paddingTop: 20,
    paddingBottom: 26,
    gap: 18,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: -27,
    marginTop: -2,
  },
  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 15, fontWeight: '900', color: '#19364F', letterSpacing: 1.5 },
  totalValue: { fontSize: 26, fontWeight: '900', color: colors.orange },
  footerBtns: { flexDirection: 'row', gap: 10 },
  closeFooterBtn: {
    width: 89, height: 42, borderRadius: 12,
    borderWidth: 1, borderColor: '#DDE3EA',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  closeFooterText: { fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 1.7 },
  exportBtn: {
    flex: 1, height: 42, borderRadius: 12,
    backgroundColor: colors.orange,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.orange,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  exportBtnLoading: { backgroundColor: '#F9A96A' },
  exportText: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1.1 },

  generatingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.navy,
    borderRadius: 14, paddingHorizontal: spacing.lg, paddingVertical: 14,
  },
  generatingText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 14, paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  successText: { fontSize: 14, fontWeight: '700', color: '#065F46' },
});
