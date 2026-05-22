import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const pakiAppsLogo = require('../../../../assets/launcher/pakiapps-logo.png');
const pakiAppsMascots = require('../../../../assets/launcher/pakiapps-mascots.png');
const pakiAppsBackground = require('../../../../assets/launcher/pakiapps-bg.png');
const pakiShipLogo = require('../../../../assets/launcher/pakiship-logo.png');
const pakiParkLogo = require('../../../../assets/launcher/pakipark-logo.png');

type ServiceKey = 'pakiship' | 'pakipark';

type ServiceSelectionScreenProps = {
  onSelectService: (service: ServiceKey) => void;
};

type ServiceCardProps = {
  accent: string;
  logo: ImageSourcePropType;
  subtitle: string;
  title: string;
  onPress: () => void;
};

function ServiceCard({ accent, logo, subtitle, title, onPress }: ServiceCardProps) {
  return (
    <View style={styles.serviceColumn}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.serviceCard,
          { shadowColor: accent, transform: [{ scale: pressed ? 0.96 : 1 }] },
        ]}
      >
        <View style={[styles.serviceCardTint, { backgroundColor: accent }]} />
        <Image source={logo} resizeMode="contain" style={styles.serviceLogo} />
      </Pressable>
      <View style={styles.serviceTextBlock}>
        <Text style={[styles.serviceTitle, { color: accent }]}>{title}</Text>
        <Text style={styles.serviceSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export function ServiceSelectionScreen({ onSelectService }: ServiceSelectionScreenProps) {
  const { height, width } = useWindowDimensions();
  const mascotFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloat, {
          duration: 3000,
          toValue: -8,
          useNativeDriver: true,
        }),
        Animated.timing(mascotFloat, {
          duration: 3000,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [mascotFloat]);

  const cardSize = useMemo(() => {
    if (width < 360) {
      return 112;
    }

    if (width < 420) {
      return 126;
    }

    return 142;
  }, [width]);

  const mascotHeight = useMemo(() => Math.min(Math.max(height * 0.3, 210), 280), [height]);
  const captionOffset = useMemo(() => (height < 760 ? 24 : 36), [height]);

  return (
    <ImageBackground
  source={pakiAppsBackground}
  resizeMode="cover"
  style={styles.screen}
>
  <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image source={pakiAppsLogo} resizeMode="contain" style={styles.pakiAppsLogo} />
            </View>

            <View style={[styles.captionBlock, { marginTop: captionOffset }]}>
              <Text style={styles.headerCaption}>Select an active service</Text>

              <View style={styles.accentRow}>
                <View style={[styles.accentDot, styles.accentDotShip]} />
                <View style={styles.accentLine} />
                <View style={[styles.accentDot, styles.accentDotPark]} />
              </View>
            </View>
          </View>

          <View style={[styles.servicesRow, { justifyContent: 'center' }]}>
            <View style={{ width: cardSize }}>
              <ServiceCard
                accent="#2F7BFF"
                logo={pakiParkLogo}
                onPress={() => onSelectService('pakipark')}
                subtitle="EASY PARKING"
                title="PakiPark"
              />
            </View>
          </View>

          <View style={[styles.mascotWrap, { minHeight: mascotHeight }]}>
            <Animated.Image
              source={pakiAppsMascots}
              resizeMode="contain"
              style={[
                styles.mascots,
                {
                  transform: [{ translateY: mascotFloat }, { scale: width < 390 ? 1.06 : 1.14 }],
                },
              ]}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>2026 PAKIAPPS</Text>
          </View>
        </View>
      </SafeAreaView>
</ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screen: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  pakiAppsLogo: {
    width: 154,
    height: 148,
  },
  captionBlock: {
    alignItems: 'center',
  },
  headerCaption: {
    marginTop:5,
    color: '#294864',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  accentRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accentDot: {
    width: 10,
    height: 3,
    borderRadius: 999,
  },
  accentDotShip: {
    backgroundColor: '#18A6A7',
  },
  accentDotPark: {
    backgroundColor: '#2F7BFF',
  },
  accentLine: {
    width: 34,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  servicesRow: {
    width: '100%',
    maxWidth: 310,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceColumn: {
    alignItems: 'center',
  },
  serviceCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 30,
    elevation: 8,
    overflow: 'hidden',
  },
  serviceCardTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.05,
  },
  serviceLogo: {
    width: '72%',
    height: '72%',
  },
  serviceTextBlock: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
  },
  serviceSubtitle: {
    color: '#8B98AA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  mascotWrap: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
  },
  mascots: {
    width: '100%',
    maxWidth: 310,
    height: '100%',
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  footerText: {
    color: '#7B8EA5',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 4.2,
  },
});
