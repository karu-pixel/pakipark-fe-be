import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { backendApi, saveSession } from '../../../lib/api';
import type { ApiUser } from '../../../lib/api';

type ProfileTab = 'info' | 'rates';
type RateType = 'hourly' | 'daily' | 'monthly';
type RateStatus = 'active' | 'inactive';
interface ParkingRate {
  id: string;
  location_id?: string;
  type: RateType;
  rate: number;
  status?: string;
  vehicleType: string;
  hourlyRate: number;
  dailyRate: number;
}

interface AdminProfileProps {
  onBack: () => void;
}



const ADMIN_SETTINGS_HIGHLIGHT = '#1C436B';

const normalizePhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('63')) return `0${digits.slice(2, 12)}`;
  if (digits.startsWith('0')) return digits.slice(0, 11);
  if (digits.startsWith('9')) return `0${digits.slice(0, 10)}`;
  return digits.slice(0, 11);
};

export function AdminProfile({ onBack }: AdminProfileProps) {
  const [tab, setTab] = useState<ProfileTab>('info');
  const [editing, setEditing] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [passwordHover, setPasswordHover] = useState(false);
  const [two_factor_enabled, settwo_factor_enabled] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; otpUri: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorModal, setTwoFactorModal] = useState<'setup' | 'disable' | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [locationsCount, setLocationsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [accountCreatedDate, setAccountCreatedDate] = useState('Jan 2025');
  const [refreshing, setRefreshing] = useState(false);

  // Parking rates
  const [rates, setRates] = useState<ParkingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [gateModal, setGateModal] = useState(false);
  const [rateModal, setRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<ParkingRate | null>(null);
  const [rateForm, setRateForm] = useState({ type: 'hourly' as RateType, rate: '', status: 'active' as RateStatus });

  const [profile, setProfile] = useState({
    firstName: '', lastName: '', name: 'Admin User',
    email: 'admin@pakipark.com',
    phone: '+63 917 123 4567',
    role: 'Super Administrator',
    dob: '',
    street: '',
    city: '',
    province: '',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  const fetchRates = async () => {
    setRatesLoading(true);
    try {
      const data = await backendApi.getParkingRates();
      setRates((data || []).filter((r: ParkingRate) => r.type === 'hourly'));
    } catch (err) {
      console.warn('Failed to fetch parking rates:', err);
    } finally {
      setRatesLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const me = await backendApi.getMe();
      setUser(me);
      settwo_factor_enabled(Boolean(me.two_factor_enabled));
      const [locs, statsData] = await Promise.all([
        backendApi.getLocations().catch(() => []),
        backendApi.getAdminStats().catch(() => null),
      ]);
      setLocationsCount(locs.length);
      setBookingsCount(statsData?.totalBookings || 0);
      setUsersCount(statsData?.activeUsers || 0);
      await fetchRates();
    } catch (err) {
      console.warn('Profile refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const me = await backendApi.getMe();
        setUser(me);
        settwo_factor_enabled(Boolean(me.two_factor_enabled));

        let dobVal = '';
        if (me.dateOfBirth) {
          try {
            const date = new Date(me.dateOfBirth);
            const day = String(date.getUTCDate()).padStart(2, '0');
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const year = date.getUTCFullYear();
            dobVal = `${day}/${month}/${year}`;
          } catch {
            dobVal = me.dateOfBirth;
          }
        }

        let streetVal = '';
        let cityVal = '';
        let provinceVal = '';
        if (me.address) {
          if (typeof me.address === 'string') {
            try {
              const parsed = JSON.parse(me.address);
              streetVal = parsed.street || '';
              cityVal = parsed.city || '';
              provinceVal = parsed.province || '';
            } catch {
              streetVal = me.address;
            }
          } else {
            streetVal = me.address.street || '';
            cityVal = me.address.city || '';
            provinceVal = me.address.province || '';
          }
        }

        setProfile((current) => ({
          ...current,
          firstName: me.first_name || me.firstName || '', lastName: me.last_name || me.lastName || '', name: me.name || current.name,
          email: me.email || current.email,
          phone: me.phone || current.phone,
          role: me.role === 'business_partner' ? 'Business Partner' : me.role === 'teller' ? 'Teller' : 'Administrator',
          dob: dobVal,
          street: streetVal,
          city: cityVal,
          province: provinceVal,
        }));
        if (me.profile_picture) setProfilePic(me.profile_picture);

        if (me.createdAt) {
          const date = new Date(me.createdAt);
          const formatted = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          setAccountCreatedDate(formatted);
        }

        // Parallel stats fetching
        const [locs, statsData] = await Promise.all([
          backendApi.getLocations().catch(() => []),
          backendApi.getAdminStats().catch(() => null),
        ]);
        setLocationsCount(locs.length);
        setBookingsCount(statsData?.totalBookings || 0);
        setUsersCount(statsData?.activeUsers || 0);
        void fetchRates();
      } catch (err) {
        console.warn('Admin profile load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === 'rates') void fetchRates();
  }, [tab]);

  const initials = ((profile.firstName ? `${profile.firstName} ${profile.lastName}` : profile.name) || 'Admin').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const RATE_TYPES: Array<RateType> = ['hourly', 'daily', 'monthly'];
  const getRateIcon = (type: string) => { if (type === 'daily') return 'sunny-outline'; if (type === 'monthly') return 'calendar-outline'; return 'time-outline'; };
  const getRateLabel = (type: string) => { if (type === 'daily') return 'Daily'; if (type === 'monthly') return 'Monthly'; return 'Hourly'; };
  const getRateUnit = (type: string) => { if (type === 'daily') return '/day'; if (type === 'monthly') return '/month'; return '/hr'; };
  const getPlaceholder = (type: string) => { if (type === 'daily') return 'e.g. 300'; if (type === 'monthly') return 'e.g. 5000'; return 'e.g. 55'; };

  const [rateToastMsg, setRateToastMsg] = useState<string | null>(null);
  const showRateToast = (text: string) => { setRateToastMsg(text); setTimeout(() => setRateToastMsg(null), 2500); };

  const openRateGate = (rate?: ParkingRate) => {
    setEditingRate(rate ?? null);
    setRateForm(rate ? { type: (rate.type || 'hourly') as RateType, rate: String(rate.rate), status: (rate.status === 'inactive' ? 'inactive' : 'active') as RateStatus } : { type: 'hourly', rate: '', status: 'active' });
    setGateModal(true);
  };
  const proceedToRateForm = () => { setGateModal(false); setRateModal(true); };

  const saveRate = async () => {
    const amount = Number(rateForm.rate);
    if (!rateForm.type || !rateForm.rate || Number.isNaN(amount) || amount <= 0) { showRateToast('Enter a valid rate amount'); return; }
    const firstRate = rates[0];
    const payload = { type: rateForm.type, rate: amount, status: rateForm.status, ...(firstRate?.location_id ? { locationId: firstRate.location_id } : {}) };
    try {
      if (editingRate) { await backendApi.updateParkingRate(editingRate.id, payload as any); showRateToast('✓ Rate updated!'); }
      else { await backendApi.createParkingRate(payload as any); showRateToast('✓ Rate added!'); }
      setRateModal(false);
      await fetchRates();
    } catch (err: any) { showRateToast(err.message || 'Failed to save rate.'); }
  };

  const deleteRate = async (id: string) => {
    try { await backendApi.deleteParkingRate(id); showRateToast('✓ Rate deleted.'); await fetchRates(); }
    catch (err: any) { showRateToast(err.message || 'Failed to delete rate.'); }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);
      if (user) {
        try {
          const updated = await backendApi.updateProfile({ profile_picture: uri });
          await saveSession(updated);
          setUser(updated);
        } catch {
          // Keep local preview if upload sync fails.
        }
      }
    }
  };

  const saveProfile = async () => {
    const fullName = `${(profile.firstName || '').trim()} ${(profile.lastName || '').trim()}`.trim();
    if (!(profile.firstName || '').trim() || !(profile.lastName || '').trim()) { Alert.alert('Validation Error', 'First and Last Name are required.'); return; }


    if (!(profile.email || '').trim() || !/\S+@\S+\.\S+/.test((profile.email || '').trim())) {
      Alert.alert('Validation Error', 'A valid email is required.');
      return;
    }
    if (!(profile.phone || '').trim() || !/^09\d{9}$/.test((profile.phone || '').trim())) {
      Alert.alert('Validation Error', 'Mobile number must start with 09 and be 11 digits long.');
      return;
    }
    if (!(profile.dob || '').trim()) {
      Alert.alert('Validation Error', 'Birthdate is required.');
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test((profile.dob || '').trim())) {
      Alert.alert('Validation Error', 'Birthdate must use DD/MM/YYYY format.');
      return;
    }
    if (!(profile.street || '').trim() || !(profile.city || '').trim() || !(profile.province || '').trim()) {
      Alert.alert('Validation Error', 'Complete address details (street, city, province) are required.');
      return;
    }

    setSaving(true);
    try {
      const [day, month, year] = (profile.dob || '').trim().split('/');
      const isoDob = `${year}-${month}-${day}`;

      const updated = await backendApi.updateProfile({
        first_name: (profile.firstName || '').trim(), last_name: (profile.lastName || '').trim(), firstName: (profile.firstName || '').trim(), lastName: (profile.lastName || '').trim(), name: fullName,
        email: (profile.email || '').trim(),
        phone: (profile.phone || '').trim(),
        profile_picture: profilePic,
        dateOfBirth: isoDob,
        address: {
          street: (profile.street || '').trim(),
          city: (profile.city || '').trim(),
          province: (profile.province || '').trim(),
        },
      });

      await saveSession(updated);
      setUser(updated);

      let dobVal = '';
      if (updated.dateOfBirth) {
        try {
          const date = new Date(updated.dateOfBirth);
          const d = String(date.getUTCDate()).padStart(2, '0');
          const m = String(date.getUTCMonth() + 1).padStart(2, '0');
          const y = date.getUTCFullYear();
          dobVal = `${d}/${m}/${y}`;
        } catch {
          dobVal = updated.dateOfBirth;
        }
      }

      let streetVal = '';
      let cityVal = '';
      let provinceVal = '';
      if (updated.address) {
        if (typeof updated.address === 'string') {
          try {
            const parsed = JSON.parse(updated.address);
            streetVal = parsed.street || '';
            cityVal = parsed.city || '';
            provinceVal = parsed.province || '';
          } catch {
            streetVal = updated.address;
          }
        } else {
          streetVal = updated.address.street || '';
          cityVal = updated.address.city || '';
          provinceVal = updated.address.province || '';
        }
      }

      setProfile((current) => ({
        ...current,
        firstName: updated.first_name || updated.firstName || current.firstName, lastName: updated.last_name || updated.lastName || current.lastName, name: updated.name || current.name,
        email: updated.email || current.email,
        phone: updated.phone || current.phone,
        dob: dobVal,
        street: streetVal,
        city: cityVal,
        province: provinceVal,
      }));
      setEditing(false);
    } catch (err: any) {
      console.warn('Admin profile update failed:', err);
      Alert.alert('Update failed', err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handle2FAToggle = async (enabled: boolean) => {
    if (enabled) {
      setSaving(true);
      try {
        const setup = await backendApi.setup2FA();
        setTwoFactorSetup(setup);
        setTwoFactorCode('');
        setTwoFactorModal('setup');
      } catch (err) {
        console.warn('2FA setup failed:', err);
      } finally {
        setSaving(false);
      }
      return;
    }

    setTwoFactorPassword('');
    setTwoFactorModal('disable');
  };

  const verify2FA = async () => {
    if (!/^\d{6}$/.test(twoFactorCode.trim())) return;
    setSaving(true);
    try {
      await backendApi.verify2FA(twoFactorCode.trim());
      const updated = await backendApi.getMe();
      await saveSession(updated);
      setUser(updated);
      settwo_factor_enabled(Boolean(updated.two_factor_enabled));
      setTwoFactorModal(null);
      setTwoFactorSetup(null);
    } catch (err) {
      console.warn('2FA verification failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const disable2FA = async () => {
    if (!twoFactorPassword) return;
    setSaving(true);
    try {
      await backendApi.disable2FA(twoFactorPassword);
      const updated = await backendApi.getMe();
      await saveSession(updated);
      setUser(updated);
      settwo_factor_enabled(Boolean(updated.two_factor_enabled));
      setTwoFactorModal(null);
      setTwoFactorPassword('');
    } catch (err) {
      console.warn('2FA disable failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pw.current || !pw.next || !pw.confirm) {
      return Alert.alert('Error', 'Please fill in all password fields.');
    }
    if (pw.next !== pw.confirm) {
      return Alert.alert('Error', 'New passwords do not match.');
    }
    if (pw.next.length < 8) {
      return Alert.alert('Error', 'Password must be at least 8 characters long.');
    }

    setSaving(true);
    try {
      await backendApi.changePassword(pw.current, pw.next);
      Alert.alert('Success', 'Password changed successfully!');
      setPw({ current: '', next: '', confirm: '' });
      setPwModal(false);
    } catch (err: any) {
      console.warn('Password update failed:', err);
      Alert.alert('Password Not Changed', err.message || 'Unable to change your password.');
    } finally {
      setSaving(false);
    }
  };

  const copy2FASecret = async () => {
    if (!twoFactorSetup?.secret) return;
    await Clipboard.setStringAsync(twoFactorSetup.secret);
  };

  const STATS = [
    { label: 'Managed\nLocations', value: String(locationsCount) },
    { label: 'Active\nBookings',   value: String(bookingsCount) },
    { label: 'Users\nManaged',     value: String(usersCount) },
    { label: 'Account\nCreated',   value: accountCreatedDate.replace(' ', '\n') },
  ];

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={[s.root, { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }]}>
          <ActivityIndicator size="large" color="#FF8A00" />
          <Text style={{ marginTop: 15, fontFamily: 'Outfit-Medium', fontSize: 16, color: '#64748B' }}>
            Loading Profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.root}>
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Admin Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF8A00']}
            tintColor="#FF8A00"
          />
        }
      >
        <View style={s.hero}>
          <View style={s.heroGradientWrap} pointerEvents="none">
            <Svg style={s.heroGradient} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="adminProfileHeroGradient" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#10283C" />
                  <Stop offset="0.55" stopColor="#183A55" />
                  <Stop offset="1" stopColor="#2E5875" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill="url(#adminProfileHeroGradient)" />
            </Svg>
          </View>
          <View style={s.heroContent}>
            <View style={s.avatarWrap}>
              {profilePic
                ? <Image source={{ uri: profilePic }} style={s.avatarImg} />
                : <View style={s.avatarBox}><Text style={s.avatarText}>{initials}</Text></View>
              }
              <TouchableOpacity style={s.cameraBtn} onPress={pickImage} accessibilityLabel="Change photo">
                <Ionicons name="camera-outline" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={s.heroName}>{profile.firstName ? `${profile.firstName} ${profile.lastName}` : profile.name}</Text>
            <Text style={s.heroEmail}>{profile.email}</Text>



            <View style={s.statsRow}>
              {STATS.map((st) => (
                <View key={st.label} style={s.statBox}>
                  <Text style={s.statValue}>{st.value}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.tabBar}>
          {([
            { id: 'info',  label: 'Personal Info'  },
            { id: 'rates', label: 'Parking Rates'   },
          ] as const).map((tb) => (
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

        {tab === 'info' && (
          <>
            <View style={s.card}>
              <View style={s.cardHeaderRow}>
                <Text style={s.cardTitle}>Personal Information</Text>
                {!editing
                  ? <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)} accessibilityLabel="Edit">
                      <Ionicons name="pencil-outline" size={13} color="#fff" />
                      <Text style={s.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  : <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(false)}><Text style={s.cancelBtnText}>Cancel</Text></TouchableOpacity>
                      <TouchableOpacity style={[s.editBtn, saving && s.disabled]} onPress={saveProfile} disabled={saving}><Ionicons name="checkmark" size={13} color="#fff" /><Text style={s.editBtnText}>{saving ? 'Saving' : 'Save'}</Text></TouchableOpacity>
                    </View>
                }
              </View>

              {([
                { label: 'FIRST NAME',    key: 'firstName',  icon: 'person-outline',    editable: true  },
                { label: 'LAST NAME',     key: 'lastName',   icon: 'person-outline',    editable: true  },
                { label: 'EMAIL ADDRESS', key: 'email',      icon: 'mail-outline',      editable: true  },
                { label: 'PHONE NUMBER',  key: 'phone',      icon: 'call-outline',      editable: true  },
                { label: 'BIRTHDATE',     key: 'dob',        icon: 'calendar-outline',  editable: true  },
                { label: 'STREET ADDRESS',key: 'street',     icon: 'map-pin-outline',   editable: true  },
                { label: 'CITY',          key: 'city',       icon: 'home-outline',      editable: true  },
                { label: 'PROVINCE',      key: 'province',   icon: 'navigate-outline',  editable: true  },
              ] as const).map(({ label, key, icon, editable }) => (
                <View key={key} style={s.fieldWrap}>
                  <View style={s.fieldLabelRow}>
                    <Ionicons name={icon as any} size={12} color={colors.muted} />
                    <Text style={s.fieldLabel}>{label}</Text>
                  </View>
                  <TextInput
                    style={[s.fieldInput, (!editing || !editable) && s.fieldInputDisabled]}
                    value={profile[key]}
                    editable={editing && editable}
                    keyboardType={key === 'phone' ? 'phone-pad' : key === 'dob' ? 'number-pad' : undefined}
                    placeholder={key === 'dob' ? 'DD/MM/YYYY' : undefined}
                    placeholderTextColor="#94A3B8"
                    maxLength={key === 'phone' ? 11 : key === 'dob' ? 10 : undefined}
                    onChangeText={(v) => {
                      if (key === 'phone') {
                        setProfile({ ...profile, phone: normalizePhoneInput(v) });
                      } else if (key === 'dob') {
                        const cleaned = v.replace(/\D/g, '');
                        let formatted = cleaned;
                        if (cleaned.length > 2 && cleaned.length <= 4) {
                          formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
                        } else if (cleaned.length > 4) {
                          formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
                        }
                        setProfile({ ...profile, dob: formatted });
                      } else {
                        setProfile({ ...profile, [key]: v });
                      }
                    }}
                  />
                </View>
              ))}
            </View>

            <View style={s.securityCard}>
              <Text style={s.secTitle}>Security</Text>
              <Pressable
                style={({ pressed }) => [s.secBtn, (passwordHover || pressed) && s.secBtnActive]}
                onPress={() => setPwModal(true)}
                onHoverIn={() => setPasswordHover(true)}
                onHoverOut={() => setPasswordHover(false)}
                accessibilityLabel="Change Password"
              >
                {({ pressed }) => (
                  <>
                    <Ionicons name="lock-closed-outline" size={16} color={passwordHover || pressed ? '#fff' : ADMIN_SETTINGS_HIGHLIGHT} />
                    <Text style={[s.secBtnText, (passwordHover || pressed) && s.secBtnTextActive]}>Change Password</Text>
                  </>
                )}
              </Pressable>
              <View style={[s.secBtn, s.secBtnMuted, s.secSwitchRow]}>
                <View style={s.secSwitchLabel}>
                  <Ionicons name="shield-outline" size={16} color={colors.muted} />
                  <Text style={[s.secBtnText, { color: colors.muted }]}>Enable 2FA</Text>
                </View>
                <Switch
                  value={two_factor_enabled}
                  onValueChange={handle2FAToggle}
                  disabled={saving}
                  trackColor={{ false: '#CBD5E1', true: '#FBC89C' }}
                  thumbColor={two_factor_enabled ? colors.orange : '#F8FAFC'}
                  ios_backgroundColor="#CBD5E1"
                  accessibilityLabel="Enable 2FA"
                />
              </View>
            </View>
          </>
        )}



        {tab === 'rates' && (
          <View style={s.card}>
            {rateToastMsg && (
              <View style={{ backgroundColor: '#1C436B', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{rateToastMsg}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <View>
                <Text style={s.cardTitle}>Parking Rates</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Manage pricing and vehicle rules</Text>
              </View>
              <TouchableOpacity
                style={[s.editBtn, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}
                onPress={() => openRateGate()}
                accessibilityLabel="Add Rate"
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.editBtnText}>Add Rate</Text>
              </TouchableOpacity>
            </View>
            {ratesLoading && <ActivityIndicator size="small" color={colors.orange} style={{ marginVertical: 16 }} />}
            {!ratesLoading && rates.length === 0 && (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={36} color={colors.muted} />
                <Text style={{ color: colors.muted, marginTop: 8 }}>No parking rates found.</Text>
              </View>
            )}
            {!ratesLoading && rates.map((rate) => (
              <View key={rate.id} style={s.rateItem}>
                <View style={s.rateTop}>
                  <View style={s.rateIconBg}>
                    <Ionicons name={getRateIcon(rate.type) as any} size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={s.rateName}>{getRateLabel(rate.type)} Rate</Text>
                      <View style={[s.statusBadge, rate.status === 'inactive' ? s.statusBadgeInactive : s.statusBadgeActive]}>
                        <Text style={[s.statusBadgeText, rate.status === 'inactive' ? s.statusBadgeTextInactive : s.statusBadgeTextActive]}>
                          {rate.status === 'inactive' ? 'INACTIVE' : 'ACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                      <Text style={s.rateHourly}>₱{Number(rate.rate).toLocaleString()}</Text>
                      <Text style={s.rateDaily}>{getRateUnit(rate.type)}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.rateBtns}>
                  <TouchableOpacity style={s.rateEditBtn} onPress={() => openRateGate(rate)} accessibilityLabel="Edit">
                    <Ionicons name="create-outline" size={13} color={ADMIN_SETTINGS_HIGHLIGHT} />
                    <Text style={s.rateEditBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rateDeleteBtn} onPress={() => deleteRate(rate.id)} accessibilityLabel="Delete">
                    <Ionicons name="trash-outline" size={13} color="#EF4444" />
                    <Text style={s.rateDeleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={pwModal} transparent animationType="fade" onRequestClose={() => setPwModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.modalOverlay}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={s.modalIconBox}>
                <Ionicons name="lock-closed" size={20} color="#fff" />
              </View>
              <View style={s.modalHeaderText}>
                <Text style={s.modalTitle}>Change Password</Text>
                <Text style={s.modalSubtitle}>Must be 8+ characters.</Text>
              </View>
              <TouchableOpacity onPress={() => setPwModal(false)} style={s.closeBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={s.modalBody}>
              {[
                { label: 'Current Password', key: 'current' as const, show: showPw.current, toggle: () => setShowPw({ ...showPw, current: !showPw.current }) },
                { label: 'New Password', key: 'next' as const, show: showPw.next, toggle: () => setShowPw({ ...showPw, next: !showPw.next }) },
                { label: 'Confirm New Password', key: 'confirm' as const, show: showPw.confirm, toggle: () => setShowPw({ ...showPw, confirm: !showPw.confirm }) },
              ].map((field) => (
                <View key={field.key} style={s.inputGroup}>
                  <Text style={s.label}>{field.label}</Text>
                  <View style={s.passwordInputWrapper}>
                    <TextInput
                      style={s.passwordInput}
                      secureTextEntry={!field.show}
                      value={pw[field.key]}
                      onChangeText={(val) => setPw({ ...pw, [field.key]: val })}
                    />
                    <TouchableOpacity onPress={field.toggle} style={s.eyeIcon}>
                      <Ionicons name={field.show ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={s.modalActions}>
                <TouchableOpacity onPress={() => setPwModal(false)} style={s.modalCancelBtn}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={changePassword}
                  disabled={saving}
                  style={[s.modalSaveBtn, saving && s.disabled]}
                >
                  <Text style={s.modalSaveText}>{saving ? 'Changing' : 'Change'}</Text>
                </TouchableOpacity>
              </View>
            </View>
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={twoFactorModal === 'setup'} transparent animationType="fade" onRequestClose={() => setTwoFactorModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.modalOverlay}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={s.twoFactorCard}>
            <Text style={s.twoFactorTitle}>Enable 2FA</Text>
            <Text style={s.twoFactorHelp}>Add this secret to your authenticator app, then enter the generated code.</Text>
            <View style={s.twoFactorSecretHeader}>
              <Text selectable style={[s.twoFactorSecret, s.twoFactorSecretText]}>{twoFactorSetup?.secret || ''}</Text>
              <TouchableOpacity style={s.copySecretBtn} onPress={copy2FASecret} accessibilityLabel="Copy 2FA secret">
                <Ionicons name="copy-outline" size={15} color={colors.orange} />
                <Text style={s.copySecretText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={s.fieldInput}
              value={twoFactorCode}
              onChangeText={(v) => setTwoFactorCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor={colors.muted}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setTwoFactorModal(null)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSaveBtn, saving && s.disabled]} onPress={verify2FA} disabled={saving}>
                <Text style={s.modalSaveText}>{saving ? 'Verifying' : 'Verify'}</Text>
              </TouchableOpacity>
            </View>
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={twoFactorModal === 'disable'} transparent animationType="fade" onRequestClose={() => setTwoFactorModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.modalOverlay}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={s.twoFactorCard}>
            <Text style={s.twoFactorTitle}>Disable 2FA</Text>
            <Text style={s.twoFactorHelp}>Enter your password to turn off two-factor authentication.</Text>
            <TextInput
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.muted}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setTwoFactorModal(null)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalSaveBtn, saving && s.disabled]} onPress={disable2FA} disabled={saving}>
                <Text style={s.modalSaveText}>{saving ? 'Saving' : 'Disable'}</Text>
              </TouchableOpacity>
            </View>
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={gateModal} transparent animationType="fade" onRequestClose={() => setGateModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setGateModal(false)} activeOpacity={1} />
          <View style={[s.modalContent, { margin: 24 }]}>
            <View style={s.modalHeader}>
              <View style={s.modalIconBox}><Ionicons name="options-outline" size={20} color="#fff" /></View>
              <View style={s.modalHeaderText}>
                <Text style={s.modalTitle}>Advanced Options</Text>
                <Text style={s.modalSubtitle}>{editingRate ? 'Editing rate' : 'Add a new parking rate'}</Text>
              </View>
              <TouchableOpacity onPress={() => setGateModal(false)} style={s.closeBtn}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10 }}>
                <Ionicons name="warning-outline" size={15} color="#F59E0B" />
                <Text style={{ flex: 1, fontSize: 12, color: '#92400E' }}>Rate changes affect all future bookings.</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setGateModal(false)}><Text style={s.modalCancelText}>CANCEL</Text></TouchableOpacity>
                <TouchableOpacity style={s.modalSaveBtn} onPress={proceedToRateForm}><Text style={s.modalSaveText}>PROCEED</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={rateModal} transparent animationType="slide" onRequestClose={() => setRateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.modalOverlay}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={[s.modalContent, { margin: 24 }]}>
                    <View style={s.modalHeader}>
                      <View style={s.modalHeaderText}><Text style={s.modalTitle}>{editingRate ? 'Edit Rate' : 'Add New Rate'}</Text></View>
                      <TouchableOpacity onPress={() => setRateModal(false)} style={s.closeBtn}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
                    </View>
                    <View style={{ padding: 16, gap: 14 }}>
                      <View>
                        <Text style={s.label}>RATE TYPE</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                          {(editingRate ? ['hourly'] as RateType[] : ['hourly', 'daily', 'monthly'] as RateType[]).map((t) => (
                            <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: rateForm.type === t ? ADMIN_SETTINGS_HIGHLIGHT : '#F1F5F9', borderWidth: 1, borderColor: rateForm.type === t ? ADMIN_SETTINGS_HIGHLIGHT : colors.border }} onPress={() => setRateForm({ ...rateForm, type: t })}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: rateForm.type === t ? '#fff' : colors.muted }}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View>
                        <Text style={s.label}>AMOUNT</Text>
                        <TextInput style={[s.fieldInput, { marginTop: 6 }]} value={rateForm.rate} onChangeText={(v) => setRateForm({ ...rateForm, rate: v.replace(/[^0-9.]/g, '') })} keyboardType="decimal-pad" placeholder={getPlaceholder(rateForm.type)} placeholderTextColor={colors.muted} />
                      </View>
                      <View>
                        <Text style={s.label}>STATUS</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                          {(['active', 'inactive'] as RateStatus[]).map((st) => (
                            <TouchableOpacity key={st} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: rateForm.status === st ? (st === 'active' ? '#ECFDF5' : '#FEF2F2') : '#F1F5F9', borderWidth: 1, borderColor: rateForm.status === st ? (st === 'active' ? '#10B981' : '#EF4444') : colors.border }} onPress={() => setRateForm({ ...rateForm, status: st })}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: rateForm.status === st ? (st === 'active' ? '#10B981' : '#EF4444') : colors.muted }}>{st.charAt(0).toUpperCase() + st.slice(1)}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={s.modalActions}>
                        <TouchableOpacity style={s.modalCancelBtn} onPress={() => setRateModal(false)}><Text style={s.modalCancelText}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity style={s.modalSaveBtn} onPress={saveRate}><Text style={s.modalSaveText}>{editingRate ? 'Update' : 'Save'}</Text></TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  nav: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#1C436B', textAlign: 'center' },
  scroll: { padding: 10, gap: 16, paddingBottom: 32 },
  hero: { position: 'relative', backgroundColor: '#10283C', borderRadius: 10, overflow: 'hidden' },
  heroGradientWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#10283C' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroContent: { padding: 20, alignItems: 'center', zIndex: 1 },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarBox: { width: 74, height: 74, borderRadius: 14, backgroundColor: '#EE6B20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  avatarImg: { width: 74, height: 74, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  cameraBtn: { position: 'absolute', bottom: -7, right: -7, width: 26, height: 26, borderRadius: 13, backgroundColor: '#EE6B20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1C436B' },
  heroName: { fontSize: 19, fontWeight: '900', color: '#fff', marginBottom: 3 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.62)', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 9, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(238,107,32,0.2)', borderWidth: 1, borderColor: 'rgba(238,107,32,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: '#EE6B20' },
  deptBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  deptBadgeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  idBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  idBadgeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, width: '100%' },
  statBox: { flex: 1, minHeight: 58, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 7, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 17, marginBottom: 3 },
  statLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 10 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, gap: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#1C436B' },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  tabBtnTextActive: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1C436B' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EE6B20', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cancelBtn: { height: 32, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  fieldWrap: { gap: 4 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8 },
  fieldInput: { height: 46, borderRadius: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#1C436B', borderWidth: 1, borderColor: '#E5E7EB' },
  fieldInputDisabled: { color: '#9CA3AF' },
  securityCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  secTitle: { fontSize: 14, fontWeight: '800', color: '#1C436B', marginBottom: 4 },
  secBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 42, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1C436B', borderRadius: 12, paddingHorizontal: 12 },
  secBtnActive: { backgroundColor: '#1C436B' },
  secBtnMuted: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  secBtnText: { fontSize: 12, fontWeight: '700', color: '#1C436B' },
  secBtnTextActive: { color: '#fff' },
  secSwitchRow: { justifyContent: 'space-between', paddingRight: 8, paddingTop: 4 },
  secSwitchLabel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateItem: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  rateTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rateIconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1C436B', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rateName: { fontSize: 14, fontWeight: '800', color: '#1C436B' },
  rateHourly: { fontSize: 20, fontWeight: '900', color: '#1C436B' },
  rateDaily: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  rateBtns: { flexDirection: 'row', gap: 8 },
  rateEditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: '#1C436B', backgroundColor: '#EFF6FF' },
  rateEditBtnText: { fontSize: 12, fontWeight: '700', color: '#1C436B' },
  rateDeleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 34, borderRadius: 10, borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  rateDeleteBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeActive: { backgroundColor: '#ECFDF5' },
  statusBadgeInactive: { backgroundColor: '#F3F4F6' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  statusBadgeTextActive: { color: '#10B981' },
  statusBadgeTextInactive: { color: '#9CA3AF' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12 },
  activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1C436B' },
  activityTime: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  activityTimeText: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,61,90,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  modalHeader: { backgroundColor: '#1C436B', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalHeaderText: { flex: 1 },
  modalIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EE6B20', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  modalSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  closeBtn: { marginLeft: 'auto', padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 9, fontWeight: '900', color: '#8FA0B7', textTransform: 'uppercase', letterSpacing: 1.2 },
  passwordInputWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { height: 48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingRight: 40, fontSize: 14, color: '#1C436B' },
  eyeIcon: { position: 'absolute', right: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 13, fontWeight: '800', color: '#9CA3AF' },
  modalSaveBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#EE6B20', alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  twoFactorCard: { margin: 16, backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12 },
  twoFactorTitle: { fontSize: 18, fontWeight: '900', color: '#1C436B' },
  twoFactorHelp: { fontSize: 12, lineHeight: 18, color: '#9CA3AF' },
  twoFactorSecretHeader: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  twoFactorSecret: { borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F8FAFC', padding: 12, color: '#1C436B', fontWeight: '900' },
  twoFactorSecretText: { flex: 1 },
  copySecretBtn: { minWidth: 76, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF7F2', alignItems: 'center', justifyContent: 'center', gap: 4 },
  copySecretText: { color: '#EE6B20', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.65 },
});
