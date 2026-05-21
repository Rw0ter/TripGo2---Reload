import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 跨端持久化存储，供 zustand persist 用。
// expo-secure-store 不支持 web —— web 用 localStorage，原生用 SecureStore。
export const persistStorage =
  Platform.OS === 'web'
    ? {
        getItem: (k: string) =>
          Promise.resolve(globalThis.localStorage?.getItem(k) ?? null),
        setItem: (k: string, v: string) => {
          globalThis.localStorage?.setItem(k, v);
          return Promise.resolve();
        },
        removeItem: (k: string) => {
          globalThis.localStorage?.removeItem(k);
          return Promise.resolve();
        },
      }
    : {
        getItem: (k: string) => SecureStore.getItemAsync(k),
        setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
        removeItem: (k: string) => SecureStore.deleteItemAsync(k),
      };
