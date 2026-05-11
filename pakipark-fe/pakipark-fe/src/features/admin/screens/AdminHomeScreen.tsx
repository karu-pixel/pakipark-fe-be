import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BookingsScreen } from '@features/bookings/screens/BookingsScreen';
import { NotificationCenter } from '@features/notifications/components/NotificationCenter';
import { ParkingScreen } from '@features/parking/screens/ParkingScreen';
import { AdminProfile } from '@features/profile/screens/AdminProfile';
import { SettingsScreen } from '@features/settings/screens/SettingsScreen';
import { AdminTutorial } from '@features/tutorial/components/AdminTutorial';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

type TabId = 'dashboard' | 'parking' | 'bookings' | 'settings';
type TutorialTargetKey = 'logo' | 'dashboard' | 'parking' | 'bookings' | 'help';

type BookingStatus = 'active' | 'completed' | 'pending';

interface Booking {
  id: string;
  customer: string;
  spot: string;
  time: string;
  duration: string;
  status: BookingStatus;
}

const RECENT_BOOKINGS: Booking[] = [
  { id: '1', customer: 'Juan Dela Cruz', spot: 'A-12', time: '10:30 AM', duration: '2 hrs',   status: 'active'    },
  { id: '2', customer: 'Maria Santos',   spot: 'B-05', time: '11:15 AM', duration: '1.5 hrs', status: 'completed' },
  { id: '3', customer: 'Pedro Reyes',    spot: 'C-18', time: '12:00 PM', duration: '3 hrs',   status: 'active'    },
  { id: '4', customer: 'Anna Lopez',     spot: 'A-23', time: '12:45 PM', duration: '1 hr',    status: 'pending'   },
  { id: '5', customer: 'Carlos Tan',     spot: 'B-14', time: '01:20 PM', duration: '2.5 hrs', status: 'active'    },
];

function Header({
  onGuide, onNotif, onProfile, onSettings, onLogout, adminName, dropdownOpen, onToggleDropdown, logoRef, helpRef,
}: {
  onGuide: () => void; onNotif: () => void; onProfile: () => void;
  onSettings: () => void; onLogout: () => void;
  adminName: string; dropdownOpen: boolean; onToggleDropdown: () => void;
  logoRef?: (el: any) => void; helpRef?: (el: any) => void;
}) {
  return (
    <View style={styles.header}>
      <View ref={logoRef} style={styles.headerLogo}>
        <Image
        source={require('../../../../assets/pakipark-logo.png')}
        style={[styles.logoImg, { tintColor: '#FFFFFF' }]}
        resizeMode="contain"
        />
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity ref={helpRef} style={styles.iconBtn} accessibilityLabel="Guide" onPress={onGuide}>
          <Ionicons name="help-circle-outline" size={21} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} accessibilityLabel="Notifications" onPress={onNotif}>
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          <View style={styles.notifDot} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatar} onPress={onToggleDropdown} accessibilityLabel="Profile menu">
          <Ionicons name="person-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {dropdownOpen && (
        <View style={styles.dropdown}>
          <View style={styles.dropdownDivider} />
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { onProfile(); onToggleDropdown(); }}>
            <Ionicons name="person-outline" size={25} color={colors.muted} />
            <Text style={styles.dropdownItemText}>Profile</Text>
          </TouchableOpacity>
          <View style={styles.dropdownDivider} />
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { onLogout(); onToggleDropdown(); }}>
            <Ionicons name="log-out-outline" size={25} color="#EF4444" />
            <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function StatCards() {
  const stats = [
    {
      label: 'Total Bookings', value: '1,234', change: '+12%',
      iconBg: '#DBEAFE', changeColor: colors.iconBlue,
      icon: <Ionicons name="car-outline" size={26} color={colors.iconBlue} />,
      decorBg: '#EFF6FF',
    },
    {
      label: 'Active Users', value: '856', change: '+8%',
      iconBg: '#D1FAE5', changeColor: colors.iconGreen,
      icon: <Ionicons name="people-outline" size={26} color={colors.iconGreen} />,
      decorBg: '#ECFDF5',
    },
    {
      label: 'Parking Spots', value: '45', change: '+3',
      iconBg: '#FEF3C7', changeColor: colors.iconYellow,
      icon: <Ionicons name="location-outline" size={26} color={colors.iconYellow} />,
      decorBg: '#FFFBEB',
    },
    {
      label: 'Revenue', value: '₱125,450', change: '+15%',
      iconBg: '#EDE9FE', changeColor: colors.iconPurple,
      icon: <MaterialCommunityIcons name="currency-php" size={26} color={colors.iconPurple} />,
      decorBg: '#F5F3FF',
    },
  ];

  return (
    <View style={styles.statsGrid}>
      {stats.map((s) => (
        <View key={s.label} style={styles.statCard}>
          <View style={[styles.statDecor, { backgroundColor: s.decorBg }]} />
          <View style={styles.statIconRow}>
            <View style={[styles.statIconBg, { backgroundColor: s.iconBg }]}>{s.icon}</View>
          </View>
          <Text style={styles.statValue}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
          <View style={[styles.statBadge, { backgroundColor: s.iconBg }]}>
            <Text style={[styles.statChange, { color: s.changeColor }]}>{s.change}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = {
    active:    { bg: colors.statusActive,    text: colors.statusActiveText,    icon: 'checkmark-circle-outline' as const, label: 'Active'    },
    completed: { bg: colors.statusCompleted, text: colors.statusCompletedText, icon: 'checkmark-circle-outline' as const, label: 'Completed' },
    pending:   { bg: colors.statusPending,   text: colors.statusPendingText,   icon: 'time-outline'              as const, label: 'Pending'   },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}> 
      <Ionicons name={cfg.icon} size={11} color={cfg.text} />
      <Text style={[styles.badgeText, { color: cfg.text }]}> {cfg.label}</Text>
    </View>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <View style={styles.bookingRow}>
      <View style={styles.bookingLeft}>
        <Text style={styles.bookingName}>{booking.customer}</Text>
        <Text style={styles.bookingMeta}>{booking.time} · {booking.duration}</Text>
      </View>
      <View style={styles.bookingRight}>
        <Text style={styles.slotText}>{booking.spot}</Text>
        <StatusBadge status={booking.status} />
      </View>
    </View>
  );
}

export function AdminHomeScreen({ onLogoutToAuth }: { onLogoutToAuth?: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const tutorialRefs = useRef<Partial<Record<TutorialTargetKey, any>>>({});
  const [spotlightLayouts, setSpotlightLayouts] = useState<Partial<Record<TutorialTargetKey, { x: number; y: number; width: number; height: number }>>>({});
  const tutorialTarget = useMemo<TutorialTargetKey>(() => {
    if (tutorialStep === 0) return 'logo';
    if (tutorialStep === 1) return 'dashboard';
    if (tutorialStep === 2) return 'parking';
    if (tutorialStep === 3) return 'bookings';
    return 'help';
  }, [tutorialStep]);
  const tutorialSpotlight = tutorialOpen ? spotlightLayouts[tutorialTarget] ?? null : null;

  const captureTutorialRef = useCallback((key: TutorialTargetKey) => (el: any) => {
    if (el) tutorialRefs.current[key] = el;
  }, []);

  useEffect(() => {
    if (!tutorialOpen) return;
    const ref = tutorialRefs.current[tutorialTarget];
    if (!ref?.measureInWindow) return;
    const timer = setTimeout(() => {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        setSpotlightLayouts((current) => ({ ...current, [tutorialTarget]: { x, y, width, height } }));
      });
    }, 90);
    return () => clearTimeout(timer);
  }, [tutorialOpen, tutorialTarget, activeTab]);

  if (showProfile) {
    return <AdminProfile onBack={() => setShowProfile(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root} testID="home-screen-root" nativeID="home-screen" collapsable={false}>
      {dropdownOpen && (
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setDropdownOpen(false)} activeOpacity={1} />
      )}

      <Header
        onGuide={() => { setTutorialStep(0); setTutorialOpen(true); }}
        onNotif={() => setNotifOpen(true)}
        onProfile={() => setShowProfile(true)}
        onSettings={() => setActiveTab('settings')}
        onLogout={() => setShowLogout(true)}
        adminName="Admin"
        dropdownOpen={dropdownOpen}
        onToggleDropdown={() => setDropdownOpen((v) => !v)}
        logoRef={captureTutorialRef('logo')}
        helpRef={captureTutorialRef('help')}
      />

      <View style={styles.contentPane}>
        {activeTab === 'dashboard' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.pageTitle}>Dashboard Overview</Text>
            <Text style={styles.pageSubtitle}>
              Welcome back! Here is what is happening with your parking facility today.
            </Text>
            <StatCards />
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Bookings</Text>
                <TouchableOpacity style={styles.viewAllBtn} accessibilityLabel="View all bookings" onPress={() => setActiveTab('bookings')}>
                  <Ionicons name="list-outline" size={13} color={colors.text} />
                  <Text style={styles.viewAllText}> View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
              {RECENT_BOOKINGS.map((b, i) => (
                <View key={b.id}>
                  <BookingRow booking={b} />
                  {i < RECENT_BOOKINGS.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
            <View style={[styles.card, { paddingBottom: 16 }]}>
              <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Quick Actions</Text>
              <TouchableOpacity style={[styles.actionRow, { backgroundColor: '#FFF7ED' }]} accessibilityLabel="New Booking" onPress={() => setActiveTab('bookings')}>
                <View style={[styles.actionIconBg, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name="car-outline" size={18} color={colors.orange} />
                </View>
                <Text style={styles.actionLabel}>New Booking</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.orange} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionRow, { backgroundColor: '#EFF6FF' }]} accessibilityLabel="Manage Slots" onPress={() => setActiveTab('parking')}>
                <View style={[styles.actionIconBg, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name="location-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.actionLabel}>Manage Slots</Text>
                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { paddingBottom: 8 }]}>
              <Text style={[styles.cardTitle, { marginBottom: 12 }]}>System Status</Text>
              {[
                { label: 'Server Status',   status: 'ACTIVE',    dotColor: '#10B981', textColor: '#10B981', bg: '#ECFDF5' },
                { label: 'Payment Gateway', status: 'ACTIVE',    dotColor: '#10B981', textColor: '#10B981', bg: '#ECFDF5' },
                { label: 'Database',        status: 'CONNECTED', dotColor: '#6366F1', textColor: '#6366F1', bg: '#EEF2FF' },
              ].map((item) => (
                <View key={item.label} style={styles.statusRow}>
                  <Text style={styles.statusLabel}>{item.label}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: item.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }]}>
                    <View style={[styles.statusDot, { backgroundColor: item.dotColor }]} />
                    <Text style={[styles.statusValue, { color: item.textColor }]}>{item.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {activeTab === 'parking'  && <ParkingScreen />}
        {activeTab === 'bookings' && <BookingsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      <View pointerEvents="none" style={styles.tabBarBackdrop} />
      <View style={styles.tabBar}>
        {([
          { id: 'dashboard', label: 'Dashboard', icon: 'grid'                  },
          { id: 'parking',   label: 'Parking',   icon: 'car-outline'           },
          { id: 'bookings',  label: 'Bookings',  icon: 'document-text-outline', dot: true },
          { id: 'settings',  label: 'Settings',  icon: 'settings-outline'      },
        ] as const).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              ref={tab.id === 'dashboard' || tab.id === 'parking' || tab.id === 'bookings' ? captureTutorialRef(tab.id) : undefined}
              style={styles.tabItem}
              accessibilityLabel={tab.label}
              onPress={() => setActiveTab(tab.id as TabId)}
            >
              <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                <Ionicons name={tab.icon} size={20} color={active ? colors.orange : colors.muted} />
                {'dot' in tab && tab.dot && <View style={styles.tabDot} />}
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <AdminTutorial
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        onNavigate={(tab) => setActiveTab(tab as TabId)}
        onStepChange={(s) => setTutorialStep(s)}
        spotlightRect={tutorialSpotlight}
      />

      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <View style={styles.logoutOverlay}>
          <View style={styles.logoutCard}>
            <Image source={require('../../../../assets/logoutMascot.png')} style={styles.logoutMascot} resizeMode="contain" />
            <Text style={styles.logoutTitle}>Admin Session Ending?</Text>
            <Text style={styles.logoutSub}>Are you sure you want to exit the dashboard? Unsaved administrative changes may be lost.</Text>
            <TouchableOpacity
              style={styles.logoutConfirmBtn}
              onPress={() => {
                setShowLogout(false);
                onLogoutToAuth?.();
              }}
              accessibilityLabel="Yes, Log Me Out"
            >
              <Text style={styles.logoutConfirmText}>Yes, Log Me Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutCancelBtn} onPress={() => setShowLogout(false)} accessibilityLabel="Stay Logged In">
              <Text style={styles.logoutCancelText}>Stay Logged In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#F0F2F5', position: 'relative' },

  header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#1C436B',
  paddingHorizontal: 14,
  paddingTop: 8,
  paddingBottom: 8,
  minHeight: 52,
  borderBottomWidth: 0,
  shadowColor: 'transparent',
  elevation: 0,
  zIndex: 50,
},

headerLogo: {
  alignItems: 'flex-start',
  justifyContent: 'center',
},

logoImg: {
  width: 80,
  height: 50,
},

headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 16,
},

iconBtn: {
  width: 26,
  height: 26,
  borderRadius: 13,
  backgroundColor: 'transparent',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
},

notifDot: {
  position: 'absolute',
  top: -1,
  right: -1,
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: colors.orange,
  borderWidth: 0,
},

avatar: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: colors.orange,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 0,
},

  dropdown: {
    position: 'absolute', top: '100%', right: 20,
    backgroundColor: colors.surface, borderRadius: 16,
    paddingVertical: 6,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    elevation: 10, zIndex: 100, minWidth: 180,
    borderWidth: 1, borderColor: colors.border,
  },
  dropdownDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: colors.text },

  contentPane: { flex: 1, paddingBottom: 88 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: 12, paddingBottom: 32 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A2B3C' },
  pageSubtitle: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginTop: -9 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18, padding: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statDecor: {
    position: 'absolute', top: -24, right: -24,
    width: 80, height: 80, borderRadius: 40,
  },
  statIconRow: { alignItems: 'center', marginBottom: 10 },
  statIconBg: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '800', color: '#1A2B3C', lineHeight: 30, textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2, marginBottom: 6, textAlign: 'center' },
  statBadge: { alignSelf: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  statChange: { fontSize: 11, fontWeight: '700' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B3C' },
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  viewAllText: { fontSize: 13, color: '#374151', fontWeight: '600' },

  bookingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  bookingLeft: { flex: 1 },
  bookingName: { fontSize: 15, fontWeight: '700', color: '#1A2B3C' },
  bookingMeta: { fontSize: 13, color: '#9CA3AF', marginTop: 3 },
  bookingRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotText: { fontSize: 15, fontWeight: '800', color: '#EE6B20' },
  divider: { height: 1, backgroundColor: '#F0F2F5', marginHorizontal: -16 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  badgeText: { fontSize: 13, fontWeight: '700' },

  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, gap: 14,
    marginBottom: 8,
  },
  actionIconBg: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A2B3C' },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#F0F2F5',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8,
  },
  statusLabel: { fontSize: 14, fontWeight: '500', color: '#1A2B3C' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusValue: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },

  logoutOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoutCard: { backgroundColor: '#fff', borderRadius: 40, padding: 28, paddingTop: 90, alignItems: 'center', gap: 12, width: '100%', maxWidth: 360 },
  logoutMascot: { position: 'absolute', top: -110, width: 200, height: 200 },
  logoutTitle: { fontSize: 24, fontWeight: '800', color: colors.navy, textAlign: 'center', lineHeight: 30 },
  logoutSub: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 8 },
  logoutConfirmBtn: { width: '100%', height: 56, borderRadius: 20, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  logoutConfirmText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  logoutCancelBtn: { width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' },
  logoutCancelText: { fontSize: 14, fontWeight: '700', color: colors.muted },

  tabBarBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    marginVertical: -12,
    backgroundColor: '#FFFFFF',
    zIndex: 55,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginVertical: -12,
    paddingTop: 12,
    paddingBottom: 14,
    zIndex: 60,
    elevation: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3, },
  tabIconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: {},
  tabIconWrapHighlight: {
    borderWidth: 3,
    borderColor: '#EE6B20',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(238,107,32,0.08)',
  },
  tabDot: {
    position: 'absolute', top: -2, right: -6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.orange,
  },
  tabLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  tabLabelActive: { color: colors.orange, fontWeight: '700' },
});
