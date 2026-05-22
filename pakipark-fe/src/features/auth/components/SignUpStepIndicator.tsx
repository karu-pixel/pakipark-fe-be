import { StyleSheet, View } from 'react-native';

interface SignUpStepIndicatorProps {
  step: 1 | 2 | 3;
}

export function SignUpStepIndicator({ step }: SignUpStepIndicatorProps) {
  return (
    <View style={styles.root}>
      {[1, 2, 3].map((index) => (
        <View
          key={index}
          style={[
            styles.segment,
            index < step ? styles.complete : undefined,
            index === step ? styles.active : undefined,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E8EEF4',
  },
  complete: {
    backgroundColor: '#EE6B20',
  },
  active: {
    backgroundColor: '#1E3D5A',
  },
});
