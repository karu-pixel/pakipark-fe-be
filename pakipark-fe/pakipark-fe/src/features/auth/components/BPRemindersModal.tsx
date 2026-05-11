import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { loginColors, loginShadows } from './LoginStyles';

const reminders = [
  {
    icon: 'briefcase',
    tint: '#EE6B20',
    title: 'Business Registration Required',
    desc: 'Make sure the parking facility is officially registered before signing up.',
  },
  {
    icon: 'file-text',
    tint: '#3B82F6',
    title: 'Document Requirements',
    desc: 'Prepare your permit, DTI or SEC registration, and proof of ownership or lease.',
  },
  {
    icon: 'shield',
    tint: '#10B981',
    title: 'Compliance & Safety',
    desc: 'Facilities must comply with local safety standards before approval.',
  },
  {
    icon: 'alert-circle',
    tint: '#F59E0B',
    title: 'Review Process',
    desc: 'Applications are reviewed within 3-5 business days. You will be notified via email once your account is approved.',
  },
];

export function BPRemindersModal({ onProceed }: { onProceed: () => void }) {
  return (
    <View style={styles.overlay}>
      <View style={[styles.card, loginShadows.card]}>
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Feather name="alert-circle" size={22} color={loginColors.text} />
          </View>
          <Text style={styles.title}>Reminders for Business Partners</Text>
        </View>

        <View style={styles.list}>
          {reminders.map((reminder) => (
            <View key={reminder.title} style={styles.item}>
              <View style={styles.itemIcon}>
                <Feather name={reminder.icon as never} size={16} color={reminder.tint} />
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{reminder.title}</Text>
                <Text style={styles.itemDesc}>{reminder.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={onProceed}>
          <Text style={styles.primaryButtonText}>Proceed to Sign Up</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          By proceeding, you confirm that you have read and understood these reminders.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 18,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 22,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E8EFF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: loginColors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    color: loginColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  itemDesc: {
    color: '#8492A6',
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: loginColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  disclaimer: {
    color: '#8492A6',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
