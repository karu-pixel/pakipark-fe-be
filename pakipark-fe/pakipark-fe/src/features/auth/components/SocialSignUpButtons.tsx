import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { loginColors } from './LoginStyles';

const socialProviders = [
  {
    label: 'Google',
    logo: require('../../../../assets/images/google.png'),
  },
  {
    label: 'Facebook',
    logo: require('../../../../assets/images/facebook.png'),
  },
  {
    label: 'PakiShip',
    logo: require('../../../../assets/images/pakiship.png'),
  },
];

export function SocialSignUpButtons({
  onPressProvider,
}: {
  onPressProvider: (provider: string) => void;
}) {
  return (
    <View style={styles.socialBlock}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerLabel}>Or Sign Up With</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.socialGrid}>
        {socialProviders.map((provider) => (
          <Pressable
            key={provider.label}
            onPress={() => onPressProvider(provider.label)}
            style={styles.socialButton}
          >
            <Image source={provider.logo} style={styles.socialLogo} resizeMode="contain" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  socialBlock: {
    gap: 14,
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: loginColors.border,
  },
  dividerLabel: {
    color: loginColors.subtle,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: loginColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  socialLogo: {
    width: 24,
    height: 24,
  },
});
