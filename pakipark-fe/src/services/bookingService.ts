import { backendApi } from '../lib/api';

export const bookingService = {
  async getMyBookings() { return backendApi.getBookings(); },
  async getBookings(params: { status?: string; page?: number; limit?: number; locationId?: string | null } = {}) { return backendApi.getAllBookings(params); },
  async getBookingById(id: string) { return backendApi.getBooking(id); },
  async createBooking(payload: Parameters<typeof backendApi.createBooking>[0]) { return backendApi.createBooking(payload); },
  async createPendingBooking(payload: Parameters<typeof backendApi.createPendingBooking>[0]) { return backendApi.createPendingBooking(payload); },
  async cancelBooking(bookingId: string, reason?: string) { return backendApi.cancelBooking(bookingId, reason); },
  async updateBookingStatus(id: string, status: 'active' | 'completed' | 'cancelled' | 'no_show', reason?: string) { return backendApi.updateBookingStatus(id, status, reason); },
  async checkIn(id: string) { return backendApi.updateBookingStatus(id, 'active'); },
  async checkOut(id: string) { return backendApi.checkOutBooking(id); },
  async getAvailableSlots(locationId: string | number, date: string) { return backendApi.getAvailableSlots(locationId, date); },
};
