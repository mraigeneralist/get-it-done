/**
 * The scoreboard. Sits at the top of the main screen and is the first thing
 * the eye lands on, because progress is the point of the app.
 *
 * Everything numeric here is mono and tabular so the digits sit in fixed
 * columns — a streak going 9 → 10 must not shove the layout sideways.
 */

import { StyleSheet, Text, View } from 'react-native';

import { XpBar } from '@/components/xp-bar';
import type { ProfileView } from '@/hooks/use-profile';
import { numeral, palette, space, type } from '@/theme/tokens';

export function ScoreHeader({ profile }: { profile: ProfileView }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <Text style={styles.eyebrow}>
            LEVEL {profile.level} · {profile.rank.toUpperCase()}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {profile.display_name}
          </Text>
        </View>

        <View style={styles.stats}>
          <Stat label="STREAK" value={profile.current_streak} highlight={profile.current_streak > 0} />
          <Stat label="COINS" value={profile.coins} />
        </View>
      </View>

      <View style={styles.barBlock}>
        <XpBar progress={profile.progress} />
        <Text style={styles.xpText}>
          {profile.xpIntoLevel.toLocaleString()} / {profile.xpForNextLevel.toLocaleString()} XP
        </Text>
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHot]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.lg },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg },
  identity: { flex: 1, gap: space.xs },
  eyebrow: { ...type.eyebrow, color: palette.accent },
  name: { ...type.title, color: palette.text },

  stats: { flexDirection: 'row', gap: space.xl },
  stat: { alignItems: 'flex-end', gap: space.xxs },
  statLabel: { ...type.eyebrow, fontSize: 10, color: palette.textFaint },
  statValue: { ...numeral.medium, color: palette.textMuted },
  // A live streak is the one stat that earns colour, because it is the one
  // you can lose by doing nothing.
  statValueHot: { color: palette.accent },

  barBlock: { gap: space.sm },
  xpText: { ...numeral.small, color: palette.textMuted, textAlign: 'right' },
});
