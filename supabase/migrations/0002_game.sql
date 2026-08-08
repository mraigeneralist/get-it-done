-- =============================================================
-- 0002_game — the ledger, focus sessions, alarms, and the
--             progression tables (quests, achievements, shop)
--
-- Note the grant pattern throughout: the app gets SELECT on
-- anything it needs to display, but INSERT/UPDATE only on tables
-- it legitimately owns (alarms, focus sessions). Everything that
-- represents *earned* progress is written exclusively by the
-- functions in 0003.
-- =============================================================

-- ---------- xp_events: the ledger ----------
create type public.xp_source as enum
  ('task', 'focus_session', 'quest', 'achievement', 'purchase');

create table public.xp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid            not null references auth.users (id) on delete cascade,
  source_type public.xp_source not null,
  -- text, not uuid: task and session sources are uuids, but quest and
  -- achievement sources are stable string keys.
  source_id   text            not null,
  xp          integer         not null default 0,
  coins       integer         not null default 0,
  created_at  timestamptz     not null default now(),

  -- THE most important line in this schema. Awarding XP begins by
  -- inserting here; the conflict makes a second award for the same
  -- source a no-op. A double-tapped checkbox, a retried request over
  -- a flaky connection, two devices at once — none can pay out twice.
  -- And because every award is a row, a corrupted profile can always
  -- be rebuilt by replaying this table.
  constraint xp_events_once_per_source unique (user_id, source_type, source_id)
);

alter table public.xp_events enable row level security;

create policy xp_events_select_own on public.xp_events
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.xp_events from anon, authenticated;
grant select on public.xp_events to authenticated;

create index xp_events_user_created_idx on public.xp_events (user_id, created_at desc);

-- ---------- focus sessions ----------
create type public.focus_kind as enum ('focus', 'short_break', 'long_break');

create table public.focus_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid              not null references auth.users (id) on delete cascade,
  task_id         uuid references public.tasks (id) on delete set null,
  kind            public.focus_kind not null default 'focus',
  planned_minutes integer           not null check (planned_minutes between 1 and 180),
  actual_minutes  integer check (actual_minutes >= 0),
  started_at      timestamptz       not null default now(),
  -- Stored, not derived: the timer must survive the app being
  -- backgrounded or killed, so the end time is an absolute instant
  -- rather than a countdown someone has to keep ticking.
  ends_at         timestamptz       not null,
  completed       boolean           not null default false,
  created_at      timestamptz       not null default now()
);

alter table public.focus_sessions enable row level security;

create policy focus_sessions_all_own on public.focus_sessions
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index focus_sessions_user_started_idx
  on public.focus_sessions (user_id, started_at desc);

-- ---------- alarms ----------
create table public.alarms (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  label          text        not null default 'Alarm' check (length(label) <= 60),
  time_of_day    time        not null,
  -- ISO weekday numbers, 1 = Monday .. 7 = Sunday. Empty = fire once.
  repeat_days    smallint[]  not null default '{}',
  enabled        boolean     not null default true,
  sound_key      text        not null default 'classic',
  snooze_minutes integer     not null default 10 check (snooze_minutes between 1 and 60),
  created_at     timestamptz not null default now(),

  constraint repeat_days_valid check (
    repeat_days <@ array[1,2,3,4,5,6,7]::smallint[]
  )
);

alter table public.alarms enable row level security;

create policy alarms_all_own on public.alarms
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index alarms_user_idx on public.alarms (user_id) where enabled;

-- ---------- achievements (static catalog) ----------
create type public.achievement_condition as enum
  ('tasks_completed', 'streak_days', 'focus_minutes', 'level_reached', 'sessions_completed');

create table public.achievements (
  key            text primary key,
  name           text    not null,
  description    text    not null,
  icon           text    not null default 'trophy',
  tier           integer not null default 1 check (tier between 1 and 4),
  condition_type public.achievement_condition not null,
  threshold      integer not null check (threshold > 0),
  xp_reward      integer not null default 0,
  coin_reward    integer not null default 0,
  sort_order     integer not null default 0
);

alter table public.achievements enable row level security;

-- Shared catalog: every signed-in user reads the same rows, and nobody
-- writes them from the app.
create policy achievements_select_all on public.achievements
  for select to authenticated using (true);

revoke all on public.achievements from anon, authenticated;
grant select on public.achievements to authenticated;

-- ---------- user_achievements ----------
create table public.user_achievements (
  user_id          uuid not null references auth.users (id) on delete cascade,
  achievement_key  text not null references public.achievements (key) on delete cascade,
  progress         integer not null default 0 check (progress >= 0),
  unlocked_at      timestamptz,
  primary key (user_id, achievement_key)
);

alter table public.user_achievements enable row level security;

create policy user_achievements_select_own on public.user_achievements
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.user_achievements from anon, authenticated;
grant select on public.user_achievements to authenticated;

-- ---------- daily quests ----------
create table public.daily_quests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  quest_date  date        not null,
  quest_key   text        not null,
  target      integer     not null check (target > 0),
  progress    integer     not null default 0 check (progress >= 0),
  completed   boolean     not null default false,
  claimed     boolean     not null default false,
  xp_reward   integer     not null default 0,
  coin_reward integer     not null default 0,
  created_at  timestamptz not null default now(),

  -- Guarantees one row per quest per day even if two devices open the
  -- app simultaneously and both try to generate today's quests.
  constraint daily_quests_one_per_day unique (user_id, quest_date, quest_key)
);

alter table public.daily_quests enable row level security;

create policy daily_quests_select_own on public.daily_quests
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.daily_quests from anon, authenticated;
grant select on public.daily_quests to authenticated;

create index daily_quests_user_date_idx on public.daily_quests (user_id, quest_date);

-- ---------- shop ----------
create type public.shop_item_type as enum ('theme', 'app_icon', 'avatar', 'consumable');

create table public.shop_items (
  key         text primary key,
  name        text    not null,
  description text    not null default '',
  type        public.shop_item_type not null,
  cost        integer not null check (cost >= 0),
  payload     jsonb   not null default '{}'::jsonb,
  sort_order  integer not null default 0
);

alter table public.shop_items enable row level security;

create policy shop_items_select_all on public.shop_items
  for select to authenticated using (true);

revoke all on public.shop_items from anon, authenticated;
grant select on public.shop_items to authenticated;

create table public.user_inventory (
  user_id     uuid not null references auth.users (id) on delete cascade,
  item_key    text not null references public.shop_items (key) on delete cascade,
  acquired_at timestamptz not null default now(),
  equipped    boolean not null default false,
  primary key (user_id, item_key)
);

alter table public.user_inventory enable row level security;

create policy user_inventory_select_own on public.user_inventory
  for select to authenticated using (auth.uid() = user_id);

revoke all on public.user_inventory from anon, authenticated;
grant select on public.user_inventory to authenticated;
-- Equipping something you already own is a cosmetic change, so the app
-- may do it directly rather than through a function.
grant update (equipped) on public.user_inventory to authenticated;

create policy user_inventory_update_own on public.user_inventory
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
