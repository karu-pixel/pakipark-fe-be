import { backendApi } from '../lib/api';

export const locationsService = {
  async getLocations() { return backendApi.getLocations(); },
  async getLocation(id: string) { return backendApi.getLocationVitals(id, { date: new Date().toISOString().slice(0, 10), timeSlot: '' }); },
  async getLocationVitals(locationId: string | number, params: { date: string; timeSlot: string }) { return backendApi.getLocationVitals(locationId, params); },
  async createLocation(data: any) { return backendApi.createLocation(data); },
  async updateLocation(id: string | number, data: any) { return backendApi.updateLocation(id, data); },
  async deleteLocation(id: string | number) { return backendApi.deleteLocation(id); },
  async updateLocationHours(id: string | number, hours: Record<string, { open: string; close: string; closed?: boolean }>) { return backendApi.updateLocationHours(id, hours); },
  async getMyLocations() { return backendApi.getLocations(); },
};
