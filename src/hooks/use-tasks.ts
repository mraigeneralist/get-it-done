import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/query';
import {
  supabase,
  type CompleteTaskResult,
  type Task,
  type TaskDifficulty,
} from '@/lib/supabase';
import { decorateProfile, type ProfileView } from './use-profile';

export function useTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: qk.tasks,
    enabled: !!user,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; difficulty: TaskDifficulty }) => {
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('tasks')
        // user_id is required: the RLS check is `auth.uid() = user_id`, so a
        // row without it is rejected rather than silently mis-owned.
        .insert({ user_id: user.id, title: input.title.trim(), difficulty: input.difficulty })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
    },
  });
}

/**
 * Completing a task.
 *
 * The RPC returns the full profile snapshot alongside the XP delta, so the
 * scoreboard can be updated from the same round trip that awarded the points
 * — no follow-up fetch, and no window where the task is ticked but the bar
 * has not moved yet.
 *
 * Note there is no guard against tapping twice. There does not need to be:
 * the second call finds its xp_events row already present and returns
 * `already_completed` having awarded nothing. Correctness lives in the
 * database, not in a disabled button.
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string): Promise<CompleteTaskResult> => {
      const { data, error } = await supabase.rpc('complete_task', { p_task_id: taskId });
      if (error) throw error;
      return data as unknown as CompleteTaskResult;
    },

    onMutate: async (taskId) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Tick the box immediately. A completion that waits on the network
      // feels broken even when it is only 250ms.
      await queryClient.cancelQueries({ queryKey: qk.tasks });
      const previous = queryClient.getQueryData<Task[]>(qk.tasks);
      queryClient.setQueryData<Task[]>(qk.tasks, (tasks) =>
        tasks?.map((t) =>
          t.id === taskId
            ? { ...t, status: 'completed', completed_at: new Date().toISOString() }
            : t,
        ),
      );
      return { previous };
    },

    onError: (_err, _taskId, context) => {
      // Put the row back exactly as it was.
      if (context?.previous) queryClient.setQueryData(qk.tasks, context.previous);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    onSuccess: (result) => {
      if (result.already_completed) return;

      // Drive the scoreboard straight from the authoritative numbers.
      queryClient.setQueryData<ProfileView>(qk.profile, (old) =>
        old
          ? decorateProfile({
              ...old,
              xp: result.xp,
              coins: result.coins,
              level: result.level,
              current_streak: result.streak,
              longest_streak: Math.max(old.longest_streak, result.streak),
              streak_freezes: result.streak_freezes,
            })
          : old,
      );

      if (result.leveled_up) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },

    onSettled: () => {
      // A completed recurring task spawns its next occurrence server-side,
      // so the list has to come from the server rather than be patched here.
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
    },
  });
}

export function useUncompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase.rpc('uncomplete_task', { p_task_id: taskId });
      if (error) throw error;
      return data;
    },
    onMutate: async (taskId) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await queryClient.cancelQueries({ queryKey: qk.tasks });
      const previous = queryClient.getQueryData<Task[]>(qk.tasks);
      queryClient.setQueryData<Task[]>(qk.tasks, (tasks) =>
        tasks?.map((t) =>
          t.id === taskId ? { ...t, status: 'pending', completed_at: null } : t,
        ),
      );
      return { previous };
    },
    onError: (_e, _id, context) => {
      if (context?.previous) queryClient.setQueryData(qk.tasks, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
      void queryClient.invalidateQueries({ queryKey: qk.profile });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.tasks });
    },
  });
}
