import { backendApi } from '../lib/api';

export interface AppNotification {
  _id: string;
  id: string | number;
  userId?: string | number;
  type?: string;
  title: string;
  body: string;
  isRead: boolean;
  entityType?: string | null;
  entityId?: string | number | null;
  createdAt: string;
}

export const notificationService = {
  async getAll(page = 1) { return backendApi.getNotifications(page, 20); },
  async getUnreadCount() { const res = await backendApi.getNotifications(1, 1); return res.unreadCount ?? 0; },
  async markOneRead(id: string) { return backendApi.markNotificationRead(id); },
  async markAllRead() { return backendApi.markAllNotificationsRead(); },
  async deleteOne(id: string) { return backendApi.deleteNotification(id); },
  async clearAll() { return backendApi.clearAllNotifications(); },
};
