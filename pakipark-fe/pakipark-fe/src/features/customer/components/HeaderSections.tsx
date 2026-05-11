import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { COLORS } from '@features/customer/data';
import type { NotificationItem, Vehicle } from '@features/customer/types';

const pakiparkLogo = require('../../../../assets/pakipark-logo.png');

export function CustomerHeader({
  userName,
  profilePicture,
  unreadCount,
  notifications,
  onGuidePress,
  onReservePress,
  onProfilePress,
  onLogoutPress,
  onNotificationPress,
  reserveTutorialRef,
  tutorialButtonRef,
}: {
  userName: string;
  profilePicture: string | null;
  unreadCount: number;
  notifications: NotificationItem[];
  onGuidePress: () => void;
  onReservePress: () => void;
  onProfilePress: () => void;
  onLogoutPress: () => void;
  onNotificationPress: (id: string) => void;
  reserveTutorialRef?: (el: any) => void;
  tutorialButtonRef?: (el: any) => void;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileMenuPosition, setProfileMenuPosition] = useState({ top: 112, right: 16 });
  const [notificationPosition, setNotificationPosition] = useState({ top: 90, left: 20 });
  const notificationButtonRef = useRef<any>(null);
  const profileButtonRef = useRef<any>(null);
  const { width: windowWidth } = useWindowDimensions();

  const openNotifications = () => {
    const button = notificationButtonRef.current;
    if (!button?.measureInWindow) {
      setShowNotifications(true);
      return;
    }

    button.measureInWindow((x: number, y: number, width: number, height: number) => {
      const popupWidth = 280;
      setNotificationPosition({
        top: y + height + 10,
        left: Math.max(12, (windowWidth - popupWidth) / 2),
      });
      setShowNotifications(true);
    });
  };

  const openProfileMenu = () => {
    const button = profileButtonRef.current;
    if (!button?.measureInWindow) {
      setShowProfileMenu(true);
      return;
    }

    button.measureInWindow((x: number, y: number, width: number, height: number) => {
      setProfileMenuPosition({
        top: y + height + 10,
        right: Math.max(12, windowWidth - x - width),
      });
      setShowProfileMenu(true);
    });
  };

  return (
    <View style={styles.headerCard}>
      <View style={styles.headerTop}>
        <Image source={pakiparkLogo} style={styles.brandLogo} resizeMode="contain" />
        <View style={styles.headerActions}>
          <Pressable ref={tutorialButtonRef} onPress={onGuidePress} style={styles.iconButton}>
            <Ionicons name="help-circle-outline" size={20} color={COLORS.text} />
          </Pressable>
          <View style={styles.notificationWrap}>
            <Pressable ref={notificationButtonRef} onPress={openNotifications} style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
              {unreadCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          <Pressable
            ref={profileButtonRef}
            onPress={openProfileMenu}
            style={[styles.profileMenuButton, showProfileMenu ? styles.profileMenuButtonActive : null]}
            accessibilityRole="button"
            accessibilityLabel="Open profile menu"
          >
            <View style={styles.avatar}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person-outline" size={22} color={COLORS.surface} />
              )}
            </View>
            <Ionicons name="chevron-down" size={15} color={COLORS.subtle} />
          </Pressable>
        </View>
      </View>

      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>Welcome, {userName}!</Text>
        <Text style={styles.headerSubtitle}>Ready to park? Let&apos;s find you a spot.</Text>
      </View>

      <Pressable ref={reserveTutorialRef} onPress={onReservePress} style={styles.reserveButton}>
        <Text style={styles.reserveButtonText}>Reserve a Spot Now</Text>
      </Pressable>

      <Modal visible={showProfileMenu} transparent animationType="fade" onRequestClose={() => setShowProfileMenu(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setShowProfileMenu(false)}>
          <Pressable style={[styles.profileDropdown, profileMenuPosition]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.profileDropdownHeader}>
              <Text style={styles.profileDropdownName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.profileDropdownRole}>Customer</Text>
            </View>
            <Pressable
              style={styles.profileDropdownItem}
              onPress={() => {
                setShowProfileMenu(false);
                onProfilePress();
              }}
            >
              <Ionicons name="person-outline" size={16} color={COLORS.muted} />
              <Text style={styles.profileDropdownItemText}>Profile</Text>
            </Pressable>
            <Pressable
              style={styles.profileDropdownItem}
              onPress={() => {
                setShowProfileMenu(false);
                onLogoutPress();
              }}
            >
              <MaterialIcons name="logout" size={16} color={COLORS.danger} />
              <Text style={styles.profileDropdownLogoutText}>Logout</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        {/* Changed background to completely transparent instead of dimming the screen */}
        <Pressable style={styles.modalOverlay} onPress={() => setShowNotifications(false)}>
          <Pressable style={[styles.notificationPopup, notificationPosition]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.notificationPopupHeader}>
              <Text style={styles.notificationPopupTitle}>Notifications</Text>
              <Pressable onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={20} color={COLORS.subtle} />
              </Pressable>
            </View>
            {notifications.length > 0 ? (
              <View style={styles.notificationPopupList}>
                {notifications.slice(0, 3).map((notification) => (
                  <Pressable
                    key={notification.id}
                    onPress={() => {
                      onNotificationPress(notification.id);
                      setShowNotifications(false);
                    }}
                    style={styles.notificationPopupItem}
                  >
                    <View
                      style={[
                        styles.notificationDot,
                        {
                          backgroundColor: notification.read
                            ? '#D1D5DB'
                            : notification.type === 'confirmed'
                              ? COLORS.success
                              : notification.type === 'completed'
                                ? '#2563EB'
                                : COLORS.danger,
                        },
                      ]}
                    />
                    <View style={styles.flexOne}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.notificationEmpty}>
                <Ionicons name="notifications-outline" size={34} color="#D1D5DB" />
                <Text style={styles.notificationEmptyText}>No notifications yet</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function QuickActionCard({
  title,
  subtitle,
  mascot,
  onPress,
  variant = 'light',
}: {
  title: string;
  subtitle: string;
  mascot: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'light';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.quickActionCard,
        variant === 'primary' ? styles.quickActionCardPrimary : null,
        variant === 'dark' ? styles.quickActionCardDark : null,
      ]}
    >
      <Image source={{ uri: mascot }} style={styles.quickActionMascot} resizeMode="contain" />
      <Text
        style={[
          styles.quickActionTitle,
          variant === 'primary' || variant === 'dark' ? styles.quickActionTitleDark : null,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.quickActionSubtitle,
          variant === 'primary' || variant === 'dark' ? styles.quickActionSubtitleDark : null,
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

export function VehicleManagement({
  cars,
  selectedCarIndex,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: {
  cars: Vehicle[];
  selectedCarIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.inlineRow}>
          <MaterialCommunityIcons name="car" size={20} color={COLORS.text} />
          <Text style={styles.sectionTitle}>My Vehicles</Text>
        </View>
        <Pressable onPress={onAdd} style={styles.smallButton}>
          <Ionicons name="add" size={16} color={COLORS.surface} />
          <Text style={styles.smallButtonText}>Add New</Text>
        </Pressable>
      </View>

      <View style={styles.verticalList}>
        {cars.map((car, index) => (
          <Pressable
            key={`${car.plateNumber}-${index}`}
            onPress={() => onSelect(index)}
            style={[styles.vehicleCard, index === selectedCarIndex ? styles.vehicleCardActive : null]}
          >
            <View style={styles.vehicleTop}>
              <View>
                <Text style={styles.vehicleName}>{car.brand} {car.model}</Text>
                <Text style={styles.vehicleMeta}>{car.color}</Text>
              </View>
              {index === selectedCarIndex ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.plateNumber}>{car.plateNumber}</Text>
            <View style={styles.actionRow}>
              <Pressable onPress={() => onEdit(index)} style={styles.softButton}>
                <MaterialIcons name="edit" size={16} color={COLORS.muted} />
                <Text style={styles.softButtonText}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(index)} style={styles.deleteButton}>
                <MaterialIcons name="delete-outline" size={16} color={COLORS.danger} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function RecentBookings({
  items,
  onViewAll,
}: {
  items: { loc: string; date: string; price: string }[];
  onViewAll: () => void;
}) {
  return (
    <View style={styles.recentBookingsSection}>
      <View style={styles.recentBookingsHeader}>
        <Text style={styles.recentBookingsHeading}>Recent Bookings</Text>
        <Pressable onPress={onViewAll} style={styles.recentBookingsViewAll}>
          <Text style={styles.recentBookingsViewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
        </Pressable>
      </View>
      <View style={styles.recentBookingsList}>
        {items.map((item) => (
          <View key={`${item.loc}-${item.date}`} style={styles.recentBookingCard}>
            <View style={styles.flexOne}>
              <View style={styles.recentBookingTitleRow}>
                <Ionicons name="location-outline" size={15} color={COLORS.primary} />
                <Text style={styles.recentBookingTitle}>{item.loc}</Text>
              </View>
              <View style={styles.recentBookingMetaRow}>
                <Ionicons name="time-outline" size={12} color={COLORS.muted} />
                <Text style={styles.recentBookingMeta}>{item.date}</Text>
              </View>
            </View>
            <Text style={styles.recentBookingPrice}>P{item.price}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#ECEDEF',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLogo: { width: 72, height: 58 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  notificationWrap: { position: 'relative' },
  notificationBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notificationBadgeText: { color: COLORS.surface, fontSize: 9, fontWeight: '800' },
  profileMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 0,
    paddingRight: 0,
    paddingVertical: 0,
  },
  profileMenuButtonActive: {
    backgroundColor: '#FFF3EA',
    borderColor: '#F6C8A8',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  headerTextWrap: { gap: 2 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, lineHeight: 36 },
  headerSubtitle: { fontSize: 14, color: COLORS.muted, lineHeight: 20 },
  reserveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  reserveButtonText: { color: COLORS.surface, fontSize: 15, fontWeight: '800' },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  profileDropdown: {
    position: 'absolute',
    width: 230,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: 'hidden',
  },
  profileDropdownHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  profileDropdownName: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  profileDropdownRole: { color: COLORS.subtle, fontSize: 12, fontWeight: '700', marginTop: 5 },
  profileDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F6',
  },
  profileDropdownItemText: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  profileDropdownLogoutText: { color: COLORS.danger, fontSize: 15, fontWeight: '800' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent', // NO MORE DARK SCREEN
  },
  notificationPopup: {
    position: 'absolute',
    width: 280,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    overflow: 'hidden',
    zIndex: 999,
  },
  notificationPopupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
  },
  notificationPopupTitle: { fontSize: 16, color: COLORS.text, fontWeight: '800' },
  notificationPopupList: { padding: 10, gap: 10 },
  notificationPopupItem: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14, backgroundColor: '#FAFBFC' },
  notificationEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 16, gap: 12 },
  notificationEmptyText: { fontSize: 15, color: '#98A2B3', fontWeight: '700' },
  notificationDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  notificationTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  notificationMessage: { fontSize: 13, color: COLORS.muted, marginTop: 4, lineHeight: 18 },

  quickActionCard: {
    flex: 1,
    minHeight: 94,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E7E9EE',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 14,
    paddingTop: 40,
    gap: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  quickActionCardPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.24,
  },
  quickActionCardDark: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.2,
  },
  quickActionMascot: { width: 84, height: 84, position: 'absolute', top: -30 },
  quickActionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  quickActionTitleDark: { color: COLORS.surface },
  quickActionSubtitle: { fontSize: 10, color: '#98A2B3', textAlign: 'center', fontWeight: '700' },
  quickActionSubtitleDark: { color: 'rgba(255,255,255,0.7)' },
  sectionCard: { backgroundColor: COLORS.surface, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: 18, gap: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  smallButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.navy, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  smallButtonText: { color: COLORS.surface, fontSize: 12, fontWeight: '700' },
  verticalList: { gap: 12 },
  vehicleCard: { borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 20, padding: 16, gap: 12 },
  vehicleCardActive: { borderColor: COLORS.primary, backgroundColor: '#FFF7F2' },
  vehicleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicleName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  vehicleMeta: { fontSize: 13, color: COLORS.muted, marginTop: 3 },
  activeBadge: { backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { color: COLORS.surface, fontSize: 10, fontWeight: '800' },
  plateNumber: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  softButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 10 },
  softButtonText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 10 },
  deleteButtonText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
  linkText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  recentBookingsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEF1F5',
    padding: 20,
    gap: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  recentBookingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentBookingsHeading: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  recentBookingsViewAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingLeft: 8 },
  recentBookingsViewAllText: { color: COLORS.primary, fontSize: 12, fontWeight: '800' },
  recentBookingsList: { gap: 12 },
  recentBookingCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  recentBookingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recentBookingMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  recentBookingTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  recentBookingMeta: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  recentBookingPrice: { fontSize: 15, fontWeight: '900', color: COLORS.text },
});
