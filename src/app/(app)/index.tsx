/**
 * Today.
 *
 * The whole loop in one screen: add a task, tap the check, watch the
 * scoreboard move. Everything after this phase adds depth to a pipeline that
 * already works end to end.
 */

import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickAdd } from '@/components/quick-add';
import { ScoreHeader } from '@/components/score-header';
import { TaskRow } from '@/components/task-row';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';
import {
  useCompleteTask,
  useCreateTask,
  useTasks,
  useUncompleteTask,
} from '@/hooks/use-tasks';
import { useAuth } from '@/lib/auth';
import type { Task } from '@/lib/supabase';
import { palette, radius, space, type } from '@/theme/tokens';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const { data: profile } = useProfile();
  const { data: tasks, isLoading, error, refetch } = useTasks();

  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  const { pending, done } = useMemo(() => {
    const all = tasks ?? [];
    return {
      pending: all.filter((t) => t.status === 'pending'),
      done: all.filter((t) => t.status === 'completed'),
    };
  }, [tasks]);

  function toggle(task: Task) {
    if (task.status === 'completed') uncompleteTask.mutate(task.id);
    else completeTask.mutate(task.id);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.giant },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {profile && <ScoreHeader profile={profile} />}

      <QuickAdd
        busy={createTask.isPending}
        onAdd={(title, difficulty) => createTask.mutate({ title, difficulty })}
      />

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
        </View>
      )}

      {error && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Could not load your tasks</Text>
          <Text style={styles.noticeBody}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
          <Button label="Try again" variant="secondary" onPress={() => refetch()} />
        </View>
      )}

      {!isLoading && !error && pending.length === 0 && done.length === 0 && (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Nothing here yet</Text>
          <Text style={styles.noticeBody}>
            Add your first task above. Easy is worth 10 XP, medium 25, hard 50 — and 200 XP
            gets you to level 2.
          </Text>
        </View>
      )}

      {pending.length > 0 && (
        <Section title="TO DO" count={pending.length}>
          {pending.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggle} />
          ))}
        </Section>
      )}

      {done.length > 0 && (
        <Section title="DONE" count={done.length}>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={toggle} />
          ))}
        </Section>
      )}

      <Button label="Sign out" variant="ghost" onPress={signOut} />
    </ScrollView>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: space.xl, gap: space.xxl },
  centered: { paddingVertical: space.xxxl, alignItems: 'center' },

  section: { gap: space.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  sectionTitle: { ...type.eyebrow, color: palette.textMuted },
  sectionCount: { ...type.eyebrow, color: palette.textFaint, fontVariant: ['tabular-nums'] },
  sectionBody: { gap: space.sm },

  notice: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.xl,
    gap: space.md,
  },
  noticeTitle: { ...type.heading, color: palette.text },
  noticeBody: { ...type.body, color: palette.textMuted },
});
