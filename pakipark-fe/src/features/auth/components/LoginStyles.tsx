import { StyleSheet } from 'react-native';

export const loginColors = {
  background: '#F2F6FB',
  surface: '#FFFFFF',
  text: '#1E3D5A',
  muted: '#6E8297',
  subtle: '#C2CEDA',
  border: '#E2EAF2',
  primary: '#1E3D5A',
  primaryAlt: '#2A5373',
  accent: '#EE6B20',
  accentSoft: '#FFF1E8',
  success: '#177B57',
  danger: '#D64545',
  hero: '#102537',
  heroAlt: '#1E3D5A',
} as const;

export const loginShadows = StyleSheet.create({
  card: {
    shadowColor: '#1E3D5A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  button: {
    shadowColor: '#1E3D5A',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});
