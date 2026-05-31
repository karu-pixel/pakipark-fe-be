import { AntDesign } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { loginColors } from './LoginStyles';

interface LoginHeaderProps {
  onBackPress: () => void;
}

export function LoginHeader({ onBackPress }: LoginHeaderProps) {
  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Pressable hitSlop={8} onPress={onBackPress} style={styles.backButton}>
          <AntDesign name="left" size={18} color={loginColors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FFFFFF',
  },
  bar: {
    height: 52,
    paddingHorizontal: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EDF5',
  },
  backButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
