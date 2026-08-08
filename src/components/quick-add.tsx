/**
 * Add a task without leaving the list.
 *
 * Difficulty is chosen inline because it is the only thing that changes what
 * a task is worth, and asking for it here costs one tap. Everything else —
 * dates, categories, notes — belongs in the full editor in Phase 3.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { TaskDifficulty } from '@/lib/supabase';
import { difficultyXp, palette, radius, space, type } from '@/theme/tokens';

const OPTIONS: TaskDifficulty[] = ['easy', 'medium', 'hard'];

export function QuickAdd({
  onAdd,
  busy = false,
}: {
  onAdd: (title: string, difficulty: TaskDifficulty) => void;
  busy?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [focused, setFocused] = useState(false);

  const canAdd = title.trim().length > 0 && !busy;

  function submit() {
    if (!canAdd) return;
    onAdd(title, difficulty);
    setTitle('');
    // Difficulty deliberately persists: people add several tasks of similar
    // size in a row, and re-picking every time is friction.
  }

  return (
    <View style={[styles.wrapper, focused && styles.wrapperFocused]}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={submit}
        placeholder="What needs doing?"
        placeholderTextColor={palette.textFaint}
        selectionColor={palette.accent}
        returnKeyType="done"
        blurOnSubmit={false}
        style={styles.input}
      />

      <View style={styles.controls}>
        <View style={styles.segments}>
          {OPTIONS.map((option) => {
            const active = option === difficulty;
            return (
              <Pressable
                key={option}
                onPress={() => setDifficulty(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                  {option[0].toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={submit}
          disabled={!canAdd}
          accessibilityRole="button"
          accessibilityLabel="Add task"
          style={({ pressed }) => [
            styles.add,
            !canAdd && styles.addDisabled,
            pressed && canAdd && styles.addPressed,
          ]}
        >
          <Text style={[styles.addLabel, !canAdd && styles.addLabelDisabled]}>
            +{difficultyXp[difficulty]}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.md,
    gap: space.md,
  },
  wrapperFocused: { borderColor: palette.borderStrong },

  input: {
    ...type.body,
    color: palette.text,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    minHeight: 40,
  },

  controls: { flexDirection: 'row', alignItems: 'center', gap: space.md },

  segments: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: palette.surfaceSunken,
    borderRadius: radius.control,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: space.sm,
    borderRadius: radius.chip,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: palette.surfaceRaised },
  segmentLabel: { ...type.label, color: palette.textFaint },
  segmentLabelActive: { color: palette.text },

  add: {
    height: 40,
    minWidth: 60,
    paddingHorizontal: space.md,
    borderRadius: radius.control,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPressed: { transform: [{ scale: 0.96 }] },
  addDisabled: { backgroundColor: palette.surfaceRaised },
  addLabel: {
    ...type.label,
    color: palette.accentText,
    fontVariant: ['tabular-nums'],
  },
  // The accent-on-dark label would vanish against the disabled surface.
  addLabelDisabled: { color: palette.textFaint },
});
