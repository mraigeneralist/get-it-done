/**
 * Get It Done — design tokens
 *
 * DIRECTION: a scoreboard for your own life.
 *
 * Not a "productivity app with some badges bolted on". The reference is the
 * arcade high-score table: dark cabinet glass, numbers in gold, progress shown
 * in blocks you can count. Three rules hold the whole thing together:
 *
 *   1. ONE ACCENT, ONE JOB. Amber is score. It marks XP, progress, and the
 *      primary action — nothing else. Because it is the only saturated colour
 *      on a desaturated field, progress is always the brightest thing on
 *      screen, and the eye goes there without being told to.
 *
 *   2. QUANTITIES ARE MONOSPACE. Every number the user is meant to read as a
 *      score — XP, level, streak, timer, stats — is set in a tabular mono face.
 *      Prose stays in the system humanist face. Numbers stop drifting as they
 *      tick, and stat columns line up for free.
 *
 *   3. PROGRESS IS SEGMENTED. The XP bar is discrete blocks, never a smooth
 *      gradient fill. A continuous bar creeps; blocks *click over*. Finishing a
 *      task should feel like a coin dropping, and you cannot feel a gradient.
 *
 * The background is blue-black rather than neutral black. It is a small thing
 * that does a lot: the cool cast makes amber read as warm metal instead of
 * yellow plastic, and it keeps the app from looking like every other dark UI.
 */

// ---------------------------------------------------------------
// Colour
// ---------------------------------------------------------------

export const palette = {
  // Surfaces — a cool, near-black stack. Each step is deliberately small;
  // depth here comes from borders, not from big jumps in lightness.
  bg: '#0A0C12',
  surface: '#12151F',
  surfaceRaised: '#1A1F2E',
  surfaceSunken: '#070910',

  border: '#252B3B',
  borderStrong: '#333A4D',

  // Text — a three-step ramp. If something needs a fourth, the layout is
  // doing too much.
  text: '#EEF1F8',
  textMuted: '#8C93A8',
  textFaint: '#575E73',

  // THE accent. Score, XP, progress, primary action. Nothing else.
  accent: '#FFB627',
  accentDim: '#8A6414',
  accentText: '#0A0C12', // sits on top of accent
  accentWash: 'rgba(255, 182, 39, 0.12)',

  // Semantic — used sparingly and never for decoration.
  success: '#3DDC97',
  danger: '#FF5C5C',
  dangerWash: 'rgba(255, 92, 92, 0.12)',
  info: '#5B9DFF',

  // Achievement tiers, in the order anyone who has played a game expects.
  tier1: '#A8724B',
  tier2: '#B9C2D0',
  tier3: '#FFB627',
  tier4: '#C77DFF',
} as const;

/**
 * Difficulty is shown with filled pips (1, 2, or 3), not colour — that keeps
 * the accent exclusive to progress. These exist for the rare case where a
 * pip won't fit, and stay close in value so no difficulty looks alarming.
 */
export const difficultyColor = {
  easy: '#4FD1A5',
  medium: '#6FA8FF',
  hard: '#FF8A65',
} as const;

export const difficultyPips = { easy: 1, medium: 2, hard: 3 } as const;
export const difficultyXp = { easy: 10, medium: 25, hard: 50 } as const;

// ---------------------------------------------------------------
// Type
// ---------------------------------------------------------------

import { Platform } from 'react-native';

/** Tabular mono for anything that is a quantity. See rule 2 above. */
export const monoFamily = Platform.select({
  android: 'monospace',
  ios: 'Menlo',
  default: 'monospace',
}) as string;

export const type = {
  display: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 29, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400', letterSpacing: 0 },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600', letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 17, fontWeight: '600', letterSpacing: 0.1 },
  /** Section eyebrows. Uppercase is applied at the call site. */
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.1 },
} as const;

/** Quantities. Always mono, always tabular so digits don't jitter as they tick. */
export const numeral = {
  hero: { fontFamily: monoFamily, fontSize: 40, lineHeight: 44, fontWeight: '700' },
  large: { fontFamily: monoFamily, fontSize: 24, lineHeight: 28, fontWeight: '700' },
  medium: { fontFamily: monoFamily, fontSize: 17, lineHeight: 21, fontWeight: '700' },
  small: { fontFamily: monoFamily, fontSize: 13, lineHeight: 16, fontWeight: '600' },
  /** The Pomodoro clock. Big enough to read across a desk. */
  timer: { fontFamily: monoFamily, fontSize: 64, lineHeight: 70, fontWeight: '700' },
} as const;

// ---------------------------------------------------------------
// Layout
// ---------------------------------------------------------------

/** 4pt base. Use these names, never raw numbers, so rhythm stays consistent. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
} as const;

export const radius = {
  chip: 6,
  control: 10,
  card: 14,
  sheet: 22,
  pill: 999,
} as const;

/** The signature element. Blocks, not a gradient. */
export const xpBar = {
  segments: 20,
  height: 10,
  gap: 3,
  radius: 2,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const duration = {
  /** Anything the finger is still touching. */
  instant: 120,
  /** State changes the eye should follow. */
  quick: 220,
  /** The XP bar filling — slow enough to be watched, not waited on. */
  reward: 520,
} as const;

// ---------------------------------------------------------------
// Ranks — derived from level, mirroring gid_rank_for_level() in SQL.
// Kept in sync by hand; the database is authoritative.
// ---------------------------------------------------------------

export const RANKS = [
  { min: 1, name: 'Rookie' },
  { min: 5, name: 'Grinder' },
  { min: 10, name: 'Focused' },
  { min: 20, name: 'Relentless' },
  { min: 35, name: 'Machine' },
] as const;

export function rankForLevel(level: number): string {
  let name = RANKS[0].name as string;
  for (const r of RANKS) if (level >= r.min) name = r.name;
  return name;
}
