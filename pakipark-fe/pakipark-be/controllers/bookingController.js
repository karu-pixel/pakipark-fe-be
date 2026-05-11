'use strict';
/**
 * bookingController.js
 * ====================
 * All reads use single-table lookups (no JOIN / no Sequelize include).
 * formatBooking reconstructs nested userId / vehicleId / locationId from
 * the snapshot columns stored on the booking row.
 */

const bookingService = require('../services/bookingService');
const { Booking, Location } = require('../models/index');
const { formatBooking }     = require('../utils/formatters');
const { logBookingCheckOut } = require('../services/logService');

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking({
      userId: req.user.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await bookingService.getUserBookings(req.user.id, { status, search, page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings (admin / teller)
const getAllBookings = async (req, res) => {
  try {
    const { status, search, date, locationId, page, limit } = req.query;
    const result = await bookingService.getAllBookings({ status, search, date, locationId, page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const isStaff = ['admin', 'teller', 'business_partner'].includes(req.user.role);

    // Single PK lookup — no JOIN
    const booking = await Booking.findOne({
      where: {
        id: parseInt(req.params.id),
        ...(!isStaff ? { userId: req.user.id } : {}),
      },
      raw: true,
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: formatBooking(booking) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user.id,
      req.body.reason
    );
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use: active | completed | cancelled | no_show',
      });
    }
    const dbStatus   = status === 'no_show' ? 'cancelled' : status;
    const cancelNote = status === 'no_show' ? 'No-show'   : 'Admin action';
    const booking    = await bookingService.updateBookingStatus(req.params.id, dbStatus, cancelNote);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /api/bookings/:id/checkout — teller check-out with billing
// Billing rules:
//   • First FREE_HOURS (2hrs) are included at no extra charge
//   • Every hour (or part thereof) BEYOND the free window is billed at RATE_PER_HOUR (₱15)
//   • Example: 2h 5min → 1 billable hour → ₱15
const checkOutBooking = async (req, res) => {
  try {
    const RATE_PER_HOUR = 15;  // ₱15 per overtime hour
    const FREE_HOURS    = 2;   // first 2 hours are free

    const booking = await Booking.findByPk(parseInt(req.params.id));
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot check out a booking with status '${booking.status}'`,
      });
    }

    const checkInAt    = booking.checkInAt ? new Date(booking.checkInAt) : new Date();
    const checkOutAt   = new Date();
    const elapsedMs    = Math.max(0, checkOutAt - checkInAt);
    const elapsedHrs   = elapsedMs / (1000 * 60 * 60);
    const overtimeHrs  = Math.max(0, elapsedHrs - FREE_HOURS);   // hours beyond the free window
    const billableHrs  = Math.ceil(overtimeHrs);                  // round up to next hour
    const finalAmount  = billableHrs * RATE_PER_HOUR;             // ₱0 if still within 2 hrs

    await booking.update({ status: 'completed', checkOutAt, finalAmount });

    // Release the parking spot back to availability
    if (booking.locationId) {
      await Location.increment('availableSpots', { by: 1, where: { id: booking.locationId } });
    }

    const updated   = await Booking.findByPk(booking.id);
    const formatted = formatBooking(updated.toJSON());
    logBookingCheckOut({ booking: formatted, adminId: req.user.id });

    const durationMins   = Math.round(elapsedMs / 60000);
    const overtimeMins   = Math.max(0, durationMins - FREE_HOURS * 60);
    res.json({
      success: true,
      data: {
        ...formatted,
        billing: {
          checkInAt:      checkInAt.toISOString(),
          checkOutAt:     checkOutAt.toISOString(),
          durationMins,
          durationLabel:  durationMins < 60
            ? `${durationMins} min`
            : `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`,
          freeHours:      FREE_HOURS,
          overtimeMins,
          overtimeLabel:  overtimeMins <= 0 ? 'None'
            : overtimeMins < 60 ? `${overtimeMins} min`
            : `${Math.floor(overtimeMins / 60)}h ${overtimeMins % 60}m`,
          ratePerHour:    RATE_PER_HOUR,
          billableHours:  billableHrs,
          finalAmount,
        },
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/slots/:locationId?date=YYYY-MM-DD
const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const slots = await bookingService.getAvailableSlots(req.params.locationId, date);
    res.json({ success: true, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  checkOutBooking,
  getAvailableSlots,
};
