import { backendApi } from '../lib/api';
import type { Vehicle, VehicleFormData } from '../features/customer/types';

export const vehiclesService = {
  async getMyVehicles(): Promise<Vehicle[]> { return backendApi.getVehicles(); },
  async addVehicle(data: VehicleFormData): Promise<Vehicle> { return backendApi.createVehicle(data); },
  async updateVehicle(id: string | number, data: VehicleFormData): Promise<Vehicle> { return backendApi.updateVehicle(id, data); },
  async deleteVehicle(id: string | number) { return backendApi.deleteVehicle(id); },
};
