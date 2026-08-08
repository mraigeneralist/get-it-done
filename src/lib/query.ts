/**
 * TanStack Query client, with its cache written to AsyncStorage.
 *
 * GID keeps its data in Supabase, so there is no local database to fall back
 * on. Persisting the query cache means a cold start on a bad connection still
 * paints yesterday's task list instead of an empty screen, and the app feels
 * instant because the first render comes from disk rather than the network.
 *
 * This is a cache, not a second source of truth: writes still need a
 * connection, and anything read from here is replaced as soon as the real
 * response lands.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tasks change because the user changed them, so refetching on a timer
      // mostly wastes battery. Mutations invalidate what they touch instead.
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24, // survives a day of app restarts
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // A completion lost to a dropped connection is worse than a slow one.
      retry: 1,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'gid-query-cache',
  throttleTime: 1000,
});

/** Query keys in one place, so an invalidation can never miss by a typo. */
export const qk = {
  profile: ['profile'] as const,
  tasks: ['tasks'] as const,
  tasksByStatus: (status: string) => ['tasks', status] as const,
  task: (id: string) => ['tasks', id] as const,
  categories: ['categories'] as const,
  focusSessions: ['focus-sessions'] as const,
  alarms: ['alarms'] as const,
  quests: ['quests'] as const,
  achievements: ['achievements'] as const,
  shop: ['shop'] as const,
  inventory: ['inventory'] as const,
} as const;
