import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { COLORS, STORAGE_KEYS } from '@features/customer/data';
import { showMessage } from '@features/customer/utils';
import { backendApi, saveSession } from '../../../lib/api';
import type { ApiUser } from '../../../lib/api';
import type { Booking } from '@features/customer/types';

// Logo removed from header as per request

type CustomerProfileProps = {
  visible: boolean;
  onClose: () => void;
  user: ApiUser | null;
  bookings: Booking[];
  onUserUpdated?: (user: ApiUser) => void;
};

const addressToText = (address: ApiUser['address']) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [address.street, address.city, address.province].filter(Boolean).join(', ');
};

const normalizePhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('63')) return `0${digits.slice(2, 12)}`;
  if (digits.startsWith('0')) return digits.slice(0, 11);
  if (digits.startsWith('9')) return `0${digits.slice(0, 10)}`;
  return digits.slice(0, 11);
};

const splitDisplayName = (...values: Array<string | null | undefined>) => {
  const fullName = values.find((value) => value?.trim())?.trim() || '';
  const [firstName = '', ...lastParts] = fullName.split(/\s+/);
  return { firstName, lastName: lastParts.join(' ') };
};

const maskPhoneOnlyEmail = (email?: string | null) => {
  const e = (email || '').trim();
  if (!e) return '';
  return e.endsWith('@phone.pakipark.local') ? '' : e;
};

const profileFormFromUser = (user: ApiUser | null) => {
  const nameParts = splitDisplayName(user?.full_name || user?.name, user?.name, user?.full_name);

  return {
    // Prefer server-provided fields (prevents wrong splits when full_name/name has unexpected formatting)
    first_name: user?.first_name || user?.firstName || nameParts.firstName,
    last_name: user?.last_name || user?.lastName || nameParts.lastName,
    // Phone-only accounts use placeholder emails.
    email: maskPhoneOnlyEmail(user?.email as any),
    mobile_number: user?.mobile_number || user?.phone || '',
    address: addressToText(user?.address) || '',
    date_of_birth: user?.date_of_birth || user?.dob || '',
  };
};

export function CustomerProfile({ visible, onClose, user, bookings, onUserUpdated }: Readonly<CustomerProfileProps>) {
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; otpUri: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [isSaving2FA, setIsSaving2FA] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'activity'>('info');


  const [profileData, setProfileData] = useState(profileFormFromUser(user));

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const activities = useMemo<Array<{ action: string; time: string; icon: 'location-outline' | 'person-add-outline' }>>(() => {
    const list: Array<{ action: string; time: string; icon: 'location-outline' | 'person-add-outline' }> = bookings.slice(0, 10).map(b => ({
      action: `Booked a spot at ${b.location}`,
      time: b.date,
      icon: 'location-outline' as const,
    }));
    
    if (user?.created_at) {
      list.push({
        action: 'Joined PakiPark',
        time: new Date(user.created_at).toLocaleDateString(),
        icon: 'person-add-outline' as const,
      });
    }
    
    return list;
  }, [bookings, user]);

  useEffect(() => {
    if (user) {
      setProfileData(profileFormFromUser(user));
      setProfilePicture(user.profile_photo_url || user.profile_picture || null);
    }
  }, [user]);

  const stats = useMemo(() => {
    const activeCount = bookings.filter(b => b.status === 'active').length;
    const memberSinceDate = user?.created_at ? new Date(user.created_at) : new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const memberSince = `${monthNames[memberSinceDate.getMonth()]}\n${memberSinceDate.getFullYear()}`;

    return [
      { value: String(bookings.length), top: 'Total', bottom: 'Bookings' },
      { value: String(activeCount), top: 'Active', bottom: 'Bookings' },
      { value: memberSince, top: 'Member', bottom: 'Since' },
    ];
  }, [bookings, user]);

  useEffect(() => {
    if (visible && !user) {
      const loadProfile = async () => {
        const savedName = await AsyncStorage.getItem(STORAGE_KEYS.profileName);
        const savedPic = await AsyncStorage.getItem(STORAGE_KEYS.profile_picture);

        // Only use cached split if the server didn't provide any names yet.
        const serverHasNames = Boolean(
          (user as any)?.first_name || (user as any)?.firstName || (user as any)?.last_name || (user as any)?.lastName
        );

        if (!serverHasNames && savedName?.trim()) {
          const { firstName, lastName } = splitDisplayName(savedName);
          setProfileData((prev) => ({ ...(prev as any), first_name: firstName, last_name: lastName }));
        }

        if (savedPic) setProfilePicture(savedPic);
      };
      loadProfile();
    }
  }, [visible, user]);

  const userInitials = (
    `${profileData.first_name?.[0] || ''}${profileData.last_name?.[0] || ''}`
  ).toUpperCase() || 'GU';



  const handleSaveProfile = async () => {
    if (!profileData.first_name.trim() && !profileData.last_name.trim()) {
      return showMessage('Missing Name', 'Please enter your first and/or last name.');
    }

    setIsSavingProfile(true);
    try {
      const firstName = profileData.first_name.trim();
      const lastName = profileData.last_name.trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const updatedUser = user
        ? await backendApi.updateProfile({
            first_name: firstName,
            last_name: lastName,
            full_name: fullName,
            email: profileData.email.trim().endsWith('@phone.pakipark.local') ? '' : profileData.email.trim(),
            mobile_number: profileData.mobile_number.trim(),
            address: profileData.address.trim(),
            date_of_birth: profileData.date_of_birth.trim(),
            profile_photo_url: profilePicture,
          })
        : null;



      if (updatedUser) {
        await saveSession(updatedUser);
        onUserUpdated?.(updatedUser);
      }

      setIsEditing(false);
      showMessage('Success', 'Profile updated successfully!');
    } catch (err: any) {
      showMessage('Profile Not Saved', err.message || 'Unable to update your profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setProfileData(profileFormFromUser(user));
      setProfilePicture(user.profile_photo_url || user.profile_picture || null);
    }
    setIsEditing(false);
  };

  const handleProfilePictureUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showMessage('Permission Denied', 'We need access to your photos to update your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : result.assets[0].uri;
      setProfilePicture(uri);
      await AsyncStorage.setItem(STORAGE_KEYS.profile_picture, uri);
      if (user) {
        try {
          const updatedUser = await backendApi.updateProfile({ profile_picture: uri });
          await saveSession(updatedUser);
          onUserUpdated?.(updatedUser);
        } catch (err: any) {
          showMessage('Upload Saved Locally', err.message || 'Profile picture could not be synced yet.');
          return;
        }
      }
      showMessage('Success', 'Profile picture updated!');
    }
  };

  const start2FASetup = async () => {
    if (!user) {
      return showMessage('Login Required', 'Please log in before enabling 2FA.');
    }

    if (user.two_factor_enabled) {
      setShowDisable2FAModal(true);
      return;
    }

    setIsSaving2FA(true);
    try {
      const setup = await backendApi.setup2FA();
      setTwoFactorSetup(setup);
      setTwoFactorCode('');
      setShow2FAModal(true);
    } catch (err: any) {
      showMessage('2FA Setup Failed', err.message || 'Unable to start 2FA setup.');
    } finally {
      setIsSaving2FA(false);
    }
  };

  const verify2FASetup = async () => {
    if (!/^\d{6}$/.test(twoFactorCode.trim())) {
      return showMessage('Invalid Code', 'Enter the 6-digit code from your authenticator app.');
    }

    setIsSaving2FA(true);
    try {
      await backendApi.verify2FA(twoFactorCode.trim());
      const updatedUser = await backendApi.getMe();
      await saveSession(updatedUser);
      onUserUpdated?.(updatedUser);
      setShow2FAModal(false);
      setTwoFactorSetup(null);
      showMessage('2FA Enabled', 'Two-factor authentication is now active.');
    } catch (err: any) {
      showMessage('2FA Verification Failed', err.message || 'Invalid or expired code.');
    } finally {
      setIsSaving2FA(false);
    }
  };

  const disable2FA = async () => {
    if (!twoFactorPassword) {
      return showMessage('Password Required', 'Enter your password to disable 2FA.');
    }

    setIsSaving2FA(true);
    try {
      await backendApi.disable2FA(twoFactorPassword);
      const updatedUser = await backendApi.getMe();
      await saveSession(updatedUser);
      onUserUpdated?.(updatedUser);
      setShowDisable2FAModal(false);
      setTwoFactorPassword('');
      showMessage('2FA Disabled', 'Two-factor authentication has been turned off.');
    } catch (err: any) {
      showMessage('Could Not Disable 2FA', err.message || 'Please check your password.');
    } finally {
      setIsSaving2FA(false);
    }
  };

  const copy2FASecret = async () => {
    if (!twoFactorSetup?.secret) return;
    await Clipboard.setStringAsync(twoFactorSetup.secret);
    showMessage('Copied', '2FA secret copied to clipboard.');
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      return showMessage('Error', 'Please fill in all password fields.');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showMessage('Error', 'New passwords do not match.');
    }
    if (passwordData.newPassword.length < 8) {
      return showMessage('Error', 'Password must be at least 8 characters long.');
    }

    setIsChangingPassword(true);
    try {
      await backendApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showMessage('Success', 'Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (err: any) {
      showMessage('Password Not Changed', err.message || 'Unable to change your password.');
    } finally {
      setIsChangingPassword(false);
    }
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
            <Pressable onPress={handleSaveProfile} disabled={isSavingProfile} style={[styles.editBtn, styles.editBtnActive, isSavingProfile && styles.buttonDisabled]}>
              <Ionicons name="save" size={14} color={COLORS.surface} />
              <Text style={[styles.editBtnText, styles.editBtnTextActive]}>{isSavingProfile ? 'Saving' : 'Save'}</Text>
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
          { label: 'First Name',               icon: 'person-outline',   key: 'first_name',    keyboard: 'default' },
          { label: 'Last Name',                icon: 'person-outline',   key: 'last_name',     keyboard: 'default' },
          { label: 'Email Address',            icon: 'mail-outline',     key: 'email',         keyboard: 'email-address' },
          { label: 'Mobile Number',            icon: 'call-outline',     key: 'mobile_number', keyboard: 'phone-pad' },
          { label: 'Date of Birth (YYYY-MM-DD)', icon: 'calendar-outline', key: 'date_of_birth', keyboard: 'default' },
          { label: 'Address',                  icon: 'location-outline', key: 'address',       keyboard: 'default' },
        ].map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name={field.icon as any} size={13} color="#9AA6B5" />
              <Text style={styles.label}>{field.label}</Text>
            </View>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={(profileData as any)[field.key]}
              onChangeText={(val) => setProfileData({
                ...profileData,
                [field.key]: field.key === 'mobile_number' ? normalizePhoneInput(val) : val,
              })}
              editable={isEditing}
              keyboardType={field.keyboard as any}
              maxLength={field.key === 'mobile_number' ? 11 : undefined}
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
        onPress={start2FASetup}
        disabled={isSaving2FA}
      >
        <View style={styles.securityLabelWrap}>
          <Ionicons name="lock-closed-outline" size={15} color="#7C8CA1" />
          <Text style={styles.securityRowText}>{user?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}</Text>
        </View>
        <Text style={[styles.securityStatus, user?.two_factor_enabled && styles.securityStatusOn]}>
          {user?.two_factor_enabled ? 'On' : 'Off'}
        </Text>
      </Pressable>
    </View>
  );


  const renderActivityTab = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
      </View>
      <View style={styles.cardBody}>
        {activities.map((activity, index) => (
          <View key={`${activity.time}-${activity.action}-${index}`} style={styles.activityRow}>
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
        <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color={COLORS.navy} />
          </Pressable>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.mainContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
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
                  <Text style={styles.heroName}>{`${profileData.first_name} ${profileData.last_name}`.trim() || 'Guest User'}</Text>
                  <Text style={styles.heroEmail}>{profileData.email}</Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.roleBadge}>
                      <Ionicons name="person" size={12} color={COLORS.primary} />
                      <Text style={styles.roleBadgeText}>Customer</Text>
                    </View>
                    {(profileData.address || user?.address) ? (
                      <View style={styles.locationBadge}>
                        <Ionicons name="location" size={12} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.locationBadgeText}>
                          {typeof profileData.address === 'string' ? profileData.address : 'Philippines'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                {stats.map((stat, i) => (
                  <View key={`${stat.top}-${stat.bottom}-${i}`} style={styles.statBox}>
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
          {activeTab === 'activity' && renderActivityTab()}
          {renderSecurityCard()}

        </ScrollView>

        <Modal visible={showPasswordModal} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
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
                    <Pressable
                      onPress={handleChangePassword}
                      disabled={isChangingPassword}
                      style={[styles.modalSaveBtn, isChangingPassword && styles.buttonDisabled]}
                    >
                      <Text style={styles.modalSaveText}>{isChangingPassword ? 'Changing' : 'Change'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        <Modal visible={show2FAModal} transparent animationType="fade" onRequestClose={() => setShow2FAModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconBox}>
                    <Ionicons name="shield-checkmark" size={20} color={COLORS.surface} />
                  </View>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>Enable 2FA</Text>
                    <Text style={styles.modalSubtitle}>Add this secret to your authenticator app.</Text>
                  </View>
                  <Pressable onPress={() => setShow2FAModal(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={COLORS.surface} />
                  </Pressable>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.secretHeader}>
                    <Text style={styles.secretLabel}>Authenticator Secret</Text>
                    <Pressable onPress={copy2FASecret} style={styles.copySecretButton}>
                      <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.copySecretText}>Copy</Text>
                    </Pressable>
                  </View>
                  <Text selectable style={styles.secretBox}>{twoFactorSetup?.secret || ''}</Text>
                  <Text style={styles.helperText}>After adding the secret, enter the 6-digit code generated by the app.</Text>
                  <TextInput
                    style={styles.input}
                    value={twoFactorCode}
                    onChangeText={(value) => setTwoFactorCode(value.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    placeholder="123456"
                    placeholderTextColor="#A5B4C5"
                  />
                  <View style={styles.modalActions}>
                    <Pressable onPress={() => setShow2FAModal(false)} style={styles.modalCancelBtn}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={verify2FASetup} disabled={isSaving2FA} style={[styles.modalSaveBtn, isSaving2FA && styles.buttonDisabled]}>
                      <Text style={styles.modalSaveText}>{isSaving2FA ? 'Verifying' : 'Verify'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={showDisable2FAModal} transparent animationType="fade" onRequestClose={() => setShowDisable2FAModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconBox}>
                    <Ionicons name="shield-outline" size={20} color={COLORS.surface} />
                  </View>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>Disable 2FA</Text>
                    <Text style={styles.modalSubtitle}>Confirm with your password.</Text>
                  </View>
                  <Pressable onPress={() => setShowDisable2FAModal(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={COLORS.surface} />
                  </Pressable>
                </View>

                <View style={styles.modalBody}>
                  <TextInput
                    style={styles.input}
                    value={twoFactorPassword}
                    onChangeText={setTwoFactorPassword}
                    secureTextEntry
                    placeholder="Password"
                    placeholderTextColor="#A5B4C5"
                  />
                  <View style={styles.modalActions}>
                    <Pressable onPress={() => setShowDisable2FAModal(false)} style={styles.modalCancelBtn}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={disable2FA} disabled={isSaving2FA} style={[styles.modalSaveBtn, isSaving2FA && styles.buttonDisabled]}>
                      <Text style={styles.modalSaveText}>{isSaving2FA ? 'Saving' : 'Disable'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
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
  securityStatus: { color: '#9AA6B5', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  securityStatusOn: { color: '#10B981' },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#FEE2E2', marginTop: 10 },
  signOutText: { fontSize: 14, fontWeight: '800', color: COLORS.danger },


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
  modalHeaderText: { flex: 1 },
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
  secretLabel: { fontSize: 10, fontWeight: '900', color: '#8FA0B7', textTransform: 'uppercase', letterSpacing: 1 },
  secretHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  copySecretButton: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 30, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFF7F2' },
  copySecretText: { color: COLORS.primary, fontSize: 11, fontWeight: '900' },
  secretBox: { marginTop: 8, marginBottom: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#F8FAFC', color: COLORS.navy, fontSize: 13, fontWeight: '900' },
  helperText: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginBottom: 12 },
  buttonDisabled: { opacity: 0.65 },
});
