export const GRACE_PERIOD_MIN = 15;
export const CHECKOUT_BUFFER_MIN = 15;
export const CANCEL_PARTIAL_CUTOFF_MIN = 30;

export function parseTimeSlot(timeSlot: string): { startMin: number; endMin: number } {
  const match = String(timeSlot).match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return { startMin: 0, endMin: 0 };
  return {
    startMin: parseInt(match[1]) * 60 + parseInt(match[2]),
    endMin: parseInt(match[3]) * 60 + parseInt(match[4]),
  };
}

export function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function windowsOverlap(existingTimeSlot: string, requestedTimeSlot: string): boolean {
  const ex = parseTimeSlot(existingTimeSlot);
  const req = parseTimeSlot(requestedTimeSlot);
  const effectiveEnd = ex.endMin + CHECKOUT_BUFFER_MIN;
  return req.startMin < effectiveEnd && req.endMin > ex.startMin;
}

export function isNoShowBooking(booking: { date: string; timeSlot: string; status: string }): boolean {
  const { date, timeSlot, status } = booking;
  if (status !== 'upcoming') return false;
  if (date !== todayStr()) return false;
  const { startMin } = parseTimeSlot(timeSlot);
  return nowMinutes() > startMin + GRACE_PERIOD_MIN;
}

export interface TimingMeta {
  minutesUntilStart: number;
  minutesPastEnd: number;
  isToday: boolean;
  isArrivingSoon: boolean;
  isInGracePeriod: boolean;
  isNoShow: boolean;
  isOverstay: boolean;
  overstayMinutes: number;
  gracePeriodMinLeft: number;
  gracePeriodExpiresAt: string;
  expectedEndAt: string;
  timingState: string;
}

export function computeTimingMeta(booking: { date: string; timeSlot: string; status: string } | null): TimingMeta | null {
  if (!booking) return null;

  const { date, timeSlot, status } = booking;
  const { startMin, endMin } = parseTimeSlot(timeSlot);
  const isToday = date === todayStr();
  const now = nowMinutes();

  const minutesUntilStart = startMin - now;
  const minutesPastEnd = now - endMin;
  const graceExpiresMin = startMin + GRACE_PERIOD_MIN;

  const isArrivingSoon = isToday && status === 'upcoming' && minutesUntilStart > 0 && minutesUntilStart <= 60;
  const isInGracePeriod = isToday && status === 'upcoming' && minutesUntilStart <= 0 && now <= graceExpiresMin;
  const isNoShow = isToday && status === 'upcoming' && now > graceExpiresMin;
  const isOverstay = isToday && status === 'active' && minutesPastEnd > 0;

  let timingState = 'reserved';
  if (status === 'active') {
    timingState = isOverstay ? 'overstay' : 'occupied';
  } else if (status === 'upcoming') {
    if (isNoShow) timingState = 'no_show';
    else if (isInGracePeriod) timingState = 'in_grace_period';
    else if (isArrivingSoon) timingState = 'arriving_soon';
    else timingState = 'reserved';
  }

  return {
    minutesUntilStart,
    minutesPastEnd,
    isToday,
    isArrivingSoon,
    isInGracePeriod,
    isNoShow,
    isOverstay,
    overstayMinutes: isOverstay ? minutesPastEnd : 0,
    gracePeriodMinLeft: isInGracePeriod ? graceExpiresMin - now : 0,
    gracePeriodExpiresAt: minToHHMM(graceExpiresMin),
    expectedEndAt: minToHHMM(endMin),
    timingState,
  };
}

export function deriveDashboardStatus(slotDbStatus: string, booking: any, timingMeta: TimingMeta | null): string {
  if (slotDbStatus === 'maintenance') return 'maintenance';
  if (!booking || !timingMeta) return 'available';
  if (timingMeta.isNoShow) return 'no_show';
  return timingMeta.timingState;
}

export function computeRefundPolicy(booking: { date: string; timeSlot: string; status: string; amount: number; paymentStatus?: string }) {
  const { date, timeSlot, status } = booking;

  if (isNoShowBooking(booking)) {
    return {
      refundPct: 0,
      refundType: 'no_show',
      label: 'No Refund (No-Show)',
      minutesUntilStart: -999,
    };
  }

  if (status !== 'upcoming') {
    return {
      refundPct: 0,
      refundType: 'non_refundable',
      label: 'No Refund',
      minutesUntilStart: -999,
    };
  }

  const { startMin } = parseTimeSlot(timeSlot);
  const isToday = date === todayStr();

  if (!isToday) {
    return {
      refundPct: 100,
      refundType: 'full_refund',
      label: 'Full Refund (100%)',
      minutesUntilStart: 9999,
    };
  }

  const now = nowMinutes();
  const minutesUntilStart = startMin - now;

  if (minutesUntilStart <= 0) {
    return {
      refundPct: 0,
      refundType: 'no_refund',
      label: 'No Refund (Slot Started)',
      minutesUntilStart,
    };
  }

  if (minutesUntilStart < CANCEL_PARTIAL_CUTOFF_MIN) {
    return {
      refundPct: 50,
      refundType: 'partial_refund',
      label: '50% Refund',
      minutesUntilStart,
    };
  }

  return {
    refundPct: 100,
    refundType: 'full_refund',
    label: 'Full Refund (100%)',
    minutesUntilStart,
  };
}
