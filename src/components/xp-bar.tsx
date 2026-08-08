/**
 * The XP bar — GID's signature element.
 *
 * Discrete blocks, never a smooth gradient fill. A continuous bar creeps up
 * and you cannot tell it moved; blocks click over one at a time, so finishing
 * a task lands like a coin dropping. The partially-filled leading block keeps
 * small gains visible without softening the edges of the rest.
 */

import { StyleSheet, View } from 'react-native';

import { palette, radius, xpBar } from '@/theme/tokens';

type Props = {
  /** 0..1 */
  progress: number;
  segments?: number;
  height?: number;
};

export function XpBar({ progress, segments = xpBar.segments, height = xpBar.height }: Props) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const exact = clamped * segments;
  const full = Math.floor(exact);
  const partial = exact - full;

  return (
    <View style={[styles.track, { height }]} accessibilityRole="progressbar">
      {Array.from({ length: segments }, (_, i) => {
        // Everything below the fill line is solid; the one block at the fill
        // line is dimmed in proportion; everything above is an empty socket.
        const opacity = i < full ? 1 : i === full ? Math.max(partial, 0) : 0;
        return (
          <View key={i} style={[styles.socket, { height }]}>
            {opacity > 0 && <View style={[styles.fill, { opacity }]} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: xpBar.gap,
    width: '100%',
  },
  socket: {
    flex: 1,
    borderRadius: xpBar.radius,
    backgroundColor: palette.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: xpBar.radius,
    backgroundColor: palette.accent,
  },
});

/** Empty-state variant used before a profile has loaded. */
export function XpBarSkeleton() {
  return <XpBar progress={0} />;
}

export const xpBarRadius = radius.chip;
