import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export function showMessage(title: string, message: string) {
  Alert.alert(title, message);
}

export async function getStoredJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveStoredJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function formatNowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
