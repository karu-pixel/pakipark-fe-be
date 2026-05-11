import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { loginColors } from './LoginStyles';

export function SignUpField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export const sharedFieldStyles = StyleSheet.create({
  inputShell: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E1EB',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
  },
  inputShellFocused: {
    borderColor: loginColors.accent,
  },
  input: {
    flex: 1,
    color: '#6E8196',
    fontSize: 13,
    paddingVertical: 9,
  },
  suffixButton: {
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#8192A3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  errorText: {
    color: loginColors.danger,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
});
