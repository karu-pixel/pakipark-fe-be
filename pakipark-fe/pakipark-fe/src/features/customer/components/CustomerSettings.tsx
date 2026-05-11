import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '@features/customer/data';
import { showMessage } from '@features/customer/utils';

type SettingsTab = 'payment' | 'security' | 'notifications' | 'preferences';

type PaymentMethod = {
  id: string;
  type: 'card' | 'ewallet';
  provider: string;
  title: string;
  subtitle: string;
};

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'payment', label: 'Payment Methods' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

export function CustomerSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('payment');

  const [payments, setPayments] = useState<PaymentMethod[]>([
    { id: '1', type: 'card', provider: 'Visa', title: 'Visa ending in 4242', subtitle: 'Expires 12/26' },
    { id: '2', type: 'ewallet', provider: 'GCash', title: 'GCash', subtitle: '+63 912 *** 8901' },
  ]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [newPaymentType, setNewPaymentType] = useState<'card' | 'ewallet'>('card');
  const [newPaymentProvider, setNewPaymentProvider] = useState('');
  const [newPaymentNumber, setNewPaymentNumber] = useState('');
  const [paymentExpiry, setPaymentExpiry] = useState('');
  const [paymentCvv, setPaymentCvv] = useState('');

  const [toggles, setToggles] = useState({
    twoFactor: true,
    biometrics: false,
    notifBookings: true,
    notifReminders: true,
    notifPromos: false,
    emailReceipts: true,
    emailNewsletters: false,
  });
  const [securityPolicy, setSecurityPolicy] = useState({
    sessionTimeout: '30',
    passwordExpiry: '90',
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const toggleSwitch = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    showMessage('Deleted', 'Payment method removed.');
  };

  const handleAddPayment = () => {
    if (!newPaymentProvider || !newPaymentNumber) {
      return showMessage('Error', 'Please fill in all fields.');
    }

    const provider = newPaymentType === 'card' ? newPaymentProvider : newPaymentNumber;
    const number = newPaymentType === 'card' ? newPaymentNumber : newPaymentProvider;
    const payload: PaymentMethod = {
      id: Date.now().toString(),
      type: newPaymentType,
      provider,
      title: newPaymentType === 'card' ? `${provider} ending in ${number.slice(-4) || 'XXXX'}` : provider,
      subtitle: newPaymentType === 'card' ? `Expires ${paymentExpiry || '12/28'}` : number,
    };

    if (editingPaymentId) {
      setPayments((current) => current.map((method) => (method.id === editingPaymentId ? { ...payload, id: method.id } : method)));
      showMessage('Success', 'Payment method updated.');
    } else {
      setPayments([...payments, payload]);
      showMessage('Success', 'Payment method added.');
    }

    setShowPaymentModal(false);
    setEditingPaymentId(null);
    setNewPaymentProvider('');
    setNewPaymentNumber('');
    setPaymentExpiry('');
    setPaymentCvv('');
  };

  const openAddPayment = () => {
    setEditingPaymentId(null);
    setNewPaymentType('card');
    setNewPaymentProvider('');
    setNewPaymentNumber('');
    setPaymentExpiry('');
    setPaymentCvv('');
    setShowPaymentModal(true);
  };

  const openEditPayment = (method: PaymentMethod) => {
    setEditingPaymentId(method.id);
    setNewPaymentType(method.type);
    setNewPaymentProvider(method.type === 'card' ? method.provider : method.subtitle);
    setNewPaymentNumber(method.type === 'card' ? (method.title.match(/(\d{4})$/)?.[1] ?? '') : method.provider);
    setPaymentExpiry(method.subtitle.replace('Expires ', ''));
    setPaymentCvv('');
    setShowPaymentModal(true);
  };

  const renderTabs = () => (
    <View style={styles.tabsWrapper}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderToggle = (key: keyof typeof toggles, label: string) => (
    <Pressable
      accessibilityLabel={`Toggle ${label}`}
      style={[styles.smallToggle, toggles[key] ? styles.smallToggleOn : styles.smallToggleOff]}
      onPress={() => toggleSwitch(key)}
    >
      <View style={styles.smallToggleThumb} />
    </Pressable>
  );

  const renderPayment = () => (
    <View style={styles.paymentPanel}>
      <View style={styles.paymentHeader}>
        <View style={styles.flexOne}>
          <Text style={styles.paymentTitle}>Payment Methods</Text>
          <Text style={styles.paymentSubtitle}>Manage your saved payment options</Text>
        </View>
        <Pressable style={styles.paymentAddButton} onPress={openAddPayment}>
          <Ionicons name="add" size={22} color={COLORS.surface} />
          <Text style={styles.paymentAddText}>Add Method</Text>
        </Pressable>
      </View>
      <View style={styles.paymentDivider} />
      <View style={styles.secureNotice}>
        <Ionicons name="lock-closed-outline" size={15} color="#16A34A" />
        <Text style={styles.secureNoticeText}>Your information is secure and encrypted</Text>
      </View>
      <View style={styles.cardList}>
        {payments.map((method) => (
          <View key={method.id} style={styles.paymentCard}>
            <View style={styles.paymentCardTop}>
              <View style={styles.paymentIconBox}>
                <Ionicons
                  name={method.type === 'card' ? 'card-outline' : 'phone-portrait-outline'}
                  size={24}
                  color={COLORS.surface}
                />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.paymentMethodTitle}>{method.title.replace('ending in', '????')}</Text>
                <Text style={styles.paymentMethodSubtitle}>{method.subtitle.replace('Expires ', '')}</Text>
              </View>
            </View>
            <View style={styles.paymentActions}>
              <Pressable style={styles.paymentActionButton} onPress={() => openEditPayment(method)}>
                <Ionicons name="create-outline" size={16} color="#2563EB" />
                <Text style={styles.paymentEditText}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => handleDeletePayment(method.id)} style={styles.paymentActionButton}>
                <Ionicons name="trash-outline" size={16} color="#4B5563" />
                <Text style={styles.paymentDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {payments.length === 0 && (
          <Text style={styles.emptyText}>No payment methods saved.</Text>
        )}

      </View>
    </View>
  );

  const renderSecurity = () => (
    <View style={styles.securityCard}>
      <Text style={styles.securityTitle}>Security Policies</Text>
      <Text style={styles.securitySubtitle}>Protect your account and login information</Text>

      <View style={styles.securityDivider} />

      <View style={styles.securityRow}>
        <View style={styles.menuText}>
          <Text style={styles.securityRowTitle}>Two-Factor Authentication</Text>
          <Text style={styles.securityRowDesc}>Add extra security to your account</Text>
        </View>
        {renderToggle('twoFactor', 'Two-Factor Authentication')}
      </View>

      <View style={styles.securityRow}>
        <View style={styles.menuText}>
          <Text style={styles.securityRowTitle}>Biometric Login</Text>
          <Text style={styles.securityRowDesc}>Use Face ID or fingerprint to sign in</Text>
        </View>
        {renderToggle('biometrics', 'Biometric Login')}
      </View>

      <View style={styles.securityRow}>
        <View style={styles.menuText}>
          <Text style={styles.securityRowTitle}>Session Timeout</Text>
          <Text style={styles.securityRowDesc}>Auto-logout after inactivity</Text>
        </View>
        <View style={styles.policyInputRow}>
          <TextInput
            style={styles.policyInput}
            keyboardType="number-pad"
            value={securityPolicy.sessionTimeout}
            onChangeText={(sessionTimeout) => setSecurityPolicy((current) => ({ ...current, sessionTimeout }))}
          />
          <Text style={styles.policyUnit}>min</Text>
        </View>
      </View>

      <View style={styles.securityRow}>
        <View style={styles.menuText}>
          <Text style={styles.securityRowTitle}>Password Expiry</Text>
          <Text style={styles.securityRowDesc}>Force reset after N days</Text>
        </View>
        <View style={styles.policyInputRow}>
          <TextInput
            style={styles.policyInput}
            keyboardType="number-pad"
            value={securityPolicy.passwordExpiry}
            onChangeText={(passwordExpiry) => setSecurityPolicy((current) => ({ ...current, passwordExpiry }))}
          />
          <Text style={styles.policyUnit}>days</Text>
        </View>
      </View>

      <View style={styles.securityDivider} />

      <Text style={styles.changePasswordTitle}>Change Password</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.securityLabel}>Current Password</Text>
        <TextInput style={styles.securityInput} secureTextEntry placeholder="........" placeholderTextColor="#C4CBD4" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.securityLabel}>New Password</Text>
        <TextInput style={styles.securityInput} secureTextEntry placeholder="........" placeholderTextColor="#C4CBD4" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.securityLabel}>Confirm Password</Text>
        <TextInput style={styles.securityInput} secureTextEntry placeholder="........" placeholderTextColor="#C4CBD4" />
      </View>

      <View style={styles.securityDivider} />

      <Pressable style={styles.securitySaveButton} onPress={() => showMessage('Success', 'Security settings saved.')}>
        <Ionicons name="save-outline" size={15} color={COLORS.surface} />
        <Text style={styles.securitySaveButtonText}>Save Security Settings</Text>
      </Pressable>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.notificationsCard}>
      <Text style={styles.notificationsTitle}>Alerts & Notifications</Text>
      <Text style={styles.notificationsSubtitle}>Manage your communication channels and types</Text>

      <View style={styles.notificationsDivider} />

      <View style={styles.notificationsGroup}>
        <Text style={styles.notificationsGroupTitle}>Channels</Text>
        <View style={styles.notificationRow}>
          <View style={styles.menuText}>
            <Text style={styles.notificationRowTitle}>Email Alerts</Text>
            <Text style={styles.notificationRowDesc}>Receive updates via email</Text>
          </View>
          {renderToggle('emailReceipts', 'Email Alerts')}
        </View>
        <View style={styles.notificationRow}>
          <View style={styles.menuText}>
            <Text style={styles.notificationRowTitle}>SMS Alerts</Text>
            <Text style={styles.notificationRowDesc}>Text messages to phone</Text>
          </View>
          {renderToggle('notifReminders', 'SMS Alerts')}
        </View>
        <View style={[styles.notificationRow, styles.notificationRowLast]}>
          <View style={styles.menuText}>
            <Text style={styles.notificationRowTitle}>Push Alerts</Text>
            <Text style={styles.notificationRowDesc}>Browser notifications</Text>
          </View>
          {renderToggle('notifBookings', 'Push Alerts')}
        </View>
      </View>

      <View style={styles.notificationsGroup}>
        <Text style={styles.notificationsGroupTitle}>Alert Types</Text>
        <View style={styles.notificationRow}>
          <View style={styles.menuText}>
            <Text style={styles.notificationRowTitle}>Booking Activity</Text>
            <Text style={styles.notificationRowDesc}>Reservations & changes</Text>
          </View>
          {renderToggle('notifBookings', 'Booking Activity')}
        </View>
        <View style={styles.notificationRow}>
          <View style={styles.menuText}>
            <Text style={styles.notificationRowTitle}>Payment Status</Text>
            <Text style={styles.notificationRowDesc}>Receipts & confirmations</Text>
          </View>
          {renderToggle('emailReceipts', 'Payment Status')}
        </View>
        <View style={[styles.notificationRow, styles.notificationRowLast]}>
          <View style={styles.menuText}>
            <Text style={styles.notificationRowTitle}>Promotions</Text>
            <Text style={styles.notificationRowDesc}>Deals & special offers</Text>
          </View>
          {renderToggle('notifPromos', 'Promotions')}
        </View>
      </View>

      <Pressable style={styles.notificationsSaveButton} onPress={() => showMessage('Success', 'Alerts configuration saved.')}>
        <Ionicons name="save-outline" size={15} color={COLORS.surface} />
        <Text style={styles.notificationsSaveButtonText}>Save Alerts Configuration</Text>
      </Pressable>
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.preferencesCard}>
      <Text style={styles.preferencesTitle}>App Preferences</Text>
      <Text style={styles.preferencesSubtitle}>Customize your application experience</Text>

      <View style={styles.preferencesDivider} />

      <View style={styles.preferencesGroup}>
        <Text style={styles.preferencesGroupTitle}>Regional</Text>
        <Text style={styles.preferenceLabel}>Language</Text>
        <Pressable style={styles.preferenceSelect} onPress={() => showMessage('Language', 'Language selection is coming soon.')}>
          <Text style={styles.preferenceSelectText}>English</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.text} />
        </Pressable>

        <Text style={styles.preferenceLabel}>Timezone</Text>
        <Pressable style={styles.preferenceSelect} onPress={() => showMessage('Timezone', 'Timezone selection is coming soon.')}>
          <Text style={styles.preferenceSelectText}>Manila (PHT)</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.text} />
        </Pressable>

        <Text style={styles.preferenceLabel}>Currency</Text>
        <Pressable style={styles.preferenceSelect} onPress={() => showMessage('Currency', 'Currency selection is coming soon.')}>
          <Text style={styles.preferenceSelectText}>PHP (₱)</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.text} />
        </Pressable>
      </View>

      <View style={styles.preferencesGroup}>
        <Text style={styles.preferencesGroupTitle}>Display</Text>
        <View style={styles.preferenceDisplayRow}>
          <View style={styles.menuText}>
            <Text style={styles.preferenceRowTitle}>Theme</Text>
            <Text style={styles.preferenceRowDesc}>Light or dark mode</Text>
          </View>
          <View style={styles.themeSegment}>
            <Pressable
              style={[styles.themeSegmentButton, themeMode === 'light' ? styles.themeSegmentButtonActive : null]}
              onPress={() => setThemeMode('light')}
            >
              <Text style={[styles.themeSegmentText, themeMode === 'light' ? styles.themeSegmentTextActive : null]}>Light</Text>
            </Pressable>
            <Pressable
              style={[styles.themeSegmentButton, themeMode === 'dark' ? styles.themeSegmentButtonActive : null]}
              onPress={() => setThemeMode('dark')}
            >
              <Text style={[styles.themeSegmentText, themeMode === 'dark' ? styles.themeSegmentTextActive : null]}>Dark</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.preferenceDisplayRow, styles.preferenceDisplayRowLast]}>
          <View style={styles.menuText}>
            <Text style={styles.preferenceRowTitle}>High Contrast</Text>
            <Text style={styles.preferenceRowDesc}>Easier to read text</Text>
          </View>
          {renderToggle('emailNewsletters', 'High Contrast')}
        </View>
      </View>

      <View style={styles.preferencesDivider} />

      <Pressable style={styles.preferencesSaveButton} onPress={() => showMessage('Success', 'Preferences saved.')}>
        <Ionicons name="save-outline" size={15} color={COLORS.surface} />
        <Text style={styles.preferencesSaveButtonText}>Save Preferences</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.accountHeader}>
        <Pressable style={styles.accountBackButton}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </Pressable>
        <View>
          <Text style={styles.accountTitle}>Account Settings</Text>
          <Text style={styles.accountSubtitle}>Manage your personal preferences</Text>
        </View>
      </View>
      {renderTabs()}

      <View style={styles.bodyContainer}>
        {activeTab === 'payment' && renderPayment()}
        {activeTab === 'security' && renderSecurity()}
        {activeTab === 'notifications' && renderNotifications()}
        {activeTab === 'preferences' && renderPreferences()}
      </View>

      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingPaymentId ? 'Edit Payment' : 'Add Payment Method'}</Text>
                <Text style={styles.modalSubtitle}>Choose your preferred payment option</Text>
              </View>
              <Pressable onPress={() => setShowPaymentModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.subtle} />
              </Pressable>
            </View>

            <Text style={styles.modalSectionLabel}>Select Payment Type</Text>
            <View style={styles.typeSelector}>
              <Pressable style={[styles.typeBtn, newPaymentType === 'card' && styles.typeBtnActive]} onPress={() => setNewPaymentType('card')}>
                <View style={styles.typeIconBox}>
                  <Ionicons name="card-outline" size={22} color={COLORS.surface} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.typeTitle}>Credit/Debit Card</Text>
                  <Text style={styles.typeDescription}>Visa, Mastercard, etc.</Text>
                </View>
                {newPaymentType === 'card' ? <Ionicons name="checkmark" size={20} color={COLORS.primary} /> : null}
              </Pressable>
              <Pressable style={[styles.typeBtn, newPaymentType === 'ewallet' && styles.typeBtnActive]} onPress={() => setNewPaymentType('ewallet')}>
                <View style={[styles.typeIconBox, styles.typeIconBoxLight]}>
                  <Ionicons name="phone-portrait-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.typeTitle}>E-Wallet</Text>
                  <Text style={styles.typeDescription}>GCash or Maya</Text>
                </View>
                {newPaymentType === 'ewallet' ? <Ionicons name="checkmark" size={20} color={COLORS.primary} /> : null}
              </Pressable>
              <Pressable style={styles.typeBtn} onPress={() => showMessage('Unavailable', 'Bank transfer support is coming soon.')}>
                <View style={[styles.typeIconBox, styles.typeIconBoxLight]}>
                  <Ionicons name="business-outline" size={22} color="#4F46E5" />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.typeTitle}>Bank Transfer</Text>
                  <Text style={styles.typeDescription}>Direct deposit</Text>
                </View>
              </Pressable>
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.modalSectionLabel}>{newPaymentType === 'card' ? 'Cardholder Name' : 'Wallet Name'}</Text>
            <TextInput
              style={styles.input}
              placeholder={newPaymentType === 'card' ? 'Name on card' : 'GCash or Maya'}
              value={newPaymentNumber}
              onChangeText={setNewPaymentNumber}
            />

            <Text style={styles.modalSectionLabel}>{newPaymentType === 'card' ? 'Card Number' : 'Mobile Number'}</Text>
            <TextInput
              style={styles.input}
              placeholder={newPaymentType === 'card' ? 'Visa / Mastercard' : '+63 9XX XXX XXXX'}
              keyboardType="number-pad"
              value={newPaymentProvider}
              onChangeText={setNewPaymentProvider}
            />

            {newPaymentType === 'card' ? (
              <View style={styles.modalInputRow}>
                <View style={styles.modalInputHalf}>
                  <Text style={styles.modalSectionLabel}>Expiry (MM/YYYY)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="12/25"
                    value={paymentExpiry}
                    onChangeText={setPaymentExpiry}
                  />
                </View>
                <View style={styles.modalInputHalf}>
                  <Text style={styles.modalSectionLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    keyboardType="number-pad"
                    value={paymentCvv}
                    onChangeText={setPaymentCvv}
                    secureTextEntry
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.modalSecureNotice}>
              <Ionicons name="lock-closed-outline" size={16} color="#16A34A" />
              <Text style={styles.secureNoticeText}>Your payment information is encrypted and secure</Text>
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelButton} onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleAddPayment}>
                <Text style={styles.saveButtonText}>{editingPaymentId ? 'Update Method' : 'Save Method'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  flexOne: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: COLORS.navy, marginBottom: 16 },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF4',
  },
  accountBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  accountSubtitle: { color: '#7F8FA6', fontSize: 12, fontWeight: '600', marginTop: 3 },
  
  tabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    padding: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabButton: { flex: 1, minHeight: 34, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabButtonActive: { backgroundColor: COLORS.navy },
  tabText: { fontSize: 12, fontWeight: '800', color: COLORS.muted },
  tabTextActive: { color: COLORS.surface },
  smallToggle: { width: 34, height: 20, borderRadius: 999, padding: 2, justifyContent: 'center', flexShrink: 0 },
  smallToggleOn: { backgroundColor: COLORS.primary, alignItems: 'flex-end' },
  smallToggleOff: { backgroundColor: '#D1D5DB', alignItems: 'flex-start' },
  smallToggleThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.surface },

  bodyContainer: { flex: 1, paddingBottom: 20 }, 
  tabContent: { flex: 1 },

  sectionHeading: { fontSize: 13, fontWeight: '800', color: COLORS.subtle, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  
  paymentPanel: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentTitle: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  paymentSubtitle: { color: '#7F8FA6', fontSize: 12, fontWeight: '600', marginTop: 3 },
  paymentAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  paymentAddText: { color: COLORS.surface, fontSize: 14, fontWeight: '900' },
  paymentDivider: { height: 1, backgroundColor: '#EEF1F5', marginTop: 14, marginBottom: 16 },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  secureNoticeText: { color: '#15803D', fontSize: 12, fontWeight: '800' },
  cardList: { gap: 12 },
  paymentCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E8EDF4', gap: 14 },
  paymentCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentIconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  paymentMethodTitle: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  paymentMethodSubtitle: { fontSize: 12, color: COLORS.muted, fontWeight: '600', marginTop: 3 },
  paymentActions: { flexDirection: 'row', gap: 10 },
  paymentActionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: '#D8E0EA', paddingVertical: 10 },
  paymentEditText: { color: '#2563EB', fontSize: 13, fontWeight: '800' },
  paymentDeleteText: { color: '#4B5563', fontSize: 13, fontWeight: '800' },
  legacyPaymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  menuDesc: { fontSize: 12, color: COLORS.muted },
  deleteBtn: { padding: 8 },
  emptyText: { textAlign: 'center', color: COLORS.muted, marginVertical: 10, fontSize: 14 },
  
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', backgroundColor: '#FFF9F5', marginTop: 8, gap: 8 },
  addText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, height: 48, fontSize: 14, color: COLORS.text, marginBottom: 16 },

  securityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  securityTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  securitySubtitle: { color: '#8A98AA', fontSize: 11, fontWeight: '600', marginTop: 4 },
  securityDivider: { height: 1, backgroundColor: '#EEF1F5', marginVertical: 16 },
  securityRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  securityRowTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  securityRowDesc: { fontSize: 11, color: '#8A98AA', fontWeight: '600', marginTop: 4 },
  policyInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  policyInput: {
    width: 56,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  policyUnit: { width: 28, color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  changePasswordTitle: { color: COLORS.text, fontSize: 13, fontWeight: '900', marginBottom: 14 },
  securityLabel: {
    color: '#9AA6B5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  securityInput: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: 14,
  },
  securitySaveButton: {
    alignSelf: 'flex-end',
    minWidth: 190,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 18,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  securitySaveButtonText: { color: COLORS.surface, fontSize: 12, fontWeight: '900' },

  notificationsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  notificationsTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  notificationsSubtitle: { color: '#8A98AA', fontSize: 11, fontWeight: '600', marginTop: 4 },
  notificationsDivider: { height: 1, backgroundColor: '#EEF1F5', marginVertical: 16 },
  notificationsGroup: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EDF4',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 14,
  },
  notificationsGroupTitle: {
    color: '#9AA6B5',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  notificationRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF4',
  },
  notificationRowLast: { borderBottomWidth: 0 },
  notificationRowTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  notificationRowDesc: { fontSize: 11, color: '#6F7E91', fontWeight: '600', marginTop: 4 },
  notificationsSaveButton: {
    alignSelf: 'flex-end',
    minWidth: 210,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 18,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  notificationsSaveButtonText: { color: COLORS.surface, fontSize: 12, fontWeight: '900' },

  preferencesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E7EF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  preferencesTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  preferencesSubtitle: { color: '#8A98AA', fontSize: 11, fontWeight: '600', marginTop: 4 },
  preferencesDivider: { height: 1, backgroundColor: '#EEF1F5', marginVertical: 16 },
  preferencesGroup: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EDF4',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 14,
  },
  preferencesGroupTitle: {
    color: '#9AA6B5',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  preferenceLabel: { color: COLORS.text, fontSize: 12, fontWeight: '900', marginBottom: 8 },
  preferenceSelect: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  preferenceSelectText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  preferenceDisplayRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF4',
  },
  preferenceDisplayRowLast: { borderBottomWidth: 0 },
  preferenceRowTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  preferenceRowDesc: { fontSize: 11, color: '#6F7E91', fontWeight: '600', marginTop: 4 },
  themeSegment: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E0EA',
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  themeSegmentButton: { minWidth: 48, minHeight: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  themeSegmentButtonActive: { backgroundColor: COLORS.text },
  themeSegmentText: { color: '#7A8798', fontSize: 12, fontWeight: '800' },
  themeSegmentTextActive: { color: COLORS.surface },
  preferencesSaveButton: {
    alignSelf: 'flex-end',
    minWidth: 160,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 18,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  preferencesSaveButtonText: { color: COLORS.surface, fontSize: 12, fontWeight: '900' },
  
  updateButton: { backgroundColor: COLORS.surface, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  updateButtonText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, paddingHorizontal: 18, paddingBottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 19, fontWeight: '900', color: COLORS.navy },
  modalSubtitle: { color: '#7F8FA6', fontSize: 12, fontWeight: '600', marginTop: 6 },
  closeBtn: { padding: 4, borderRadius: 20 },
  
  modalSectionLabel: { color: '#5F6F86', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  typeSelector: { gap: 12, marginBottom: 20 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: '#D8E0EA', gap: 14 },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#FFF7F2' },
  typeIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  typeIconBoxLight: { backgroundColor: '#DBEAFE' },
  typeTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  typeDescription: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginTop: 5 },
  modalDivider: { height: 1, backgroundColor: '#DCE3EC', marginBottom: 12 },
  modalInputRow: { flexDirection: 'row', gap: 12 },
  modalInputHalf: { flex: 1 },
  modalSecureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: -18,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  modalCancelButton: { flex: 1, borderWidth: 1, borderColor: '#C9D3E0', borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  modalCancelText: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  typeText: { fontSize: 14, fontWeight: '700', color: COLORS.muted },
  typeTextActive: { color: COLORS.primary },
  
  saveButton: { flex: 1, backgroundColor: COLORS.primary, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.26, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  saveButtonText: { color: COLORS.surface, fontSize: 15, fontWeight: '800' },
});
