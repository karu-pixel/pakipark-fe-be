import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

import { SupabaseService } from '../supabase/supabase.service';
import { formatBooking } from '../utils/formatters';
import {
  computeRefundPolicy,
  computeTimingMeta,
  isNoShowBooking,
  windowsOverlap,
} from '../utils/time-utils';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type RequestWithUser = Request & {
  user?: any;
  accessToken?: string;
  body: any;
  query: any;
  params: any;
  file?: UploadedFile;
  files?: UploadedFile[] | Record<string, UploadedFile[]>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const phoneEmail = (phone: string) => `${phone}@phone.pakipark.local`;
const normalizePhone = (value = '') => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `0${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return digits;
  if (digits.length === 12 && digits.startsWith('63')) return `0${digits.slice(2)}`;
  return '';
};
const isEmail = (value = '') => /\S+@\S+\.\S+/.test(value.trim());

@Injectable()
export class LegacyHandlerService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) { }

  private readonly passwordResetOtps = new Map<string, {
    code: string;
    userId: string;
    authEmail: string;
    expiresAt: number;
  }>();

  private readonly passwordResetTokens = new Map<string, {
    userId: string;
    expiresAt: number;
  }>();

  private get client() {
    return this.supabaseService.client;
  }

  private getRequestUserId(req: RequestWithUser) {
    return (
      req.user?.supabaseId ||
      req.user?.supabase_id ||
      req.user?.id ||
      null
    );
  }

  async call(name: string, action: string, request: Request, response: Response) {
    try {
      const req = request as RequestWithUser;
      const result = await this.dispatch(name, action, req);
      if (response.headersSent) return;
      const status = action.startsWith('create') || action.startsWith('register') || action === 'addPaymentMethod' ? 201 : 200;
      response.status(status).json(result);
    } catch (error) {
      if (response.headersSent) return;
      const message = error instanceof Error ? error.message : String(error);
      const status = error instanceof BadRequestException ? 400 : 500;
      response.status(status).json({ success: false, message });
    }
  }

  private dispatch(name: string, action: string, req: RequestWithUser) {
    if (name === 'auth') return this.auth(action, req);
    if (name === 'booking') return this.booking(action, req);
    if (name === 'location') return this.location(action, req);
    if (name === 'parkingSlot') return this.parkingSlot(action, req);
    if (name === 'notification') return this.notification(action, req);
    if (name === 'review') return this.review(action, req);
    if (name === 'settings') return this.settings(action, req);
    if (name === 'user') return this.user(action, req);
    if (name === 'paymentMethod') return this.paymentMethod(action, req);
    if (name === 'payment') return this.payment(action, req);
    if (name === 'analytics') return this.analytics(action, req);
    if (name === 'logs') return this.logs(action, req);
    if (name === 'upload') return this.upload(action, req);
    if (name === 'webhook') return this.webhook(action, req);
    throw new BadRequestException(`Unsupported controller ${name}`);
  }

  private async auth(action: string, req: RequestWithUser) {
    if (action === 'getMe') {
      const user = req.user;
      if (!user) throw new BadRequestException('Not authenticated');
      return { success: true, data: this.normalizeProfileResponse(user) };
    }

    if (action === 'login') return this.login(req.body);
    if (action === 'registerCustomer') return this.registerCustomer(req.body);
    if (action === 'registerAdmin') return this.registerAdmin(req.body);
    if (action === 'registerPartner') return this.registerPartner(req.body);
    if (action === 'socialLogin') return this.socialLogin(req.body);
    if (action === 'forgotPassword') return this.startPasswordReset(req.body);
    if (action === 'verifyResetOtp') return this.verifyPasswordResetOtp(req.body);
    if (action === 'resetPassword') return this.resetPassword(req.body);
    throw new BadRequestException(`Unsupported auth action ${action}`);
  }

  private async login(body: any) {
    const raw = String(body.identifier || body.email || '').trim();
    const email = isEmail(raw) ? raw.toLowerCase() : phoneEmail(normalizePhone(raw));
    const tempClient = createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: loginData, error: loginError } = await tempClient.auth.signInWithPassword({ email, password: body.password });
    if (loginError || !loginData.session?.access_token || !loginData.user) throw new BadRequestException('Invalid credentials');

    const { data: profile } = await this.client
      .schema('account')
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .maybeSingle();
    if (!profile) throw new BadRequestException('User account not found');

    return {
      success: true,
      data: {
        _id: profile.id,
        id: profile.id,
        full_name: profile.full_name || '',
        name: profile.full_name || '',
        email: String(profile.email || '').endsWith('@phone.pakipark.local') ? '' : profile.email,
        phone: profile.phone || '',
        role: profile.role,
        profile_picture: profile.profile_picture || null,
        two_factor_enabled: profile.two_factor_enabled ?? false,
        account_table: 'profiles',
        token: loginData.session.access_token,
      },
    };
  }

  private async registerCustomer(body: any) {
    const fullName = body.name || `${body.firstName || ''} ${body.lastName || ''}`.trim();
    const raw = String(body.identifier || body.email || body.phone || '').trim();
    const phone = isEmail(raw) ? normalizePhone(body.phone || '') : normalizePhone(raw || body.phone || '');
    const email = isEmail(raw) ? raw.toLowerCase() : phoneEmail(phone);
    if (!email || (!isEmail(raw) && !phone)) throw new BadRequestException('Enter a valid email address or mobile number');

    const { data: authData, error: authError } = await this.client.auth.admin.createUser({
      email,
      password: body.password,
      user_metadata: { name: fullName, role: 'customer' },
      email_confirm: true,
    });
    if (authError || !authData.user) throw new BadRequestException(authError?.message || 'Unable to create user');

    const { data, error } = await this.client
      .schema('account')
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        email,
        phone: phone || null,
        role: 'customer',
        dob: body.date_of_birth || body.dateOfBirth || null,
        address: typeof body.address === 'string' ? body.address : JSON.stringify(body.address || {}),
        is_verified: true,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    const loginData = await this.login({ identifier: email, password: body.password });
    return { success: true, data: { ...loginData.data, ...data } };
  }

  private async registerAdmin(body: any) {
    if (body.accessCode !== this.configService.get<string>('ADMIN_ACCESS_CODE')) {
      throw new BadRequestException('Invalid admin access code');
    }
    const fullName = body.name || `${body.firstName || ''} ${body.lastName || ''}`.trim();
    const role = ['admin', 'teller', 'business_partner'].includes(body.role) ? body.role : 'admin';
    const { data: authData, error: authError } = await this.client.auth.admin.createUser({
      email: String(body.email).toLowerCase(),
      password: body.password,
      user_metadata: { name: fullName, role },
      email_confirm: true,
    });
    if (authError || !authData.user) throw new BadRequestException(authError?.message || 'Unable to create admin');

    const { data, error } = await this.client
      .schema('account')
      .from('users')
      .upsert({ id: authData.user.id, full_name: fullName, email: String(body.email).toLowerCase(), phone: body.phone, role, is_verified: true })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return { success: true, data: { ...data, token: this.signLocalToken(data.id, 'users') } };
  }

  private async registerPartner(body: any) {
    const payload = { ...body, role: 'business_partner', accessCode: this.configService.get<string>('ADMIN_ACCESS_CODE') };
    const result = await this.registerAdmin(payload);
    return { ...result, message: 'Partner application submitted. Please wait for admin verification before logging in.' };
  }

  private async socialLogin(body: any) {
    const email = String(body.email || '').toLowerCase().trim();
    if (!email) throw new BadRequestException('Email is required for social login.');
    const { data, error } = await this.client
      .schema('account')
      .from('profiles')
      .upsert({ email, full_name: body.name || '', role: 'customer', profile_picture: body.profilePicture || null, is_verified: true }, { onConflict: 'email' })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return { success: true, data: { ...data, token: this.signLocalToken(data.id, 'profiles'), account_table: 'profiles' } };
  }

  private signLocalToken(id: string | number, accountTable: string) {
    return jwt.sign({ id, accountTable }, this.configService.getOrThrow<string>('JWT_SECRET'), {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '7d',
    } as jwt.SignOptions);
  }

  private normalizePaymentMethod(value: unknown) {
    const raw = String(value || '').trim().toLowerCase();

    if (raw === 'maya' || raw === 'paymaya') return 'Maya';
    if (raw === 'card' || raw === 'credit/debit card' || raw === 'credit_card') {
      return 'Credit/Debit Card';
    }

    return 'GCash';
  }

  private getSlotTypeFromTimeSlot(timeSlot: string) {
    const [startRaw, endRaw] = String(timeSlot || '').split(' - ');

    if (!startRaw || !endRaw) {
      return 'Fixed';
    }

    const startHour = Number(startRaw.split(':')[0]);
    const endHour = Number(endRaw.split(':')[0]);

    if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) {
      return 'Fixed';
    }

    const hours = Math.max(1, endHour - startHour);
    return `${hours}-Hour Slot`;
  }

  private getSlotLabel(slot: any) {
    if (!slot) return null;
    return slot.label || null;
  }

  private getSlotFloor(slot: any) {
    return Number(slot?.floor ?? slot?.floor_number ?? 1) || 1;
  }

  private getLocationAvailableSpots(location: any) {
    return Number(location?.available_spots ?? location?.availableSpots ?? 0) || 0;
  }

  private getLocationTotalSpots(location: any) {
    return Number(location?.total_spots ?? location?.totalSpots ?? location?.capacity ?? 0) || 0;
  }

  private getLocationHourlyRate(location: any) {
    return Number(
      location?.price_per_hour ??
      location?.pricePerHour ??
      location?.hourly_rate ??
      location?.hourlyRate ??
      location?.rate ??
      0,
    ) || 0;
  }

  private calculateAmount(timeSlot: string, fallbackAmount: unknown, location: any) {
    const fallback = Number(fallbackAmount || 0);
    const rate = this.getLocationHourlyRate(location);

    if (!rate) return fallback;

    const [startRaw, endRaw] = String(timeSlot || '').split(' - ');
    if (!startRaw || !endRaw) return fallback || rate;

    const [startHour, startMin = 0] = startRaw.split(':').map(Number);
    const [endHour, endMin = 0] = endRaw.split(':').map(Number);

    if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) {
      return fallback || rate;
    }

    const duration = Math.max(1, ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60);
    return Math.round(rate * duration * 100) / 100;
  }

  private async selectParkingSlots(_client: any, locationId: string | number) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    console.log('[selectParkingSlots] SUPABASE_URL:', supabaseUrl);
    console.log('[selectParkingSlots] locationId:', locationId);

    const { data, error, count } = await this.client
      .schema('parking_lot')
      .from('parking_slots')
      .select('id,label,section,floor,type,status,location_id', {
        count: 'exact',
      })
      .eq('location_id', locationId);

    if (error) {
      console.error('[selectParkingSlots] error:', error);
      throw new BadRequestException(
        `Unable to read parking_lot.parking_slots: ${error.message}`,
      );
    }

    console.log('[selectParkingSlots] count:', count);
    console.log('[selectParkingSlots] rows:', data);

    return data || [];
  }

  private async findParkingSlotById(_client: any, parkingSlotId: string | number) {
    const { data, error } = await this.client
      .schema('parking_lot')
      .from('parking_slots')
      .select('id,label,section,floor,type,status,location_id')
      .eq('id', parkingSlotId)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(
        `Unable to read selected parking slot from parking_lot.parking_slots: ${error.message}`,
      );
    }

    return data || null;
  }

  private async updateParkingSlotStatus(
    _client: any,
    parkingSlotId: string | number | null | undefined,
    status: string,
  ) {
    if (!parkingSlotId) return;

    const { error } = await this.client
      .schema('parking_lot')
      .from('parking_slots')
      .update({ status })
      .eq('id', parkingSlotId);

    if (error) {
      throw new BadRequestException(
        `Failed to update parking_lot.parking_slots status: ${error.message}`,
      );
    }
  }

  private async adjustLocationAvailableSpots(client: any, locationId: string | number | null | undefined, delta: number) {
    if (!locationId || !delta) return;

    const { data: location, error } = await client
      .schema('parking_lot')
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .maybeSingle();

    if (error || !location) return;

    const current = this.getLocationAvailableSpots(location);
    const total = this.getLocationTotalSpots(location);
    const next = Math.max(0, total > 0 ? Math.min(total, current + delta) : current + delta);

    const updatePayload: Record<string, unknown> = {};

    if ('available_spots' in location) updatePayload.available_spots = next;
    if ('availableSpots' in location) updatePayload.availableSpots = next;

    if (Object.keys(updatePayload).length === 0) return;

    await client
      .schema('parking_lot')
      .from('locations')
      .update(updatePayload)
      .eq('id', locationId);
  }

  private async getConflictingBookings(_client: any, locationId: string | number, date: string, timeSlot: string) {
    // Conflict checks must see all reservations, not just the current user's rows.
    const { data, error } = await this.client
      .schema('reservation')
      .from('bookings')
      .select('id,parking_slot_id,spot,timeSlot,status,date')
      .eq('location_id', locationId)
      .eq('date', date)
      .in('status', ['upcoming', 'active', 'payment_pending']);

    if (error) {
      throw new BadRequestException(
        `Unable to check conflicting bookings: ${error.message}`,
      );
    }

    return (data || []).filter((booking: any) => {
      if (!windowsOverlap(booking.timeSlot, timeSlot)) return false;
      if (booking.status === 'active' || booking.status === 'payment_pending') return true;
      if (booking.status === 'upcoming') return !isNoShowBooking(booking);
      return false;
    });
  }

  private async getVehicleSnapshot(client: any, vehicleId: string | number | null | undefined) {
    if (!vehicleId) {
      return {
        vehiclePlate: null,
        vehicleType: null,
        vehicleColor: null,
      };
    }

    const { data } = await client
      .schema('teller')
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .maybeSingle();

    return {
      vehiclePlate:
        data?.plate_number ||
        data?.plateNumber ||
        data?.vehiclePlateNumber ||
        data?.plate ||
        null,
      vehicleType: data?.type || null,
      vehicleColor: data?.color || null,
    };
  }

  private async getLocationSnapshot(client: any, locationId: string | number | null | undefined) {
    if (!locationId) {
      return {
        locationName: null,
        locationAddress: null,
        location: null,
      };
    }

    const { data } = await client
      .schema('parking_lot')
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .maybeSingle();

    return {
      locationName: data?.name || null,
      locationAddress: data?.address || null,
      location: data || null,
    };
  }

  private async getParkingSlotSnapshot(
    client: any,
    locationId: string | number | null | undefined,
    parkingSlotId: string | number | null | undefined,
    date: string,
    timeSlot: string,
  ) {
    if (!locationId) {
      throw new BadRequestException('Missing location ID for parking slot assignment.');
    }

    if (parkingSlotId) {
      const slot = await this.findParkingSlotById(client, parkingSlotId);

      if (!slot) {
        throw new BadRequestException('Selected parking slot was not found in parking_lot.parking_slots.');
      }

      const slotLocationId = slot.location_id;

      if (slotLocationId && String(slotLocationId) !== String(locationId)) {
        throw new BadRequestException('The selected parking slot does not belong to this location.');
      }

      const spot = this.getSlotLabel(slot);

      if (!spot) {
        throw new BadRequestException(
          'Selected parking slot has no slot label/number. Please check parking_lot.parking_slots data.',
        );
      }

      const conflicts = await this.getConflictingBookings(client, locationId, date, timeSlot);

      const isConflict = conflicts.some((booking: any) => {
        return String(booking.parking_slot_id || '') === String(parkingSlotId);
      });

      if (isConflict) {
        throw new BadRequestException('This parking slot is already booked for the requested time window.');
      }

      return {
        parking_slot_id: slot.id || parkingSlotId,
        spot,
      };
    }

    const slots = await this.selectParkingSlots(client, locationId);

    if (!slots.length) {
      throw new BadRequestException(
        `No parking slots found by backend for location_id ${locationId}. SQL editor may be using a different Supabase project than backend SUPABASE_URL, or backend was not rebuilt/restarted.`,
      );
    }

    const conflicts = await this.getConflictingBookings(client, locationId, date, timeSlot);

    const conflictSlotIds = new Set(
      conflicts
        .map((booking: any) => String(booking.parking_slot_id || ''))
        .filter(Boolean),
    );

    const conflictLabels = new Set(
      conflicts
        .map((booking: any) => String(booking.spot || ''))
        .filter(Boolean),
    );

    const availableSlots = slots
      .filter((slot: any) => {
        const status = String(slot.status || 'available').toLowerCase();
        return status !== 'maintenance';
      })
      .sort((a: any, b: any) => {
        const floorDiff = this.getSlotFloor(a) - this.getSlotFloor(b);
        if (floorDiff !== 0) return floorDiff;

        return String(this.getSlotLabel(a) || '').localeCompare(
          String(this.getSlotLabel(b) || ''),
        );
      });

    if (!availableSlots.length) {
      throw new BadRequestException(
        `All parking slots for location_id ${locationId} are marked as maintenance or unavailable.`,
      );
    }

    const selected = availableSlots.find((slot: any) => {
      const id = String(slot.id || '');
      const label = String(this.getSlotLabel(slot) || '');

      if (!id || !label) return false;

      return !conflictSlotIds.has(id) && !conflictLabels.has(label);
    });

    if (!selected) {
      throw new BadRequestException(
        'No available parking slot found for this location and time slot.',
      );
    }

    const selectedSpot = this.getSlotLabel(selected);

    if (!selectedSpot) {
      throw new BadRequestException(
        'Selected parking slot has no slot label/number. Please check parking_lot.parking_slots data.',
      );
    }

    return {
      parking_slot_id: selected.id,
      spot: selectedSpot,
    };
  }

  private async generateBookingIdentifiers(_client: any) {
    const { data, error } = await this.client
      .schema('reservation')
      .from('bookings')
      .select('reference')
      .like('reference', 'PKP-%')
      .order('createdAt', { ascending: false })
      .limit(100);

    if (error) {
      throw new BadRequestException(`Failed to generate booking reference: ${error.message}`);
    }

    let maxNumber = 0;

    for (const row of data || []) {
      const match = String(row.reference || '').match(/^PKP-(\d+)$/);
      if (!match) continue;

      const value = Number(match[1]);
      if (Number.isFinite(value)) {
        maxNumber = Math.max(maxNumber, value);
      }
    }

    const nextNumber = maxNumber + 1;
    const padded = String(nextNumber).padStart(8, '0');

    return {
      reference: `PKP-${padded}`,
      barcode: `PKP${padded}`,
    };
  }

  private async booking(action: string, req: RequestWithUser) {
    if (!req.accessToken) {
      throw new BadRequestException('Missing Supabase access token');
    }

    // Validate that this is a real Supabase Auth token, not a local JWT.
    const {
      data: { user: authUser },
      error: authError,
    } = await this.client.auth.getUser(req.accessToken);

    if (authError || !authUser?.id) {
      throw new BadRequestException(
        'Invalid Supabase access token. Please log out and sign in again.',
      );
    }

    const client = this.supabaseService.forUser(req.accessToken);
    const table = client.schema('reservation').from('bookings');

    if (action === 'createBooking' || action === 'createPendingBooking') {
      const { reference, barcode } = await this.generateBookingIdentifiers(client);

      const {
        userId,
        locationId,
        location_id,
        vehicleId,
        vehicle_id,
        parkingSlotId,
        parking_slot_id,
        parkingSlotType,
        type,
        paymentMethod,
        paymentLabel,

        // Frontend/display fields
        location,
        locationName,
        address,
        locationAddress,
        vehicle,
        vehiclePlate,
        vehiclePlateNumber,
        bookingPlate,
        plateNumber,
        vehicleType,
        vehicleColor,

        // Non-column helper fields
        durationHours,
        price,
        reference: ignoredReference,
        barcode: ignoredBarcode,
        bookingId,
        ...body
      } = req.body;

      const resolvedLocationId = locationId || location_id;
      const resolvedVehicleId = vehicleId || vehicle_id;
      const resolvedParkingSlotId = parkingSlotId || parking_slot_id;
      const resolvedDate = body.date || new Date().toISOString().split('T')[0];
      const resolvedTimeSlot = body.timeSlot || body.time || '10:00 - 11:00';

      if (!resolvedLocationId) {
        throw new BadRequestException('Missing location ID.');
      }

      if (!resolvedVehicleId) {
        throw new BadRequestException('Missing vehicle ID.');
      }

      const [vehicleSnapshot, locationSnapshot, slotSnapshot] = await Promise.all([
        this.getVehicleSnapshot(client, resolvedVehicleId),
        this.getLocationSnapshot(client, resolvedLocationId),
        this.getParkingSlotSnapshot(client, resolvedLocationId, resolvedParkingSlotId, resolvedDate, resolvedTimeSlot),
      ]);

      if (!slotSnapshot.parking_slot_id) {
        throw new BadRequestException(
          'No available parking slot found for this location and time slot.',
        );
      }

      if (!slotSnapshot.spot) {
        throw new BadRequestException(
          'Selected parking slot has no slot label/number. Please check parking_slots data.',
        );
      }

      const normalizedPaymentMethod = this.normalizePaymentMethod(paymentMethod || paymentLabel);
      const isOnlinePayment = ['GCash', 'Maya', 'Credit/Debit Card'].includes(normalizedPaymentMethod);

      const insertPayload = {
        // RLS identity
        user_id: authUser.id,

        // Foreign keys
        vehicle_id: resolvedVehicleId,
        location_id: resolvedLocationId,
        parking_slot_id: slotSnapshot.parking_slot_id,

        // Booking identifiers
        reference,
        barcode,

        // Booking details
        spot: slotSnapshot.spot || body.spot || 'Auto-Assigned',
        date: resolvedDate,
        timeSlot: resolvedTimeSlot,
        type: type || parkingSlotType || this.getSlotTypeFromTimeSlot(resolvedTimeSlot),
        amount: this.calculateAmount(resolvedTimeSlot, body.amount, locationSnapshot.location),
        paymentMethod: normalizedPaymentMethod,
        paymentStatus: isOnlinePayment || action === 'createPendingBooking' ? 'pending' : 'paid',

        // Snapshot columns for complete backend rows
        vehiclePlate:
          vehicleSnapshot.vehiclePlate ||
          vehiclePlate ||
          vehiclePlateNumber ||
          bookingPlate ||
          plateNumber ||
          null,
        vehicleType:
          vehicleSnapshot.vehicleType ||
          vehicleType ||
          null,
        vehicleColor:
          vehicleSnapshot.vehicleColor ||
          vehicleColor ||
          null,
        locationName:
          locationSnapshot.locationName ||
          locationName ||
          location ||
          null,
        locationAddress:
          locationSnapshot.locationAddress ||
          locationAddress ||
          address ||
          null,

        checkedInByTeller: false,
        status:
          action === 'createPendingBooking'
            ? 'payment_pending'
            : 'upcoming',
      };

      const { data, error } = await table
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        throw new BadRequestException(
          `Failed to create pending booking: ${error.message}`,
        );
      }

      await Promise.all([
        this.adjustLocationAvailableSpots(client, resolvedLocationId, -1),
        this.updateParkingSlotStatus(client, slotSnapshot.parking_slot_id, 'reserved'),
      ]);

      if (action === 'createPendingBooking') {
        return {
          success: true,
          data: {
            booking_id: data.id,
            reference: data.reference,
            booking: formatBooking(data),
          },
        };
      }

      return { success: true, data: formatBooking(data) };
    }

    if (action === 'getMyBookings') {
      const { data, count, error } = await table
        .select('*', { count: 'exact' })
        .eq('user_id', authUser.id)
        .order('createdAt', { ascending: false });

      if (error) throw new BadRequestException(error.message);

      return {
        success: true,
        data: {
          bookings: (data || []).map((booking: any) => ({
            ...formatBooking(booking),
            timing: computeTimingMeta(booking),
          })),
          total: count || 0,
          page: 1,
          totalPages: 1,
        },
      };
    }

    if (action === 'getAllBookings') return this.list(table, req, formatBooking);

    if (action === 'getBookingById') {
      const { data, error } = await table
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) throw new BadRequestException(error.message);

      return {
        success: true,
        data: {
          ...formatBooking(data),
          timing: computeTimingMeta(data),
        },
      };
    }

    if (action === 'cancelBooking') {
      const { data: booking, error: bookingError } = await table
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (bookingError) throw new BadRequestException(bookingError.message);
      if (!['upcoming', 'payment_pending'].includes(String(booking.status))) {
        throw new BadRequestException('Only upcoming bookings can be cancelled.');
      }

      const refundPolicy = computeRefundPolicy(booking);

      const { data, error } = await table
        .update({
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);

      await Promise.all([
        this.adjustLocationAvailableSpots(client, booking.location_id, 1),
        this.updateParkingSlotStatus(client, booking.parking_slot_id, 'available'),
      ]);

      return {
        success: true,
        data: {
          ...formatBooking(data),
          refundPolicy,
        },
      };
    }

    if (action === 'updateBookingStatus') {
      const nextStatus = req.body.status;
      if (!nextStatus) throw new BadRequestException('Missing booking status.');

      const { data: booking, error: bookingError } = await table
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (bookingError) throw new BadRequestException(bookingError.message);

      const updatePayload: Record<string, unknown> = {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };

      if (nextStatus === 'active') {
        updatePayload.checkInAt = new Date().toISOString();
        updatePayload.checkedInByTeller = true;
      }

      if (nextStatus === 'completed') {
        updatePayload.checkOutAt = new Date().toISOString();
      }

      const { data, error } = await table
        .update(updatePayload)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);

      if (nextStatus === 'cancelled' || nextStatus === 'completed') {
        await Promise.all([
          this.adjustLocationAvailableSpots(client, booking.location_id, 1),
          this.updateParkingSlotStatus(client, booking.parking_slot_id, 'available'),
        ]);
      } else if (nextStatus === 'active') {
        await this.updateParkingSlotStatus(client, booking.parking_slot_id, 'occupied');
      }

      return { success: true, data: formatBooking(data) };
    }

    if (action === 'checkInBooking') {
      const { data: booking, error: bookingError } = await table
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (bookingError) throw new BadRequestException(bookingError.message);
      if (booking.status !== 'upcoming') throw new BadRequestException('Only upcoming bookings can be checked in.');
      if (booking.checkInAt) throw new BadRequestException('This booking is already checked in.');

      const { data, error } = await table
        .update({
          status: 'active',
          checkInAt: new Date().toISOString(),
          checkedInByTeller: true,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);

      await this.updateParkingSlotStatus(client, booking.parking_slot_id, 'occupied');

      return { success: true, data: formatBooking(data) };
    }

    if (action === 'checkOutBooking') {
      const { data: booking, error: bookingError } = await table
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (bookingError) throw new BadRequestException(bookingError.message);
      if (booking.status !== 'active') throw new BadRequestException('Only active bookings can be checked out.');

      const now = new Date();
      const [, endRaw] = String(booking.timeSlot || '').split(' - ');
      const [endHour, endMin = 0] = String(endRaw || '23:59').split(':').map(Number);
      const endAt = new Date(`${booking.date}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`);
      const overtimeMs = Math.max(0, now.getTime() - endAt.getTime());
      const overtimeFee = Math.round((overtimeMs / 3_600_000) * 15 * 100) / 100;

      const { data, error } = await table
        .update({
          status: 'completed',
          checkOutAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);

      await Promise.all([
        this.adjustLocationAvailableSpots(client, booking.location_id, 1),
        this.updateParkingSlotStatus(client, booking.parking_slot_id, 'available'),
      ]);

      return {
        success: true,
        data: {
          ...formatBooking(data),
          overtimeFee,
          overtimeMinutes: Math.round(overtimeMs / 60_000),
          finalAmount: Number(booking.amount || 0) + overtimeFee,
        },
      };
    }

    if (action === 'getAvailableSlots') return { success: true, data: await this.availableSlots(req.params.locationId, req.query.date as string) };

    throw new BadRequestException(`Unsupported booking action ${action}`);
  }

  private async location(action: string, req: RequestWithUser) {
    const table = this.client.schema('parking_lot').from('locations');

    if (action === 'getLocations') {
      let query = table.select('*', { count: 'exact' }).order('name', { ascending: true });
      if (req.query.mine === 'true') {
        const ownerId = this.getRequestUserId(req);
        query = query.eq('owner_id', ownerId);
      }
      if (req.query.active !== undefined) {
        query = query.eq('is_active', String(req.query.active) !== 'false');
      }
      const { data, error, count } = await query;
      if (error) throw new BadRequestException(error.message);
      return { success: true, data: (data || []).map((row: any) => this.normalizeLocation(row)), total: count ?? 0 };
    }

    if (action === 'getLocation') return this.getById(table, req.params.id, (row) => this.normalizeLocation(row));

    if (action === 'getLocationVitals') {
      const locationId = req.params.id;
      const requestedDate = String(req.query.date || new Date().toISOString().slice(0, 10));
      const timeSlot = String(req.query.timeSlot || req.query.time || '');
      const [{ data: slots }, { data: bookings }] = await Promise.all([
        this.client.schema('parking_lot').from('parking_slots').select('*').eq('location_id', locationId),
        this.client.schema('reservation').from('bookings').select('id,status,timeSlot,spot,parking_slot_id').eq('location_id', locationId).eq('date', requestedDate).in('status', ['upcoming', 'active', 'payment_pending']),
      ]);
      const activeSlots = (slots || []).filter((slot: any) => String(slot.status || '').toLowerCase() !== 'maintenance');
      const overlapping = timeSlot
        ? (bookings || []).filter((booking: any) => windowsOverlap(booking.timeSlot, timeSlot))
        : (bookings || []);
      const total = activeSlots.length;
      const occupied = overlapping.length;
      return {
        success: true,
        data: {
          pressure: total ? Math.round((occupied / total) * 100) : 0,
          utilization: total ? occupied / total : 0,
          totalSlots: total,
          occupiedSlots: occupied,
          availableSlots: Math.max(0, total - occupied),
          status: total && occupied >= total ? 'Full' : 'Open',
        },
      };
    }

    if (action === 'createLocation') return this.insert(table, this.mapLocationPayload(req.body));
    if (action === 'updateLocation') return this.updateById(table, req.params.id, this.mapLocationPayload(req.body), (row) => this.normalizeLocation(row));
    if (action === 'updateOperatingHours') return this.updateById(table, req.params.id, { operating_hours: req.body.hours || req.body.operatingHours || req.body }, (row) => this.normalizeLocation(row));
    if (action === 'deleteLocation') return this.deleteById(table, req.params.id);
    throw new BadRequestException(`Unsupported location action ${action}`);
  }

  private async parkingSlot(action: string, req: RequestWithUser) {
    const table = this.client.schema('parking_lot').from('parking_slots');

    if (action === 'getSlotsByLocation' || action === 'getAvailableSlots' || action === 'getDashboardSlots') {
      let query = table.select('*').eq('location_id', req.params.locationId).order('floor', { ascending: true }).order('section', { ascending: true }).order('label', { ascending: true });
      if (action === 'getAvailableSlots') query = query.eq('status', 'available');
      const { data, error } = await query;
      if (error) throw new BadRequestException(error.message);
      const slots = (data || []).map((row: any) => this.normalizeParkingSlot(row));
      return { success: true, data: slots, recommendedPollMs: action === 'getDashboardSlots' ? 60000 : undefined };
    }

    if (action === 'getSlot') return this.getById(table, req.params.id, (row) => this.normalizeParkingSlot(row));

    if (action === 'generateSlots') {
      const locationId = req.body.locationId || req.body.location_id;
      if (!locationId) throw new BadRequestException('locationId is required.');
      const floors = Math.max(1, Number(req.body.floors || 1));
      const sections: string[] = Array.isArray(req.body.sections) && req.body.sections.length ? req.body.sections : ['A'];
      const slotsPerSection = Math.max(1, Number(req.body.slotsPerSection || req.body.slots_per_section || 10));
      const customSlots = Array.isArray(req.body.slots) ? req.body.slots : [];
      const rows = customSlots.length
        ? customSlots.map((slot: any) => this.mapParkingSlotPayload({ ...slot, locationId }))
        : Array.from({ length: floors }).flatMap((_, floorIndex) =>
          sections.flatMap((section) =>
            Array.from({ length: slotsPerSection }).map((__, slotIndex) =>
              this.mapParkingSlotPayload({
                locationId,
                label: `${section}${slotIndex + 1}`,
                section,
                floor: floorIndex + 1,
                type: req.body.type || 'regular',
                status: 'available',
              }),
            ),
          ),
        );

      const { data, error } = await table.upsert(rows, { onConflict: 'location_id,label' }).select('*');
      if (error) throw new BadRequestException(error.message);
      return { success: true, data: (data || []).map((row: any) => this.normalizeParkingSlot(row)), total: data?.length || 0 };
    }

    if (action === 'createSlot') return this.insert(table, this.mapParkingSlotPayload(req.body));
    if (action === 'updateSlot') return this.updateById(table, req.params.id, this.mapParkingSlotPayload(req.body), (row) => this.normalizeParkingSlot(row));
    if (action === 'deleteSlot') return this.deleteById(table, req.params.id);

    throw new BadRequestException(`Unsupported parking slot action ${action}`);
  }

  private async notification(action: string, req: RequestWithUser) {
    const table = this.client.schema('notifications').from('notifications');
    const userId = this.getRequestUserId(req);

    if (action === 'getMyNotifications') {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const [{ data, error, count }, { count: unreadCount, error: unreadError }] = await Promise.all([
        table.select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).range(from, to),
        this.client.schema('notifications').from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false),
      ]);
      if (error) throw new BadRequestException(error.message);
      if (unreadError) throw new BadRequestException(unreadError.message);
      const notifications = (data || []).map((row: any) => this.normalizeNotification(row));
      return { success: true, data: { notifications, total: count || 0, page, totalPages: Math.ceil((count || 0) / limit), unreadCount: unreadCount || 0 } };
    }

    if (action === 'getUnreadCount') {
      const { count, error } = await table.select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
      if (error) throw new BadRequestException(error.message);
      return { success: true, data: { count: count || 0 } };
    }

    if (action === 'markAllRead') return this.updateWhere(table, { is_read: true }, 'user_id', userId);
    if (action === 'markOneRead') return this.updateById(table, req.params.id, { is_read: true }, (row) => this.normalizeNotification(row));
    if (action === 'deleteOne') return this.deleteById(table, req.params.id);
    if (action === 'clearAll') return this.deleteWhere(table, 'user_id', userId);
    throw new BadRequestException(`Unsupported notification action ${action}`);
  }

  private async review(action: string, req: RequestWithUser) {
    if (!req.accessToken) {
      throw new BadRequestException('Missing Supabase access token');
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await this.client.auth.getUser(req.accessToken);

    if (authError || !authUser?.id) {
      throw new BadRequestException(
        'Invalid Supabase access token. Please log out and sign in again.',
      );
    }

    // Reviews use the trusted backend Supabase client because this project does
    // not allow adding RLS policies for partner.reviews. This still goes through
    // Supabase/PostgREST over HTTPS and never opens a direct DB connection.
    // Because service_role bypasses RLS, ownership checks are done manually here.
    const adminClient = this.client;
    const table = adminClient.schema('partner').from('reviews');
    const userId = authUser.id;

    if (action === 'createReview') {
      const booking = await this.resolveReviewBooking(adminClient, req, userId);
      const payload = this.mapReviewPayload(req.body, userId, booking);

      const { data: existingReview, error: existingReviewError } = await table
        .select('*')
        .eq('user_id', userId)
        .eq('booking_id', payload.booking_id)
        .maybeSingle();

      if (existingReviewError) {
        throw new BadRequestException(existingReviewError.message);
      }

      if (existingReview?.id) {
        const { data, error } = await table
          .update({
            rating: payload.rating,
            comment: payload.comment,
            location_id: payload.location_id,
          })
          .eq('id', existingReview.id)
          .select('*')
          .single();

        if (error) throw new BadRequestException(error.message);

        return { success: true, data: this.normalizeReview(data) };
      }

      const { data, error } = await table
        .insert(payload)
        .select('*')
        .single();

      if (error) throw new BadRequestException(error.message);

      return { success: true, data: this.normalizeReview(data) };
    }

    if (action === 'getMyReviews') {
      const { data, error, count } = await table
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new BadRequestException(error.message);

      return {
        success: true,
        data: {
          reviews: (data || []).map((row: any) => this.normalizeReview(row)),
          total: count || 0,
        },
      };
    }

    if (action === 'getReviewStats') {
      let query = table.select('rating');

      if (req.query.locationId) {
        query = query.eq('location_id', req.query.locationId);
      }

      const { data, error } = await query;

      if (error) throw new BadRequestException(error.message);

      const ratings = (data || [])
        .map((row: any) => Number(row.rating || 0))
        .filter((rating: number) => rating > 0);

      const totalReviews = ratings.length;
      const countStars = (star: number) =>
        ratings.filter((rating: number) => rating === star).length;

      return {
        success: true,
        data: {
          averageRating: totalReviews
            ? Math.round(
                (ratings.reduce(
                  (sum: number, rating: number) => sum + rating,
                  0,
                ) /
                  totalReviews) *
                  100,
              ) / 100
            : 0,
          totalReviews,
          fiveStars: countStars(5),
          fourStars: countStars(4),
          threeStars: countStars(3),
          twoStars: countStars(2),
          oneStar: countStars(1),
        },
      };
    }

    if (action === 'getReviews') {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = table
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (req.query.locationId) {
        query = query.eq('location_id', req.query.locationId);
      }

      const { data, error, count } = await query;

      if (error) throw new BadRequestException(error.message);

      return {
        success: true,
        data: {
          reviews: (data || []).map((row: any) => this.normalizeReview(row)),
          total: count || 0,
          page,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    }

    throw new BadRequestException(`Unsupported review action ${action}`);
  }

  private async settings(action: string, req: RequestWithUser) {
    if (action.includes('ParkingRate')) {
      const table = this.client.schema('parking_lot').from('parking_rates');
      if (action === 'getParkingRates') {
        const { data, error } = await table.select('*').order('type', { ascending: true });
        if (error) throw new BadRequestException(error.message);
        return { success: true, data: (data || []).map((row: any) => this.normalizeParkingRate(row)) };
      }
      if (action === 'createParkingRate') return this.insert(table, this.mapParkingRatePayload(req.body));
      if (action === 'updateParkingRate') return this.updateById(table, req.params.id, this.mapParkingRatePayload(req.body), (row) => this.normalizeParkingRate(row));
      if (action === 'deleteParkingRate') return this.deleteById(table, req.params.id);
    }

    if (action.includes('PricingRule')) {
      const table = this.client.schema('parking_lot').from('pricing_rules');
      if (action === 'getPricingRules') {
        let query = table.select('*');
        if (req.query.locationId) query = query.eq('location_id', req.query.locationId);
        const { data, error } = await query;
        if (error) throw new BadRequestException(error.message);
        return { success: true, data: data || [] };
      }
      if (action === 'createPricingRule') return this.insert(table, this.mapPricingRulePayload(req.body));
      if (action === 'updatePricingRule') return this.updateById(table, req.params.id, this.mapPricingRulePayload(req.body));
      if (action === 'deletePricingRule') return this.deleteById(table, req.params.id);
    }

    if (action === 'getAdminUsers') {
      const { data, error, count } = await this.client.schema('account').from('profiles').select('*', { count: 'exact' }).in('role', ['admin', 'teller', 'business_partner', 'staff']);
      if (error) throw new BadRequestException(error.message);
      return { success: true, data: (data || []).map((row: any) => this.normalizeProfileResponse(row)), total: count || 0 };
    }

    const table = this.client.schema('settings').from('settings');
    if (action === 'getSettings') {
      const { data, error } = await table.select('*').eq('category', req.params.category);
      if (error) throw new BadRequestException(error.message);
      const value = (data || []).reduce((acc: Record<string, unknown>, row: any) => {
        acc[row.key || row.name || row.category] = row.value ?? row.data ?? row.settings;
        return acc;
      }, {});
      return { success: true, data: value };
    }
    if (action === 'updateSettings') {
      const category = req.params.category;
      const entries = Object.entries(req.body || {}).map(([key, value]) => ({ category, key, value }));
      if (!entries.length) return { success: true, data: {} };
      const { data, error } = await table.upsert(entries, { onConflict: 'category,key' }).select('*');
      if (error) throw new BadRequestException(error.message);
      return { success: true, data };
    }
    throw new BadRequestException(`Unsupported settings action ${action}`);
  }

  private async user(action: string, req: RequestWithUser) {
    const table = this.client.schema('account').from(req.user?.account_table === 'users' ? 'users' : 'profiles');
    const userId = this.getRequestUserId(req);

    if (action === 'getProfile') return this.getById(table, req.user?.id, (row) => this.normalizeProfileResponse(row));
    if (action === 'updateProfile') return this.updateById(table, req.user?.id, this.mapProfileUpdatePayload(req.body), (row) => this.normalizeProfileResponse(row));
    if (action === 'changePassword') return this.changePassword(req);
    if (action === 'deleteAccount') return this.softDeleteAccount(req);
    if (action === 'getPendingPartners') return this.listPartnerProfiles(req);
    if (action === 'reviewPartnerRegistration') return this.updateById(this.client.schema('account').from('profiles'), req.params.id, { is_verified: req.body.status === 'approved' || req.body.action === 'approve' }, (row) => this.normalizeProfileResponse(row));
    if (action === 'getAllUsers') return this.list(this.client.schema('account').from('profiles'), req, (row) => this.normalizeProfileResponse(row));
    if (action === 'setup2FA') return this.setupTwoFactor(userId);
    if (action === 'verify2FA') return this.verifyTwoFactor(userId, req.body.code);
    if (action === 'disable2FA') return this.disableTwoFactor(req);
    throw new BadRequestException(`Unsupported user action ${action}`);
  }

  private async paymentMethod(action: string, req: RequestWithUser) {
    const table = this.client.schema('payment').from('payment_methods');
    const userId = this.getRequestUserId(req);

    if (action === 'getPaymentMethods') {
      const { data, error } = await table.select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw new BadRequestException(error.message);
      return { success: true, data: (data || []).map((row: any) => this.normalizePaymentMethodRecord(row)) };
    }

    if (action === 'addPaymentMethod') {
      const payload = this.mapPaymentMethodPayload(req.body, userId);
      if (payload.is_default) {
        await table.update({ is_default: false }).eq('user_id', userId);
      }
      const { data, error } = await table.insert(payload).select('*').single();
      if (error) throw new BadRequestException(error.message);
      return { success: true, data: this.normalizePaymentMethodRecord(data) };
    }

    if (action === 'updatePaymentMethod') {
      const payload = this.mapPaymentMethodPayload(req.body, userId, true);
      if (payload.is_default) {
        await table.update({ is_default: false }).eq('user_id', userId).neq('id', req.params.id);
      }
      return this.updateById(table, req.params.id, payload, (row) => this.normalizePaymentMethodRecord(row));
    }

    if (action === 'deletePaymentMethod') return this.deleteById(table, req.params.id);
    throw new BadRequestException(`Unsupported payment method action ${action}`);
  }

  private async payment(action: string, req: RequestWithUser) {
    if (action === 'paymongoCallback') {
      return { success: true, message: 'Payment callback received' };
    }

    if (action === 'paymongoWebhook') {
      return this.webhook('paymentStatus', req);
    }

    if (action === 'createPayMongoIntent') {
      const { amount, paymentMethod, bookingId } = req.body;

      if (!amount || Number(amount) <= 0) {
        throw new BadRequestException('Invalid payment amount.');
      }

      if (!bookingId) {
        throw new BadRequestException('Missing booking ID.');
      }

      const secretKey = this.configService.get<string>('PAYMONGO_SECRET_KEY');

      if (!secretKey) {
        throw new BadRequestException('PayMongo secret key is not configured.');
      }

      const methodMap: Record<string, string> = {
        gcash: 'gcash',
        maya: 'paymaya',
        card: 'card',
      };

      const paymongoPaymentMethod = methodMap[paymentMethod];

      if (!paymongoPaymentMethod) {
        throw new BadRequestException('Unsupported payment method.');
      }

      const baseUrl =
        this.configService.get<string>('APP_URL') ||
        this.configService.get<string>('API_BASE_URL') ||
        'https://example.com';

      const paymongoResponse = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              line_items: [
                {
                  name: 'PakiPark Parking Reservation',
                  amount: Math.round(Number(amount) * 100),
                  currency: 'PHP',
                  quantity: 1,
                },
              ],
              payment_method_types: [paymongoPaymentMethod],
              success_url: `${baseUrl}/api/payments/paymongo/callback?status=success&bookingId=${encodeURIComponent(
                String(bookingId),
              )}`,
              cancel_url: `${baseUrl}/api/payments/paymongo/callback?status=cancelled&bookingId=${encodeURIComponent(
                String(bookingId),
              )}`,
              reference_number: String(bookingId),
              description: `PakiPark booking ${bookingId}`,
            },
          },
        }),
      });

      const paymongoJson = await paymongoResponse.json().catch(() => null);

      if (!paymongoResponse.ok) {
        const errorMessage =
          paymongoJson?.errors?.[0]?.detail ||
          paymongoJson?.errors?.[0]?.message ||
          'Unable to create PayMongo checkout session.';

        throw new BadRequestException(errorMessage);
      }

      const checkoutSessionId = paymongoJson?.data?.id;
      const redirectUrl = paymongoJson?.data?.attributes?.checkout_url;

      if (!checkoutSessionId || !redirectUrl) {
        throw new BadRequestException('PayMongo did not return a checkout URL.');
      }

      const bookingOwnerId = this.getRequestUserId(req);

      let sessionUpdateQuery = this.client
        .schema('reservation')
        .from('bookings')
        .update({
          payment_session_id: String(checkoutSessionId),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', String(bookingId));

      if (bookingOwnerId) {
        sessionUpdateQuery = sessionUpdateQuery.eq('user_id', bookingOwnerId);
      }

      const { data: sessionUpdateData, error: sessionUpdateError } = await sessionUpdateQuery
        .select('id')
        .maybeSingle();

      if (sessionUpdateError) {
        throw new BadRequestException(
          `Failed to save PayMongo checkout session: ${sessionUpdateError.message}`,
        );
      }

      if (!sessionUpdateData) {
        throw new BadRequestException(
          'Failed to save PayMongo checkout session: booking was not found for the authenticated user.',
        );
      }

      return {
        success: true,
        data: {
          success: true,
          checkoutSessionId,
          redirectUrl,
        },
      };
    }

    if (action === 'verifyPayMongoPayment') {
      const { checkoutSessionId, bookingId } = req.body;

      if (!checkoutSessionId) {
        throw new BadRequestException('Missing PayMongo checkout session ID.');
      }

      if (!bookingId) {
        throw new BadRequestException('Missing booking ID.');
      }

      const secretKey = this.configService.get<string>('PAYMONGO_SECRET_KEY');

      if (!secretKey) {
        throw new BadRequestException('PayMongo secret key is not configured.');
      }

      const paymongoResponse = await fetch(
        `https://api.paymongo.com/v1/checkout_sessions/${encodeURIComponent(String(checkoutSessionId))}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
            Accept: 'application/json',
          },
        },
      );

      const paymongoJson = await paymongoResponse.json().catch(() => null);

      if (!paymongoResponse.ok) {
        const errorMessage =
          paymongoJson?.errors?.[0]?.detail ||
          paymongoJson?.errors?.[0]?.message ||
          'Unable to verify PayMongo checkout session.';

        throw new BadRequestException(errorMessage);
      }

      const attributes = paymongoJson?.data?.attributes || {};
      const payments = attributes.payments || [];

      const paidPayment = Array.isArray(payments)
        ? payments.find((payment: any) => payment?.attributes?.status === 'paid')
        : null;

      const status =
        paidPayment
          ? 'succeeded'
          : attributes.status === 'active'
            ? 'pending'
            : attributes.status || 'pending';

      const updatePayload =
        status === 'succeeded'
          ? {
            paymentStatus: 'paid',
            status: 'upcoming',
            payment_session_id: String(checkoutSessionId),
            updatedAt: new Date().toISOString(),
          }
          : {
            paymentStatus: 'pending',
            payment_session_id: String(checkoutSessionId),
            updatedAt: new Date().toISOString(),
          };

      const bookingOwnerId = this.getRequestUserId(req);

      let bookingUpdateQuery = this.client
        .schema('reservation')
        .from('bookings')
        .update(updatePayload)
        .eq('id', String(bookingId));

      if (bookingOwnerId) {
        bookingUpdateQuery = bookingUpdateQuery.eq('user_id', bookingOwnerId);
      }

      const { data: bookingUpdateData, error: bookingUpdateError } = await bookingUpdateQuery
        .select('id')
        .maybeSingle();

      if (bookingUpdateError) {
        throw new BadRequestException(
          `Failed to update booking payment status: ${bookingUpdateError.message}`,
        );
      }

      if (!bookingUpdateData) {
        throw new BadRequestException(
          'Failed to update booking payment status: booking was not found for the authenticated user.',
        );
      }

      return {
        success: true,
        data: {
          success: true,
          status,
          checkoutSessionId,
          bookingId: String(bookingId),
        },
      };
    }

    throw new BadRequestException(`Unsupported payment action ${action}`);
  }

  private async analytics(action: string, req: RequestWithUser) {
    const locationId = req.query.locationId ? String(req.query.locationId) : null;
    const bookingBase = this.client.schema('reservation').from('bookings');

    if (action === 'getDashboardStats') {
      const bookingQuery = locationId ? bookingBase.select('*').eq('location_id', locationId) : bookingBase.select('*');
      const [{ data: bookings, error: bookingError }, { count: locationCount }, { count: userCount }] = await Promise.all([
        bookingQuery,
        this.client.schema('parking_lot').from('locations').select('id', { count: 'exact', head: true }),
        this.client.schema('account').from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      if (bookingError) throw new BadRequestException(bookingError.message);
      const rows = bookings || [];
      const revenue = rows.filter((row: any) => ['paid', 'completed'].includes(String(row.paymentStatus || row.payment_status || '').toLowerCase()) || row.status === 'completed')
        .reduce((sum: number, row: any) => sum + Number(row.finalAmount || row.final_amount || row.amount || 0), 0);
      const activeBookings = rows.filter((row: any) => ['upcoming', 'active', 'payment_pending'].includes(String(row.status))).length;
      return {
        success: true,
        data: {
          totalBookings: rows.length,
          activeBookings,
          completedBookings: rows.filter((row: any) => row.status === 'completed').length,
          cancelledBookings: rows.filter((row: any) => row.status === 'cancelled').length,
          totalRevenue: Math.round(revenue * 100) / 100,
          totalLocations: locationCount || 0,
          totalUsers: userCount || 0,
        },
      };
    }

    if (action === 'getRevenueData') return this.buildGroupedBookingMetric('revenue', locationId);
    if (action === 'getOccupancyData') return this.buildGroupedBookingMetric('occupancy', locationId);
    if (action === 'getVehicleTypeDistribution') return this.buildGroupedBookingMetric('vehicleType', locationId);
    if (action === 'getPaymentMethodDistribution') return this.buildGroupedBookingMetric('paymentMethod', locationId);

    throw new BadRequestException(`Unsupported analytics action ${action}`);
  }

  private async logs(action: string, req: RequestWithUser) {
    const paymentTransactionsTable = 'payment_transactions';
    const reservationTransactionLogsTable = 'transaction_logs';

    if (
      action === 'getTransactionLogs' ||
      action === 'getCombinedTransactionLogs'
    ) {
      const pagination = this.getPagination(req);

      const [paymentTransactions, reservationTransactionLogs] = await Promise.all([
        this.readSchemaRows(
          'payment',
          paymentTransactionsTable,
          req,
          (row) => this.normalizePaymentTransaction(row),
          1000,
        ),
        this.readSchemaRows(
          'reservation',
          reservationTransactionLogsTable,
          req,
          (row) => this.normalizeReservationTransactionLog(row),
          1000,
        ),
      ]);

      const combinedRows = [
        ...paymentTransactions.rows,
        ...reservationTransactionLogs.rows,
      ].sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt || a.created_at || 0).getTime();
        const bTime = new Date(b.createdAt || b.created_at || 0).getTime();
        return bTime - aTime;
      });

      const pagedRows = combinedRows.slice(pagination.from, pagination.to + 1);

      return {
        success: true,
        data: pagedRows,
        total: combinedRows.length,
        page: pagination.page,
        totalPages: Math.ceil(combinedRows.length / pagination.limit),
        sources: {
          'payment.payment_transactions': paymentTransactions.total,
          'reservation.transaction_logs': reservationTransactionLogs.total,
        },
        warnings: [
          ...paymentTransactions.warnings,
          ...reservationTransactionLogs.warnings,
        ],
      };
    }

    if (action === 'getPaymentTransactions') {
      const result = await this.readSchemaRows(
        'payment',
        paymentTransactionsTable,
        req,
        (row) => this.normalizePaymentTransaction(row),
      );

      return {
        success: true,
        data: result.rows,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        warnings: result.warnings,
      };
    }

    if (
      action === 'getPaymentTransactionLogs' ||
      action === 'getRawTransactionLogs' ||
      action === 'getReservationTransactionLogs'
    ) {
      const result = await this.readSchemaRows(
        'reservation',
        reservationTransactionLogsTable,
        req,
        (row) => this.normalizeReservationTransactionLog(row),
      );

      return {
        success: true,
        data: result.rows,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        warnings: result.warnings,
      };
    }

    if (action === 'getTransactionStats') {
      const [paymentTransactions, reservationTransactionLogs] = await Promise.all([
        this.readSchemaRows(
          'payment',
          paymentTransactionsTable,
          req,
          (row) => this.normalizePaymentTransaction(row),
          1000,
        ),
        this.readSchemaRows(
          'reservation',
          reservationTransactionLogsTable,
          req,
          (row) => this.normalizeReservationTransactionLog(row),
          1000,
        ),
      ]);

      const rows = [
        ...paymentTransactions.rows,
        ...reservationTransactionLogs.rows,
      ];

      const statusOf = (row: any) =>
        String(row.status || row.paymentStatus || '').toLowerCase();

      const isPaid = (row: any) =>
        ['paid', 'success', 'succeeded', 'completed'].includes(statusOf(row));

      const isPending = (row: any) =>
        ['pending', 'processing', 'payment_pending'].includes(statusOf(row));

      const isFailed = (row: any) =>
        ['failed', 'cancelled', 'canceled', 'expired'].includes(statusOf(row));

      const totalAmount = rows.reduce(
        (sum: number, row: any) => sum + Number(row.amount || 0),
        0,
      );

      return {
        success: true,
        data: {
          totalTransactions: rows.length,
          totalPaymentTransactions: paymentTransactions.rows.length,
          totalReservationTransactionLogs: reservationTransactionLogs.rows.length,
          totalAmount: Math.round(totalAmount * 100) / 100,
          paid: rows.filter(isPaid).length,
          pending: rows.filter(isPending).length,
          failed: rows.filter(isFailed).length,
          sources: {
            'payment.payment_transactions': paymentTransactions.total,
            'reservation.transaction_logs': reservationTransactionLogs.total,
          },
          warnings: [
            ...paymentTransactions.warnings,
            ...reservationTransactionLogs.warnings,
          ],
        },
      };
    }

    const table = this.client.schema('partner').from('activity_logs');

    if (action === 'getActivityStats') {
      const { count, error } = await table.select('id', {
        count: 'exact',
        head: true,
      });

      if (error) throw new BadRequestException(error.message);

      return { success: true, data: { totalActivity: count || 0 } };
    }

    return this.list(table, req);
  }

  private getPagination(req: RequestWithUser) {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(
      1,
      Math.min(100, Number(req.query.limit || req.query.perPage || 20)),
    );
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return { page, limit, from, to };
  }

  private async readSchemaRows(
    schemaName: string,
    tableName: string,
    req: RequestWithUser,
    mapper: (row: any) => any,
    maxRows?: number,
  ) {
    const pagination = this.getPagination(req);
    const warnings: string[] = [];

    let query = this.client
      .schema(schemaName)
      .from(tableName)
      .select('*', { count: 'exact' });

    const userId = req.query.userId || req.query.user_id;
    const bookingId =
      req.query.bookingId ||
      req.query.booking_id ||
      req.query.reservationId ||
      req.query.reservation_id;
    const status = req.query.status;
    const provider = req.query.provider;
    const paymentMethod = req.query.paymentMethod || req.query.payment_method;

    if (userId) query = query.eq('user_id', String(userId));
    if (bookingId) query = query.eq('booking_id', String(bookingId));
    if (status) query = query.eq('status', String(status));
    if (provider) query = query.eq('provider', String(provider));
    if (paymentMethod) query = query.eq('payment_method', String(paymentMethod));

    if (maxRows) {
      query = query.limit(maxRows);
    } else {
      query = query.range(pagination.from, pagination.to);
    }

    const { data, error, count } = await query;

    if (error) {
      if (this.isMissingPostgrestRelation(error)) {
        warnings.push(`${schemaName}.${tableName}: ${error.message}`);
        return {
          rows: [],
          total: 0,
          page: pagination.page,
          totalPages: 0,
          warnings,
        };
      }

      throw new BadRequestException(
        `Unable to read ${schemaName}.${tableName}: ${error.message}`,
      );
    }

    const rows = (data || []).map(mapper);

    return {
      rows,
      total: count ?? rows.length,
      page: pagination.page,
      totalPages: Math.ceil((count ?? rows.length) / pagination.limit),
      warnings,
    };
  }

  private isMissingPostgrestRelation(error: any) {
    const message = String(error?.message || '').toLowerCase();
    const code = String(error?.code || '').toUpperCase();

    return (
      code === 'PGRST205' ||
      code === 'PGRST202' ||
      message.includes('could not find the table') ||
      message.includes('could not find the relation') ||
      message.includes('does not exist')
    );
  }

  private normalizePaymentTransaction(row: any) {
    const amount = Number(
      row.amount ??
      row.total_amount ??
      row.totalAmount ??
      row.final_amount ??
      row.finalAmount ??
      0,
    );

    const status =
      row.status ||
      row.payment_status ||
      row.paymentStatus ||
      row.transaction_status ||
      row.transactionStatus ||
      'unknown';

    const paymentMethod =
      row.payment_method ||
      row.paymentMethod ||
      row.method ||
      row.provider ||
      null;

    const reference =
      row.payment_reference ||
      row.paymentReference ||
      row.reference ||
      row.reference_number ||
      row.referenceNumber ||
      row.checkout_session_id ||
      row.checkoutSessionId ||
      row.payment_session_id ||
      row.paymentSessionId ||
      null;

    return {
      ...row,
      source: 'payment.payment_transactions',
      id: row.id,
      _id: String(row.id || ''),
      bookingId:
        row.booking_id ||
        row.bookingId ||
        row.reservation_id ||
        row.reservationId ||
        null,
      userId: row.user_id || row.userId || null,
      amount,
      status,
      provider: row.provider || null,
      paymentMethod,
      reference,
      paymentReference: reference,
      createdAt:
        row.created_at ||
        row.createdAt ||
        row.created ||
        row.transaction_date ||
        row.transactionDate ||
        null,
      updatedAt: row.updated_at || row.updatedAt || null,
    };
  }

  private normalizeReservationTransactionLog(row: any) {
    const amount = Number(
      row.amount ??
      row.total_amount ??
      row.totalAmount ??
      row.final_amount ??
      row.finalAmount ??
      0,
    );

    const status =
      row.status ||
      row.payment_status ||
      row.paymentStatus ||
      row.action ||
      row.event ||
      'logged';

    const reference =
      row.payment_reference ||
      row.paymentReference ||
      row.reference ||
      row.reference_number ||
      row.referenceNumber ||
      row.checkout_session_id ||
      row.checkoutSessionId ||
      row.payment_session_id ||
      row.paymentSessionId ||
      null;

    return {
      ...row,
      source: 'reservation.transaction_logs',
      id: row.id,
      _id: String(row.id || ''),
      bookingId:
        row.booking_id ||
        row.bookingId ||
        row.reservation_id ||
        row.reservationId ||
        null,
      userId: row.user_id || row.userId || null,
      amount,
      status,
      provider: row.provider || null,
      paymentMethod:
        row.payment_method ||
        row.paymentMethod ||
        row.method ||
        row.provider ||
        null,
      reference,
      paymentReference: reference,
      message:
        row.message ||
        row.description ||
        row.details ||
        row.action ||
        row.event ||
        '',
      createdAt:
        row.created_at ||
        row.createdAt ||
        row.created ||
        row.logged_at ||
        row.loggedAt ||
        null,
      updatedAt: row.updated_at || row.updatedAt || null,
    };
  }

  private async upload(action: string, req: RequestWithUser) {
    if (action === 'getMyUploads') return this.listWhere(this.client.schema('teller').from('uploads'), req, 'user_id', this.getRequestUserId(req));
    if (action === 'deleteUpload') return this.deleteById(this.client.schema('teller').from('uploads'), req.params.id);
    const file = req.file;
    if (!file) throw new BadRequestException('No file uploaded');

    const folder = String((req as any).uploadFolder || 'uploads').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    const userId = this.getRequestUserId(req) || 'anonymous';
    const extension = file.originalname.includes('.') ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase() : '';
    const path = `${folder}/${userId}/${Date.now()}-${randomBytes(6).toString('hex')}${extension}`;
    const bucket = this.configService.get<string>('SUPABASE_UPLOAD_BUCKET') || 'pakipark-uploads';

    const { error: uploadError } = await this.client.storage.from(bucket).upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
    if (uploadError) throw new BadRequestException(uploadError.message);

    const { data: publicUrlData } = this.client.storage.from(bucket).getPublicUrl(path);
    const url = publicUrlData.publicUrl;

    if (action === 'uploadAvatar') {
      await this.client.schema('account').from('profiles').update({ profile_picture: url }).eq('id', userId);
    }

    return {
      success: true,
      data: {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path,
        url,
      },
    };
  }

  private async webhook(action: string, req: RequestWithUser) {
    if (action !== 'paymentStatus') throw new BadRequestException(`Unsupported webhook action ${action}`);
    const { bookingId, status, paymentId } = req.body;
    return this.updateById(this.client.schema('reservation').from('bookings'), bookingId, {
      paymentStatus: status,
      paymentId,
      status: status === 'paid' ? 'upcoming' : 'payment_failed',
    });
  }


  private normalizeProfileResponse(user: any) {
    const fullName = user.full_name || user.name || '';
    const [firstName = '', ...lastParts] = String(fullName).trim().split(/\s+/).filter(Boolean);
    const email = String(user.email || '').endsWith('@phone.pakipark.local') ? '' : user.email || '';
    return {
      ...user,
      id: user.id,
      _id: String(user.id || ''),
      full_name: fullName,
      name: fullName,
      email,
      phone: user.phone || '',
      role: user.role || 'customer',
      address: user.address || '',
      dob: user.dob || user.date_of_birth || user.dateOfBirth || '',
      dateOfBirth: user.dateOfBirth || user.date_of_birth || user.dob || '',
      profile_picture: user.profile_picture || user.profilePicture || null,
      profilePicture: user.profilePicture || user.profile_picture || null,
      two_factor_enabled: user.two_factor_enabled ?? user.twoFactorEnabled ?? false,
      is_verified: user.is_verified ?? user.isVerified ?? false,
      created_at: user.created_at || user.createdAt || '',
      createdAt: user.createdAt || user.created_at || '',
      account_table: user.account_table || 'profiles',
      first_name: user.first_name || user.firstName || firstName,
      last_name: user.last_name || user.lastName || lastParts.join(' '),
      mobile_number: user.mobile_number || user.phone || '',
      date_of_birth: user.date_of_birth || user.dob || user.dateOfBirth || '',
      profile_photo_url: user.profile_photo_url || user.profile_picture || user.profilePicture || null,
    };
  }

  private mapProfileUpdatePayload(body: any) {
    const payload: Record<string, unknown> = {};
    const firstName = body.first_name || body.firstName;
    const lastName = body.last_name || body.lastName;
    if (body.full_name || body.name || firstName || lastName) payload.full_name = body.full_name || body.name || `${firstName || ''} ${lastName || ''}`.trim();
    if (body.email !== undefined) payload.email = body.email;
    if (body.phone !== undefined || body.mobile_number !== undefined) payload.phone = body.phone || body.mobile_number;
    if (body.address !== undefined) payload.address = typeof body.address === 'string' ? body.address : JSON.stringify(body.address || {});
    if (body.dob !== undefined || body.date_of_birth !== undefined || body.dateOfBirth !== undefined) payload.dob = body.dob || body.date_of_birth || body.dateOfBirth;
    if (body.profile_picture !== undefined || body.profilePicture !== undefined || body.profile_photo_url !== undefined) payload.profile_picture = body.profile_picture || body.profilePicture || body.profile_photo_url;
    return payload;
  }

  private normalizeLocation(row: any) {
    return {
      ...row,
      id: row.id,
      _id: String(row.id || ''),
      totalSpots: row.totalSpots ?? row.total_spots ?? row.totalspots ?? 0,
      availableSpots: row.availableSpots ?? row.available_spots ?? row.availablespots ?? 0,
      hourlyRate: row.hourlyRate ?? row.hourly_rate ?? row.price_per_hour ?? 0,
      pricePerHour: row.pricePerHour ?? row.price_per_hour ?? row.hourly_rate ?? 0,
      imageUrl: row.imageUrl ?? row.image_url ?? null,
      ownerId: row.ownerId ?? row.owner_id ?? null,
      isActive: row.isActive ?? row.is_active ?? true,
      createdAt: row.createdAt || row.created_at || null,
      updatedAt: row.updatedAt || row.updated_at || null,
    };
  }

  private mapLocationPayload(body: any) {
    const payload: Record<string, unknown> = { ...body };
    if (body.totalSpots !== undefined) payload.total_spots = Number(body.totalSpots);
    if (body.availableSpots !== undefined) payload.available_spots = Number(body.availableSpots);
    if (body.hourlyRate !== undefined) payload.hourly_rate = Number(body.hourlyRate);
    if (body.pricePerHour !== undefined) payload.price_per_hour = Number(body.pricePerHour);
    if (body.imageUrl !== undefined) payload.image_url = body.imageUrl;
    if (body.ownerId !== undefined) payload.owner_id = body.ownerId;
    if (body.isActive !== undefined) payload.is_active = body.isActive;
    if (body.operatingHours !== undefined) payload.operating_hours = body.operatingHours;
    ['totalSpots', 'availableSpots', 'hourlyRate', 'pricePerHour', 'imageUrl', 'ownerId', 'isActive', 'operatingHours'].forEach((key) => delete payload[key]);
    return payload;
  }

  private normalizeParkingSlot(row: any) {
    const label = row.label || row.slotNumber || row.slot_number || row.spot || '';
    return {
      ...row,
      id: row.id,
      _id: String(row.id || ''),
      label,
      slotNumber: label,
      slot_number: label,
      locationId: row.locationId || row.location_id,
      location_id: row.location_id || row.locationId,
      vehicleTypeAllowed: row.vehicleTypeAllowed || row.vehicle_type_allowed || row.type || 'any',
      createdAt: row.createdAt || row.created_at || null,
      updatedAt: row.updatedAt || row.updated_at || null,
    };
  }

  private mapParkingSlotPayload(body: any) {
    const payload: Record<string, unknown> = { ...body };
    payload.location_id = body.location_id || body.locationId;
    payload.label = body.label || body.slotNumber || body.slot_number || body.spot;
    payload.section = body.section || String(payload.label || 'A1').match(/^[A-Za-z]+/)?.[0] || 'A';
    payload.floor = Number(body.floor || 1);
    payload.type = body.type || 'regular';
    payload.status = body.status || 'available';
    if (body.vehicleTypeAllowed !== undefined) payload.vehicle_type_allowed = body.vehicleTypeAllowed;
    ['locationId', 'slotNumber', 'slot_number', 'spot', 'vehicleTypeAllowed'].forEach((key) => delete payload[key]);
    return payload;
  }

  private normalizeNotification(row: any) {
    return {
      ...row,
      _id: String(row.id || row._id || ''),
      id: row.id,
      userId: row.userId || row.user_id,
      isRead: row.isRead ?? row.is_read ?? row.read ?? false,
      entityType: row.entityType || row.entity_type || null,
      entityId: row.entityId || row.entity_id || null,
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
      body: row.body || row.message || '',
    };
  }

  private getReviewBodyValue(body: any, keys: string[]) {
    for (const key of keys) {
      const value = body?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }

    return null;
  }

  private getReviewBookingId(body: any) {
    const directValue = this.getReviewBodyValue(body, [
      'booking_id',
      'bookingId',
      'reservation_id',
      'reservationId',
      'bookingID',
      'reservationID',
    ]);

    if (directValue) return directValue;

    return (
      body?.booking?.id ||
      body?.booking?._id ||
      body?.booking?.booking_id ||
      body?.booking?.bookingId ||
      body?.reservation?.id ||
      body?.reservation?._id ||
      body?.reservation?.booking_id ||
      body?.reservation?.bookingId ||
      null
    );
  }

  private getReviewLocationId(body: any) {
    const directValue = this.getReviewBodyValue(body, [
      'location_id',
      'locationId',
      'parking_lot_id',
      'parkingLotId',
    ]);

    if (directValue) return directValue;

    return (
      body?.location?.id ||
      body?.location?._id ||
      body?.booking?.location_id ||
      body?.booking?.locationId ||
      body?.reservation?.location_id ||
      body?.reservation?.locationId ||
      null
    );
  }

  private async findBookingBySubmittedId(adminClient: any, rawBookingId: unknown) {
    const bookingId = String(rawBookingId || '').trim();
    if (!bookingId) return null;

    const selectColumns = 'id,user_id,location_id,status,reference,barcode,createdAt,date';

    if (UUID_REGEX.test(bookingId)) {
      const { data, error } = await adminClient
        .schema('reservation')
        .from('bookings')
        .select(selectColumns)
        .eq('id', bookingId)
        .maybeSingle();

      if (error) throw new BadRequestException(error.message);
      if (data) return data;
    }

    const { data: byReference, error: referenceError } = await adminClient
      .schema('reservation')
      .from('bookings')
      .select(selectColumns)
      .eq('reference', bookingId)
      .maybeSingle();

    if (referenceError) throw new BadRequestException(referenceError.message);
    if (byReference) return byReference;

    const { data: byBarcode, error: barcodeError } = await adminClient
      .schema('reservation')
      .from('bookings')
      .select(selectColumns)
      .eq('barcode', bookingId)
      .maybeSingle();

    if (barcodeError) throw new BadRequestException(barcodeError.message);
    return byBarcode || null;
  }

  private async resolveReviewBooking(adminClient: any, req: RequestWithUser, userId: string) {
    const body = req.body || {};
    const submittedBookingId =
      this.getReviewBookingId(body) ||
      req.params?.bookingId ||
      req.params?.booking_id ||
      req.query?.bookingId ||
      req.query?.booking_id ||
      null;

    const submittedLocationId =
      this.getReviewLocationId(body) ||
      req.params?.locationId ||
      req.params?.location_id ||
      req.query?.locationId ||
      req.query?.location_id ||
      null;

    if (submittedBookingId) {
      const booking = await this.findBookingBySubmittedId(adminClient, submittedBookingId);

      if (!booking) {
        throw new BadRequestException('Booking was not found. Send a valid bookingId/reservationId when creating a review.');
      }

      if (String(booking.user_id) !== String(userId)) {
        throw new BadRequestException('You can only review your own booking.');
      }

      if (
        submittedLocationId &&
        booking.location_id &&
        String(booking.location_id) !== String(submittedLocationId)
      ) {
        throw new BadRequestException('Review location does not match the booking location.');
      }

      return booking;
    }

    if (!submittedLocationId) {
      throw new BadRequestException('Missing booking ID. Send bookingId or reservationId when creating a review.');
    }

    const { data: booking, error } = await adminClient
      .schema('reservation')
      .from('bookings')
      .select('id,user_id,location_id,status,reference,barcode,createdAt,date')
      .eq('user_id', userId)
      .eq('location_id', submittedLocationId)
      .in('status', ['completed', 'active', 'upcoming', 'payment_pending'])
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);

    if (!booking) {
      throw new BadRequestException('No booking was found for this location. Send bookingId or reservationId when creating a review.');
    }

    return booking;
  }

  private mapReviewPayload(body: any, userId: string, booking: any) {
    const rating = Number(body.rating || 0);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be an integer from 1 to 5.');
    }

    if (!booking?.id) {
      throw new BadRequestException('Missing booking ID. Send bookingId or reservationId when creating a review.');
    }

    if (!booking?.location_id) {
      throw new BadRequestException('The selected booking has no location ID.');
    }

    return {
      user_id: userId,
      location_id: booking.location_id,
      booking_id: booking.id,
      rating,
      comment: body.comment || null,
    };
  }

  private normalizeReview(row: any) {
    return {
      ...row,
      _id: String(row.id || ''),
      id: String(row.id || ''),
      userId: row.userId || row.user_id || null,
      locationId: row.locationId || row.location_id || null,
      bookingId: row.bookingId || row.booking_id || null,
      rating: Number(row.rating || 0),
      comment: row.comment || null,
      userName: row.userName || row.user_name || null,
      userAvatar: row.userAvatar || row.user_avatar || null,
      locationName: row.locationName || row.location_name || null,
      createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    };
  }

  private normalizeParkingRate(row: any) {
    return {
      ...row,
      id: row.id,
      _id: String(row.id || ''),
      vehicleType: row.vehicleType || row.vehicle_type || row.type,
      hourlyRate: Number(row.hourlyRate ?? row.hourly_rate ?? row.rate ?? 0),
      dailyRate: Number(row.dailyRate ?? row.daily_rate ?? row.rate ?? 0),
      isActive: row.isActive ?? row.is_active ?? true,
    };
  }

  private mapParkingRatePayload(body: any) {
    const payload: Record<string, unknown> = { ...body };
    if (body.vehicleType !== undefined) payload.type = body.vehicleType;
    if (body.hourlyRate !== undefined) payload.rate = Number(body.hourlyRate);
    if (body.rate !== undefined) payload.rate = Number(body.rate);
    ['vehicleType', 'hourlyRate', 'dailyRate', 'isActive'].forEach((key) => delete payload[key]);
    return payload;
  }

  private mapPricingRulePayload(body: any) {
    const payload: Record<string, unknown> = { ...body };
    if (body.locationId !== undefined) payload.location_id = body.locationId;
    if (body.ruleType !== undefined) payload.rule_type = body.ruleType;
    if (body.startTime !== undefined) payload.start_time = body.startTime;
    if (body.endTime !== undefined) payload.end_time = body.endTime;
    if (body.isActive !== undefined) payload.is_active = body.isActive;
    ['locationId', 'ruleType', 'startTime', 'endTime', 'isActive'].forEach((key) => delete payload[key]);
    return payload;
  }

  private mapPaymentMethodPayload(body: any, userId: string, partial = false) {
    const payload: Record<string, unknown> = partial ? {} : { user_id: userId };
    const copy = (from: string, to: string = from) => {
      if (body[from] !== undefined) payload[to] = body[from];
    };
    copy('paymentType', 'payment_type');
    copy('provider');
    copy('accountName', 'account_name');
    copy('mobileNumber', 'mobile_number');
    copy('accountNumber', 'account_number');
    copy('lastFourDigits', 'last_four_digits');
    copy('isDefault', 'is_default');
    copy('displayLabel', 'display_label');
    copy('status');
    return payload;
  }

  private normalizePaymentMethodRecord(row: any) {
    return {
      ...row,
      _id: String(row.id || ''),
      id: row.id,
      paymentType: row.paymentType || row.payment_type,
      accountName: row.accountName || row.account_name,
      mobileNumber: row.mobileNumber || row.mobile_number,
      accountNumber: row.accountNumber || row.account_number,
      lastFourDigits: row.lastFourDigits || row.last_four_digits,
      displayLabel: row.displayLabel || row.display_label || row.provider || 'Payment Method',
      isDefault: row.isDefault ?? row.is_default ?? false,
      createdAt: row.createdAt || row.created_at || null,
    };
  }

  private resetKey(identifier: string) {
    const raw = String(identifier || '').trim();
    const normalizedPhone = normalizePhone(raw);
    return isEmail(raw) ? raw.toLowerCase() : normalizedPhone || raw.toLowerCase();
  }

  private async findProfileForIdentifier(identifier: string) {
    const raw = String(identifier || '').trim();
    const normalizedPhone = normalizePhone(raw);
    if (isEmail(raw)) {
      const { data } = await this.client.schema('account').from('profiles').select('*').eq('email', raw.toLowerCase()).maybeSingle();
      return data;
    }
    if (normalizedPhone) {
      const { data } = await this.client.schema('account').from('profiles').select('*').eq('phone', normalizedPhone).maybeSingle();
      return data;
    }
    return null;
  }

  private async startPasswordReset(body: any) {
    const identifier = body.identifier || body.email || body.phone;
    const profile = await this.findProfileForIdentifier(identifier);
    if (profile?.id) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      this.passwordResetOtps.set(this.resetKey(identifier), {
        code,
        userId: profile.id,
        authEmail: profile.email || phoneEmail(profile.phone || ''),
        expiresAt: Date.now() + 10 * 60_000,
      });
      return {
        success: true,
        message: 'If an account was found, a verification code has been sent.',
        data: process.env.NODE_ENV === 'production' ? undefined : { devOtp: code },
      };
    }
    return { success: true, message: 'If an account was found, a verification code has been sent.' };
  }

  private async verifyPasswordResetOtp(body: any) {
    const identifier = body.identifier || body.email || body.phone;
    const entry = this.passwordResetOtps.get(this.resetKey(identifier));
    if (!entry || entry.expiresAt < Date.now() || entry.code !== String(body.otp || body.code || '').trim()) {
      throw new BadRequestException('Invalid or expired verification code.');
    }
    const resetToken = randomBytes(32).toString('hex');
    this.passwordResetTokens.set(resetToken, { userId: entry.userId, expiresAt: Date.now() + 15 * 60_000 });
    this.passwordResetOtps.delete(this.resetKey(identifier));
    return { success: true, data: { resetToken } };
  }

  private async resetPassword(body: any) {
    const resetToken = String(body.resetToken || '').trim();
    const entry = this.passwordResetTokens.get(resetToken);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token.');
    }
    if (!body.newPassword || String(body.newPassword).length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }
    const { error } = await this.client.auth.admin.updateUserById(entry.userId, { password: body.newPassword });
    if (error) throw new BadRequestException(error.message);
    this.passwordResetTokens.delete(resetToken);
    return { success: true, message: 'Password reset successfully.' };
  }

  private async changePassword(req: RequestWithUser) {
    const user = req.user;
    const currentPassword = req.body.currentPassword || req.body.current_password;
    const newPassword = req.body.newPassword || req.body.new_password;
    if (!currentPassword || !newPassword) throw new BadRequestException('Current and new password are required.');
    if (String(newPassword).length < 8) throw new BadRequestException('Password must be at least 8 characters.');
    const authEmail = user.email || phoneEmail(user.phone || '');
    const { error: verifyError } = await this.client.auth.signInWithPassword({ email: authEmail, password: currentPassword });
    if (verifyError) throw new BadRequestException('Current password is incorrect.');
    const { error } = await this.client.auth.admin.updateUserById(user.supabaseId || user.id, { password: newPassword });
    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'Password changed successfully.' };
  }

  private async softDeleteAccount(req: RequestWithUser) {
    const userId = this.getRequestUserId(req);
    const table = this.client.schema('account').from(req.user?.account_table === 'users' ? 'users' : 'profiles');
    const payload = req.user?.account_table === 'users'
      ? { deletedAt: new Date().toISOString() }
      : { deleted_at: new Date().toISOString(), is_active: false };
    return this.updateById(table, req.user?.id, payload);
  }

  private base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  private base32Encode(buffer: Buffer) {
    let bits = '';
    for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
    return bits.match(/.{1,5}/g)?.map((chunk) => this.base32Alphabet[parseInt(chunk.padEnd(5, '0'), 2)]).join('') || '';
  }

  private base32Decode(secret: string) {
    const clean = String(secret || '').replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
    let bits = '';
    for (const char of clean) {
      const value = this.base32Alphabet.indexOf(char);
      if (value < 0) continue;
      bits += value.toString(2).padStart(5, '0');
    }
    const bytes = bits.match(/.{8}/g)?.map((byte) => parseInt(byte, 2)) || [];
    return Buffer.from(bytes);
  }

  private generateTotp(secret: string, step = 0) {
    const counter = Math.floor(Date.now() / 30000) + step;
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buffer.writeUInt32BE(counter & 0xffffffff, 4);
    const hmac = createHmac('sha1', this.base32Decode(secret)).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
    return String(code % 1000000).padStart(6, '0');
  }

  private verifyTotp(secret: string, code: string) {
    if (!/^\d{6}$/.test(String(code || ''))) return false;
    return [-1, 0, 1].some((step) => {
      const expected = Buffer.from(this.generateTotp(secret, step));
      const actual = Buffer.from(String(code));
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    });
  }

  private async setupTwoFactor(userId: string) {
    const secret = this.base32Encode(randomBytes(20));
    const { error } = await this.client.schema('account').from('profiles').update({ two_factor_secret: secret, two_factor_enabled: false }).eq('id', userId);
    if (error) throw new BadRequestException(error.message);
    const issuer = encodeURIComponent('PakiPark');
    const label = encodeURIComponent(`PakiPark:${userId}`);
    return { success: true, data: { secret, otpUri: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}` } };
  }

  private async verifyTwoFactor(userId: string, code: string) {
    const { data, error } = await this.client.schema('account').from('profiles').select('two_factor_secret').eq('id', userId).single();
    if (error) throw new BadRequestException(error.message);
    if (!data?.two_factor_secret || !this.verifyTotp(data.two_factor_secret, code)) {
      throw new BadRequestException('Invalid two-factor code.');
    }
    const { error: updateError } = await this.client.schema('account').from('profiles').update({ two_factor_enabled: true }).eq('id', userId);
    if (updateError) throw new BadRequestException(updateError.message);
    return { success: true, message: 'Two-factor authentication enabled.' };
  }

  private async disableTwoFactor(req: RequestWithUser) {
    await this.changePassword({ ...req, body: { currentPassword: req.body.password, newPassword: req.body.password } } as RequestWithUser).catch((error) => {
      throw new BadRequestException(error.message || 'Password verification failed.');
    });
    const userId = this.getRequestUserId(req);
    const { error } = await this.client.schema('account').from('profiles').update({ two_factor_enabled: false, two_factor_secret: null }).eq('id', userId);
    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'Two-factor authentication disabled.' };
  }

  private async buildGroupedBookingMetric(kind: 'revenue' | 'occupancy' | 'vehicleType' | 'paymentMethod', locationId: string | null) {
    let query = this.client.schema('reservation').from('bookings').select('*');
    if (locationId) query = query.eq('location_id', locationId);
    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    const rows = data || [];

    if (kind === 'vehicleType') {
      const grouped = this.countBy(rows, (row) => row.vehicleType || row.vehicle_type || 'Unknown');
      return { success: true, data: Object.entries(grouped).map(([type, count]) => ({ type, count })) };
    }
    if (kind === 'paymentMethod') {
      const grouped = this.countBy(rows, (row) => row.paymentMethod || row.payment_method || 'Unknown');
      return { success: true, data: Object.entries(grouped).map(([method, count]) => ({ method, count })) };
    }

    const grouped = rows.reduce((acc: Record<string, number>, row: any) => {
      const key = String(row.date || row.created_at || row.createdAt || '').slice(0, 10) || 'unknown';
      acc[key] = acc[key] || 0;
      acc[key] += kind === 'revenue' ? Number(row.finalAmount || row.final_amount || row.amount || 0) : 1;
      return acc;
    }, {});
    return { success: true, data: { labels: Object.keys(grouped), datasets: [{ data: Object.values(grouped) }] } };
  }

  private countBy(rows: any[], getKey: (row: any) => string) {
    return rows.reduce((acc: Record<string, number>, row) => {
      const key = getKey(row);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private crudByAction(table: any, action: string, req: RequestWithUser) {
    if (action.startsWith('get')) return this.list(table, req);
    if (action.startsWith('create')) return this.insert(table, req.body);
    if (action.startsWith('update')) return this.updateById(table, req.params.id, req.body);
    if (action.startsWith('delete')) return this.deleteById(table, req.params.id);
    throw new BadRequestException(`Unsupported CRUD action ${action}`);
  }

  private async list(query: any, req: RequestWithUser, mapper: (row: any) => any = (row) => row) {
    const { data, error, count } = await query.select('*', { count: 'exact' });
    if (error) throw new BadRequestException(error.message);
    return { success: true, data: Array.isArray(data) ? data.map(mapper) : data, total: count ?? undefined };
  }

  private async listWhere(query: any, req: RequestWithUser, column: string, value: unknown, mapper: (row: any) => any = (row) => row) {
    const { data, error, count } = await query.select('*', { count: 'exact' }).eq(column, value);
    if (error) throw new BadRequestException(error.message);
    return { success: true, data: Array.isArray(data) ? data.map(mapper) : data, total: count ?? undefined };
  }

  private async listPartnerProfiles(req: RequestWithUser) {
    const { data, error, count } = await this.client
      .schema('account')
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'business_partner')
      .eq('is_verified', false);
    if (error) throw new BadRequestException(error.message);
    return { success: true, data, total: count ?? undefined };
  }

  private async getById(query: any, id: string | number, mapper: (row: any) => any = (row) => row) {
    const { data, error } = await query.select('*').eq('id', id).single();
    if (error) throw new BadRequestException(error.message);
    return { success: true, data: mapper(data) };
  }

  private async insert(query: any, payload: Record<string, unknown>) {
    const { data, error } = await query.insert(payload).select().single();
    if (error) throw new BadRequestException(error.message);
    return { success: true, data };
  }

  private async updateById(query: any, id: string | number, payload: Record<string, unknown>, mapper: (row: any) => any = (row) => row) {
    const { data, error } = await query.update(payload).eq('id', id).select().single();
    if (error) throw new BadRequestException(error.message);
    return { success: true, data: mapper(data) };
  }

  private async updateWhere(query: any, payload: Record<string, unknown>, column: string, value: unknown) {
    const { data, error } = await query.update(payload).eq(column, value).select();
    if (error) throw new BadRequestException(error.message);
    return { success: true, data };
  }

  private async deleteById(query: any, id: string | number) {
    const { error } = await query.delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'Deleted' };
  }

  private async deleteWhere(query: any, column: string, value: unknown) {
    const { error } = await query.delete().eq(column, value);
    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'Deleted' };
  }

  private async availableSlots(locationId: string, date?: string) {
    const requestedDate = date || new Date().toISOString().slice(0, 10);
    const allSlots = Array.from({ length: 17 }, (_, index) => {
      const hour = index + 6;
      return `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;
    });

    if (!UUID_REGEX.test(String(locationId))) {
      return allSlots.map((slot) => ({ slot, booked: 0, totalSpots: 0, available: 0, isFull: false }));
    }

    const { data: location } = await this.client
      .schema('parking_lot')
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .maybeSingle();

    const slots = await this.selectParkingSlots(this.client, locationId);
    const activeSlots = (slots || []).filter((slot: any) => String(slot.status || 'available').toLowerCase() !== 'maintenance');
    const physicalSlotCount = activeSlots.length;
    const totalSpots = physicalSlotCount || this.getLocationTotalSpots(location);

    const { data: bookings } = await this.client
      .schema('reservation')
      .from('bookings')
      .select('timeSlot,status,date,parking_slot_id,spot')
      .eq('location_id', locationId)
      .eq('date', requestedDate)
      .in('status', ['upcoming', 'active', 'payment_pending']);

    return allSlots.map((slot) => {
      const overlappingBookings = (bookings || []).filter((booking: any) => {
        if (!windowsOverlap(booking.timeSlot, slot)) return false;
        if (booking.status === 'active' || booking.status === 'payment_pending') return true;
        if (booking.status === 'upcoming') return !isNoShowBooking(booking);
        return false;
      });

      const booked = overlappingBookings.length;
      const available = Math.max(0, totalSpots - booked);

      return {
        slot,
        booked,
        totalSpots,
        available,
        isFull: totalSpots > 0 && available <= 0,
        bookedSlots: overlappingBookings.map((booking: any) => ({
          spot: booking.spot,
          parking_slot_id: booking.parking_slot_id,
          timeSlot: booking.timeSlot,
          status: booking.status,
        })),
      };
    });
  }

}
