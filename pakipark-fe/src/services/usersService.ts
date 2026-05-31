import { backendApi } from '../lib/api';

export const usersService = {
  async getProfile() { return backendApi.getMe(); },
  async updateProfile(data: any) { return backendApi.updateProfile(data); },
  async changePassword(currentPassword: string, newPassword: string) { return backendApi.changePassword(currentPassword, newPassword); },
  async getAllUsers() { return backendApi.getAdminUsers(); },
};
