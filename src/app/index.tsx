/**
 * Phase 0 — foundation check.
 *
 * A placeholder screen with a job: prove on the device that every link in the
 * chain works before a single feature is built. Config is baked into the
 * bundle, the bundle can reach Supabase in Mumbai, and row-level security is
 * actually switched on. Phase 1 replaces this with sign-in.
 */

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { XpBar } from '@/components/xp-bar';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { numeral, palette, radius, space, type } from '@/theme/tokens';

/** Rows in 0004_catalog.sql. Signed out, we should be able to see none of them. */
const CATALOG_SIZE = 17;

type State = 'checking' | 'pass' | 'fail';

type Check = {
  label: string;
  state: State;
  value: string;
  detail: string;
};

export default function FoundationScreen() {
  const insets = useSafeAreaInsets();
  const [checks, setChecks] = useState<Check[]>([
    { label: 'Config', state: 'checking', value: '', detail: 'Reading bundled environment' },
    { label: 'Database', state: 'checking', value: '', detail: 'Contacting ap-south-1' },
    { label: 'Row-level security', state: 'checking', value: '', detail: 'Testing as a signed-out user' },
  ]);

  useEffect(() => {
    let cancelled = false;
    const set = (i: number, patch: Partial<Check>) =>
      !cancelled && setChecks((prev) => prev.map((c, n) => (n === i ? { ...c, ...patch } : c)));

    (async () => {
      // 1 — config. If env.ts had not found these it would have thrown on
      // import, so reaching this line is most of the proof.
      const host = env.supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];
      set(0, { state: 'pass', value: 'OK', detail: `Project ${host}` });

      // 2 + 3 — one request answers both. Signed out we hold the anon key,
      // so the request must succeed; but the achievements policy only grants
      // reads to authenticated users, so it must come back empty.
      const started = Date.now();
      const { data, error } = await supabase.from('achievements').select('key');
      const ms = Date.now() - started;

      if (error) {
        set(1, { state: 'fail', value: 'FAILED', detail: error.message });
        set(2, { state: 'fail', value: '—', detail: 'Skipped: no connection' });
        return;
      }

      set(1, { state: 'pass', value: `${ms} ms`, detail: 'Round trip to Mumbai' });

      const visible = data?.length ?? 0;
      if (visible === 0) {
        set(2, {
          state: 'pass',
          value: 'ON',
          detail: `0 of ${CATALOG_SIZE} rows readable while signed out`,
        });
      } else {
        set(2, {
          state: 'fail',
          value: 'OFF',
          detail: `${visible} rows leaked to an anonymous reader`,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const allPassed = checks.every((c) => c.state === 'pass');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.giant, paddingBottom: insets.bottom + space.xxxl },
      ]}
    >
      <Text style={styles.eyebrow}>PHASE 0 · FOUNDATION</Text>
      <Text style={styles.wordmark}>Get It Done</Text>

      <View style={styles.card}>
        {checks.map((check, i) => (
          <View key={check.label} style={[styles.row, i > 0 && styles.rowDivided]}>
            <View style={[styles.dot, dotStyle(check.state)]} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{check.label}</Text>
              <Text style={styles.rowDetail}>{check.detail}</Text>
            </View>
            <Text style={[styles.rowValue, check.state === 'fail' && styles.rowValueFail]}>
              {check.state === 'checking' ? '···' : check.value}
            </Text>
          </View>
        ))}
      </View>

      {/* A preview of the element the whole app is built around. */}
      <View style={styles.xpBlock}>
        <XpBar progress={allPassed ? 0.15 : 0} />
        <View style={styles.xpMeta}>
          <Text style={styles.xpRank}>LEVEL 1 · ROOKIE</Text>
          <Text style={styles.xpValue}>0 / 200 XP</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        {allPassed
          ? 'Foundation is live. Next: sign in, then one task end to end.'
          : 'Waiting on the checks above.'}
      </Text>
    </ScrollView>
  );
}

function dotStyle(state: State) {
  if (state === 'pass') return { backgroundColor: palette.success };
  if (state === 'fail') return { backgroundColor: palette.danger };
  return { backgroundColor: palette.textFaint };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: space.xl, gap: space.xxl },

  eyebrow: { ...type.eyebrow, color: palette.accent },
  wordmark: { ...type.display, color: palette.text, marginTop: -space.md },

  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
  },
  rowDivided: { borderTopWidth: 1, borderTopColor: palette.border },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  rowText: { flex: 1, gap: space.xxs },
  rowLabel: { ...type.bodyStrong, color: palette.text },
  rowDetail: { ...type.label, color: palette.textFaint, fontWeight: '400' },
  rowValue: { ...numeral.small, color: palette.textMuted },
  rowValueFail: { color: palette.danger },

  xpBlock: { gap: space.md },
  xpMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  xpRank: { ...type.eyebrow, color: palette.textMuted },
  xpValue: { ...numeral.small, color: palette.accent },

  footer: { ...type.body, color: palette.textFaint },
});
