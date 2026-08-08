import { Stack } from 'expo-router';

import { palette } from '@/theme/tokens';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
