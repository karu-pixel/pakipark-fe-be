import { backendApi } from '../lib/api';

export interface ParkingSlot {
  _id?: string;
  id?: string | number;
  label: string;
  floor?: number;
  type?: string;
  size?: string;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance' | string;
}

export const parkingSlotService = {
  async getSlotsByLocation(locationId: string | number): Promise<ParkingSlot[]> { return backendApi.getSlotsByLocation(locationId); },
  async getAvailableSlots(locationId: string | number, date: string, _timeSlot?: string): Promise<ParkingSlot[]> { return backendApi.getAvailableSlots(locationId, date) as Promise<ParkingSlot[]>; },
  async getDashboardSlots(locationId: string | number, date?: string) { return backendApi.getDashboardSlots(locationId, date); },
  async createSlot(data: any) { return backendApi.createSlot(data); },
  async updateSlot(slotId: string | number, data: any) { return backendApi.updateSlot(slotId, data); },
  async deleteSlot(slotId: string | number) { return backendApi.deleteSlot(slotId); },
  async generateSlots(data: { locationId: string; sections?: string[]; slotsPerSection?: number; floors?: number; slots?: any[] }) { return backendApi.generateSlots({ sections: ['A'], slotsPerSection: 10, ...data } as any); },
};
