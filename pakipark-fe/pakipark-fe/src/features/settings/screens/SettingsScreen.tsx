import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

type Tab = 'parking-rates' | 'payment-methods' | 'security' | 'notifications' | 'user-management' | 'system-preferences';

interface ParkingRate { id: number; vehicleType: string; hourlyRate: number; dailyRate: number }
interface PaymentMethod { id: number; name: string; enabled: boolean; processingFee: string }
interface AdminUser { id: number; name: string; email: string; role: string; status: 'Active' | 'Inactive' }
type NotificationSettingKey = 'emailNotifications' | 'smsNotifications' | 'pushNotifications' | 'bookingAlerts' | 'paymentAlerts' | 'systemAlerts';

const ADMIN_HEADER_COLOR = '#1C436B';

const INIT_RATES: ParkingRate[] = [
  { id: 1, vehicleType: 'Sedan',      hourlyRate: 50, dailyRate: 300 },
  { id: 2, vehicleType: 'SUV',        hourlyRate: 75, dailyRate: 450 },
  { id: 3, vehicleType: 'Motorcycle', hourlyRate: 30, dailyRate: 180 },
];

const INIT_METHODS: PaymentMethod[] = [
  { id: 1, name: 'Cash on Site',      enabled: true, processingFee: 'None' },
  { id: 2, name: 'GCash',             enabled: true, processingFee: '2%'   },
  { id: 3, name: 'PayMaya',           enabled: true, processingFee: '2.5%' },
  { id: 4, name: 'Credit/Debit Card', enabled: true, processingFee: '3%'   },
];

const INIT_ADMIN_USERS: AdminUser[] = [
  { id: 1, name: 'Admin User', email: 'admin@pakipark.com', role: 'Super Admin', status: 'Active' },
  { id: 2, name: 'John Manager', email: 'john@pakipark.com', role: 'Manager', status: 'Active' },
  { id: 3, name: 'Jane Staff', email: 'jane@pakipark.com', role: 'Staff', status: 'Active' },
];

const TABS: { id: Tab; label: string }[] = [
  { id: 'parking-rates',   label: 'Parking Rates'   },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'security',        label: 'Security'        },
];

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 2500); };
  return { msg, show };
}

export function SettingsScreen() {
  const [tab, setTab] = useState<Tab>('parking-rates');
  const { msg, show } = useToast();

  const [rates, setRates] = useState<ParkingRate[]>(INIT_RATES);
  const [gateModal, setGateModal] = useState(false);
  const [rateModal, setRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<ParkingRate | null>(null);
  const [rateForm, setRateForm] = useState({ vehicleType: '', hourlyRate: '', dailyRate: '' });
  const [methods, setMethods] = useState<PaymentMethod[]>(INIT_METHODS);
  const [security, setSecurity] = useState({
    twoFactorAuth: false, sessionTimeout: 30, passwordExpiry: 90, loginAttempts: 5,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true, smsNotifications: false, pushNotifications: true,
    bookingAlerts: true, paymentAlerts: true, systemAlerts: true,
  });
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(INIT_ADMIN_USERS);
  const [userModal, setUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Staff', status: 'Active' as AdminUser['status'] });
  const [openUserDropdown, setOpenUserDropdown] = useState<'role' | 'status' | null>(null);
  const [openPreferenceDropdown, setOpenPreferenceDropdown] = useState<'timezone' | 'currency' | null>(null);
  const [systemPreferences, setSystemPreferences] = useState({
    parkingName: 'PakiPark Admin',
    timezone: 'Asia/Manila',
    currency: 'PHP',
    operatingHours: '24/7',
    maxBookingDays: '30',
    cancellationWindow: '2',
  });

  const timezoneOptions = [
    { value: 'Asia/Manila', label: 'Manila (PHT)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'UTC', label: 'UTC' },
  ];

  const currencyOptions = [
    { value: 'PHP', label: 'PHP (P)' },
    { value: 'USD', label: 'USD ($)' },
  ];

  const openRateGate = (rate?: ParkingRate) => {
    setEditingRate(rate ?? null);
    setRateForm(rate
      ? { vehicleType: rate.vehicleType, hourlyRate: String(rate.hourlyRate), dailyRate: String(rate.dailyRate) }
      : { vehicleType: '', hourlyRate: '', dailyRate: '' });
    setGateModal(true);
  };

  const proceedToForm = () => { setGateModal(false); setRateModal(true); };

  const saveRate = () => {
    const r = { vehicleType: rateForm.vehicleType, hourlyRate: Number(rateForm.hourlyRate), dailyRate: Number(rateForm.dailyRate) };
    if (!r.vehicleType || !r.hourlyRate || !r.dailyRate) { show('Fill in all fields'); return; }
    if (editingRate) setRates(rates.map((x) => x.id === editingRate.id ? { ...x, ...r } : x));
    else setRates([...rates, { ...r, id: Date.now() }]);
    show(editingRate ? '✓ Rate updated!' : '✓ Rate added!');
    setRateModal(false);
  };

  const openAddUser = () => {
    setEditingUserId(null);
    setUserForm({ name: '', email: '', role: 'Staff', status: 'Active' });
    setOpenUserDropdown(null);
    setUserModal(true);
  };

  const openEditUser = (user: AdminUser) => {
    setEditingUserId(user.id);
    setUserForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setOpenUserDropdown(null);
    setUserModal(true);
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      show('Fill in all required fields');
      return;
    }

    setAdminUsers((current) => {
      const payload = { name: userForm.name.trim(), email: userForm.email.trim(), role: userForm.role, status: userForm.status };
      if (editingUserId !== null) {
        return current.map((user) => user.id === editingUserId ? { ...user, ...payload } : user);
      }
      return [...current, { id: Date.now(), ...payload }];
    });
    setUserModal(false);
    setOpenUserDropdown(null);
    setEditingUserId(null);
    show(editingUserId !== null ? 'Admin user updated!' : 'Admin user added!');
  };

  return (
    <View style={s.root}>
      {msg && (
        <View style={s.toast}>
          <Text style={s.toastText}>{msg}</Text>
        </View>
      )}

      <View style={s.subHeader}>
        <View>
          <Text style={s.subHeaderTitle}>System Settings</Text>
          <Text style={s.subHeaderSub}>Configure global platform parameters</Text>
        </View>
      </View>

      <View style={s.tabsWrapper}>
        <View style={s.tabBar}>
          {TABS.map((tb) => (
            <TouchableOpacity
              key={tb.id}
              style={[s.tabBtn, tab === tb.id && s.tabBtnActive]}
              onPress={() => setTab(tb.id)}
              accessibilityLabel={tb.label}
            >
              <Text style={[s.tabBtnText, tab === tb.id && s.tabBtnTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'notifications' && (
          <View style={s.card}>
            <View style={s.cardSectionHeader}>
              <Text style={s.cardTitle}>Alerts & Notifications</Text>
              <Text style={s.cardSubtitle}>Manage your communication channels and types</Text>
            </View>

            <View style={s.notificationGroup}>
              <Text style={s.notificationGroupTitle}>Channels</Text>
              {([
                { key: 'emailNotifications', title: 'Email Alerts', subtitle: 'Receive updates via email' },
                { key: 'smsNotifications', title: 'SMS Alerts', subtitle: 'Text messages to phone' },
                { key: 'pushNotifications', title: 'Push Alerts', subtitle: 'Browser notifications' },
              ] as { key: NotificationSettingKey; title: string; subtitle: string }[]).map((item, index, list) => (
                <View key={item.key} style={[s.notificationRow, index === list.length - 1 ? s.notificationRowLast : null]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.secTitle}>{item.title}</Text>
                    <Text style={s.secSub}>{item.subtitle}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.smallToggle, notificationSettings[item.key] ? s.smallToggleOn : s.smallToggleOff]}
                    onPress={() => setNotificationSettings((current) => ({ ...current, [item.key]: !current[item.key] }))}
                    accessibilityLabel={`Toggle ${item.title}`}
                  >
                    <View style={s.smallToggleThumb} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={s.notificationGroup}>
              <Text style={s.notificationGroupTitle}>Alert Types</Text>
              {([
                { key: 'bookingAlerts', title: 'Booking Activity', subtitle: 'New reservations & changes' },
                { key: 'paymentAlerts', title: 'Payment Status', subtitle: 'Receipts & failures' },
                { key: 'systemAlerts', title: 'System Health', subtitle: 'Maintenance & updates' },
              ] as { key: NotificationSettingKey; title: string; subtitle: string }[]).map((item, index, list) => (
                <View key={item.key} style={[s.notificationRow, index === list.length - 1 ? s.notificationRowLast : null]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.secTitle}>{item.title}</Text>
                    <Text style={s.secSub}>{item.subtitle}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.smallToggle, notificationSettings[item.key] ? s.smallToggleOn : s.smallToggleOff]}
                    onPress={() => setNotificationSettings((current) => ({ ...current, [item.key]: !current[item.key] }))}
                    accessibilityLabel={`Toggle ${item.title}`}
                  >
                    <View style={s.smallToggleThumb} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={s.notificationActions}>
              <TouchableOpacity style={s.saveBtnCompact} onPress={() => show('Notification settings saved!')} accessibilityLabel="Save Notification Settings">
                <Ionicons name="save-outline" size={14} color="#fff" />
                <Text style={s.saveBtnText}>Save Alerts Configuration</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {tab === 'user-management' && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <View>
                <Text style={s.cardTitle}>Admin Users</Text>
                <Text style={s.cardSubtitle}>Manage internal system administrators</Text>
              </View>
              <TouchableOpacity
                style={s.addBtn}
                onPress={openAddUser}
                accessibilityLabel="Add User"
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.addBtnText}>Add User</Text>
              </TouchableOpacity>
            </View>

            {adminUsers.map((user) => (
              <View key={user.id} style={s.userRow}>
                <View style={s.userInfoRow}>
                  <View style={s.userAvatar}>
                    <Text style={s.userAvatarText}>{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.methodName}>{user.name}</Text>
                    <Text style={s.methodFee}>{user.email}</Text>
                    <View style={s.userBadges}>
                      <Text style={s.userRole}>{user.role}</Text>
                      <Text style={[s.userStatus, user.status === 'Inactive' ? s.userStatusInactive : null]}>{user.status}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.userActions}>
                  <TouchableOpacity style={s.userActionBtn} onPress={() => openEditUser(user)} accessibilityLabel="Edit user">
                    <Ionicons name="create-outline" size={15} color={colors.navy} />
                    <Text style={s.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.userActionBtn} onPress={() => setAdminUsers((current) => current.filter((item) => item.id !== user.id))} accessibilityLabel="Delete user">
                    <Ionicons name="trash-outline" size={15} color={colors.navy} />
                    <Text style={s.editBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'system-preferences' && (
          <View style={s.card}>
            <View style={s.cardSectionHeader}>
              <Text style={s.cardTitle}>System Preferences</Text>
              <Text style={s.cardSubtitle}>Configure core global platform settings</Text>
            </View>

            <View style={s.preferenceGroup}>
              <Text style={s.notificationGroupTitle}>General Info</Text>
              <Text style={s.preferenceLabel}>Facility Name</Text>
              <TextInput style={s.preferenceInput} value={systemPreferences.parkingName} onChangeText={(parkingName) => setSystemPreferences((current) => ({ ...current, parkingName }))} />

              <Text style={s.preferenceLabel}>Timezone</Text>
              <TouchableOpacity
                style={[s.preferenceSelect, openPreferenceDropdown === 'timezone' ? s.preferenceSelectOpen : null]}
                onPress={() => setOpenPreferenceDropdown((current) => current === 'timezone' ? null : 'timezone')}
                accessibilityLabel="Select timezone"
              >
                <Text style={s.preferenceSelectText}>{timezoneOptions.find((item) => item.value === systemPreferences.timezone)?.label ?? systemPreferences.timezone}</Text>
                <Ionicons name="chevron-down" size={18} color={colors.navy} />
              </TouchableOpacity>
              {openPreferenceDropdown === 'timezone' ? (
                <View style={s.preferenceDropdownMenu}>
                  {timezoneOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[s.userDropdownItem, systemPreferences.timezone === option.value ? s.userDropdownItemActive : null]}
                      onPress={() => {
                        setSystemPreferences((current) => ({ ...current, timezone: option.value }));
                        setOpenPreferenceDropdown(null);
                      }}
                    >
                      <Text style={[s.userDropdownText, systemPreferences.timezone === option.value ? s.userDropdownTextActive : null]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <Text style={s.preferenceLabel}>Currency</Text>
              <TouchableOpacity
                style={[s.preferenceSelect, openPreferenceDropdown === 'currency' ? s.preferenceSelectOpen : null]}
                onPress={() => setOpenPreferenceDropdown((current) => current === 'currency' ? null : 'currency')}
                accessibilityLabel="Select currency"
              >
                <Text style={s.preferenceSelectText}>{currencyOptions.find((item) => item.value === systemPreferences.currency)?.label ?? systemPreferences.currency}</Text>
                <Ionicons name="chevron-down" size={18} color={colors.navy} />
              </TouchableOpacity>
              {openPreferenceDropdown === 'currency' ? (
                <View style={s.preferenceDropdownMenu}>
                  {currencyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[s.userDropdownItem, systemPreferences.currency === option.value ? s.userDropdownItemActive : null]}
                      onPress={() => {
                        setSystemPreferences((current) => ({ ...current, currency: option.value }));
                        setOpenPreferenceDropdown(null);
                      }}
                    >
                      <Text style={[s.userDropdownText, systemPreferences.currency === option.value ? s.userDropdownTextActive : null]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={s.preferenceGroup}>
              <Text style={s.notificationGroupTitle}>Booking Rules</Text>
              <Text style={s.preferenceLabel}>Operating Hours</Text>
              <TextInput style={s.preferenceInput} value={systemPreferences.operatingHours} onChangeText={(operatingHours) => setSystemPreferences((current) => ({ ...current, operatingHours }))} />

              <Text style={s.preferenceLabel}>Max Booking Advance (Days)</Text>
              <TextInput style={s.preferenceInput} keyboardType="numeric" value={systemPreferences.maxBookingDays} onChangeText={(maxBookingDays) => setSystemPreferences((current) => ({ ...current, maxBookingDays }))} />

              <Text style={s.preferenceLabel}>Cancellation Window (Hours)</Text>
              <TextInput style={s.preferenceInput} keyboardType="numeric" value={systemPreferences.cancellationWindow} onChangeText={(cancellationWindow) => setSystemPreferences((current) => ({ ...current, cancellationWindow }))} />
            </View>

            <View style={s.notificationActions}>
              <TouchableOpacity style={s.saveBtnCompact} onPress={() => show('System preferences saved!')} accessibilityLabel="Save System Preferences">
                <Ionicons name="save-outline" size={14} color="#fff" />
                <Text style={s.saveBtnText}>Save System Configuration</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {tab === 'parking-rates' && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <View>
                <Text style={s.cardTitle}>Parking Rates</Text>
                <Text style={s.cardSubtitle}>Manage pricing and vehicle rules</Text>
              </View>
              <TouchableOpacity style={s.addBtn} onPress={() => openRateGate()} accessibilityLabel="Add Rate">
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.addBtnText}>Add Rate</Text>
              </TouchableOpacity>
            </View>

            {rates.map((rate) => (
              <View key={rate.id} style={s.rateItem}>
                <View style={s.rateTop}>
                  <View style={s.rateIconBg}>
                    <Ionicons name="car-outline" size={22} color="#fff" />
                  </View>
                  <View>
                    <Text style={s.rateName}>{rate.vehicleType}</Text>
                    <View style={s.ratePriceRow}>
                      <Text style={s.rateHourly}>₱{rate.hourlyRate}/hr</Text>
                      <Text style={s.rateDot}> · </Text>
                      <Text style={s.rateDaily}>₱{rate.dailyRate}/day</Text>
                    </View>
                  </View>
                </View>
                <View style={s.rateBtns}>
                  <TouchableOpacity style={s.editBtn} onPress={() => openRateGate(rate)} accessibilityLabel="Edit">
                    <Ionicons name="create-outline" size={14} color={colors.navy} />
                    <Text style={s.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => { setRates(rates.filter((r) => r.id !== rate.id)); show('✓ Rate deleted.'); }}
                    accessibilityLabel="Delete"
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={s.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'payment-methods' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Payment Methods</Text>
            <Text style={s.cardSubtitle}>Enable or disable accepted payment gateways</Text>

            {[...methods].sort((a, b) => a.name === 'Cash on Site' ? -1 : b.name === 'Cash on Site' ? 1 : 0).map((m) => {
              const isCash = m.name === 'Cash on Site';
              return (
                <View key={m.id} style={s.methodRow}>
                  <View style={[s.methodIcon, { backgroundColor: m.enabled ? ADMIN_HEADER_COLOR : '#9CA3AF' }]}>
                    <Ionicons name={isCash ? 'cash-outline' : 'card-outline'} size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.methodName} numberOfLines={1}>{m.name}</Text>
                      {isCash && (
                        <View style={s.defaultBadge}>
                          <Text style={s.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.methodFee}>Processing Fee: {m.processingFee}</Text>
                  </View>
                  {isCash
                    ? <Text style={s.alwaysOn}>ALWAYS ON</Text>
                    : (
                      <TouchableOpacity
                        style={[s.smallToggle, m.enabled ? s.smallToggleOn : s.smallToggleOff]}
                        onPress={() => setMethods(methods.map((x) => x.id === m.id ? { ...x, enabled: !x.enabled } : x))}
                        accessibilityLabel={`Toggle ${m.name}`}
                      >
                        <View style={[s.smallToggleThumb, m.enabled ? s.smallToggleThumbOn : null]} />
                      </TouchableOpacity>
                    )
                  }
                </View>
              );
            })}
          </View>
        )}

        {tab === 'security' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Security Policies</Text>
            <Text style={s.cardSubtitle}>Manage access controls and session timeouts</Text>

            <View style={s.secRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.secTitle}>Two-Factor Authentication</Text>
                <Text style={s.secSub}>Require 2FA for all admin logins</Text>
              </View>
              <TouchableOpacity
                style={[s.smallToggle, security.twoFactorAuth ? s.smallToggleOn : s.smallToggleOff]}
                onPress={() => setSecurity((current) => ({ ...current, twoFactorAuth: !current.twoFactorAuth }))}
                accessibilityLabel="Toggle two-factor authentication"
              >
                <View style={s.smallToggleThumb} />
              </TouchableOpacity>
            </View>

            <View style={s.secRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.secTitle}>Session Timeout</Text>
                <Text style={s.secSub}>Auto-logout after inactivity</Text>
              </View>
              <View style={s.numRow}>
                <TextInput
                  style={s.numInput}
                  keyboardType="numeric"
                  value={String(security.sessionTimeout)}
                  onChangeText={(v) => setSecurity({ ...security, sessionTimeout: Number(v) })}
                />
                <Text style={s.numUnit}>min</Text>
              </View>
            </View>

            <View style={s.secRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.secTitle}>Password Expiry</Text>
                <Text style={s.secSub}>Force reset after N days</Text>
              </View>
              <View style={s.numRow}>
                <TextInput
                  style={s.numInput}
                  keyboardType="numeric"
                  value={String(security.passwordExpiry)}
                  onChangeText={(v) => setSecurity({ ...security, passwordExpiry: Number(v) })}
                />
                <Text style={s.numUnit}>days</Text>
              </View>
            </View>

            <View style={[s.secRow, { borderBottomWidth: 0 }]}> 
              <View style={{ flex: 1 }}>
                <Text style={s.secTitle}>Max Login Attempts</Text>
                <Text style={s.secSub}>Lockout account after N failures</Text>
              </View>
              <View style={s.numRow}>
                <TextInput
                  style={s.numInput}
                  keyboardType="numeric"
                  value={String(security.loginAttempts)}
                  onChangeText={(v) => setSecurity({ ...security, loginAttempts: Number(v) })}
                />
                <Text style={s.numUnit}>tries</Text>
              </View>
            </View>

            <View style={s.notificationActions}>
              <TouchableOpacity style={s.saveBtnCompact} onPress={() => show('✓ Security settings saved!')} accessibilityLabel="Save Security Settings">
                <Ionicons name="save-outline" size={14} color="#fff" />
                <Text style={s.saveBtnText}>Save Security Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={gateModal} transparent animationType="fade" onRequestClose={() => setGateModal(false)}>
        <View style={s.gateOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setGateModal(false)} activeOpacity={1} />
          <View style={s.gateCard}>
            <View style={s.gateHeader}>
              <TouchableOpacity style={s.gateCloseBtn} onPress={() => setGateModal(false)}>
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <View style={s.gateIconWrap}>
                <Ionicons name="options-outline" size={32} color="#fff" />
              </View>
              <Text style={s.gateTitle}>Advanced Options</Text>
              <Text style={s.gateSub}>{editingRate ? `Editing: ${editingRate.vehicleType}` : 'Add a new parking rate'}</Text>
            </View>
            <View style={s.gateBody}>
              <View style={s.gateWarning}>
                <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                <Text style={s.gateWarningText}>Changes to parking rates will immediately affect all future bookings. Please review carefully before saving.</Text>
              </View>
              <View style={s.gateBtns}>
                <TouchableOpacity style={s.gateCancelBtn} onPress={() => setGateModal(false)}>
                  <Text style={s.gateCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.gateProceedBtn} onPress={proceedToForm}>
                  <Text style={s.gateProceedText}>PROCEED</Text>
                  <Ionicons name="chevron-forward" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={rateModal} transparent animationType="slide" onRequestClose={() => setRateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.keyboardAvoidingView}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setRateModal(false)} activeOpacity={1} />
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingRate ? 'Edit Rate' : 'Add New Rate'}</Text>
              <TouchableOpacity onPress={() => setRateModal(false)} accessibilityLabel="Close">
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={s.modalBody}>
              <Text style={s.modalLabel}>VEHICLE TYPE</Text>
              <TextInput style={s.modalInput} placeholder="e.g. Sedan, SUV, Motorcycle" value={rateForm.vehicleType} onChangeText={(v) => setRateForm({ ...rateForm, vehicleType: v })} placeholderTextColor={colors.muted} />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalLabel}>HOURLY (₱)</Text>
                  <TextInput style={s.modalInput} keyboardType="numeric" placeholder="50" value={rateForm.hourlyRate} onChangeText={(v) => setRateForm({ ...rateForm, hourlyRate: v })} placeholderTextColor={colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalLabel}>DAILY (₱)</Text>
                  <TextInput style={s.modalInput} keyboardType="numeric" placeholder="300" value={rateForm.dailyRate} onChangeText={(v) => setRateForm({ ...rateForm, dailyRate: v })} placeholderTextColor={colors.muted} />
                </View>
              </View>
            </View>
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setRateModal(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSaveBtn} onPress={saveRate}>
                <Ionicons name="save-outline" size={14} color="#fff" />
                <Text style={s.modalSaveText}>{editingRate ? 'Update Rate' : 'Save Rate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={userModal} transparent animationType="fade" onRequestClose={() => setUserModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.keyboardAvoidingView}>
        <View style={s.userModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setUserModal(false)} activeOpacity={1} />
          <View style={s.userModalCard}>
            <View style={s.userModalHeader}>
              <Text style={s.userModalTitle}>{editingUserId !== null ? 'Edit User' : 'Add Admin User'}</Text>
              <TouchableOpacity style={s.userModalClose} onPress={() => { setUserModal(false); setEditingUserId(null); setOpenUserDropdown(null); }} accessibilityLabel="Close">
                <Ionicons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalLabel}>FULL NAME</Text>
            <TextInput
              style={s.userModalInput}
              placeholder="Juan Dela Cruz"
              placeholderTextColor="#B8C2CF"
              value={userForm.name}
              onChangeText={(name) => setUserForm((current) => ({ ...current, name }))}
            />

            <Text style={s.modalLabel}>EMAIL</Text>
            <TextInput
              style={s.userModalInput}
              placeholder="juan@pakipark.com"
              placeholderTextColor="#B8C2CF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={userForm.email}
              onChangeText={(email) => setUserForm((current) => ({ ...current, email }))}
            />

            <View style={s.userModalPickerRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.modalLabel}>ROLE</Text>
                <TouchableOpacity
                  style={[s.userModalSelect, openUserDropdown === 'role' ? s.userModalSelectOpen : null]}
                  onPress={() => setOpenUserDropdown((current) => current === 'role' ? null : 'role')}
                  accessibilityLabel="Select role"
                >
                  <Text style={s.userModalSelectText}>{userForm.role}</Text>
                  <Ionicons name="chevron-down" size={18} color={colors.navy} />
                </TouchableOpacity>
                {openUserDropdown === 'role' ? (
                  <View style={s.userDropdownMenu}>
                    {['Super Admin', 'Manager', 'Staff'].map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[s.userDropdownItem, userForm.role === role ? s.userDropdownItemActive : null]}
                        onPress={() => {
                          setUserForm((current) => ({ ...current, role }));
                          setOpenUserDropdown(null);
                        }}
                      >
                        <Text style={[s.userDropdownText, userForm.role === role ? s.userDropdownTextActive : null]}>{role}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.modalLabel}>STATUS</Text>
                <TouchableOpacity
                  style={[s.userModalSelect, openUserDropdown === 'status' ? s.userModalSelectOpen : null]}
                  onPress={() => setOpenUserDropdown((current) => current === 'status' ? null : 'status')}
                  accessibilityLabel="Select status"
                >
                  <Text style={s.userModalSelectText}>{userForm.status}</Text>
                  <Ionicons name="chevron-down" size={18} color={colors.navy} />
                </TouchableOpacity>
                {openUserDropdown === 'status' ? (
                  <View style={s.userDropdownMenu}>
                    {(['Active', 'Inactive'] as AdminUser['status'][]).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[s.userDropdownItem, userForm.status === status ? s.userDropdownItemActive : null]}
                        onPress={() => {
                          setUserForm((current) => ({ ...current, status }));
                          setOpenUserDropdown(null);
                        }}
                      >
                        <Text style={[s.userDropdownText, userForm.status === status ? s.userDropdownTextActive : null]}>{status}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={s.userModalActions}>
              <TouchableOpacity style={s.userModalCancelBtn} onPress={() => { setUserModal(false); setEditingUserId(null); setOpenUserDropdown(null); }}>
                <Text style={s.userModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.userModalSaveBtn} onPress={saveUser}>
                <Text style={s.userModalSaveText}>{editingUserId !== null ? 'Update User' : 'Add User'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  keyboardAvoidingView: { flex: 1 },
  toast: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999, backgroundColor: '#10B981', paddingVertical: 12, alignItems: 'center' },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  subHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  subHeaderTitle: { fontSize: 26, fontWeight: '800', color: '#1A2B3C' },
  subHeaderSub: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginTop: 2 },

  tabsWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    padding: 4,
    position: 'relative',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
  },
  tabBtn: { flex: 1, minHeight: 34, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: ADMIN_HEADER_COLOR },
  tabBtnText: { fontSize: 12, fontWeight: '800', color: colors.muted },
  tabBtnTextActive: { color: '#fff' },

  scroll: { padding: spacing.lg, paddingBottom: 32 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, gap: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardSectionHeader: { borderBottomWidth: 1, borderBottomColor: '#EEF2F6', paddingBottom: spacing.md, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.navy },
  cardSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.orange, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  rateItem: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: spacing.md, gap: spacing.sm },
  rateTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rateIconBg: { width: 46, height: 46, borderRadius: 14, backgroundColor: ADMIN_HEADER_COLOR, alignItems: 'center', justifyContent: 'center' },
  rateName: { fontSize: 16, fontWeight: '700', color: colors.navy },
  ratePriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rateHourly: { fontSize: 13, fontWeight: '700', color: colors.orange },
  rateDot: { fontSize: 13, color: colors.muted },
  rateDaily: { fontSize: 13, fontWeight: '600', color: colors.muted },
  rateBtns: { flexDirection: 'row', gap: spacing.sm },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingVertical: 10 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: colors.navy },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 10, paddingVertical: 10 },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },

  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: '#E5EAF1', borderRadius: 14, backgroundColor: '#F8FAFC' },
  methodIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodName: { fontSize: 14, fontWeight: '700', color: colors.navy },
  methodFee: { fontSize: 12, color: colors.muted, marginTop: 2 },
  defaultBadge: { backgroundColor: '#D1FAE5', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  defaultBadgeText: { fontSize: 9, fontWeight: '900', color: '#047857', textTransform: 'uppercase' },
  alwaysOn: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 0.5 },
  smallToggle: { width: 34, height: 20, borderRadius: 999, padding: 2, justifyContent: 'center', flexShrink: 0 },
  smallToggleOn: { backgroundColor: colors.orange, alignItems: 'flex-end' },
  smallToggleOff: { backgroundColor: '#D1D5DB', alignItems: 'flex-start' },
  smallToggleThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },
  smallToggleThumbOn: {},
  userRow: { gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: '#E5EAF1', borderRadius: 14, backgroundColor: '#F8FAFC' },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  userAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: ADMIN_HEADER_COLOR, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  userBadges: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  userRole: { fontSize: 10, fontWeight: '800', color: colors.orange, backgroundColor: '#FFF3EA', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  userStatus: { fontSize: 10, fontWeight: '800', color: '#047857', backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  userStatusInactive: { color: '#6B7280', backgroundColor: '#E5E7EB' },
  userActions: { flexDirection: 'row', gap: spacing.sm },
  userActionBtn: { flex: 1, height: 34, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },

  secRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  secTitle: { fontSize: 14, fontWeight: '700', color: colors.navy },
  secSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  numRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numInput: { width: 64, height: 40, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.navy, backgroundColor: '#F8FAFC' },
  numUnit: { fontSize: 12, color: colors.muted, width: 30 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.orange, borderRadius: 14, paddingVertical: spacing.md, marginTop: spacing.sm },
  saveBtnCompact: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.orange, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 20 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  notificationGroup: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5EAF1', borderRadius: 16, padding: spacing.md, gap: 0 },
  notificationGroupTitle: { fontSize: 11, fontWeight: '900', color: colors.muted, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: spacing.sm },
  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5EAF1' },
  notificationRowLast: { borderBottomWidth: 0 },
  notificationActions: { alignItems: 'flex-end', paddingTop: spacing.sm },
  preferenceGroup: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5EAF1', borderRadius: 16, padding: spacing.md, gap: 8 },
  preferenceLabel: { fontSize: 12, fontWeight: '800', color: colors.navy, marginTop: 4 },
  preferenceInput: { height: 40, borderWidth: 1.5, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.navy, fontSize: 13 },
  preferenceSelect: { height: 40, borderWidth: 1.5, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preferenceSelectOpen: { borderColor: colors.orange, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  preferenceSelectText: { color: colors.navy, fontSize: 13 },
  preferenceDropdownMenu: { marginTop: -8, borderWidth: 1.5, borderTopWidth: 0, borderColor: colors.orange, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden', paddingVertical: 2 },

  gateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  gateCard: { width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden' },
  gateHeader: { backgroundColor: '#1E3D5A', paddingTop: spacing.xl, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg, alignItems: 'center', gap: spacing.sm },
  gateCloseBtn: { position: 'absolute', top: spacing.md, right: spacing.md, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  gateIconWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  gateTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  gateSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  gateBody: { padding: spacing.lg, gap: spacing.lg },
  gateWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 14, padding: spacing.md },
  gateWarningText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '500', lineHeight: 19 },
  gateBtns: { flexDirection: 'row', gap: spacing.md },
  gateCancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  gateCancelText: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 0.5 },
  gateProceedBtn: { flex: 2, height: 48, borderRadius: 14, backgroundColor: colors.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  gateProceedText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: ADMIN_HEADER_COLOR, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  modalBody: { padding: spacing.lg, gap: spacing.sm },
  modalLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 1, marginBottom: 4 },
  modalInput: { height: 44, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, fontSize: 14, color: colors.navy, backgroundColor: '#F8FAFC' },
  modalFooter: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, paddingTop: 0 },
  modalCancelBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  modalSaveBtn: { flex: 2, height: 44, borderRadius: 12, backgroundColor: colors.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modalSaveText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  userModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  userModalCard: { width: '100%', backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  userModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  userModalTitle: { fontSize: 18, fontWeight: '900', color: colors.navy },
  userModalClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  userModalInput: { height: 40, borderWidth: 1.5, borderColor: colors.border, borderRadius: 11, backgroundColor: '#F8FAFC', paddingHorizontal: 12, color: colors.navy, fontSize: 13, marginBottom: 8 },
  userModalPickerRow: { flexDirection: 'row', gap: spacing.md, marginTop: 2 },
  userModalSelect: { height: 42, borderWidth: 1.5, borderColor: colors.border, borderRadius: 11, backgroundColor: '#F8FAFC', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userModalSelectOpen: { borderColor: colors.orange, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  userModalSelectText: { fontSize: 13, color: colors.navy, fontWeight: '600' },
  userDropdownMenu: { borderWidth: 1.5, borderTopWidth: 0, borderColor: colors.orange, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden', paddingVertical: 2 },
  userDropdownItem: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 12 },
  userDropdownItemActive: { backgroundColor: '#E5E7EB', borderRadius: 5, marginHorizontal: 2 },
  userDropdownText: { fontSize: 13, color: colors.navy },
  userDropdownTextActive: { color: '#0F172A', fontWeight: '700' },
  userModalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  userModalCancelBtn: { flex: 1, height: 40, borderRadius: 11, backgroundColor: '#F1F3F6', alignItems: 'center', justifyContent: 'center' },
  userModalCancelText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  userModalSaveBtn: { flex: 1, height: 40, borderRadius: 11, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  userModalSaveText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
