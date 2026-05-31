import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.client;
  }

  async notify(userId: string, type: string, title: string, body: string, entityType: string | null = null, entityId: any = null) {
    try {
      let dbType = type;
      const validTypes = ['delivery', 'parking', 'system', 'promo'];
      if (!validTypes.includes(dbType)) {
        if (dbType && (dbType.startsWith('booking') || dbType === 'no_show' || dbType.includes('discount'))) {
          dbType = 'parking';
        } else {
          dbType = 'system';
        }
      }

      const { error } = await this.client.schema('notifications').from('notifications').insert({
        user_id: userId,
        type: dbType,
        title,
        message: body,
        source_service: 'pakipark',
      });
      if (error) throw error;
    } catch (err) {
      this.logger.warn(`Notification Write failed: ${errorMessage(err)}`);
    }
  }

  notifyBookingConfirmed(userId: string, booking: any) {
    return this.notify(
      userId,
      'booking_confirmed',
      '🎉 Booking Confirmed!',
      `Your parking slot ${booking.spot} at ${booking.locationName} is reserved for ${booking.date}, ${booking.timeSlot}. Reference: ${booking.reference}`,
      'Booking',
      booking.id || booking._id,
    );
  }

  notifyBookingCancelled(userId: string, booking: any, reason?: string) {
    return this.notify(
      userId,
      'booking_cancelled',
      '❌ Booking Cancelled',
      `Your booking ${booking.reference} for ${booking.date}, ${booking.timeSlot} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`.trim(),
      'Booking',
      booking.id || booking._id,
    );
  }

  notifyBookingReminder(userId: string, booking: any) {
    const { timeSlot, locationName, spot, reference, id, _id } = booking;
    return this.notify(
      userId,
      'booking_reminder',
      '⏰ Parking Reminder',
      `Your slot ${spot} at ${locationName} starts in 30 minutes (${timeSlot}). Reference: ${reference}`,
      'Booking',
      id || _id,
    );
  }

  notifyNoShow(userId: string, booking: any) {
    return this.notify(
      userId,
      'no_show',
      '⚠️ Reservation Forfeited',
      `Your booking ${booking.reference} for ${booking.date}, ${booking.timeSlot} was forfeited — no check-in was detected within the 15-minute grace period.`,
      'Booking',
      booking.id || booking._id,
    );
  }

  notifyDiscountApproved(userId: string) {
    return this.notify(
      userId,
      'discount_approved',
      '🎁 Discount Approved!',
      'Your PWD/Senior Citizen discount has been approved. You will now receive 20% off every parking reservation automatically.',
      'User',
      userId,
    );
  }

  notifyDiscountRejected(userId: string, reason?: string) {
    return this.notify(
      userId,
      'discount_rejected',
      '❌ Discount Request Rejected',
      `Your discount ID was not approved. ${reason || 'Please upload a clearer, valid PWD or Senior Citizen ID.'}`,
      'User',
      userId,
    );
  }

  notifyRegistrationRejected(userId: string, reason?: string) {
    return this.notify(
      userId,
      'registration_rejected',
      '❌ Registration Rejected',
      `Your business partner registration was rejected. ${reason || 'Please contact support for more information.'}`,
      'User',
      userId,
    );
  }

  notifyPartnerNewBooking(partnerId: string, booking: any) {
    return this.notify(
      partnerId,
      'booking_confirmed',
      '🆕 New Booking Received',
      `A new booking (${booking.reference}) has been made for ${booking.spot} at ${booking.locationName} by ${booking.userName}.`,
      'Booking',
      booking.id || booking._id,
    );
  }

  notifyPartnerCancellation(partnerId: string, booking: any, reason?: string) {
    return this.notify(
      partnerId,
      'booking_cancelled',
      '⚠️ Booking Cancelled',
      `Booking ${booking.reference} for ${booking.spot} at ${booking.locationName} was cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      'Booking',
      booking.id || booking._id,
    );
  }

  notifyPartnerOccupancy(partnerId: string, locationName: string, occupancyPct: number) {
    return this.notify(
      partnerId,
      'system',
      '📈 Occupancy Update',
      `${locationName} is now ${occupancyPct}% full.`,
      'Location',
      null,
    );
  }

  notifySystem(userId: string, title: string, body: string) {
    return this.notify(userId, 'system', title, body, null, null);
  }
}
