import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ParkingScreen({ onViewWebDesign }: Readonly<{ onViewWebDesign?: () => void }>) {
  return (
    <View style={s.container}>
      <View style={s.card}>
        {/* Peach logo container */}
        <View style={s.logoContainer}>
          <View style={s.orangeBox}>
            <Text style={s.logoP}>P</Text>
          </View>
        </View>

        {/* Heading */}
        <Text style={s.title}>Parking Customization</Text>

        {/* Description */}
        <Text style={s.description}>
          To manage your parking layout, slots, and availability, please open the full website editor.
        </Text>

        {/* Button */}
        <TouchableOpacity
          style={s.button}
          onPress={onViewWebDesign}
          accessibilityLabel="Open Website to Customize Parking"
        >
          <Text style={s.buttonText}>Open Website to Customize Parking</Text>
          <Ionicons name="open-outline" size={18} color="#FFFFFF" style={s.buttonIcon} />
        </TouchableOpacity>

        {/* Subtext */}
        <Text style={s.subtext}>Opens in a new tab</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // matches the main app page background color
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    width: '100%',
    maxWidth: 360,
    paddingVertical: 54,
    paddingHorizontal: 30,
    alignItems: 'center',
    // shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#FFF7ED', // light peach/orange background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  orangeBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#EE6B20', // orange border matching theme
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoP: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EE6B20',
    textAlign: 'center',
    includeFontPadding: false,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C436B', // matching header blue/navy theme
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B', // slate/muted gray
    textAlign: 'center',
    marginBottom: 36,
    paddingHorizontal: 6,
  },
  button: {
    backgroundColor: '#EE6B20', // vibrant orange
    borderRadius: 20,
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#EE6B20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: '85%',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  subtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});