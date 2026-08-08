import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/query';
import { supabase, type Profile } from '@/lib/supabase';
import { rankForLevel } from '@/theme/tokens';

/** Cumulative XP required to have reached a level. Mirrors gid_xp_for_level(). */
export function xpForLevel(level: number): number {
  const l = Math.max(1, level);
  return 100 * (l - 1) * l;
}

export type ProfileView = Profile & {
  rank: string;
  /** XP earned since this level began. */
  xpIntoLevel: number;
  /** XP the whole level costs. */
  xpForNextLevel: number;
  /** 0..1, for the XP bar. */
  progress: number;
};

function decorate(profile: Profile): ProfileView {
  const floor = xpForLevel(profile.level);
  const ceiling = xpForLevel(profile.level + 1);
  const span = Math.max(1, ceiling - floor);
  const into = Math.max(0, profile.xp - floor);

  return {
    ...profile,
    rank: rankForLevel(profile.level),
    xpIntoLevel: into,
    xpForNextLevel: span,
    progress: Math.min(1, into / span),
  };
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: qk.profile,
    enabled: !!user,
    queryFn: async (): Promise<ProfileView> => {
      // No .eq('id', user.id) needed — the RLS policy already restricts this
      // to the caller's own row. Filtering again would just restate it.
      const { data, error } = await supabase.from('profiles').select('*').single();
      if (error) throw error;
      return decorate(data);
    },
  });
}
