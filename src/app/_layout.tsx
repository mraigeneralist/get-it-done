import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { asyncStoragePersister, queryClient } from '@/lib/query';
import { palette } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </SafeAreaProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();

  // Render nothing decisive until the stored session has been read. Routing
  // on an unresolved session throws a returning user onto the sign-in screen
  // for a frame before snapping back — a flash that reads as a bug.
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
        animation: 'fade',
      }}
    >
      {/* Declarative guards: the router itself refuses to mount the wrong
          group, so no screen has to defend itself with its own redirect. */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
