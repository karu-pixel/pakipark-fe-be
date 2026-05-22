import type { ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';

const COLORS = {
  background: '#FFFFFF',
  border: '#EDF0F4',
  card: '#FFFFFF',
  dark: '#021B1A',
  muted: '#9AA2BE',
  primary: '#39B5A8',
  softBackground: '#F1FAF8',
} as const;

type RoleCardProps = {
  description: string;
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  onPress: () => void;
};

type PakiShipCreateAccountScreenProps = {
  onBackToLogin: () => void;
};

function RoleCard({ description, icon, title, onPress }: RoleCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.roleCard, pressed ? styles.roleCardPressed : null]}>
      <View style={styles.roleIconBox}>
        <Feather color={COLORS.primary} name={icon} size={26} />
      </View>
      <View style={styles.roleCopy}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

export function PakiShipCreateAccountScreen({ onBackToLogin }: PakiShipCreateAccountScreenProps) {
  const handleRoleSelect = (role: 'sender' | 'driver' | 'operator') => {
    const messages = {
      sender: 'Parcel sender signup is ready for the next backend step.',
      driver: 'Driver onboarding is ready for the next backend step.',
      operator: 'Operator onboarding is ready for the next backend step.',
    } as const;

    Alert.alert('PakiShip create account', messages[role]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onBackToLogin} style={styles.backButton}>
          <AntDesign color={COLORS.primary} name="left" size={18} />
        </Pressable>
        <Text style={styles.headerTitle}>Join PakiSHIP</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBlock}>
          <Text style={styles.eyebrow}>Create Account</Text>
          <Text style={styles.heroTitle}>Join the PakiSHIP</Text>
          <Text style={styles.heroTitle}>community.</Text>
        </View>

        <RoleCard
          description="I need to send and track parcels quickly."
          icon="user"
          onPress={() => handleRoleSelect('sender')}
          title="Parcel Sender"
        />
        <RoleCard
          description="I want to deliver and earn money."
          icon="truck"
          onPress={() => handleRoleSelect('driver')}
          title="Driver"
        />
        <RoleCard
          description="I want to manage a drop-off point."
          icon="map-pin"
          onPress={() => handleRoleSelect('operator')}
          title="Operator"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    height: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 28,
    height: 28,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 32,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    textAlign: 'center',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5ECEB',
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
    shadowColor: '#041614',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  roleCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  roleIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleCopy: {
    flex: 1,
    gap: 4,
  },
  roleTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  roleDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});
