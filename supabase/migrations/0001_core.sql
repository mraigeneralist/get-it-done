-- =============================================================
-- 0001_core — profiles, categories, tasks
--
-- Two ideas drive everything in this file:
--   1. Row-level security is enabled on every table at creation.
--      Without it, any signed-in user could read and delete any
--      other user's tasks, because the anon key ships inside the
--      app bundle and is therefore public by design.
--   2. The client is never granted write access to game state.
--      RLS decides which ROWS you may touch; column-level GRANTs
--      decide which COLUMNS. We use both, so even a policy mistake
--      cannot let the app write its own XP.
-- =============================================================

-- ---------- level curve ----------
-- Cumulative XP required to have reached a given level:
--     total_xp(L) = 100 * (L - 1) * L
-- so level 1 starts at 0 XP, level 2 at 200, level 3 at 600.
-- 200 XP is about eight medium tasks: quick enough to feel good on
-- day one, steep enough that level 20 still means something.
create or replace function public.gid_xp_for_level(p_level integer)
returns integer
language sql
immutable
as $$
  select (100 * (greatest(p_level, 1) - 1) * greatest(p_level, 1))::integer;
$$;

-- Inverse of the above: solve 100*(L-1)*L <= xp for the largest L.
--     L = floor((1 + sqrt(1 + 0.04 * xp)) / 2)
create or replace function public.gid_level_for_xp(p_xp integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor((1 + sqrt(1 + 0.04 * greatest(p_xp, 0))) / 2)::integer);
$$;

-- Rank names are derived from level, never stored.
create or replace function public.gid_rank_for_level(p_level integer)
returns text
language sql
immutable
as $$
  select case
    when p_level >= 35 then 'Machine'
    when p_level >= 20 then 'Relentless'
    when p_level >= 10 then 'Focused'
    when p_level >= 5  then 'Grinder'
    else 'Rookie'
  end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  display_name        text        not null default 'Player',
  avatar_key          text        not null default 'default',
  xp                  integer     not null default 0 check (xp >= 0),
  level               integer     not null default 1 check (level >= 1),
  coins               integer     not null default 0 check (coins >= 0),
  current_streak      integer     not null default 0 check (current_streak >= 0),
  longest_streak      integer     not null default 0 check (longest_streak >= 0),
  last_completed_date date,
  streak_freezes      integer     not null default 1 check (streak_freezes >= 0),
  equipped_theme      text        not null default 'midnight',
  -- A streak means "did you finish something today" in YOUR day, not UTC's.
  -- Without this, a task completed at 1am IST would count as yesterday.
  timezone            text        not null default 'Asia/Kolkata',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Defence in depth. The policy above would happily allow `update profiles
-- set xp = 999999`. These grants make that impossible at the SQL level:
-- the app may only ever write cosmetic columns. XP, coins, levels and
-- streaks are writable solely by the SECURITY DEFINER functions in 0003.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_key, equipped_theme, timezone)
  on public.profiles to authenticated;

-- ---------- profile bootstrap ----------
-- Creating the profile row from the app would mean an unauthenticated
-- window where a user exists with no profile. A trigger closes that gap.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(coalesce(new.email, 'player@local'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- categories ----------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  name       text        not null check (length(trim(name)) between 1 and 40),
  color      text        not null default '#7C5CFF',
  icon       text        not null default 'tag',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.categories enable row level security;

create policy categories_all_own on public.categories
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index categories_user_idx on public.categories (user_id);

-- ---------- tasks ----------
create type public.task_difficulty as enum ('easy', 'medium', 'hard');
create type public.task_status     as enum ('pending', 'completed', 'archived');
create type public.task_recurrence as enum ('none', 'daily', 'weekdays', 'weekly', 'monthly');

create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid                    not null references auth.users (id) on delete cascade,
  title          text                    not null check (length(trim(title)) between 1 and 200),
  notes          text,
  category_id    uuid references public.categories (id) on delete set null,
  parent_task_id uuid references public.tasks (id) on delete cascade,
  due_at         timestamptz,
  reminder_at    timestamptz,
  difficulty     public.task_difficulty  not null default 'medium',
  status         public.task_status      not null default 'pending',
  recurrence     public.task_recurrence  not null default 'none',
  completed_at   timestamptz,
  sort_order     integer                 not null default 0,
  created_at     timestamptz             not null default now(),
  updated_at     timestamptz             not null default now(),

  -- A reminder with no time to fire at is a silent bug; catch it here.
  constraint reminder_needs_due check (reminder_at is null or due_at is not null),
  constraint completed_has_timestamp check (
    (status = 'completed') = (completed_at is not null)
  )
);

alter table public.tasks enable row level security;

create policy tasks_all_own on public.tasks
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The Today screen's main query: pending tasks for one user, by due date.
create index tasks_user_status_due_idx on public.tasks (user_id, status, due_at);
-- Drives the notification reconciliation pass in Phase 4.
create index tasks_user_reminder_idx on public.tasks (user_id, reminder_at)
  where status = 'pending' and reminder_at is not null;
create index tasks_parent_idx on public.tasks (parent_task_id)
  where parent_task_id is not null;

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
