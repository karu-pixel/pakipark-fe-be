import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

type NotifType = 'success' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_NOTIFS: Notification[] = [
  { id: '1', type: 'success', title: 'New Booking',      message: 'Juan Dela Cruz made a new booking for spot A-12',    time: '5 min ago',   read: false },
  { id: '2', type: 'info',    title: 'Payment Received', message: 'Payment of P150 received from Maria Santos',          time: '15 min ago',  read: false },
  { id: '3', type: 'warning', title: 'System Update',    message: 'Scheduled maintenance on March 15, 2026 at 2:00 AM', time: '1 hour ago',  read: true  },
];

const TYPE_CFG: Record<NotifType, { icon: string; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle',  color: '#10B981', bg: '#F0FDF4' },
  warning: { icon: 'alert-circle',      color: '#F59E0B', bg: '#FFFBEB' },
  info:    { icon: 'information-circle', color: '#3B82F6', bg: '#EFF6FF' },
};

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifs, setNotifs] = useState<Notification[]>(DEFAULT_NOTIFS);

  const unread = notifs.filter((n) => !n.read).length;

  const markRead = (id: string) => setNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, read: true })));
  const remove = (id: string) => setNotifs(notifs.filter((n) => n.id !== id));
  const clearAll = () => setNotifs([]);

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={s.sheet}>
          <View style={s.header}>
            <View style={s.headerTop}>
              <View style={s.headerLeft}>
                <View style={s.bellIconWrap}>
                  <Ionicons name="notifications" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={s.headerTitle}>Notifications</Text>
                  <Text style={s.headerSub}>{unread} unread messages</Text>
                </View>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={onClose} accessibilityLabel="Close">
                <Ionicons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={s.headerActions}>
              <TouchableOpacity style={s.actionBtn} onPress={markAllRead} accessibilityLabel="Mark all read">
                <Ionicons name="checkmark" size={14} color={colors.orange} />
                <Text style={[s.actionBtnText, { color: colors.orange }]}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.actionBtnRed]} onPress={clearAll} accessibilityLabel="Clear all">
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={[s.actionBtnText, { color: '#EF4444' }]}>Clear all</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
            {notifs.length === 0 ? (
              <View style={s.empty}>
                <View style={s.emptyIcon}>
                  <Ionicons name="notifications-outline" size={32} color={colors.border} />
                </View>
                <Text style={s.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              notifs.map((n) => {
                const cfg = TYPE_CFG[n.type];
                return (
                  <View key={n.id} style={[s.notifCard, !n.read && s.notifCardUnread]}>
                    <View style={s.notifTop}>
                      <View style={[s.notifIcon, { backgroundColor: cfg.bg }]}> 
                        <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
                      </View>
                      <View style={s.notifContent}>
                        <View style={s.notifTitleRow}>
                          <Text style={s.notifTitle}>{n.title}</Text>
                          {!n.read && <View style={s.unreadDot} />}
                        </View>
                        <Text style={s.notifMessage}>{n.message}</Text>
                      </View>
                    </View>
                    <View style={s.notifFooter}>
                      <Text style={s.notifTime}>{n.time}</Text>
                      <View style={s.notifFooterActions}>
                        {!n.read && (
                          <TouchableOpacity onPress={() => markRead(n.id)} accessibilityLabel="Mark as read">
                            <Text style={s.markReadText}>Mark as read</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => remove(n.id)} accessibilityLabel="Delete notification">
                          <Ionicons name="trash-outline" size={16} color={colors.muted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30,61,90,0.6)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '85%',
    overflow: 'hidden',
  },

  header: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: 20, paddingBottom: spacing.md, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bellIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', shadowColor: colors.navy, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.navy },
  headerSub: { fontSize: 12, color: colors.muted, fontWeight: '600', marginTop: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFF1E8', borderRadius: 10, paddingVertical: 11 },
  actionBtnRed: { backgroundColor: '#FEF2F2' },
  actionBtnText: { fontSize: 12, fontWeight: '800' },

  list: { padding: 14, gap: spacing.md, paddingBottom: 24, backgroundColor: '#F4F6F9' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, fontWeight: '700', color: colors.muted },

  notifCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  notifCardUnread: { borderColor: '#FFB27F' },
  notifTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  notifIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { fontSize: 14, fontWeight: '700', color: colors.navy, flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
  notifMessage: { fontSize: 13, color: colors.muted, lineHeight: 18, marginTop: 3 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  notifTime: { fontSize: 11, fontWeight: '700', color: colors.muted },
  notifFooterActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  markReadText: { fontSize: 12, fontWeight: '700', color: colors.orange },
});
