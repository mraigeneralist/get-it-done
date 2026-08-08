/**
 * Home. In Phase 1 this proves the authenticated read path: the same table
 * that refused an anonymous reader hands over exactly one row — yours — once
 * you are signed in. Phase 2 adds the task list beneath the scoreboard.
 */

import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScoreHeader } from '@/components/score-header';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/lib/auth';
import { palette, radius, space, type } from '@/theme/tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const { data: profile, isLoading, error, refetch } = useProfile();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xxxl },
      ]}
    >
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
        </View>
      )}

      {error && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Could not load your profile</Text>
          <Text style={styles.cardBody}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
          <Button label="Try again" variant="secondary" onPress={() => refetch()} />
        </View>
      )}

      {profile && (
        <>
          <ScoreHeader profile={profile} />

          <View style={styles.card}>
            <Text style={styles.eyebrow}>PHASE 1 · SIGNED IN</Text>
            <Text style={styles.cardTitle}>Your row, and only your row</Text>
            <Text style={styles.cardBody}>
              Signed out, Postgres refused this table outright. Signed in, it returns exactly
              one profile — yours. Same database, same key in the app; the difference is who
              is asking.
            </Text>
            <Text style={styles.mono}>{user?.email}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Next up</Text>
            <Text style={styles.cardBody}>
              Phase 2 puts a real task here: create it, tap the check, and watch the XP bar
              above move.
            </Text>
          </View>

          <Button label="Sign out" variant="ghost" onPress={signOut} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: space.xl, gap: space.xxl },
  centered: { paddingVertical: space.giant, alignItems: 'center' },

  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.xl,
    gap: space.md,
  },
  eyebrow: { ...type.eyebrow, color: palette.accent },
  cardTitle: { ...type.heading, color: palette.text },
  cardBody: { ...type.body, color: palette.textMuted },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: palette.textFaint,
  },
});
