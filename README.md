# Get It Done (GID)

A gamified to-do app for Android. Create tasks, give them a time, get notified
when it arrives, and earn XP for finishing them. Levels, streaks, coins, daily
quests and achievements sit on top; an alarm clock and a Pomodoro timer sit
alongside.

Built from scratch as a recorded tutorial, so the commit history is meant to be
read in order.

## Stack

| | |
|---|---|
| App | React Native + Expo SDK 57, TypeScript, expo-router |
| Backend | Supabase — Postgres, auth, row-level security |
| State | TanStack Query, cache persisted to AsyncStorage |
| Target | Android (kept iOS-portable), tested on the Android Studio emulator |

## Running it

You need Node.js LTS, Git, and Android Studio with an emulator (or a phone with
USB debugging on).

```bash
npm install
cp .env.example .env      # then fill in the two EXPO_PUBLIC_ values
npx expo run:android      # first build takes 5-15 minutes
```

After the first build, `npx expo start` is all you need — code changes appear
instantly via Fast Refresh. Rebuild only when a native package or an Android
permission changes.

> **Use `npx expo install <pkg>`, never `npm install <pkg>`.** `expo install`
> picks the version matching the SDK; plain npm grabs the latest and breaks the
> native build. This one habit prevents most Expo dependency pain.

### Why a dev build and not Expo Go

Expo Go is a single pre-built app with a fixed set of native modules. GID needs
its own notification channels, exact alarms and custom sounds, which are
configured natively — so we compile our own app. One slow build up front, honest
errors forever after.

## Database

Schema lives in [`supabase/migrations/`](supabase/migrations/) and is applied in
filename order. Every table has row-level security enabled with an explicit
policy, because the anon key ships inside the APK and is therefore public by
design — RLS is what makes that safe.

**All XP, coins, levels, streaks, quests and achievements are awarded by
Postgres functions. The client cannot write them.** Two mechanisms enforce it:

- Column-level `GRANT`s mean the app may only update cosmetic profile fields.
  `update profiles set xp = 999999` fails at the SQL level, policy or no policy.
- Every award begins by inserting into `xp_events`, which carries
  `UNIQUE (user_id, source_type, source_id)`. A double-tapped checkbox, a
  retried request, or two devices at once cannot pay out twice — and because
  every award is a row, a corrupted profile can be rebuilt by replaying the
  ledger.

Entry points: `complete_task`, `uncomplete_task`, `complete_focus_session`,
`claim_quest`, `ensure_daily_quests`, `purchase_item`.

## Environment

`.env` is gitignored and was ignored in the very first commit, before anything
else was staged. Only `EXPO_PUBLIC_*` variables are inlined into the app bundle:

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — safe to ship,
  protected by RLS
- everything else — local tooling only, never prefixed, never bundled

## Build order

Each phase is a working, testable app rather than a layer of scaffolding.

- [x] **0** — Foundation: project, schema, RLS, dev build running
- [ ] **1** — Auth: sign up, sign in, session survives a restart
- [ ] **2** — One task end to end: create → complete → XP
- [ ] **3** — Task depth: dates, difficulty, categories, recurrence, subtasks
- [ ] **4** — Reminders: notification channels, Done/Snooze actions
- [ ] **5** — Game core: levels, ranks, streaks, coins
- [ ] **6** — Focus: Pomodoro, timestamp-based so backgrounding can't desync it
- [ ] **7** — Alarm clock
- [ ] **8** — Quests, achievements, stats, shop
- [ ] **9** — Polish, EAS build, optional native full-screen alarm

## Design

Dark-first, one accent. The reference is an arcade high-score table: amber is
the colour of score and marks XP, progress and the primary action — nothing
else. Every quantity is set in tabular monospace so digits don't jitter as they
tick and stat columns align. The XP bar is discrete blocks rather than a smooth
fill, because a gradient creeps but blocks click over, and finishing a task
should feel like a coin dropping.

Tokens: [`src/theme/tokens.ts`](src/theme/tokens.ts).
