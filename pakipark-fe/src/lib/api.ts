import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAppConfig } from '@config/appConfig';
import type { Booking, LocationItem, Vehicle, VehicleFormData, VehicleType } from '@features/customer/types';

const AUTH_TOKEN_KEY = 'pakipark_api_token';
const AUTH_USER_KEY = 'pakipark_api_user';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field?: string; message?: string }[];
};

export type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
};

export type ReviewRecord = {
  _id: string;
  id: string;
  userId: string;
  locationId: string | null;
  bookingId: string | null;
  rating: number;
  comment: string | null;
  userName: string | null;
  userAvatar: string | null;
  locationName: string | null;
  createdAt: string;
};

export type ApiUser = {
  _id: string;
  id?: string;
  full_name?: string;
  name?: string;
  email: string;
  phone?: string | null;
  role: 'customer' | 'admin' | 'staff' | 'teller' | 'partner' | 'business_partner';
  profile_picture?: string | null;
  profilePicture?: string | null;
  address?: string | { street?: string; city?: string; province?: string } | null;
  dob?: string | null;
  dateOfBirth?: string | null;
  two_factor_enabled?: boolean;
  is_verified?: boolean;
  created_at?: string;
  createdAt?: string;
  account_table?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  mobile_number?: string | null;
  date_of_birth?: string | null;
  profile_photo_url?: string | null;
  token?: string;
  paymentMethods?: any[];
};

export type LoginResult = ApiUser & {
  message?: string;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

type BookingId = string | number;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RegisterPartnerPayload = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    province: string;
  };
  documents: {
    permit: { uri: string; name: string; type: string };
    registration: { uri: string; name: string; type: string };
    ownership: { uri: string; name: string; type: string };
  };
};

function getBaseUrl() {
  return getAppConfig().apiBaseUrl.replace(/\/$/, '');
}

async function getToken() {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

function normalizeApiUser(raw: ApiUser): ApiUser {
  const fullName = raw.full_name || raw.name || '';
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = raw.first_name || raw.firstName || nameParts[0] || '';
  const lastName = raw.last_name || raw.lastName || nameParts.slice(1).join(' ') || '';
  const displayName = fullName || `${firstName} ${lastName}`.trim();

  return {
    ...raw,
    _id: String(raw._id || raw.id || ''),
    full_name: displayName,
    name: displayName,
    email: raw.email || '',
    phone: raw.phone || '',
    profile_picture: raw.profile_picture || raw.profilePicture || null,
    profilePicture: raw.profilePicture || raw.profile_picture || null,
    dob: raw.dob || raw.date_of_birth || raw.dateOfBirth || '',
    dateOfBirth: raw.dateOfBirth || raw.date_of_birth || raw.dob || '',
    createdAt: raw.createdAt || raw.created_at,
    first_name: firstName,
    last_name: lastName,
    firstName,
    lastName,
    mobile_number: raw.mobile_number || raw.phone || '',
    date_of_birth: raw.date_of_birth || raw.dob || raw.dateOfBirth || '',
    profile_photo_url: raw.profile_photo_url || raw.profile_picture || raw.profilePicture || null,
    two_factor_enabled: false,
  };
}

export async function saveSession(user: ApiUser) {
  const existingToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const normalizedUser = normalizeApiUser(user);
  const token = normalizedUser.token || existingToken || undefined;
  const userToStore = token ? { ...normalizedUser, token } : normalizedUser;

  console.log('[saveSession] Saving session. Token present:', !!token);

  if (user.token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, user.token);
  }

  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userToStore));
}

export async function getSavedUser() {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  return raw ? normalizeApiUser(JSON.parse(raw) as ApiUser) : null;
}

export async function clearSession() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
}

async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...(options.body && !isMultipart ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.auth) {
    const token = await getToken();
    console.log(`[apiRequest] Token for ${path}:`, token ? 'Present' : 'MISSING');

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      throw new Error('Authentication required but no token found in storage.');
    }
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const json = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!response.ok || json.success === false) {
    const detail = json.errors?.map((error) => error.message).filter(Boolean).join('\n');
    throw new Error(detail || json.message || `Request failed with status ${response.status}`);
  }

  return json.data as T;
}


export const api = {
  async get<T = any>(path: string, auth = true): Promise<ApiEnvelope<T>> {
    const data = await apiRequest<T>(path, { auth });
    return { success: true, data };
  },

  async post<T = any>(path: string, body?: unknown, auth = true): Promise<ApiEnvelope<T>> {
    const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;
    const data = await apiRequest<T>(path, {
      method: 'POST',
      auth,
      body: isMultipart ? (body as BodyInit) : JSON.stringify(body ?? {}),
    });
    return { success: true, data };
  },

  async put<T = any>(path: string, body?: unknown, auth = true): Promise<ApiEnvelope<T>> {
    const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;
    const data = await apiRequest<T>(path, {
      method: 'PUT',
      auth,
      body: isMultipart ? (body as BodyInit) : JSON.stringify(body ?? {}),
    });
    return { success: true, data };
  },

  async patch<T = any>(path: string, body?: unknown, auth = true): Promise<ApiEnvelope<T>> {
    const data = await apiRequest<T>(path, {
      method: 'PATCH',
      auth,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { success: true, data };
  },

  async delete<T = any>(path: string, auth = true): Promise<ApiEnvelope<T>> {
    const data = await apiRequest<T>(path, { method: 'DELETE', auth });
    return { success: true, data };
  },

  async deleteWithBody<T = any>(path: string, body?: unknown, auth = true): Promise<ApiEnvelope<T>> {
    const data = await apiRequest<T>(path, {
      method: 'DELETE',
      auth,
      body: JSON.stringify(body ?? {}),
    });
    return { success: true, data };
  },
};

function normalizeVehicle(vehicle: any): Vehicle {
  const type = (vehicle.type || 'sedan') as VehicleType;

  return {
    id: vehicle.id,
    _id: String(vehicle._id || vehicle.id),
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    color: vehicle.color || '',
    plate_number: vehicle.plate_number || vehicle.plateNumber || '',
    user_id: vehicle.user_id,
    type,
    orDoc: vehicle.or_doc || vehicle.orDoc || null,
    crDoc: vehicle.cr_doc || vehicle.crDoc || null,
  };
}

function firstUuid(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && UUID_PATTERN.test(value));
}

function normalizeBooking(booking: any): Booking {
  const vehicle =
    (booking.vehicleId && typeof booking.vehicleId === 'object' ? booking.vehicleId : null) ||
    booking.vehicles ||
    booking.vehicle ||
    {};

  const location =
    (booking.locationId && typeof booking.locationId === 'object' ? booking.locationId : null) ||
    booking.locations ||
    booking.location ||
    {};

  const rawStatus = String(booking.status || '').toLowerCase();

  let status: Booking['status'] = 'active';
  if (rawStatus === 'cancelled' || rawStatus === 'canceled') {
    status = 'cancelled';
  } else if (rawStatus === 'completed') {
    status = 'completed';
  } else if (rawStatus === 'upcoming') {
    status = 'upcoming';
  } else if (rawStatus === 'payment_pending') {
    status = 'payment_pending';
  } else if (rawStatus === 'no_show') {
    status = 'no_show';
  }

  const plate_number = booking.vehiclePlateNumber || vehicle.plate_number || vehicle.plateNumber || '';
  const vehicleLabel = booking.vehiclePlateNumber
    ? `${booking.vehicleType || 'Vehicle'} (${booking.vehiclePlateNumber})`
    : vehicle.brand
      ? `${vehicle.brand} ${vehicle.model || ''} (${plate_number})`
      : booking.vehiclePlate || 'Vehicle';

  return {
    id: String(booking._id || booking.id),
    reference: booking.reference || `PKP-${booking.id}`,
    location: booking.locationName || location.name || 'Parking Location',
    address: booking.locationAddress || location.address || '',
    spot: booking.slotLabel || booking.spot || 'TBD',
    date: booking.date || (booking.startTime ? booking.startTime.split('T')[0] : ''),
    time: booking.time || booking.time_slot || booking.timeSlot || booking.startTime || '',
    vehicle: vehicleLabel,
    status,
    type: 'Fixed',
    price: `P${booking.totalAmount || booking.amount || 0}`,
    amount: Number(booking.totalAmount || booking.amount || 0),
    payment: booking.paymentMethod || booking.payment_method || undefined,
    location_id: booking.location_id || booking.locationId || location.id || undefined,
    locationName: booking.locationName || location.name || 'Parking Location',
    locationAddress: booking.locationAddress || location.address || '',
    vehiclePlateNumber: booking.vehiclePlateNumber || plate_number || '',
    vehicleType: booking.vehicleType || vehicle.type || '',
    startTime: booking.startTime || booking.checkInAt || booking.timeSlot || '',
    endTime: booking.endTime || booking.checkOutAt || '',
    totalAmount: Number(booking.totalAmount || booking.amount || 0),
    slotLabel: booking.slotLabel || booking.spot || 'TBD',
    userName: booking.userName || undefined,
    userId: booking.userId || undefined,
    customerName: booking.customerName || undefined,
  };
}

function normalizeLocation(location: any): LocationItem {
  const id =
    firstUuid(location.id, location._id, location.location_id, location.locationId, location.uuid) ||
    String(location.id || location._id || '');

  return {
    id,
    _id: String(location._id || id),
    name: location.name || 'Parking Location',
    address: location.address || '',
    distance: location.distance || `${location.available_spots ?? location.availableSpots ?? 0} spots available`,
  };
}

function assertUuidId(value: number | string, label: string) {
  const id = String(value);
  if (!UUID_PATTERN.test(id)) {
    throw new Error(`${label} must be a UUID. Please refresh locations and choose the parking location again.`);
  }
  return id;
}

export const backendApi = {
  async login(
    identifier: string,
    password: string,
    app?: 'pakipark' | 'pakiship',
    keepLoggedIn: boolean = false,
  ) {
    const user = await apiRequest<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, app, keepLoggedIn }),
    });

    await saveSession(user);

    return user;
  },

  async socialLogin(payload: { email: string; name: string; provider: string; providerId?: string; profile_picture?: string }) {
    const user = await apiRequest<LoginResult>('/auth/social-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await saveSession(user);
    return user;
  },

  async registerCustomer(payload: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phone: string;
    password: string;
    date_of_birth?: string;
    address?: string;
    city?: string;
    province?: string;
  }) {
    const user = await apiRequest<ApiUser>('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await saveSession(user);
    return user;
  },

  async registerPartner(payload: RegisterPartnerPayload) {
    const formData = new FormData();
    if (payload.firstName) formData.append('firstName', payload.firstName);
    if (payload.lastName) formData.append('lastName', payload.lastName);
    if (payload.name) formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('phone', payload.phone);
    formData.append('password', payload.password);
    formData.append('dateOfBirth', payload.dateOfBirth);
    formData.append('address', JSON.stringify(payload.address));
    formData.append('permit', payload.documents.permit as any);
    formData.append('registration', payload.documents.registration as any);
    formData.append('ownership', payload.documents.ownership as any);

    return apiRequest<ApiUser>('/auth/register/partner', {
      method: 'POST',
      body: formData,
    });
  },

  async getMe() {
    const raw = await apiRequest<ApiUser>('/auth/me', { auth: true });
    console.log('[getMe] Raw API response:', JSON.stringify(raw));
    const user = normalizeApiUser(raw);
    console.log('[getMe] Normalized user:', JSON.stringify(user));
    return user;
  },

  async updateProfile(updates: Partial<ApiUser>) {
    console.log('[updateProfile] Sending:', JSON.stringify(updates));
    const raw = await apiRequest<ApiUser>('/users/profile', {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(updates),
    });
    console.log('[updateProfile] Raw response:', JSON.stringify(raw));
    return normalizeApiUser(raw);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ message?: string }>('/users/password', {
      method: 'PUT',
      auth: true,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async getVehicles() {
    const vehicles = await apiRequest<any[]>('/vehicles', { auth: true });
    return vehicles.map(normalizeVehicle);
  },

  async createVehicle(vehicle: VehicleFormData) {
    const form = new FormData();
    form.append('brand', vehicle.brand);
    form.append('model', vehicle.model);
    form.append('color', vehicle.color);
    form.append('plateNumber', vehicle.plate_number);
    form.append('type', vehicle.type);

    if (vehicle.orDocFile) {
      form.append('orDoc', {
        uri: vehicle.orDocFile.uri,
        name: vehicle.orDocFile.name,
        type: vehicle.orDocFile.mimeType,
      } as unknown as Blob);
    }

    if (vehicle.crDocFile) {
      form.append('crDoc', {
        uri: vehicle.crDocFile.uri,
        name: vehicle.crDocFile.name,
        type: vehicle.crDocFile.mimeType,
      } as unknown as Blob);
    }

    const created = await apiRequest<any>('/vehicles', {
      method: 'POST',
      auth: true,
      body: form,
    });
    return normalizeVehicle(created);
  },

  async updateVehicle(id: number | string, vehicle: VehicleFormData) {
    const form = new FormData();
    form.append('brand', vehicle.brand);
    form.append('model', vehicle.model);
    form.append('color', vehicle.color);
    form.append('plateNumber', vehicle.plate_number);
    form.append('type', vehicle.type);

    if (vehicle.orDocFile) {
      form.append('orDoc', {
        uri: vehicle.orDocFile.uri,
        name: vehicle.orDocFile.name,
        type: vehicle.orDocFile.mimeType,
      } as unknown as Blob);
    }

    if (vehicle.crDocFile) {
      form.append('crDoc', {
        uri: vehicle.crDocFile.uri,
        name: vehicle.crDocFile.name,
        type: vehicle.crDocFile.mimeType,
      } as unknown as Blob);
    }

    const updated = await apiRequest<any>(`/vehicles/${id}`, {
      method: 'PUT',
      auth: true,
      body: form,
    });
    return normalizeVehicle(updated);
  },

  async deleteVehicle(id: number | string) {
    await apiRequest(`/vehicles/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async getBooking(id: string) {
    const booking = await apiRequest<any>(`/bookings/${id}`, { auth: true });
    return normalizeBooking(booking);
  },

  async getBookings() {
    const result = await apiRequest<{ bookings: any[] }>('/bookings/my', { auth: true });
    return (result.bookings || []).map(normalizeBooking);
  },

  async createBooking(payload: {
    userId?: string | number;
    vehicleId: number | string;
    locationId: number | string;
    date: string;
    timeSlot: string;
    amount: number;
    paymentMethod: 'gcash' | 'maya' | 'card';
    spot?: string;
    parkingSlotType?: string;
    arrivalEta?: Date | string;
  }) {
    const bookingPayload = {
      ...payload,
      locationId: assertUuidId(payload.locationId, 'Location ID'),
    };

    const booking = await apiRequest<any>('/bookings', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(bookingPayload),
    });
    return normalizeBooking(booking);
  },

  async createPendingBooking(payload: {
    userId?: string | number;
    vehicleId: number | string;
    locationId: number | string;
    date: string;
    timeSlot: string;
    amount: number;
    paymentMethod: 'gcash' | 'maya' | 'card';
    spot?: string;
    parkingSlotType?: string;
    arrivalEta?: Date | string;
  }) {
    const bookingPayload = {
      ...payload,
      locationId: assertUuidId(payload.locationId, 'Location ID'),
    };

    return apiRequest<any>('/bookings/pending', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(bookingPayload),
    });
  },

  async getLocations() {
    const locations = await apiRequest<any[]>('/locations', { auth: true });
    return locations.map(normalizeLocation);
  },

  async getAvailableSlots(locationId: number | string, date: string) {
    const slots = await apiRequest<any[]>(`/bookings/slots/${locationId}?date=${date}`, { auth: true });
    return slots || [];
  },

  async getLocationVitals(locationId: number | string, params: { date: string; timeSlot: string }) {
    return apiRequest<any>(`/locations/${locationId}/vitals?date=${params.date}&timeSlot=${params.timeSlot}`, { auth: true });
  },

  async cancelBooking(id: string, reason?: string) {
    return apiRequest(`/bookings/${id}/cancel`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ reason: reason || 'Cancelled by customer' }),
    });
  },

  async getAdminStats(params: { locationId?: string | null } = {}) {
    const query = params.locationId ? `?locationId=${params.locationId}` : '';
    return apiRequest<any>(`/analytics/dashboard${query}`, { auth: true });
  },

  async getAllBookings(params: { status?: string; page?: number; limit?: number; locationId?: string | null } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.locationId) query.append('locationId', params.locationId.toString());

    const result = await apiRequest<{ bookings: any[] }>(`/bookings?${query.toString()}`, { auth: true });
    return (result.bookings || []).map(normalizeBooking);
  },

  async getNotifications(page = 1, limit = 20) {
    return apiRequest<{ notifications: any[]; total: number; unreadCount: number }>(`/notifications?page=${page}&limit=${limit}`, {
      auth: true,
    });
  },

  async markNotificationRead(id: string) {
    return apiRequest<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
      auth: true,
    });
  },

  async markAllNotificationsRead() {
    return apiRequest<any>('/notifications/read-all', {
      method: 'PATCH',
      auth: true,
    });
  },

  async deleteNotification(id: string) {
    return apiRequest<any>(`/notifications/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async clearAllNotifications() {
    return apiRequest<any>('/notifications', {
      method: 'DELETE',
      auth: true,
    });
  },

  async submitReview(payload: { rating: number; comment?: string; locationId?: string; bookingId?: string }) {
    return apiRequest<ReviewRecord>('/reviews', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async getMyReviews() {
    const result = await apiRequest<{ reviews: ReviewRecord[] }>('/reviews/my', { auth: true });
    return result?.reviews ?? [];
  },

  async getReviewStats(locationId?: string) {
    const query = locationId ? `?locationId=${locationId}` : '';
    return apiRequest<ReviewStats>(`/reviews/stats${query}`, { auth: true });
  },

  async getAllReviews(params: { locationId?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.locationId) query.append('locationId', params.locationId);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    const result = await apiRequest<{ reviews: ReviewRecord[]; total: number; page: number; totalPages: number }>(
      `/reviews${qs ? `?${qs}` : ''}`,
      { auth: true },
    );

    return result ?? { reviews: [], total: 0, page: 1, totalPages: 0 };
  },

  async getPaymentMethods() {
    return apiRequest<any[]>('/payment-methods', { auth: true });
  },

  async addPaymentMethod(payload: {
    paymentType: 'card' | 'ewallet' | 'bank';
    provider: string;
    accountName?: string;
    mobileNumber?: string;
    accountNumber?: string;
    lastFourDigits?: string;
  }) {
    return apiRequest<any>('/payment-methods', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async updatePaymentMethod(
    id: string,
    payload: {
      isDefault?: boolean;
      paymentType?: 'card' | 'ewallet' | 'bank';
      provider?: string;
      accountName?: string;
      mobileNumber?: string;
      accountNumber?: string;
      lastFourDigits?: string;
    },
  ) {
    return apiRequest<any>(`/payment-methods/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async deletePaymentMethod(id: string) {
    return apiRequest<any>(`/payment-methods/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async getPublicParkingRates() {
    return apiRequest<any[]>('/settings/public/parking-rates', { auth: true });
  },

  async getParkingRates() {
    return apiRequest<any[]>('/settings/parking-rates', { auth: true });
  },

  async createParkingRate(payload: { vehicleType: string; hourlyRate: number; dailyRate: number }) {
    return apiRequest<any>('/settings/parking-rates', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async updateParkingRate(id: number | string, payload: { vehicleType: string; hourlyRate: number; dailyRate: number }) {
    return apiRequest<any>(`/settings/parking-rates/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async deleteParkingRate(id: number | string) {
    return apiRequest<any>(`/settings/parking-rates/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async forgotPassword(identifier: string) {
    return apiRequest<{ message?: string; devOtp?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  },

  async verifyResetOtp(identifier: string, otp: string) {
    return apiRequest<{ resetToken: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp }),
    });
  },

  async resetPassword(resetToken: string, newPassword: string) {
    return apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  },

  async getActivityLogs(params: { userId?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId.toString());
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const result = await apiRequest<{ logs: any[] }>(`/logs/activity?${query.toString()}`, { auth: true });
    return result?.logs || [];
  },

  async getSystemSettings(category: string, isPublic = false) {
    const prefix = isPublic ? '/settings/public' : '/settings';
    return apiRequest<any>(`${prefix}/${category}`, { auth: true });
  },

  async updateSystemSettings(category: string, payload: any) {
    return apiRequest<any>(`/settings/${category}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async getAdminUsers() {
    return apiRequest<any[]>('/settings/admin-users', { auth: true });
  },

  async getUsers() {
    return apiRequest<any[]>('/users', { auth: true });
  },

  async getDashboardSlots(locationId: string | number, date?: string) {
    const qs = date ? `?date=${date}` : '';
    return apiRequest<any[]>(`/parking-slots/dashboard/${locationId}${qs}`, { auth: true });
  },

  async getSlotsByLocation(locationId: string | number) {
    return apiRequest<any[]>(`/parking-slots/location/${locationId}`, { auth: true });
  },

  async createSlot(payload: { locationId: string; slotNumber: string; section?: string; floor?: number; type?: string; status?: string }) {
    return apiRequest<any>('/parking-slots', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async updateSlot(id: string | number, payload: { status?: string; slotNumber?: string; section?: string; floor?: number; type?: string }) {
    return apiRequest<any>(`/parking-slots/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async deleteSlot(id: string | number) {
    return apiRequest<any>(`/parking-slots/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async generateSlots(payload: { locationId: string; sections: string[]; slotsPerSection: number; floors?: number; type?: string }) {
    return apiRequest<any>('/parking-slots/generate', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async updateBookingStatus(id: string, status: 'active' | 'completed' | 'cancelled' | 'no_show', reason?: string) {
    return apiRequest<any>(`/bookings/${id}/status`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, reason }),
    });
  },

  async checkOutBooking(id: string) {
    return apiRequest<any>(`/bookings/${id}/checkout`, {
      method: 'PATCH',
      auth: true,
    });
  },

  async createLocation(payload: { name: string; address: string; totalSpots?: number;[key: string]: any }) {
    return apiRequest<any>('/locations', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async updateLocation(id: string | number, payload: Partial<{ name: string; address: string; totalSpots: number;[key: string]: any }>) {
    return apiRequest<any>(`/locations/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async deleteLocation(id: string | number) {
    return apiRequest<any>(`/locations/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async updateLocationHours(id: string | number, hours: Record<string, { open: string; close: string; closed?: boolean }>) {
    return apiRequest<any>(`/locations/${id}/hours`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ hours }),
    });
  },

  async getPricingRules(params: { locationId?: string } = {}) {
    const qs = params.locationId ? `?locationId=${params.locationId}` : '';
    return apiRequest<any[]>(`/settings/pricing-rules${qs}`, { auth: true });
  },

  async createPricingRule(payload: {
    locationId?: string;
    ruleType: 'early_bird' | 'peak' | 'flat' | 'pwd_discount';
    multiplier: number;
    startTime?: string;
    endTime?: string;
    isActive?: boolean;
    description?: string;
  }) {
    return apiRequest<any>('/settings/pricing-rules', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async updatePricingRule(
    id: string | number,
    payload: {
      ruleType?: string;
      multiplier?: number;
      startTime?: string;
      endTime?: string;
      isActive?: boolean;
      description?: string;
    },
  ) {
    return apiRequest<any>(`/settings/pricing-rules/${id}`, {
      method: 'PUT',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async deletePricingRule(id: string | number) {
    return apiRequest<any>(`/settings/pricing-rules/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  createPayMongoIntent(amount: number, paymentMethod: 'gcash' | 'maya' | 'card', bookingId: BookingId) {
    return apiRequest<{
      success: boolean;
      checkoutSessionId: string;
      redirectUrl: string;
    }>('/payments/paymongo/intent', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        amount,
        paymentMethod,
        bookingId: String(bookingId),
      }),
    });
  },

  async verifyPayMongoPayment(checkoutSessionId: string, bookingId: BookingId) {
    return apiRequest<{
      success: boolean;
      status: string;
    }>('/payments/paymongo/verify', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        checkoutSessionId,
        bookingId: String(bookingId),
      }),
    });
  },

  logout: clearSession,
};
