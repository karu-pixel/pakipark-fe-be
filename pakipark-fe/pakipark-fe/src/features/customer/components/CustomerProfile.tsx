import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, SafeAreaView } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { COLORS, STORAGE_KEYS } from '@features/customer/data';
import { showMessage } from '@features/customer/utils';

const pakiparkLogo = require('../../../../assets/images/big_logo.png');

type CustomerProfileProps = {
  visible: boolean;
  onClose: () => void;
  onManageVehicles?: () => void;
};

export function CustomerProfile({ visible, onClose, onManageVehicles }: CustomerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'activity'>('info');

  const [profileData, setProfileData] = useState({
    name: 'Guest User',
    email: 'customer@email.com',
    phone: '+63 912 345 6789',
    address: 'Quezon City, Metro Manila',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const vehicles = [
    { brand: 'Toyota', model: 'Vios', color: 'Silver', plateNumber: 'ABC 1234', type: 'sedan' },
    { brand: 'Honda', model: 'Civic', color: 'Black', plateNumber: 'XYZ 7890', type: 'sedan' },
  ];

  const activities = [
    { action: 'Booked a spot at Ayala Center', time: '2 hours ago', icon: 'location-outline' },
    { action: 'Completed booking at SM North EDSA', time: '1 day ago', icon: 'checkmark-circle-outline' },
    { action: 'Added new vehicle: Honda Civic', time: '3 days ago', icon: 'car-outline' },
    { action: 'Updated profile information', time: '5 days ago', icon: 'person-outline' },
    { action: 'Booked a spot at Robinsons Galleria', time: '1 week ago', icon: 'location-outline' },
    { action: 'Rated parking at SM Mall of Asia', time: '2 weeks ago', icon: 'document-text-outline' },
  ];

  useEffect(() => {
    if (visible) {
      const loadProfile = async () => {
        const savedName = await AsyncStorage.getItem(STORAGE_KEYS.profileName);
        const savedPic = await AsyncStorage.getItem(STORAGE_KEYS.profilePicture);
        if (savedName) setProfileData((prev) => ({ ...prev, name: savedName }));
        if (savedPic) setProfilePicture(savedPic);
      };
      loadProfile();
    }
  }, [visible]);

  const userInitials = profileData.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  const getVehicleIcon = (type: string, model: string) => {
    const vehicleKey = `${type} ${model}`.toLowerCase();

    if (vehicleKey.includes('motor') || vehicleKey.includes('scooter')) return 'bicycle-outline';
    if (vehicleKey.includes('van') || vehicleKey.includes('truck') || vehicleKey.includes('pickup')) return 'bus-outline';
    if (vehicleKey.includes('suv')) return 'car-outline';
    if (vehicleKey.includes('sedan') || vehicleKey.includes('civic') || vehicleKey.includes('vios')) return 'car-sport-outline';

    return 'car-outline';
  };

  const handleSaveProfile = async () => {
    setIsEditing(false);
    await AsyncStorage.setItem(STORAGE_KEYS.profileName, profileData.name);
    showMessage('Success', 'Profile updated successfully!');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleProfilePictureUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showMessage('Permission Denied', 'We need access to your photos to update your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : result.assets[0].uri;
      setProfilePicture(uri);
      await AsyncStorage.setItem(STORAGE_KEYS.profilePicture, uri);
      showMessage('Success', 'Profile picture updated!');
    }
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      return showMessage('Error', 'Please fill in all password fields.');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showMessage('Error', 'New passwords do not match.');
    }
    if (passwordData.newPassword.length < 8) {
      return showMessage('Error', 'Password must be at least 8 characters long.');
    }
    showMessage('Success', 'Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordModal(false);
  };

  const renderInfoTab = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        {isEditing ? (
          <View style={styles.editActions}>
            <Pressable onPress={handleCancelEdit} style={styles.cancelEditBtn}>
              <Text style={styles.cancelEditText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSaveProfile} style={[styles.editBtn, styles.editBtnActive]}>
              <Ionicons name="save" size={14} color={COLORS.surface} />
              <Text style={[styles.editBtnText, styles.editBtnTextActive]}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setIsEditing(true)} style={styles.editBtn}>
            <Ionicons name="pencil" size={14} color={COLORS.surface} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.cardBody}>
        {[
          { label: 'Full Name', icon: 'person-outline', key: 'name', keyboard: 'default' },
          { label: 'Email Address', icon: 'mail-outline', key: 'email', keyboard: 'email-address' },
          { label: 'Phone Number', icon: 'call-outline', key: 'phone', keyboard: 'phone-pad' },
          { label: 'Address', icon: 'location-outline', key: 'address', keyboard: 'default' },
        ].map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name={field.icon as any} size={13} color="#9AA6B5" />
              <Text style={styles.label}>{field.label}</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={(profileData as any)[field.key]}
              onChangeText={(val) => setProfileData({ ...profileData, [field.key]: val })}
              editable={isEditing}
              keyboardType={field.keyboard as any}
            />
          </View>
        ))}

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="lock-closed-outline" size={13} color="#9AA6B5" />
            <Text style={styles.label}>Password</Text>
            <Pressable onPress={() => setShowPasswordModal(true)} style={styles.resetPasswordLink}>
              <Text style={styles.resetText}>Reset Password</Text>
            </Pressable>
          </View>
          <TextInput style={[styles.input, styles.inputDisabled]} value="??????????" editable={false} secureTextEntry />
        </View>
      </View>
    </View>
  );

  const renderSecurityCard = () => (
    <View style={styles.securityCard}>
      <Text style={styles.securityTitle}>Security</Text>
      <Pressable
        style={({ pressed }) => [styles.securityRow, pressed && styles.securityRowPressed]}
        onPress={() => showMessage('Error', 'Two-factor authentication is not available yet.')}
      >
        <View style={styles.securityLabelWrap}>
          <Ionicons name="lock-closed-outline" size={15} color="#7C8CA1" />
          <Text style={styles.securityRowText}>Enable 2FA</Text>
        </View>
      </Pressable>
    </View>
  );

  const renderVehiclesTab = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>My Vehicles</Text>
        <Pressable style={styles.manageVehiclesButton} onPress={onManageVehicles ?? onClose}>
          <Ionicons name="car-outline" size={14} color={COLORS.surface} />
          <Text style={styles.manageVehiclesText}>Manage</Text>
        </Pressable>
      </View>
      <View style={styles.cardBody}>
        {vehicles.map((car, index) => (
            <View key={index} style={styles.vehicleRow}>
              <View style={styles.vehicleIcon}>
              <Ionicons name={getVehicleIcon(car.type, car.model) as any} size={18} color={COLORS.navy} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{car.brand} {car.model}</Text>
              <Text style={styles.vehicleMeta}>{car.color} · {car.plateNumber}</Text>
            </View>
            <View style={styles.vehicleBadge}>
              <Text style={styles.vehicleBadgeText}>{car.type}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderActivityTab = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
      </View>
      <View style={styles.cardBody}>
        {activities.map((activity, index) => (
          <View key={index} style={styles.activityRow}>
            <View style={styles.activityIcon}>
              <Ionicons name={activity.icon as any} size={18} color={COLORS.navy} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityAction}>{activity.action}</Text>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={12} color="#9AA6B5" />
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color={COLORS.navy} />
          </Pressable>
          <View style={styles.headerLogo}>
            <Image source={pakiparkLogo} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.heroCard}>
            <Svg style={styles.heroGradient} viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="profileHeroGradient" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#10283C" />
                  <Stop offset="0.55" stopColor="#183A55" />
                  <Stop offset="1" stopColor="#2E5875" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill="url(#profileHeroGradient)" />
            </Svg>
            <View style={styles.heroContent}>
              <View style={styles.heroTop}>
                <View style={styles.avatarContainer}>
                  {profilePicture ? (
                    <Image source={{ uri: profilePicture }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{userInitials}</Text>
                    </View>
                  )}
                  <Pressable style={styles.cameraBtn} onPress={handleProfilePictureUpload}>
                    <Ionicons name="camera" size={16} color={COLORS.surface} />
                  </Pressable>
                </View>

                <View style={styles.heroInfo}>
                  <Text style={styles.heroName}>{profileData.name}</Text>
                  <Text style={styles.heroEmail}>{profileData.email}</Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.roleBadge}>
                      <Ionicons name="person" size={12} color={COLORS.primary} />
                      <Text style={styles.roleBadgeText}>Customer</Text>
                    </View>
                    <View style={styles.locationBadge}>
                      <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.locationBadgeText}>Quezon City, Metro Manila</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                {[
                { value: '24', top: 'Total', bottom: 'Bookings' },
                { value: '1', top: 'Active', bottom: 'Bookings' },
                { value: '2', top: '', bottom: 'Vehicles' },
                { value: 'Jan\n2025', top: 'Member', bottom: 'Since' },
              ].map((stat, i) => (
                <View key={i} style={styles.statBox}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  {!!stat.top && <Text style={styles.statLabelTop}>{stat.top}</Text>}
                  <Text style={styles.statLabelBottom}>{stat.bottom}</Text>
                </View>
              ))}
              </View>
            </View>
          </View>

          <View style={styles.tabNav}>
            {[
              { id: 'info', label: 'Personal Info' },
              { id: 'vehicles', label: 'My Vehicles' },
              { id: 'activity', label: 'Activity' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable key={tab.id} onPress={() => setActiveTab(tab.id as any)} style={[styles.tabBtn, isActive && styles.tabBtnActive]}>
                  <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'vehicles' && renderVehiclesTab()}
          {activeTab === 'activity' && renderActivityTab()}
          {renderSecurityCard()}

        </ScrollView>

        <Modal visible={showPasswordModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="lock-closed" size={20} color={COLORS.surface} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <Text style={styles.modalSubtitle}>Must be 8+ characters.</Text>
                </View>
                <Pressable onPress={() => setShowPasswordModal(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={COLORS.surface} />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                {[
                  { label: 'Current Password', key: 'currentPassword', show: showCurrentPassword, toggle: () => setShowCurrentPassword(!showCurrentPassword) },
                  { label: 'New Password', key: 'newPassword', show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
                  { label: 'Confirm New Password', key: 'confirmPassword', show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) },
                ].map((field) => (
                  <View key={field.key} style={styles.inputGroup}>
                    <Text style={styles.label}>{field.label}</Text>
                    <View style={styles.passwordInputWrapper}>
                      <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={!field.show}
                        value={(passwordData as any)[field.key]}
                        onChangeText={(val) => setPasswordData({ ...passwordData, [field.key]: val })}
                      />
                      <Pressable onPress={field.toggle} style={styles.eyeIcon}>
                        <Ionicons name={field.show ? 'eye-off' : 'eye'} size={20} color={COLORS.muted} />
                      </Pressable>
                    </View>
                  </View>
                ))}

                <View style={styles.modalActions}>
                  <Pressable onPress={() => setShowPasswordModal(false)} style={styles.modalCancelBtn}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleChangePassword} style={styles.modalSaveBtn}>
                    <Text style={styles.modalSaveText}>Change</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerLogo: { alignItems: 'center', justifyContent: 'center', width: 62 },
  logoImage: { width: 54, height: 34 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900', color: COLORS.navy },
  headerSpacer: { width: 34 },
  
  scrollContent: { padding: 10, paddingBottom: 40 },

  heroCard: { position: 'relative', backgroundColor: COLORS.navy, borderRadius: 10, marginBottom: 14, overflow: 'hidden' },
  heroGradient: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroContent: { padding: 20, zIndex: 1 },
  heroTop: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarImage: { width: 74, height: 74, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  avatarPlaceholder: { width: 74, height: 74, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  avatarInitials: { fontSize: 24, fontWeight: '900', color: COLORS.surface },
  cameraBtn: { position: 'absolute', bottom: -7, right: -7, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.navy },
  heroInfo: { alignItems: 'center', width: '100%' },
  heroName: { fontSize: 19, fontWeight: '900', color: COLORS.surface, marginBottom: 3 },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.62)', marginBottom: 14 },
  badgesRow: { flexDirection: 'row', gap: 9, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(238, 107, 32, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(238, 107, 32, 0.3)' },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  locationBadgeText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statBox: {
    flex: 1,
    minHeight: 78,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    paddingVertical: 10,
  },
  statValue: { fontSize: 17, fontWeight: '900', color: COLORS.surface, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  statLabelTop: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 10 },
  statLabelBottom: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 10 },

  tabNav: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 4, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: COLORS.navy },
  tabBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.muted },
  tabBtnTextActive: { color: COLORS.surface },

  card: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 14, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.navy },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editBtnActive: { backgroundColor: COLORS.primary },
  editBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.surface },
  editBtnTextActive: { color: COLORS.surface },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelEditBtn: { height: 30, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cancelEditText: { fontSize: 12, fontWeight: '800', color: COLORS.muted },
  cardBody: { padding: 16 },

  inputGroup: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 9, fontWeight: '900', color: '#8FA0B7', textTransform: 'uppercase', letterSpacing: 1.2 },
  resetPasswordLink: { marginLeft: 'auto' },
  resetText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  input: { height: 36, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 12, color: COLORS.navy, fontWeight: '700' },
  inputDisabled: { backgroundColor: '#F8FAFC', color: COLORS.muted },

  securityCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  securityTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', marginBottom: 12 },
  securityRow: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12, paddingRight: 8 },
  securityRowPressed: { backgroundColor: '#F8FAFC' },
  securityLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  securityRowText: { color: COLORS.text, fontSize: 11, fontWeight: '900' },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#FEE2E2', marginTop: 10 },
  signOutText: { fontSize: 14, fontWeight: '800', color: COLORS.danger },

  manageVehiclesButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  manageVehiclesText: { color: COLORS.surface, fontSize: 12, fontWeight: '900' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E8EDF4', marginBottom: 10 },
  vehicleIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EAF0F6', alignItems: 'center', justifyContent: 'center' },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 13, fontWeight: '900', color: COLORS.navy },
  vehicleMeta: { fontSize: 11, color: '#8FA0B7', fontWeight: '700', marginTop: 4 },
  vehicleBadge: { backgroundColor: '#FFF3EA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  vehicleBadgeText: { fontSize: 9, fontWeight: '900', color: COLORS.primary, textTransform: 'capitalize' },

  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 13, borderRadius: 12, marginBottom: 10 },
  activityIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#EAF0F6', alignItems: 'center', justifyContent: 'center' },
  activityInfo: { flex: 1 },
  activityAction: { fontSize: 12, fontWeight: '800', color: '#3B4B63', lineHeight: 17 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  activityTime: { fontSize: 10, fontWeight: '700', color: '#8FA0B7' },

  // Password Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(30, 61, 90, 0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: 24, overflow: 'hidden' },
  modalHeader: { backgroundColor: COLORS.navy, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.surface },
  modalSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  closeBtn: { marginLeft: 'auto', padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  modalBody: { padding: 20 },
  passwordInputWrapper: { position: 'relative', justifyContent: 'center' },
  passwordInput: { height: 48, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 16, paddingRight: 40, fontSize: 14, color: COLORS.navy },
  eyeIcon: { position: 'absolute', right: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalCancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 13, fontWeight: '800', color: COLORS.muted },
  modalSaveBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { fontSize: 13, fontWeight: '800', color: COLORS.surface },
});
