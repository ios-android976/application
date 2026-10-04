import 'react-native-url-polyfill/auto';

import type { CoffeeClient, Database } from '@coffee/shared';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL болон EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY-г apps/mobile/.env файлд тохируулна уу.',
  );
}

/**
 * A phone running Expo Go cannot reach "localhost" on your computer. When the
 * URL points at a local Supabase, swap in the dev machine's LAN address that
 * Expo already knows about.
 */
function resolveSupabaseUrl(value: string): string {
  if (Platform.OS === 'web') return value;
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!devHost) return value;
  return value.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, `//${devHost}`);
}

// The customer app never signs in, so there is no session to keep.
export const supabase: CoffeeClient = createClient<Database>(resolveSupabaseUrl(url), publishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
