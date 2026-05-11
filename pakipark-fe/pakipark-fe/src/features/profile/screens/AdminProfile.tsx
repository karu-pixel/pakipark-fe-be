import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

type ProfileTab = 'info' | 'permissions' | 'activity';

interface AdminProfileProps {
  onBack: () => void;
}

const PERMISSIONS = [
  'Dashboard Access',
  'User Management',
  'Parking Management',
  'Analytics & Reports',
  'Settings Access',
  'Billing & Payments',
];

const ACTIVITY = [
  { action: 'Updated parking slot A-12 status',  time: '2 hours ago',  icon: 'settings-outline'         },
  { action: 'Approved new user registration',    time: '5 hours ago',  icon: 'person-outline'           },
  { action: 'Generated monthly report',          time: '1 day ago',    icon: 'document-text-outline'    },
  { action: 'Modified parking rates',            time: '2 days ago',   icon: 'settings-outline'         },
  { action: 'Logged in from new device',         time: '3 days ago',   icon: 'shield-outline'           },
  { action: 'Resolved booking dispute #0042',    time: '4 days ago',   icon: 'checkmark-circle-outline' },
];

const ADMIN_SETTINGS_HIGHLIGHT = '#1C436B';

export function AdminProfile({ onBack }: AdminProfileProps) {
  const [tab, setTab] = useState<ProfileTab>('info');
  const [editing, setEditing] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [passwordHover, setPasswordHover] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@pakipark.com',
    phone: '+63 917 123 4567',
    role: 'Super Administrator',
    department: 'Operations',
    employeeId: 'PKP-ADM-001',
  });

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

  const initials = profile.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const STATS = [
    { label: 'Managed\nLocations', value: '5'     },
    { label: 'Active\nBookings',   value: '234'   },
    { label: 'Users\nManaged',     value: '1,234' },
    { label: 'Account\nCreated',   value: 'Jan\n2025' },
  ];

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

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
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

            <Text style={s.heroName}>{profile.name}</Text>
            <Text style={s.heroEmail}>{profile.email}</Text>

            <View style={s.badgeRow}>
              <View style={s.roleBadge}>
                <Ionicons name="shield-outline" size={12} color={colors.orange} />
                <Text style={s.roleBadgeText}>{profile.role}</Text>
              </View>
              <View style={s.deptBadge}>
                <Text style={s.deptBadgeText}>{profile.department}</Text>
              </View>
              <View style={s.idBadge}>
                <Text style={s.idBadgeText}>{profile.employeeId}</Text>
              </View>
            </View>

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
            { id: 'info',        label: 'Personal Info' },
            { id: 'permissions', label: 'Permissions'   },
            { id: 'activity',    label: 'Activity'      },
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
                      <TouchableOpacity style={s.editBtn} onPress={() => setEditing(false)}><Ionicons name="checkmark" size={13} color="#fff" /><Text style={s.editBtnText}>Save</Text></TouchableOpacity>
                    </View>
                }
              </View>

              {([
                { label: 'FULL NAME',     key: 'name',       icon: 'person-outline',    editable: true  },
                { label: 'EMAIL ADDRESS', key: 'email',      icon: 'mail-outline',      editable: true  },
                { label: 'PHONE NUMBER',  key: 'phone',      icon: 'call-outline',      editable: true  },
                { label: 'EMPLOYEE ID',   key: 'employeeId', icon: 'shield-outline',    editable: false },
                { label: 'ROLE',          key: 'role',       icon: 'shield-outline',    editable: false },
                { label: 'DEPARTMENT',    key: 'department', icon: 'settings-outline',  editable: true  },
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
                    onChangeText={(v) => setProfile({ ...profile, [key]: v })}
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
                  value={twoFactorEnabled}
                  onValueChange={setTwoFactorEnabled}
                  trackColor={{ false: '#CBD5E1', true: '#FBC89C' }}
                  thumbColor={twoFactorEnabled ? colors.orange : '#F8FAFC'}
                  ios_backgroundColor="#CBD5E1"
                  accessibilityLabel="Enable 2FA"
                />
              </View>
            </View>
          </>
        )}

        {tab === 'permissions' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Permissions & Access</Text>
            {PERMISSIONS.map((p) => (
              <View key={p} style={s.permItem}>
                <View>
                  <Text style={s.permName}>{p}</Text>
                  <Text style={s.permAccess}>Full access</Text>
                </View>
                <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
              </View>
            ))}
          </View>
        )}

        {tab === 'activity' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Recent Activity</Text>
            {ACTIVITY.map((a, i) => (
              <View key={i} style={s.activityRow}>
                <View style={s.activityIcon}>
                  <Ionicons name={a.icon as any} size={16} color={colors.muted} />
                </View>
                <Text style={s.activityText}>{a.action}</Text>
                <View style={s.activityTime}>
                  <Ionicons name="time-outline" size={11} color={colors.muted} />
                  <Text style={s.activityTimeText}>{a.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab !== 'info' && (
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
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: '#CBD5E1', true: '#FBC89C' }}
                thumbColor={twoFactorEnabled ? colors.orange : '#F8FAFC'}
                ios_backgroundColor="#CBD5E1"
                accessibilityLabel="Enable 2FA"
              />
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={pwModal} transparent animationType="slide" onRequestClose={() => setPwModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={s.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setPwModal(false)} activeOpacity={1} />
            <View style={s.modalSheet}>
              <View style={s.modalHeader}>
                <View style={s.modalHeaderIcon}>
                  <Ionicons name="lock-closed" size={20} color="#fff" />
                </View>
                <TouchableOpacity style={s.modalCloseBtn} onPress={() => setPwModal(false)}>
                  <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <Text style={s.modalTitle}>Change Password</Text>
                <Text style={s.modalSub}>Must be 8+ characters with letters and numbers.</Text>
              </View>
              <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
                {([
                  { label: 'CURRENT PASSWORD', key: 'current' as const, show: showPw.current, toggle: () => setShowPw({ ...showPw, current: !showPw.current }) },
                  { label: 'NEW PASSWORD',     key: 'next'    as const, show: showPw.next,    toggle: () => setShowPw({ ...showPw, next: !showPw.next })       },
                  { label: 'CONFIRM NEW PASSWORD', key: 'confirm' as const, show: showPw.confirm, toggle: () => setShowPw({ ...showPw, confirm: !showPw.confirm }) },
                ]).map(({ label, key, show, toggle }) => (
                  <View key={key} style={s.pwField}>
                    <Text style={s.pwLabel}>{label}</Text>
                    <View style={s.pwRow}>
                      <TextInput
                        style={s.pwInput}
                        secureTextEntry={!show}
                        value={pw[key]}
                        onChangeText={(v) => setPw({ ...pw, [key]: v })}
                        placeholder="••••••••"
                        placeholderTextColor={colors.muted}
                      />
                      <TouchableOpacity style={s.eyeBtn} onPress={toggle}>
                        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={s.modalFooter}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setPwModal(false)}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalSaveBtn} onPress={() => setPwModal(false)}>
                  <Text style={s.modalSaveText}>Change Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  root: { flex: 1, backgroundColor: '#F3F4F6' },

  nav: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.navy, textAlign: 'center' },

  scroll: { padding: 10, gap: spacing.md, paddingBottom: 32 },

  hero: { position: 'relative', backgroundColor: '#10283C', borderRadius: 10, overflow: 'hidden' },
  heroGradientWrap: { ...StyleSheet.absoluteFillObject, backgroundColor: '#10283C' },
  heroGradient: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroContent: { padding: 20, alignItems: 'center', zIndex: 1 },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarBox: { width: 74, height: 74, borderRadius: 14, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  avatarImg: { width: 74, height: 74, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  cameraBtn: { position: 'absolute', bottom: -7, right: -7, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.navy },
  heroName: { fontSize: 19, fontWeight: '900', color: '#fff', marginBottom: 3 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.62)', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 9, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(238, 107, 32, 0.2)', borderWidth: 1, borderColor: 'rgba(238, 107, 32, 0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: colors.orange },
  deptBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  deptBadgeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  idBadge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  idBadgeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, width: '100%' },
  statBox: { flex: 1, minHeight: 58, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 7, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 17, marginBottom: 3 },
  statLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 10 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, gap: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: ADMIN_SETTINGS_HIGHLIGHT },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  tabBtnTextActive: { color: '#fff', fontWeight: '700' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.navy },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.orange, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cancelBtn: { height: 32, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: colors.muted },

  fieldWrap: { gap: 4 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 0.8 },
  fieldInput: { height: 46, borderRadius: 12, backgroundColor: '#F8FAFC', paddingHorizontal: spacing.md, fontSize: 14, fontWeight: '600', color: colors.navy, borderWidth: 1, borderColor: colors.border },
  fieldInputDisabled: { color: colors.muted },

  securityCard: { backgroundColor: '#fff', borderRadius: 14, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  secTitle: { fontSize: 14, fontWeight: '800', color: colors.navy, marginBottom: spacing.xs },
  secBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, height: 42, backgroundColor: '#fff', borderWidth: 1.5, borderColor: ADMIN_SETTINGS_HIGHLIGHT, borderRadius: 12, paddingHorizontal: spacing.md },
  secBtnActive: { backgroundColor: ADMIN_SETTINGS_HIGHLIGHT },
  secBtnMuted: { backgroundColor: '#fff', borderColor: colors.border },
  secBtnText: { fontSize: 12, fontWeight: '700', color: ADMIN_SETTINGS_HIGHLIGHT },
  secBtnTextActive: { color: '#fff' },
  secSwitchRow: { justifyContent: 'space-between', paddingRight: spacing.sm, paddingTop: spacing.xs },
  secSwitchLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  permItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', borderRadius: 12, padding: spacing.md },
  permName: { fontSize: 14, fontWeight: '700', color: colors.navy },
  permAccess: { fontSize: 12, color: '#10B981', fontWeight: '600', marginTop: 2 },

  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#F8FAFC', borderRadius: 12, padding: spacing.md },
  activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.navy },
  activityTime: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  activityTimeText: { fontSize: 10, color: colors.muted, fontWeight: '500' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  modalHeader: { backgroundColor: ADMIN_SETTINGS_HIGHLIGHT, padding: spacing.lg, gap: spacing.sm },
  modalHeaderIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  modalCloseBtn: { position: 'absolute', top: spacing.md, right: spacing.md, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  modalSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  modalBody: { padding: spacing.lg, gap: spacing.md },
  pwField: { gap: 6 },
  pwLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 0.8 },
  pwRow: { position: 'relative' },
  pwInput: { height: 46, borderRadius: 12, backgroundColor: '#F3F4F6', paddingHorizontal: spacing.md, paddingRight: 44, fontSize: 14, color: colors.navy },
  eyeBtn: { position: 'absolute', right: spacing.md, top: 13 },
  modalFooter: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, paddingTop: 0 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  modalSaveBtn: { flex: 2, height: 48, borderRadius: 14, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
