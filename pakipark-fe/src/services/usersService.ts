import { backendApi } from '../lib/api';

export const usersService = {
  async getProfile() { return backendApi.getMe(); },
  async updateProfile(data: any) { return backendApi.updateProfile(data); },
  async changePassword(currentPassword: string, newPassword: string) { return backendApi.changePassword(currentPassword, newPassword); },
  async setup2FA() { return backendApi.setup2FA(); },
  async verify2FA(code: string) { return backendApi.verify2FA(code); },
  async disable2FA(password: string) { return backendApi.disable2FA(password); },
  async getAllUsers() { return backendApi.getAdminUsers(); },
};
