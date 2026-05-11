import { Ionicons } from '@expo/vector-icons';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@theme/colors';

export function ParkingScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <View style={styles.pSign}>
            <Text style={styles.pLetter}>P</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>Parking Customization</Text>
          <Text style={styles.subtitle}>
            To manage your parking layout, slots, and availability, please open the full website editor.
          </Text>
        </View>

        <View style={styles.btnBlock}>
          <TouchableOpacity
            style={styles.btn}
            accessibilityLabel="Open Website to Customize Parking"
            onPress={() => Linking.openURL('https://pakipark.com')}
          >
            <Text style={styles.btnText}>Open Website to Customize Parking</Text>
            <Ionicons name="open-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.hint}>Opens in a new tab</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingTop: 52,
    paddingBottom: 44,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: '#FDEBD0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pSign: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pLetter: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.orange,
    lineHeight: 38,
  },

  textBlock: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.navy,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 23,
  },

  btnBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.orange,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 28,
    width: '90%',
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});