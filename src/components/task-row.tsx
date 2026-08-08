/**
 * One task. The checkbox is the most-tapped control in the app, so it gets
 * the largest touch target and the only motion on the row.
 *
 * Difficulty is shown as pips rather than colour. Colour would compete with
 * the accent, and amber has exactly one meaning here: score.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Task } from '@/lib/supabase';
import { difficultyPips, difficultyXp, palette, radius, space, type } from '@/theme/tokens';

type Props = {
  task: Task;
  onToggle: (task: Task) => void;
  onLongPress?: (task: Task) => void;
};

export function TaskRow({ task, onToggle, onLongPress }: Props) {
  const done = task.status === 'completed';
  const pips = difficultyPips[task.difficulty];

  return (
    <Pressable
      onPress={() => onToggle(task)}
      onLongPress={onLongPress ? () => onLongPress(task) : undefined}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${task.title}, ${task.difficulty}, worth ${difficultyXp[task.difficulty]} XP`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.box, done && styles.boxDone]}>
        {done && <Text style={styles.check}>✓</Text>}
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
      </View>

      <View style={styles.meta}>
        <View style={styles.pips}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.pip, i < pips && !done && styles.pipOn]} />
          ))}
        </View>
        <Text style={[styles.xp, done && styles.xpDone]}>
          {done ? '' : `+${difficultyXp[task.difficulty]}`}
        </Text>
      </View>
    </Pressable>
  );
}

const BOX = 26;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rowPressed: { backgroundColor: palette.surfaceRaised },

  box: {
    width: BOX,
    height: BOX,
    borderRadius: BOX / 2,
    borderWidth: 2,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: palette.accent, borderColor: palette.accent },
  check: { color: palette.accentText, fontSize: 15, fontWeight: '900', lineHeight: 18 },

  body: { flex: 1 },
  title: { ...type.body, color: palette.text },
  titleDone: { color: palette.textFaint, textDecorationLine: 'line-through' },

  meta: { alignItems: 'flex-end', gap: space.sm, minWidth: 44 },
  pips: { flexDirection: 'row', gap: 3 },
  pip: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.surfaceRaised },
  pipOn: { backgroundColor: palette.textFaint },
  xp: { ...type.label, color: palette.textFaint, fontVariant: ['tabular-nums'] },
  xpDone: { color: 'transparent' },
});
