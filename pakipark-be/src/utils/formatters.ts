export const toPlain = (v: any) => (v ? (v.toJSON ? v.toJSON() : v) : null);

export const withId = (obj: any) =>
  obj ? { ...obj, _id: String(obj.id || obj._id || '') } : null;

export const formatBooking = (booking: any) => {
  if (!booking) return null;

  const b = toPlain(booking);

  const userId = b.userId || b.user_id || b.user?.id || null;
  const vehicleId = b.vehicleId || b.vehicle_id || b.vehicle?.id || null;
  const locationId = b.locationId || b.location_id || b.location?.id || null;
  const parkingSlotId =
    b.parkingSlotId ||
    b.parking_slot_id ||
    b.parkingSlot?.id ||
    null;

  const result: any = {
    ...b,

    id: String(b.id),
    _id: String(b.id),

    user_id: userId,
    vehicle_id: vehicleId,
    location_id: locationId,
    parking_slot_id: parkingSlotId,

    userId,
    vehicleId,
    locationId,
    parkingSlotId,

    reference: b.reference || '',
    barcode: b.barcode || '',

    spot: b.spot || b.slotLabel || '',
    date: b.date || '',
    timeSlot: b.timeSlot || b.time_slot || '',
    time: b.timeSlot || b.time_slot || b.time || '',

    type: b.type || 'Fixed',
    amount: Number(b.amount || b.totalAmount || 0),
    totalAmount: Number(b.totalAmount || b.amount || 0),

    paymentMethod: b.paymentMethod || b.payment_method || '',
    paymentStatus: b.paymentStatus || b.payment_status || '',
    payment_session_id: b.payment_session_id || b.paymentSessionId || null,
    paymentSessionId: b.paymentSessionId || b.payment_session_id || null,

    status: b.status || 'upcoming',

    checkedInByTeller:
      b.checkedInByTeller ??
      b.checked_in_by_teller ??
      false,

    checkInAt: b.checkInAt || b.check_in_at || null,
    checkOutAt: b.checkOutAt || b.check_out_at || null,

    vehiclePlate:
      b.vehiclePlate ||
      b.vehiclePlateNumber ||
      b.vehicle_plate ||
      '',
    vehiclePlateNumber:
      b.vehiclePlateNumber ||
      b.vehiclePlate ||
      b.vehicle_plate ||
      '',
    vehicleType: b.vehicleType || b.vehicle_type || '',
    vehicleColor: b.vehicleColor || b.vehicle_color || '',

    locationName: b.locationName || b.location_name || '',
    locationAddress: b.locationAddress || b.location_address || '',

    createdAt: b.createdAt || b.created_at || null,
    updatedAt: b.updatedAt || b.updated_at || null,
  };

  if (b.userName || b.userEmail || b.userPhone) {
    result.userId = {
      _id: String(userId || ''),
      id: userId,
      name: b.userName || '',
      email: b.userEmail || '',
      phone: b.userPhone || '',
    };
  } else if (b.user) {
    result.userId = withId(b.user);
  }

  if (b.vehicleBrand || b.vehiclePlate || b.vehiclePlateNumber) {
    result.vehicleId = {
      _id: String(vehicleId || ''),
      id: vehicleId,
      brand: b.vehicleBrand || '',
      model: b.vehicleModel || '',
      plateNumber:
        b.vehiclePlate ||
        b.vehiclePlateNumber ||
        '',
      plate_number:
        b.vehiclePlate ||
        b.vehiclePlateNumber ||
        '',
      type: b.vehicleType || '',
      color: b.vehicleColor || '',
    };
  } else if (b.vehicle) {
    result.vehicleId = withId(b.vehicle);
  }

  if (b.locationName || b.locationAddress) {
    result.locationId = {
      _id: String(locationId || ''),
      id: locationId,
      name: b.locationName || '',
      address: b.locationAddress || '',
    };
  } else if (b.location) {
    result.locationId = withId(b.location);
  }

  if (parkingSlotId || b.spot || b.parkingSlot) {
    result.parkingSlotId = {
      _id: String(parkingSlotId || ''),
      id: parkingSlotId,
      spot: b.spot || b.parkingSlot?.spot || b.parkingSlot?.slotNumber || '',
      slotNumber:
        b.parkingSlot?.slotNumber ||
        b.parkingSlot?.slot_number ||
        b.spot ||
        '',
    };
  }

  delete result.user;
  delete result.vehicle;
  delete result.location;
  delete result.parkingSlot;

  return result;
};

export const formatReview = (review: any) => {
  if (!review) return null;
  const r = toPlain(review);

  return {
    _id: String(r.id),
    id: String(r.id),
    userId: r.user_id || r.userId || null,
    locationId: r.location_id || r.locationId || null,
    bookingId: r.booking_id || r.bookingId || null,
    rating: r.rating ?? null,
    comment: r.comment || null,
    userName: r.userName || null,
    userAvatar: r.userAvatar || null,
    locationName: r.locationName || null,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
};