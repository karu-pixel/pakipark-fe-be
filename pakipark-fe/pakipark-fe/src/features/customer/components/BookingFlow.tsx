import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '@features/customer/data';
import type { Vehicle } from '@features/customer/types';

type Step = 'datetime' | 'payment' | 'confirmation' | 'success';
type SlotStatus = 'available' | 'taken' | 'unavailable';

type DateOption = {
  id: string;
  displayDay: string;
  displayDate: string;
  fullDisplay: string;
  fieldDisplay: string;
  year: number;
  month: number;
  day: number;
};

type TimeSlot = {
  label: string;
  value: string;
  status: SlotStatus;
};

const ALL_SLOTS: TimeSlot[] = [
  { label: '11 AM', value: '11:00', status: 'available' },
  { label: '12 PM', value: '12:00', status: 'available' },
  { label: '1 PM', value: '13:00', status: 'taken' },
  { label: '2 PM', value: '14:00', status: 'taken' },
  { label: '3 PM', value: '15:00', status: 'available' },
  { label: '4 PM', value: '16:00', status: 'available' },
  { label: '5 PM', value: '17:00', status: 'taken' },
  { label: '6 PM', value: '18:00', status: 'available' },
  { label: '7 PM', value: '19:00', status: 'available' },
  { label: '8 PM', value: '20:00', status: 'available' },
  { label: '9 PM', value: '21:00', status: 'available' },
  { label: '10 PM', value: '22:00', status: 'available' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const padDatePart = (value: number) => String(value).padStart(2, '0');

const getDateId = (year: number, month: number, day: number) => `${year}-${month}-${day}`;

const createDateOption = (date: Date): DateOption => {
  const month = MONTHS[date.getMonth()] ?? 'January';

  return {
    id: getDateId(date.getFullYear(), date.getMonth(), date.getDate()),
    displayDay: DAYS[date.getDay()] ?? 'Today',
    displayDate: date.getDate().toString(),
    fullDisplay: `${month} ${date.getDate()}, ${date.getFullYear()}`,
    fieldDisplay: `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`,
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
};

const parseDateInput = (input: string) => {
  const match = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return createDateOption(date);
};

const formatDateInput = (input: string) => {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length > 4) {
    return `${day}/${month}/${year}`;
  }

  if (digits.length > 2) {
    return `${day}/${month}`;
  }

  return day;
};

const generateDates = (): DateOption[] => {
  const dates: DateOption[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    dates.push(createDateOption(d));
  }

  return dates;
};

const UPCOMING_DATES = generateDates();
const FALLBACK_DATE = UPCOMING_DATES[0]!;
const TODAY_START = new Date(FALLBACK_DATE.year, FALLBACK_DATE.month, FALLBACK_DATE.day).getTime();
const MALL_HOURS_LABEL = '11 AM - 10 PM';
const gcashLogo = require('../../../../assets/images/gcash.png');
const mayaLogo = require('../../../../assets/images/maya.png');

type CalendarCell = {
  id: string;
  day: number;
  option: DateOption | null;
};

function formatHour(time: string) {
  const hour = parseInt(time.split(':')[0] || '0', 10);

  if (hour === 12) {
    return '12 PM';
  }

  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

function slotHour(slotValue: string) {
  return parseInt(slotValue.split(':')[0] || '0', 10);
}

function isPastDate(option: DateOption) {
  return new Date(option.year, option.month, option.day).getTime() < TODAY_START;
}

type BookingFlowProps = {
  location: string;
  address: string;
  cars: Vehicle[];
  onBack: () => void;
  onConfirm: (bookingDetails: any) => void;
};

export function BookingFlow({ location, address, cars, onBack, onConfirm }: BookingFlowProps) {
  const [step, setStep] = useState<Step>('datetime');
  const [selectedDate, setSelectedDate] = useState<DateOption>(FALLBACK_DATE);
  const [dateInput, setDateInput] = useState(FALLBACK_DATE.fieldDisplay);
  const [visibleCalendarMonth, setVisibleCalendarMonth] = useState(() => new Date(FALLBACK_DATE.year, FALLBACK_DATE.month, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [selectedCar] = useState<Vehicle | null>(cars[0] ?? null);
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [selectedWallet, setSelectedWallet] = useState<'gcash' | 'maya'>('gcash');
  const [selectedBank, setSelectedBank] = useState<'bdo' | 'bpi'>('bdo');

  const selectedVehicleLabel = selectedCar ? `${selectedCar.brand} ${selectedCar.model} (${selectedCar.plateNumber})` : 'Unknown Vehicle';
  const bookingPlate = selectedCar?.plateNumber ?? 'ABC 1234';
  const paymentLabel =
    paymentMethod === 'cash'
      ? 'Pay at Counter'
      : paymentMethod === 'bank'
        ? selectedBank === 'bdo'
          ? 'BDO Unibank'
          : 'BPI'
        : selectedWallet === 'gcash'
          ? 'GCash'
          : 'Maya';
  const reviewDate = `${selectedDate.year}-${padDatePart(selectedDate.month + 1)}-${padDatePart(selectedDate.day)}`;
  const visibleMonthLabel = `${MONTHS[visibleCalendarMonth.getMonth()] ?? 'Month'} ${visibleCalendarMonth.getFullYear()}`;
  const canGoToPreviousMonth = visibleCalendarMonth.getFullYear() > FALLBACK_DATE.year || visibleCalendarMonth.getMonth() > FALLBACK_DATE.month;
  const canGoToNextMonth = true;
  const calendarCells = useMemo(() => {
    const year = visibleCalendarMonth.getFullYear();
    const month = visibleCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (CalendarCell | null)[] = Array.from({ length: firstDay }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const id = getDateId(year, month, day);
      const option = createDateOption(new Date(year, month, day));

      cells.push({ id, day, option });
    }

    while (cells.length < 42) {
      cells.push(null);
    }

    return cells;
  }, [visibleCalendarMonth]);

  const calculateHours = () => {
    if (!startTime || !endTime) {
      return 0;
    }

    return Math.max(1, slotHour(endTime) - slotHour(startTime));
  };

  const totalAmount = calculateHours() * 50;
  const canContinue = Boolean(startTime && endTime && slotHour(startTime) < slotHour(endTime));
  const selectedTimeRange = canContinue ? `${formatHour(startTime || '11:00')} -> ${formatHour(endTime || '22:00')}` : '';
  const handleSlotPress = (slot: TimeSlot) => {
    if (slot.status !== 'available') {
      return;
    }

    if (!startTime || (startTime && endTime)) {
      setStartTime(slot.value);
      setEndTime(null);
      return;
    }

    if (slotHour(slot.value) <= slotHour(startTime)) {
      setStartTime(slot.value);
      setEndTime(null);
      return;
    }

    setEndTime(slot.value);
  };

  const handleDateInputChange = (value: string) => {
    setDateInput(formatDateInput(value));
  };

  const commitTypedDate = () => {
    const parsedDate = parseDateInput(dateInput);

    if (!parsedDate) {
      setDateInput(selectedDate.fieldDisplay);
      return selectedDate;
    }

    if (isPastDate(parsedDate)) {
      setDateInput(selectedDate.fieldDisplay);
      return selectedDate;
    }

    setSelectedDate(parsedDate);
    setDateInput(parsedDate.fieldDisplay);
    setVisibleCalendarMonth(new Date(parsedDate.year, parsedDate.month, 1));
    return parsedDate;
  };

  const handleNext = () => {
    if (step === 'datetime') {
      if (!canContinue) {
        return;
      }

      setStep('payment');
      return;
    }

    if (step === 'payment') {
      setStep('confirmation');
    }
  };

  const handleConfirmPay = () => {
    handleFinish();
  };

  const handleFinish = () => {
    const safeStart = startTime || '11:00';
    const safeEnd = endTime || '22:00';

    onConfirm({
      location,
      address: address || `${location} Area`,
      spot: `P-${Math.floor(Math.random() * 90) + 10}`,
      date: selectedDate.fullDisplay,
      time: `${formatHour(safeStart)} - ${formatHour(safeEnd)}`,
      vehicle: selectedVehicleLabel,
      type: 'Fixed',
      price: `P${totalAmount}`,
      amount: totalAmount,
      bookingId: 'PKP-Z3CX1V',
      bookingPlate,
      durationHours: calculateHours(),
      paymentLabel,
      reviewDate,
    });
  };

  const renderDateTimeStep = () => (
    <View style={styles.dateTimeScreen}>
      <View style={styles.prototypeHeader}>
        <Pressable onPress={onBack} style={styles.prototypeBackButton} accessibilityLabel="Back to parking locations">
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.prototypeContent} showsVerticalScrollIndicator={false}>
        <View style={styles.bookingPill}>
          <Ionicons name="car-sport-outline" size={15} color={COLORS.primary} />
          <Text style={styles.bookingPillText}>Booking for: {bookingPlate}</Text>
        </View>

      <View style={styles.heroBlock}>
        <Text style={styles.heroTitle}>
          Plan your <Text style={styles.heroAccent}>parking</Text> ahead of time.
        </Text>
        <Text style={styles.heroSubtitle}>Secure your slot in seconds at {location}.</Text>
      </View>

      <View style={styles.prototypeCard}>
        <Text style={styles.prototypeLabel}>Arrival Date</Text>
        <View style={styles.dateField}>
          <TextInput
            value={dateInput}
            onChangeText={handleDateInputChange}
            onBlur={commitTypedDate}
            onSubmitEditing={commitTypedDate}
            keyboardType="numbers-and-punctuation"
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#9CA3AF"
            style={styles.dateInput}
            accessibilityLabel="Type arrival date"
          />
          <Pressable
            onPress={() => {
              const activeDate = commitTypedDate();
              setVisibleCalendarMonth(new Date(activeDate.year, activeDate.month, 1));
              setShowDatePicker(true);
            }}
            style={styles.dateIconButton}
            accessibilityLabel="Open arrival date calendar"
          >
            <Ionicons name="calendar-clear-outline" size={18} color="#9CA3AF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.prototypeCard}>
        <View style={styles.slotHeader}>
          <Text style={styles.prototypeLabel}>Select Time Slot</Text>
          <Text style={styles.slotHint}>Tap check-in {'->'} check-out</Text>
        </View>

          <View style={styles.legendRow}>
            {[
              { label: 'Selected', color: COLORS.navy },
            { label: 'Range', color: '#F6C7AF' },
            { label: 'Taken', color: '#FFD9DD' },
            { label: 'Unavailable', color: '#E5E7EB' },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>

          {canContinue ? (
            <View style={styles.selectedRangeSummary}>
              <View style={styles.selectedRangeLeft}>
                <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                <Text style={styles.selectedRangeText}>{selectedTimeRange}</Text>
              </View>
              <Text style={styles.selectedRangePrice}>₱{totalAmount}</Text>
            </View>
          ) : null}

        <View style={styles.slotGrid}>
          {ALL_SLOTS.map((slot) => {
            const hour = slotHour(slot.value);
            const isEndpoint = slot.value === startTime || slot.value === endTime;
            const isInRange = Boolean(startTime && endTime && hour > slotHour(startTime) && hour < slotHour(endTime));
            const isTaken = slot.status === 'taken';
            const isUnavailable = slot.status === 'unavailable';

            return (
              <Pressable
                key={slot.value}
                disabled={isTaken || isUnavailable}
                onPress={() => handleSlotPress(slot)}
                style={[
                  styles.slotButton,
                  isEndpoint ? styles.slotButtonSelected : null,
                  isInRange ? styles.slotButtonRange : null,
                  isTaken ? styles.slotButtonTaken : null,
                  isUnavailable ? styles.slotButtonUnavailable : null,
                ]}
                accessibilityLabel={`${slot.label} ${slot.status}`}
              >
                {isTaken ? <Text style={styles.takenLabel}>Taken</Text> : null}
                <Text
                  style={[
                    styles.slotText,
                    isEndpoint ? styles.slotTextSelected : null,
                    isInRange ? styles.slotTextRange : null,
                    isTaken ? styles.slotTextTaken : null,
                    isUnavailable ? styles.slotTextUnavailable : null,
                  ]}
                >
                  {slot.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

          <View style={styles.rateBanner}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.rateText}>
              Rate: P50 / hr - Booking window: {MALL_HOURS_LABEL}
            </Text>
          </View>

        </View>

      </ScrollView>

      <View style={styles.dateTimeActions}>
        <Pressable
          disabled={!canContinue}
          style={[styles.prototypeCta, canContinue ? styles.prototypeCtaReady : styles.prototypeCtaDisabled]}
          onPress={handleNext}
          accessibilityLabel="Select a time range to continue"
        >
          <Text style={styles.prototypeCtaText}>
            {canContinue ? `Next: Payment - ₱${totalAmount}` : 'Select a Time Range to Continue'}
          </Text>
        </Pressable>
      </View>

      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Arrival Date</Text>
              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerClose}
                accessibilityLabel="Close date picker"
              >
                <Ionicons name="close" size={20} color={COLORS.muted} />
              </Pressable>
            </View>

            <View style={styles.calendarMonthRow}>
              <Pressable
                disabled={!canGoToPreviousMonth}
                onPress={() =>
                  setVisibleCalendarMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                  )
                }
                style={[styles.calendarArrow, !canGoToPreviousMonth ? styles.calendarArrowDisabled : null]}
                accessibilityLabel="Previous month"
              >
                <Ionicons name="chevron-back" size={20} color={canGoToPreviousMonth ? COLORS.text : '#CBD5E1'} />
              </Pressable>
              <Text style={styles.calendarMonthTitle}>{visibleMonthLabel}</Text>
              <Pressable
                disabled={!canGoToNextMonth}
                onPress={() =>
                  setVisibleCalendarMonth(
                    (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                  )
                }
                style={[styles.calendarArrow, !canGoToNextMonth ? styles.calendarArrowDisabled : null]}
                accessibilityLabel="Next month"
              >
                <Ionicons name="chevron-forward" size={20} color={canGoToNextMonth ? COLORS.text : '#CBD5E1'} />
              </Pressable>
            </View>

            <View style={styles.calendarWeekRow}>
              {DAYS.map((day) => (
                <Text key={day} style={styles.calendarWeekday}>
                  {day.slice(0, 2)}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarCells.map((cell, index) => {
                if (!cell) {
                  return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                }

                const active = selectedDate.id === cell.id;
                const selectable = Boolean(cell.option && !isPastDate(cell.option));

                return (
                  <Pressable
                    key={cell.id}
                    disabled={!selectable}
                    style={[
                      styles.calendarDayCell,
                      active ? styles.calendarDayCellActive : null,
                      !selectable ? styles.calendarDayCellDisabled : null,
                    ]}
                    onPress={() => {
                      if (!cell.option) {
                        return;
                      }

                      setSelectedDate(cell.option);
                      setDateInput(cell.option.fieldDisplay);
                      setShowDatePicker(false);
                    }}
                    accessibilityLabel={cell.option ? `Select ${cell.option.fullDisplay}` : `Unavailable date ${cell.day}`}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        active ? styles.calendarDayTextActive : null,
                        !selectable ? styles.calendarDayTextDisabled : null,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderPaymentStep = () => (
    <View style={styles.paymentScreen}>
      <View style={styles.prototypeHeader}>
        <Pressable onPress={() => setStep('datetime')} style={styles.prototypeBackButton} accessibilityLabel="Back to date and time">
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.paymentContent} showsVerticalScrollIndicator={false}>
        <View style={styles.paymentSummaryCard}>
          <Text style={styles.paymentSummaryTitle}>Order Summary</Text>

          <View style={styles.summaryRows}>
            <View style={styles.summaryRow}>
              <Text style={styles.paymentSummaryLabel}>Vehicle</Text>
              <Text style={styles.paymentSummaryValue}>{bookingPlate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.paymentSummaryLabel}>Time Slot</Text>
              <Text style={styles.paymentSummaryValue}>
                {formatHour(startTime || '11:00')} - {formatHour(endTime || '22:00')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.paymentSummaryLabel}>Duration</Text>
              <Text style={styles.paymentSummaryValue}>{calculateHours()} hrs</Text>
            </View>
          </View>

          <View style={styles.summaryTotalRow}>
            <Text style={styles.paymentTotalLabel}>Total Amount</Text>
            <Text style={styles.paymentTotalValue}>₱{totalAmount}</Text>
          </View>
        </View>

        <View style={styles.paymentMethodCard}>
          <View style={styles.paymentMethodHeader}>
            <View style={styles.paymentMethodHeaderIcon}>
              <Ionicons name="card-outline" size={15} color={COLORS.primary} />
            </View>
            <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          </View>

          {[
            {
              id: 'cash',
              title: 'Pay at Counter',
              subtitle: 'Cash payment upon arrival',
              icon: 'cash-outline',
              tint: '#14B981',
              bg: '#E9FFF4',
            },
            {
              id: 'ewallet',
              title: 'E-Wallet',
              subtitle: 'GCash or Maya',
              icon: 'phone-portrait-outline',
              tint: '#4F8CFF',
              bg: '#EEF5FF',
            },
            {
              id: 'bank',
              title: 'Bank Transfer',
              subtitle: 'Secure Direct Deposit',
              icon: 'business-outline',
              tint: '#6366F1',
              bg: '#F0F0FF',
            },
          ].map((method) => {
            const active = paymentMethod === method.id;

            return (
              <View key={method.id}>
                <Pressable
                  style={[
                    styles.paymentOption,
                    active ? styles.paymentOptionActive : null,
                    active && (method.id === 'ewallet' || method.id === 'bank') ? styles.paymentOptionAttached : null,
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                  accessibilityLabel={`Select ${method.title}`}
                >
                  <View style={[styles.paymentOptionIcon, { backgroundColor: method.bg }]}>
                    <Ionicons name={method.icon as any} size={18} color={method.tint} />
                  </View>
                  <View style={styles.paymentOptionText}>
                    <Text style={styles.paymentOptionTitle}>{method.title}</Text>
                    <Text style={styles.paymentOptionSubtitle}>{method.subtitle}</Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                  )}
                </Pressable>

                {method.id === 'ewallet' && active ? (
                  <View style={styles.walletDropdown}>
                    {[
                      { id: 'gcash' as const, label: 'GCash', logo: gcashLogo, bg: '#F4F8FF' },
                      { id: 'maya' as const, label: 'Maya', logo: mayaLogo, bg: '#F1FFF8' },
                    ].map((wallet, index) => {
                      const walletActive = selectedWallet === wallet.id;

                      return (
                        <Pressable
                          key={wallet.id}
                          style={[
                            styles.walletOption,
                            walletActive ? styles.dropdownOptionActive : null,
                            index === 0 ? styles.dropdownOptionFirst : null,
                            index === 1 ? styles.dropdownOptionLast : null,
                          ]}
                          onPress={() => setSelectedWallet(wallet.id)}
                          accessibilityLabel={`Select ${wallet.label}`}
                        >
                          <View style={[styles.walletLogo, { backgroundColor: wallet.bg }]}>
                            <Image source={wallet.logo} style={styles.walletLogoImage} resizeMode="contain" />
                          </View>
                          <Text style={styles.walletLabel}>{wallet.label}</Text>
                          {walletActive ? <Ionicons name="checkmark" size={18} color={COLORS.primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {method.id === 'bank' && active ? (
                  <View style={styles.walletDropdown}>
                    {[
                      { id: 'bdo' as const, label: 'BDO Unibank' },
                      { id: 'bpi' as const, label: 'BPI' },
                    ].map((bank, index) => {
                      const bankActive = selectedBank === bank.id;

                      return (
                        <Pressable
                          key={bank.id}
                          style={[
                            styles.bankOption,
                            bankActive ? styles.dropdownOptionActive : null,
                            index === 0 ? styles.dropdownOptionFirst : null,
                            index === 1 ? styles.dropdownOptionLast : null,
                          ]}
                          onPress={() => setSelectedBank(bank.id)}
                          accessibilityLabel={`Select ${bank.label}`}
                        >
                          <Text style={styles.bankLabel}>{bank.label}</Text>
                          {bankActive ? <Ionicons name="checkmark" size={18} color={COLORS.primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}

          <View style={styles.secureFooter}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
            <View style={styles.secureCopy}>
              <View style={styles.secureTitleRow}>
                <Text style={styles.secureTitle}>PakiPark SecurePay</Text>
                <Text style={styles.encryptedPill}>Encrypted</Text>
              </View>
              <Text style={styles.secureText}>Payments are processed through 256-bit SSL secure layers.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.paymentActions}>
        <Pressable style={styles.paymentBackButton} onPress={() => setStep('datetime')} accessibilityLabel="Back">
          <Text style={styles.paymentBackText}>Back</Text>
        </Pressable>
        <Pressable style={styles.reviewButton} onPress={handleNext} accessibilityLabel="Review reservation">
          <Text style={styles.reviewButtonText}>Review Reservation</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderConfirmationStep = () => (
    <View style={styles.reviewScreen}>
      <View style={styles.prototypeHeader}>
        <Pressable onPress={() => setStep('payment')} style={styles.prototypeBackButton} accessibilityLabel="Back to payment">
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.reviewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewHero}>
          <Text style={styles.reviewTitle}>
            Confirmation <Text style={styles.reviewTitleAccent}>Review</Text>
          </Text>
          <Text style={styles.reviewSubtitle}>Final summary before you confirm.</Text>
        </View>

        <View style={styles.reviewSummaryCard}>
          {[
            { label: 'Location', value: location },
            { label: 'Date', value: reviewDate },
            { label: 'Time', value: `${formatHour(startTime || '11:00')} - ${formatHour(endTime || '22:00')}` },
            { label: 'Vehicle', value: bookingPlate || '---' },
            { label: 'Payment', value: paymentLabel },
          ].map((item) => (
            <View key={item.label} style={styles.reviewSummaryRow}>
              <Text style={styles.reviewSummaryLabel}>{item.label}</Text>
              <Text style={styles.reviewSummaryValue}>{item.value}</Text>
            </View>
          ))}

          <View style={styles.reviewTotalRow}>
            <Text style={styles.reviewTotalLabel}>Total Amount</Text>
            <Text style={styles.reviewTotalValue}>₱{totalAmount}</Text>
          </View>
        </View>

        <View style={styles.reviewSecureCard}>
          <View style={styles.reviewSecureHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
            <View style={styles.secureCopy}>
              <View style={styles.secureTitleRow}>
                <Text style={styles.secureTitle}>PakiPark SecurePay</Text>
                <Text style={styles.encryptedPill}>Encrypted</Text>
              </View>
              <Text style={styles.reviewSecureText}>
                256-bit SSL. By confirming you agree to the booking policy.
              </Text>
            </View>
          </View>

          <View style={styles.priceBreakdown}>
            <Text style={styles.breakdownTitle}>Price Breakdown</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Parking ({calculateHours()} hrs x ₱50)</Text>
              <Text style={styles.breakdownAmount}>₱{totalAmount}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Service Fee</Text>
              <Text style={styles.freeText}>Free</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownDueLabel}>Total Due</Text>
              <Text style={styles.breakdownDueAmount}>₱{totalAmount}</Text>
            </View>
          </View>

          <View style={styles.payingBanner}>
            <View style={styles.payingDot} />
            <Text style={styles.payingText}>Paying via {paymentLabel}</Text>
          </View>

          <View style={styles.graceBanner}>
            <Ionicons name="information-circle-outline" size={14} color="#98A5B8" />
            <Text style={styles.graceText}>
              15-min grace period. Non-refundable within 2 hrs of arrival. Present E-Pass to attendant on entry.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.paymentActions}>
        <Pressable style={styles.paymentBackButton} onPress={() => setStep('payment')} accessibilityLabel="Back">
          <Text style={styles.paymentBackText}>Back</Text>
        </Pressable>
        <Pressable style={styles.confirmPayButton} onPress={handleConfirmPay} accessibilityLabel="Confirm and pay">
          <Text style={styles.reviewButtonText}>Confirm & Pay ₱{totalAmount}</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderSuccessStep = () => (
    <Modal visible transparent animationType="slide" onRequestClose={handleFinish}>
      <View style={styles.successScreen}>
        <View style={styles.successSheet}>
        <View style={styles.successHandle} />
        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle-outline" size={30} color="#00B977" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSub}>Reservation for {bookingPlate} is all set.</Text>

          <View style={styles.epassCard}>
            <View style={styles.epassHeader}>
              <View>
                <Text style={styles.epassKicker}>PakiPark E-Pass</Text>
                <Text style={styles.epassTitle}>Fixed Slot</Text>
                <View style={styles.epassLocationRow}>
                  <Ionicons name="location-outline" size={12} color="#AFC3D4" />
                  <Text style={styles.epassLocation}>{location}</Text>
                </View>
                <View style={styles.bookingIdPill}>
                  <Text style={styles.bookingIdLabel}>Booking ID</Text>
                  <Text style={styles.bookingIdValue}>PKP-Z3CX1V</Text>
                </View>
              </View>
              <View style={styles.epassCarIcon}>
                <Ionicons name="car-sport-outline" size={16} color={COLORS.primary} />
              </View>
            </View>

            <View style={styles.ticketCutRow}>
              {Array.from({ length: 26 }, (_, index) => (
                <View key={index} style={styles.ticketCutDot} />
              ))}
            </View>

            <View style={styles.epassBody}>
              <View style={styles.epassGrid}>
                <View style={styles.epassInfo}>
                  <Text style={styles.epassInfoLabel}>Driver Name</Text>
                  <Text style={styles.epassInfoValue}>Guest User</Text>
                </View>
                <View style={styles.epassInfoRight}>
                  <Text style={styles.epassInfoLabel}>Plate Number</Text>
                  <Text style={styles.epassPlateValue}>{bookingPlate}</Text>
                </View>
                <View style={styles.epassInfo}>
                  <Text style={styles.epassInfoLabel}>Date</Text>
                  <Text style={styles.epassInfoValue}>{reviewDate}</Text>
                </View>
                <View style={styles.epassInfoRight}>
                  <Text style={styles.epassInfoLabel}>Time Slot</Text>
                  <Text style={styles.epassInfoValue}>
                    {formatHour(startTime || '11:00')} - {formatHour(endTime || '22:00')}
                  </Text>
                </View>
                <View style={styles.epassInfo}>
                  <Text style={styles.epassInfoLabel}>Duration</Text>
                  <Text style={styles.epassInfoValue}>{calculateHours()} hrs</Text>
                </View>
                <View style={styles.epassInfoRight}>
                  <Text style={styles.epassInfoLabel}>Amount Paid</Text>
                  <Text style={styles.epassPlateValue}>₱{totalAmount}</Text>
                </View>
              </View>

              <View style={styles.barcodeBox}>
                <View style={styles.barcode}>
                  {Array.from({ length: 44 }, (_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.barcodeLine,
                        { width: index % 5 === 0 ? 3 : index % 2 === 0 ? 2 : 1 },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.barcodeMeta}>PKP-Z3CX1V - {bookingPlate}</Text>
                <Text style={styles.presentText}>Present to Attendant</Text>
              </View>

              <View style={styles.epassBottomRow}>
                <View style={styles.epassMiniCard}>
                  <View style={styles.epassMiniTitleRow}>
                    <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.epassMiniLabel}>Duration</Text>
                  </View>
                  <Text style={styles.epassMiniValue}>{calculateHours()} Hours Reserved</Text>
                </View>
                <View style={styles.epassMiniCard}>
                  <Text style={styles.epassMiniLabel}>Payment</Text>
                  <Text style={styles.epassMiniValue}>{paymentLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.successActions}>
          <Pressable style={styles.shareButton} accessibilityLabel="Share booking">
            <Ionicons name="share-social-outline" size={18} color="#111827" />
            <Text style={styles.shareButtonText}>Share</Text>
          </Pressable>
          <Pressable style={styles.backHomeButton} onPress={handleFinish} accessibilityLabel="Back to home">
            <Text style={styles.backHomeText}>Back to Home</Text>
          </Pressable>
        </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {step === 'datetime' ? renderDateTimeStep() : null}
      {step === 'payment' ? renderPaymentStep() : null}
      {step === 'confirmation' || step === 'success' ? renderConfirmationStep() : null}
      {step === 'success' ? renderSuccessStep() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  dateTimeScreen: { flex: 1, backgroundColor: COLORS.background },
  prototypeContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
    gap: 16,
  },
  prototypeHeader: {
    height: 60,
    paddingHorizontal: 24,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prototypeBackButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingPill: {
    alignSelf: 'flex-start',
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  bookingPillText: { color: '#07325A', fontSize: 12, fontWeight: '900' },
  heroBlock: { gap: 8 },
  heroTitle: {
    color: '#153B5C',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  heroAccent: { color: COLORS.primary },
  heroSubtitle: { color: '#8796AE', fontSize: 14, fontWeight: '500' },
  prototypeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDF0F4',
    shadowColor: '#1E3D5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  prototypeLabel: {
    color: '#9BA7BD',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  dateField: {
    width: '100%',
    height: 54,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#D2D2D2',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dateFieldText: { color: COLORS.navy, fontSize: 14, fontWeight: '800' },
  dateInput: { flex: 1, color: COLORS.navy, fontSize: 14, fontWeight: '800', paddingVertical: 0 },
  dateIconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
  },
  datePickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  datePickerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  datePickerClose: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calendarArrowDisabled: { opacity: 0.45 },
  calendarMonthTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  calendarWeekRow: { flexDirection: 'row', height: 28, alignItems: 'center' },
  calendarWeekday: { width: `${100 / 7}%`, textAlign: 'center', color: COLORS.subtle, fontSize: 10, fontWeight: '900' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  calendarDayCellActive: { backgroundColor: COLORS.primary },
  calendarDayCellDisabled: { opacity: 0.4 },
  calendarDayText: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  calendarDayTextActive: { color: COLORS.surface },
  calendarDayTextDisabled: { color: '#AAB2C0' },
  slotHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  slotHint: { color: '#8E99AE', fontSize: 10, fontWeight: '600' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#667085', fontSize: 9, fontWeight: '600' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  slotButton: {
    width: '31%',
    minWidth: 93,
    height: 57,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: '#E8EBF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotButtonSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  slotButtonRange: { backgroundColor: '#FFF6F0', borderColor: '#F4C7AE' },
  slotButtonTaken: { backgroundColor: '#FFF0F0', borderColor: '#FFC6C8' },
  slotButtonUnavailable: { backgroundColor: '#F4F5F7', borderColor: '#E4E7EC' },
  takenLabel: {
    color: '#FF6B6B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  slotText: { color: '#07325A', fontSize: 13, fontWeight: '900' },
  slotTextSelected: { color: COLORS.surface },
  slotTextRange: { color: COLORS.primary },
  slotTextTaken: { color: '#FF4F59' },
  slotTextUnavailable: { color: '#A9B0BD' },
  rateBanner: {
    minHeight: 32,
    borderRadius: 16,
    backgroundColor: '#FFF6ED',
    marginTop: 32,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateText: { flex: 1, color: '#07325A', fontSize: 11, fontWeight: '800' },
  selectedRangeSummary: {
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: '#F4F6F9',
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectedRangeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedRangeText: { color: '#082C4E', fontSize: 13, fontWeight: '900' },
  selectedRangePrice: { color: COLORS.primary, fontSize: 13, fontWeight: '900' },
  prototypeCta: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  dateTimeActions: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
  },
  prototypeCtaReady: { backgroundColor: COLORS.primary },
  prototypeCtaDisabled: { backgroundColor: '#F3BE9E', opacity: 0.8 },
  prototypeCtaText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 18, gap: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  paymentScreen: { flex: 1, backgroundColor: COLORS.background },
  paymentContent: { padding: 20, paddingBottom: 12, gap: 14 },
  paymentSummaryCard: {
    backgroundColor: '#234766',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  paymentSummaryTitle: { color: COLORS.surface, fontSize: 18, fontWeight: '900', marginBottom: 18 },
  summaryRows: { gap: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  paymentSummaryLabel: { color: '#BDD0E0', fontSize: 14, fontWeight: '700' },
  paymentSummaryValue: { color: COLORS.surface, fontSize: 15, fontWeight: '900' },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    marginTop: 18,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentTotalLabel: { color: '#9FB5C8', fontSize: 13, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  paymentTotalValue: { color: COLORS.primary, fontSize: 30, fontWeight: '900' },
  paymentMethodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDF0F4',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentMethodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  paymentMethodHeaderIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3EA',
  },
  paymentMethodTitle: { color: '#082C4E', fontSize: 16, fontWeight: '900' },
  paymentOption: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9EEF5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionActive: { borderColor: COLORS.primary, backgroundColor: '#FFFDFC' },
  paymentOptionAttached: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  paymentOptionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  paymentOptionText: { flex: 1 },
  paymentOptionTitle: { color: '#082C4E', fontSize: 13, fontWeight: '900' },
  paymentOptionSubtitle: { color: '#7D8BA1', fontSize: 10, fontWeight: '700', marginTop: 3 },
  walletDropdown: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.primary,
    marginBottom: 10,
    backgroundColor: COLORS.surface,
  },
  walletOption: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  dropdownOptionActive: { backgroundColor: '#FAFCFF' },
  dropdownOptionFirst: { marginTop: 4 },
  dropdownOptionLast: { marginBottom: 4, borderBottomWidth: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  walletLogo: { width: 34, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  walletLogoImage: { width: 26, height: 18, borderRadius: 4 },
  walletLabel: { flex: 1, color: '#082C4E', fontSize: 13, fontWeight: '900' },
  bankOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  bankLabel: { flex: 1, color: '#082C4E', fontSize: 13, fontWeight: '800' },
  secureFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  secureCopy: { flex: 1 },
  secureTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureTitle: { color: '#082C4E', fontSize: 11, fontWeight: '900' },
  encryptedPill: {
    color: '#10A969',
    backgroundColor: '#EAFBF2',
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  secureText: { color: '#98A5B8', fontSize: 8, fontWeight: '700', marginTop: 3 },
  paymentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
  },
  paymentBackButton: {
    width: 68,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBackText: { color: '#111827', fontSize: 12, fontWeight: '900' },
  reviewButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#234766',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  reviewScreen: { flex: 1, backgroundColor: COLORS.background },
  reviewContent: { padding: 20, paddingBottom: 16 },
  reviewHero: { marginBottom: 12 },
  reviewTitle: { color: '#153B5C', fontSize: 22, fontWeight: '900', lineHeight: 28 },
  reviewTitleAccent: { color: COLORS.primary },
  reviewSubtitle: { color: '#8796AE', fontSize: 12, fontWeight: '600', marginTop: 3 },
  reviewSummaryCard: {
    backgroundColor: '#234766',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 12,
  },
  reviewSummaryRow: {
    minHeight: 36,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewSummaryLabel: { color: '#AFC3D4', fontSize: 13, fontWeight: '700' },
  reviewSummaryValue: { flex: 1, color: COLORS.surface, fontSize: 13, fontWeight: '900', textAlign: 'right' },
  reviewTotalRow: {
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewTotalLabel: { color: '#9FB5C8', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  reviewTotalValue: { color: COLORS.primary, fontSize: 30, fontWeight: '900' },
  reviewSecureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EDF0F4',
  },
  reviewSecureHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reviewSecureText: { color: '#7285A0', fontSize: 10, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  priceBreakdown: {
    backgroundColor: '#F4F6FA',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  breakdownTitle: { color: '#082C4E', fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  breakdownLabel: { color: '#8A98AD', fontSize: 13, fontWeight: '700' },
  breakdownAmount: { color: '#082C4E', fontSize: 13, fontWeight: '900' },
  freeText: { color: '#08A35B', fontSize: 13, fontWeight: '900' },
  breakdownDivider: { height: 1, backgroundColor: '#DDE4EE' },
  breakdownDueLabel: { color: '#334155', fontSize: 14, fontWeight: '900' },
  breakdownDueAmount: { color: COLORS.primary, fontSize: 14, fontWeight: '900' },
  payingBanner: {
    minHeight: 36,
    borderRadius: 13,
    backgroundColor: '#FFF6ED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  payingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  payingText: { color: '#082C4E', fontSize: 13, fontWeight: '800' },
  graceBanner: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  graceText: { flex: 1, color: '#8A98AD', fontSize: 10, lineHeight: 15, fontWeight: '700' },
  confirmPayButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successScreen: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'flex-end',
    paddingHorizontal: 6,
  },
  successSheet: {
    height: '84%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  successHandle: {
    alignSelf: 'center',
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginTop: 10,
    marginBottom: 18,
  },
  successContent: { paddingHorizontal: 14, paddingBottom: 14, alignItems: 'center' },
  successIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E9FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: { color: '#153B5C', fontSize: 18, fontWeight: '900', marginBottom: 3 },
  successSub: { color: '#8796AE', fontSize: 12, fontWeight: '700', marginBottom: 16 },
  epassCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  epassHeader: {
    minHeight: 126,
    backgroundColor: '#234766',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  epassKicker: { color: '#8CA6BC', fontSize: 8, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  epassTitle: { color: COLORS.primary, fontSize: 20, fontWeight: '900', marginTop: 12 },
  epassLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  epassLocation: { color: '#AFC3D4', fontSize: 10, fontWeight: '800' },
  bookingIdPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#315570',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },
  bookingIdLabel: { color: '#AFC3D4', fontSize: 7, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  bookingIdValue: { color: COLORS.primary, fontSize: 10, fontWeight: '900' },
  epassCarIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#315570',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCutRow: {
    height: 12,
    marginTop: -6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  ticketCutDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.surface },
  epassBody: { padding: 18, paddingTop: 14 },
  epassGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 13 },
  epassInfo: { width: '50%' },
  epassInfoRight: { width: '50%', alignItems: 'flex-end' },
  epassInfoLabel: { color: '#C5CDD8', fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  epassInfoValue: { color: '#153B5C', fontSize: 12, fontWeight: '900', marginTop: 5 },
  epassPlateValue: { color: COLORS.primary, fontSize: 12, fontWeight: '900', marginTop: 5 },
  barcodeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  barcode: { height: 36, flexDirection: 'row', alignItems: 'stretch', gap: 1 },
  barcodeLine: { height: 36, backgroundColor: '#0F172A' },
  barcodeMeta: { color: '#A5AFBE', fontSize: 7, fontWeight: '900', letterSpacing: 1.2, marginTop: 8 },
  presentText: { color: COLORS.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  epassBottomRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  epassMiniCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12 },
  epassMiniTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  epassMiniLabel: { color: COLORS.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  epassMiniValue: { color: '#153B5C', fontSize: 11, fontWeight: '900', marginTop: 6 },
  successActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
  },
  shareButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: { color: '#111827', fontSize: 13, fontWeight: '900' },
  backHomeButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHomeText: { color: COLORS.surface, fontSize: 13, fontWeight: '900' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.subtle, textTransform: 'uppercase', marginBottom: 12 },
  summaryCard: { backgroundColor: COLORS.navy, padding: 20, borderRadius: 16 },
  summaryTitle: { color: COLORS.surface, fontSize: 18, fontWeight: '800', marginBottom: 15 },
  summaryDetail: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8, fontWeight: '500' },
  summaryTotal: {
    color: COLORS.surface,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentCardActive: { borderColor: COLORS.primary },
  paymentText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '700', color: COLORS.text },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  nextButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  nextButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '800' },
  confirmContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  confirmIcon: { marginBottom: 20 },
  confirmTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  confirmSub: { fontSize: 15, color: COLORS.muted, textAlign: 'center', marginBottom: 30 },
  confirmDetails: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 30,
  },
  confirmDetailText: { fontSize: 15, color: COLORS.text, fontWeight: '600', marginBottom: 10 },
  homeButton: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  homeButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '800' },
});
