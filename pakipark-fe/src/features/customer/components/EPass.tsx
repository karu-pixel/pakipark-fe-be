import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Booking } from '../types';

interface EPassProps {
  booking: Booking & {
    bookingId?: string;
    bookingPlate?: string;
    reviewDate?: string;
    durationHours?: number;
    paymentLabel?: string;
  };
  driverName: string;
}

const cleanText = (value: unknown) => String(value ?? '').trim();

const getBookingPlate = (booking: any) => {
  return cleanText(
    booking?.vehiclePlateNumber ||
    booking?.bookingPlate ||
    booking?.plateNumber ||
    booking?.plate_number ||
    booking?.plate ||
    booking?.vehiclePlate ||
    '',
  );
};

const getLocationName = (booking: any) => {
  const name = cleanText(
    booking?.locationName ||
    booking?.location ||
    booking?.parkingLocation ||
    '',
  );

  return name || 'Parking Location';
};

const getLocationAddress = (booking: any, fallbackName: string) => {
  return cleanText(
    booking?.locationAddress ||
    booking?.address ||
    booking?.parkingAddress ||
    '',
  ) || fallbackName;
};

export const EPass = forwardRef<View, EPassProps>(({ booking, driverName }, ref) => {
  if (!booking) return null;

  const bookingAny = booking as any;
  const plate = getBookingPlate(bookingAny);
  const locationName = getLocationName(bookingAny);
  const locationAddress = getLocationAddress(bookingAny, locationName);
  const bookingCode = cleanText(bookingAny.bookingId || bookingAny.reference || bookingAny.id || 'BKG');

  return (
    <View style={styles.confirmedPass} ref={ref} collapsable={false}>
      <View style={styles.confirmedPassTop}>
        <Text style={styles.confirmedPassKicker}>PAKIPARK E-PASS</Text>
        <Text style={styles.confirmedPassTitle}>{locationName}</Text>

        <View style={styles.confirmedLocationRow}>
          <Ionicons name="location" size={12} color="#AFC3D4" />
          <Text style={styles.confirmedLocation}>{locationAddress}</Text>
        </View>

        <View style={styles.confirmedIdPill}>
          <Text style={styles.confirmedIdLabel}>BOOKING ID</Text>
          <Text style={styles.confirmedIdValue}>{bookingCode}</Text>
        </View>

        <View style={styles.confirmedCarIcon}>
          <Ionicons name="car-sport" size={16} color="#F15A24" />
        </View>

        <View style={styles.wavyEdge}>
          {Array.from({ length: 24 }, (_, index) => (
            <View key={index} style={styles.waveDot} />
          ))}
        </View>
      </View>

      <View style={styles.confirmedPassBody}>
        <View style={styles.confirmedInfoGrid}>
          <View style={styles.confirmedInfo}>
            <Text style={styles.confirmedInfoLabel}>DRIVER NAME</Text>
            <Text style={styles.confirmedInfoValue}>{driverName || 'Guest User'}</Text>
          </View>

          <View style={styles.confirmedInfoRight}>
            <Text style={styles.confirmedInfoLabel}>PLATE NUMBER</Text>
            <Text style={styles.confirmedInfoAccent}>{plate || '---'}</Text>
          </View>

          <View style={styles.confirmedInfo}>
            <Text style={styles.confirmedInfoLabel}>DATE</Text>
            <Text style={styles.confirmedInfoValue}>
              {booking.reviewDate || booking.date}
            </Text>
          </View>

          <View style={styles.confirmedInfoRight}>
            <Text style={styles.confirmedInfoLabel}>TIME SLOT</Text>
            <Text style={styles.confirmedInfoValue}>{booking.time}</Text>
          </View>

          <View style={styles.confirmedInfo}>
            <Text style={styles.confirmedInfoLabel}>DURATION</Text>
            <Text style={styles.confirmedInfoValue}>{booking.durationHours ?? 1} hrs</Text>
          </View>

          <View style={styles.confirmedInfoRight}>
            <Text style={styles.confirmedInfoLabel}>AMOUNT PAID</Text>
            <Text style={styles.confirmedInfoAccent}>₱{booking.amount}</Text>
          </View>
        </View>

        <View style={styles.confirmedBarcodeBox}>
          <View style={styles.confirmedBarcode}>
            {Array.from({ length: 42 }, (_, index) => {
              let barWidth = 1;
              if (index % 5 === 0) {
                barWidth = 3;
              } else if (index % 2 === 0) {
                barWidth = 2;
              }

              return (
                <View
                  key={index}
                  style={[
                    styles.confirmedBarcodeLine,
                    { width: barWidth },
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.confirmedBarcodeMeta}>
            {bookingCode} - {plate || 'NO PLATE'}
          </Text>

          <Text style={styles.confirmedPresentText}>PRESENT TO ATTENDANT</Text>
        </View>

        <View style={styles.confirmedMiniRow}>
          <View style={styles.confirmedMiniCard}>
            <Text style={styles.confirmedMiniLabel}>PAYMENT</Text>
            <Text style={styles.confirmedMiniValue}>{booking.paymentLabel ?? booking.payment ?? 'GCash'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  confirmedPass: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmedPassTop: {
    backgroundColor: '#1A3D54',
    padding: 24,
    paddingBottom: 36,
    position: 'relative',
  },
  confirmedPassKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  confirmedPassTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F15A24',
    marginBottom: 8,
  },
  confirmedLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  confirmedLocation: {
    fontSize: 12,
    color: '#AFC3D4',
    fontWeight: '600',
  },
  confirmedIdPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmedIdLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#AFC3D4',
    textTransform: 'uppercase',
  },
  confirmedIdValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F15A24',
  },
  confirmedCarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 24,
    right: 24,
  },
  wavyEdge: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waveDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  confirmedPassBody: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  confirmedInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
    marginBottom: 24,
  },
  confirmedInfo: {
    width: '50%',
    gap: 4,
  },
  confirmedInfoRight: {
    width: '50%',
    gap: 4,
    alignItems: 'flex-end',
  },
  confirmedInfoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  confirmedInfoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3D54',
  },
  confirmedInfoAccent: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F15A24',
  },
  confirmedBarcodeBox: {
    backgroundColor: '#F4F6F8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmedBarcode: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'stretch',
    marginBottom: 10,
  },
  confirmedBarcodeLine: {
    backgroundColor: '#1A3D54',
    marginHorizontal: 0.5,
  },
  confirmedBarcodeMeta: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 2,
  },
  confirmedPresentText: {
    fontSize: 10,
    color: '#F15A24',
    fontWeight: '900',
    letterSpacing: 1,
  },
  confirmedMiniRow: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmedMiniCard: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  confirmedMiniTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmedMiniLabel: {
    fontSize: 9,
    color: '#F15A24',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  confirmedMiniValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A3D54',
  },
});