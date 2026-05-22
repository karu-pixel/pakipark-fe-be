import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(private supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.client;
  }

  async logTransaction(params: {
    bookingId?: any;
    userId?: string;
    reference?: string;
    transactionType?: string;
    paymentMethod?: string;
    amount: number;
    status?: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const bookingId = params.bookingId ?? null;
      const userId = params.userId ?? null;
      const reference = params.reference ?? null;
      const transactionType = params.transactionType ?? 'payment';
      const paymentMethod = params.paymentMethod ?? null;
      const amount = params.amount;
      const status = params.status ?? 'success';
      const description = params.description ?? null;
      const metadata = params.metadata ?? {};

      const isValidUuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

      if (transactionType === 'refund' || transactionType === 'partial_refund') {
        await this.client.schema('payment').from('refunds').insert({
          transaction_id: bookingId,
          user_id: userId,
          refund_amount: amount,
          reason: metadata.reason || description || null,
          status: 'processed',
        });
      } else {
        await this.client.schema('payment').from('payment_transactions').insert({
          reference_id: String(bookingId),
          user_id: userId,
          amount: amount,
          status: status === 'success' ? 'captured' : status,
          payment_method: paymentMethod || 'Cash on Site',
          source_service: 'pakipark',
        });
      }

      if (isValidUuid(bookingId) && isValidUuid(userId)) {
        const { error: resTxErr } = await this.client.schema('reservation').from('transaction_logs').insert({
          booking_id: bookingId,
          user_id: userId,
          type: transactionType,
          amount: amount,
          details: {
            reference,
            paymentMethod: paymentMethod || 'Cash on Site',
            status,
            description,
            ...metadata,
          },
        });
        if (resTxErr) {
          this.logger.warn(`reservation.transaction_logs write failed: ${resTxErr.message}`);
        } else {
          this.logger.log('Recorded reservation transaction inside reservation.transaction_logs table.');
        }
      } else {
        this.logger.warn(`Skipping reservation.transaction_logs write due to invalid UUIDs: bookingId=${bookingId}, userId=${userId}`);
      }
    } catch (err) {
      this.logger.warn(`TransactionLog write failed: ${errorMessage(err)}`);
    }
  }

  async logActivity(params: {
    userId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: any;
    description?: string | null;
    severity?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any>;
  }) {
    try {
      const { error } = await this.client.schema('partner').from('activity_logs').insert({
        admin_id: params.userId ?? null,
        action: params.action,
        target_type: params.entityType ?? null,
        target_id: params.entityId != null ? String(params.entityId) : null,
        details: {
          description: params.description ?? null,
          severity: params.severity ?? 'info',
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
          ...(params.metadata ?? {}),
        },
      });
      if (error) throw error;
    } catch (err) {
      this.logger.warn(`ActivityLog write failed: ${errorMessage(err)}`);
    }
  }

  logBookingCreated(params: { booking: any; userId: string; creatorId?: string }) {
    const { booking, userId, creatorId } = params;
    const ref = booking.reference || booking.ref;

    const promises = [
      this.logTransaction({
        bookingId: booking.id || parseInt(booking._id),
        userId,
        reference: ref,
        transactionType: 'payment',
        paymentMethod: booking.paymentMethod,
        amount: booking.amount,
        status: booking.paymentStatus === 'paid' ? 'success' : 'pending',
        description: `Booking created — ${ref}`,
        metadata: { spot: booking.spot, date: booking.date, timeSlot: booking.timeSlot },
      }),
      this.logActivity({
        userId,
        action: 'BOOKING_CREATED',
        entityType: 'Booking',
        entityId: booking.id || booking._id,
        description: `Booking ${ref} created for ${booking.date} ${booking.timeSlot}`,
        severity: 'info',
        metadata: {
          reference: ref,
          paymentMethod: booking.paymentMethod,
          amount: booking.amount,
          spot: booking.spot,
        },
      }),
    ];

    if (creatorId && String(creatorId) !== String(userId)) {
      promises.push(
        this.logActivity({
          userId: creatorId,
          action: 'ADMIN_BOOKING_CREATED',
          entityType: 'Booking',
          entityId: booking.id || booking._id,
          description: `You created booking ${ref} for a customer`,
          severity: 'info',
          metadata: {
            reference: ref,
            paymentMethod: booking.paymentMethod,
            amount: booking.amount,
            spot: booking.spot,
            customerId: userId,
          },
        }),
      );
    }

    Promise.all(promises).catch(() => {});
  }

  logBookingCancelled(params: { booking: any; userId: string; reason: string; refundAmount?: number; refundType?: string; isRefund?: boolean }) {
    const { booking, userId, reason, refundAmount = 0, refundType = 'none', isRefund = false } = params;
    const ref = booking.reference || booking.ref;

    Promise.all([
      isRefund && refundAmount > 0
        ? this.logTransaction({
            bookingId: booking.id || parseInt(booking._id),
            userId,
            reference: ref,
            transactionType: refundType === 'partial_refund' ? 'partial_refund' : 'refund',
            paymentMethod: booking.paymentMethod,
            amount: refundAmount,
            status: 'refunded',
            description: refundType === 'partial_refund'
              ? `50% partial refund for cancelled booking ${ref}`
              : `Full refund for cancelled booking ${ref}`,
            metadata: { reason, refundPct: refundType === 'partial_refund' ? 50 : 100, refundType, originalAmount: booking.amount },
          })
        : Promise.resolve(),
      this.logActivity({
        userId,
        action: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: booking.id || booking._id,
        description: `Booking ${ref} cancelled — ${reason || 'User cancelled'}`,
        severity: 'warning',
        metadata: { reference: ref, reason, refundAmount, refundType: refundType || 'none' },
      }),
    ]).catch(() => {});
  }

  logBookingCheckIn(params: { booking: any; adminId: string }) {
    const { booking, adminId } = params;
    this.logActivity({
      userId: adminId,
      action: 'BOOKING_CHECKIN',
      entityType: 'Booking',
      entityId: booking.id || booking._id,
      description: `Check-in recorded for ${booking.reference}`,
      severity: 'info',
      metadata: { reference: booking.reference, spot: booking.spot },
    }).catch(() => {});
  }

  logBookingCheckOut(params: { booking: any; adminId: string }) {
    const { booking, adminId } = params;
    this.logActivity({
      userId: adminId,
      action: 'BOOKING_CHECKOUT',
      entityType: 'Booking',
      entityId: booking.id || booking._id,
      description: `Check-out recorded for ${booking.reference}`,
      severity: 'info',
      metadata: { reference: booking.reference, spot: booking.spot },
    }).catch(() => {});
  }

  logBookingNoShow(params: { booking: any; adminId: string }) {
    const { booking, adminId } = params;
    this.logActivity({
      userId: adminId,
      action: 'BOOKING_NO_SHOW',
      entityType: 'Booking',
      entityId: booking.id || booking._id,
      description: `No-show flagged for ${booking.reference}`,
      severity: 'warning',
      metadata: { reference: booking.reference },
    }).catch(() => {});
  }
}
