import { backendApi } from '../lib/api';

export const analyticsService = {
  async getDashboard(params: { locationId?: string | null } = {}) { return backendApi.getAdminStats(params); },
  async getRevenueData() { return backendApi.getAdminStats({}); },
  async getOccupancyData() { return backendApi.getAdminStats({}); },
};
