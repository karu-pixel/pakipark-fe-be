import type { ExpoConfig } from 'expo/config';
import { withGradleProperties } from 'expo/config-plugins';

type RuntimeEnvironment = 'development' | 'staging' | 'production';

const defaultAppName = 'PakiApps';
const defaultEnvironment: RuntimeEnvironment = 'development';
const defaultApiBaseUrl = 'https://api.example.com';
const defaultSupabaseUrl = 'https://rregfrhtlmfktliijzpd.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable__1PnaWg4F91cxR3KFqQITA_TDMmdtLV';
const defaultPasswordResetRedirectUrl = 'pakiship://reset-password';
const kotlinVersion = '2.0.21';
const allowedEnvironments = new Set<RuntimeEnvironment>(['development', 'staging', 'production']);

function pickFirstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value?.trim());
}

function withCiKotlinGradleProperty(config: ExpoConfig): ExpoConfig {
  return withGradleProperties(config, (gradleConfig) => {
    const properties = gradleConfig.modResults;
    let hasKotlinVersion = false;

    for (const item of properties) {
      if (item.type === 'property' && item.key === 'kotlinVersion') {
        item.value = kotlinVersion;
        hasKotlinVersion = true;
      }
    }

    if (!hasKotlinVersion) {
      properties.push({
        type: 'property',
        key: 'kotlinVersion',
        value: kotlinVersion,
      });
    }

    return gradleConfig;
  });
}

function resolveEnvironment(value: string | undefined): RuntimeEnvironment {
  if (value && allowedEnvironments.has(value as RuntimeEnvironment)) {
    return value as RuntimeEnvironment;
  }

  return defaultEnvironment;
}

export default function getExpoConfig(): ExpoConfig {
  const appName = process.env.EXPO_PUBLIC_APP_NAME ?? defaultAppName;
  const environment = resolveEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
  const apiBaseUrl =
    pickFirstDefined(
      process.env.EXPO_PUBLIC_API_BASE_URL,
      process.env.API_BASE_URL,
    ) ?? defaultApiBaseUrl;
  const supabaseUrl =
    pickFirstDefined(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_URL,
    ) ?? defaultSupabaseUrl;
  const supabaseAnonKey =
    pickFirstDefined(
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      process.env.SUPABASE_ANON_KEY,
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ) ?? defaultSupabaseAnonKey;
  const supabasePasswordResetRedirectUrl =
    pickFirstDefined(
      process.env.EXPO_PUBLIC_SUPABASE_PASSWORD_RESET_REDIRECT_URL,
      process.env.SUPABASE_PASSWORD_RESET_REDIRECT_URL,
    ) ?? defaultPasswordResetRedirectUrl;

  return withCiKotlinGradleProperty({
    name: appName,
    slug: 'template-repo-mobile-single',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'templatemobilesingle',
    userInterfaceStyle: 'automatic',
    jsEngine: 'hermes',
    experiments: {
      tsconfigPaths: true,
    },
    android: {
      package: 'com.anonymous.templaterepombsingle',
    },
    ios: {
      bundleIdentifier: 'com.anonymous.templaterepombsingle',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            kotlinVersion,
          },
        },
      ],
    ],
    extra: {
      appName,
      environment,
      apiBaseUrl,
      supabaseUrl,
      supabaseAnonKey,
      supabasePublishableKey: supabaseAnonKey,
      supabasePasswordResetRedirectUrl,
    },
  });
}
