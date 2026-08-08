/**
 * The Supabase client.
 *
 * Typed against database.types.ts, which is generated from the live schema —
 * so a column rename shows up as a TypeScript error rather than as `undefined`
 * at runtime. Regenerate after every migration.
 */

// Must come first. supabase-js builds URLs with the WHATWG URL API, which
// React Native's JS runtime does not ship. Without this the client throws on
// its very first request, with an error that points nowhere useful.
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from './database.types';
import { env } from './env';

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    // Keeps the user signed in across app restarts. Without it they would be
    // kicked to the sign-in screen every cold start.
    persistSession: true,
    autoRefreshToken: true,
    // Web-only concern: there is no URL bar to read a session out of here,
    // and leaving it on makes the client wait on something that never arrives.
    detectSessionInUrl: false,
  },
});

/**
 * Refresh the access token only while the app is actually in front of the
 * user. A timer left running in the background wakes the device to renew a
 * token nobody is waiting on, which costs battery for nothing.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});

/** Shorthands for the rows we touch most, so screens don't re-derive them. */
export type Tables = Database['public']['Tables'];
export type Profile = Tables['profiles']['Row'];
export type Task = Tables['tasks']['Row'];
export type TaskInsert = Tables['tasks']['Insert'];
export type Category = Tables['categories']['Row'];
export type FocusSession = Tables['focus_sessions']['Row'];
export type Alarm = Tables['alarms']['Row'];
export type Achievement = Tables['achievements']['Row'];
export type DailyQuest = Tables['daily_quests']['Row'];
export type ShopItem = Tables['shop_items']['Row'];

export type TaskDifficulty = Database['public']['Enums']['task_difficulty'];
export type TaskStatus = Database['public']['Enums']['task_status'];
export type TaskRecurrence = Database['public']['Enums']['task_recurrence'];

/**
 * What complete_task() hands back. One round trip returns everything the UI
 * needs to animate: the XP delta, the new totals, and anything that unlocked
 * as a side effect.
 */
export type CompleteTaskResult = {
  already_completed: boolean;
  xp_gained: number;
  coins_gained: number;
  xp: number;
  coins: number;
  level: number;
  rank: string;
  xp_into_level: number;
  xp_for_next_level: number;
  leveled_up: boolean;
  streak: number;
  longest_streak: number;
  streak_freezes: number;
  quests_completed: { id: string; key: string; xp: number; coins: number }[];
  achievements_unlocked: {
    key: string;
    name: string;
    description: string;
    icon: string;
    tier: number;
    xp: number;
    coins: number;
  }[];
};
