import { StyleSheet, Text, View } from 'react-native';

import { loginColors } from './LoginStyles';

export function SignUpLeftPanel() {
  return (
    <View style={styles.root}>
      <Text style={styles.heading}>
        Tap. Reserve.{'\n'}
        <Text style={styles.headingAccent}>Convenience</Text> in Every Spot!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 38,
    paddingBottom: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  heading: {
    color: loginColors.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
    textAlign: 'center',
  },
  headingAccent: {
    color: loginColors.accent,
  },
});
