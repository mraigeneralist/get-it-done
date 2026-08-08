-- =============================================================
-- 0003_functions — every path that awards XP, coins or progress
--
-- These are SECURITY DEFINER, so they run as the table owner and
-- bypass RLS. That is the point: they are the *only* way game state
-- changes. Each one therefore re-checks auth.uid() itself, and each
-- one starts by claiming an xp_events row, so a repeated call is a
-- no-op rather than a second payout.
-- =============================================================

-- ---------- achievements ----------
-- Recomputes progress for every achievement and pays out any that are
-- newly unlocked. Safe to call as often as you like: the ledger's
-- unique constraint is what makes "pay out once" true, not a flag we
-- have to remember to set.
create or replace function public.gid_sync_achievements(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stats       record;
  v_rec         record;
  v_value       integer;
  v_rows        integer;
  v_unlocked    jsonb := '[]'::jsonb;
  v_bonus_xp    integer := 0;
  v_bonus_coins integer := 0;
begin
  select
    (select count(*) from public.tasks
      where user_id = p_user_id and status = 'completed')                    as tasks_completed,
    (select count(*) from public.focus_sessions
      where user_id = p_user_id and completed and kind = 'focus')            as sessions_completed,
    (select coalesce(sum(actual_minutes), 0) from public.focus_sessions
      where user_id = p_user_id and completed and kind = 'focus')            as focus_minutes,
    p.current_streak                                                          as streak_days,
    p.level                                                                   as level_reached
  into v_stats
  from public.profiles p
  where p.id = p_user_id;

  for v_rec in select * from public.achievements loop
    v_value := case v_rec.condition_type
      when 'tasks_completed'    then v_stats.tasks_completed
      when 'sessions_completed' then v_stats.sessions_completed
      when 'focus_minutes'      then v_stats.focus_minutes
      when 'streak_days'        then v_stats.streak_days
      when 'level_reached'      then v_stats.level_reached
    end;

    insert into public.user_achievements (user_id, achievement_key, progress, unlocked_at)
    values (
      p_user_id, v_rec.key, v_value,
      case when v_value >= v_rec.threshold then now() end
    )
    on conflict (user_id, achievement_key) do update
      set progress    = excluded.progress,
          -- never re-stamp an already-earned unlock
          unlocked_at = coalesce(user_achievements.unlocked_at, excluded.unlocked_at);
  end loop;

  -- Pay out anything unlocked but not yet in the ledger.
  for v_rec in
    select a.*
      from public.achievements a
      join public.user_achievements ua
        on ua.achievement_key = a.key and ua.user_id = p_user_id
     where ua.unlocked_at is not null
  loop
    insert into public.xp_events (user_id, source_type, source_id, xp, coins)
    values (p_user_id, 'achievement', v_rec.key, v_rec.xp_reward, v_rec.coin_reward)
    on conflict do nothing;
    get diagnostics v_rows = row_count;

    if v_rows > 0 then
      v_bonus_xp    := v_bonus_xp + v_rec.xp_reward;
      v_bonus_coins := v_bonus_coins + v_rec.coin_reward;
      v_unlocked := v_unlocked || jsonb_build_object(
        'key', v_rec.key, 'name', v_rec.name,
        'description', v_rec.description, 'icon', v_rec.icon,
        'tier', v_rec.tier, 'xp', v_rec.xp_reward, 'coins', v_rec.coin_reward
      );
    end if;
  end loop;

  if v_bonus_xp > 0 or v_bonus_coins > 0 then
    update public.profiles
       set xp    = xp + v_bonus_xp,
           coins = coins + v_bonus_coins,
           level = public.gid_level_for_xp(xp + v_bonus_xp)
     where id = p_user_id;
  end if;

  return jsonb_build_object(
    'unlocked', v_unlocked,
    'bonus_xp', v_bonus_xp,
    'bonus_coins', v_bonus_coins
  );
end;
$$;

-- ---------- shared profile snapshot ----------
create or replace function public.gid_profile_snapshot(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'xp', p.xp,
    'coins', p.coins,
    'level', p.level,
    'rank', public.gid_rank_for_level(p.level),
    'xp_into_level', p.xp - public.gid_xp_for_level(p.level),
    'xp_for_next_level',
      public.gid_xp_for_level(p.level + 1) - public.gid_xp_for_level(p.level),
    'streak', p.current_streak,
    'longest_streak', p.longest_streak,
    'streak_freezes', p.streak_freezes
  )
  from public.profiles p
  where p.id = p_user_id;
$$;

-- ---------- complete_task ----------
create or replace function public.complete_task(p_task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_task      public.tasks%rowtype;
  v_profile   public.profiles%rowtype;
  v_xp        integer;
  v_coins     integer;
  v_rows      integer;
  v_today     date;
  v_streak    integer;
  v_freezes   integer;
  v_old_level integer;
  v_next_due  timestamptz;
  v_shift     interval;
  v_quests    jsonb := '[]'::jsonb;
  v_ach       jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- FOR UPDATE serialises two simultaneous taps on the same task.
  select * into v_task
    from public.tasks
   where id = p_task_id and user_id = v_user
     for update;
  if not found then
    raise exception 'task % not found', p_task_id using errcode = 'P0002';
  end if;

  select * into v_profile from public.profiles where id = v_user for update;
  if not found then
    raise exception 'profile for % is missing', v_user using errcode = 'P0002';
  end if;

  -- "Today" means today where the user lives, not in UTC. Otherwise a
  -- task finished at 1am IST would count towards yesterday's streak.
  v_today := (now() at time zone v_profile.timezone)::date;

  v_xp := case v_task.difficulty
            when 'easy'   then 10
            when 'medium' then 25
            when 'hard'   then 50
          end;
  v_coins := greatest(1, v_xp / 10);

  -- Claim the payout. A second call finds the row already there,
  -- inserts nothing, and returns without awarding anything.
  insert into public.xp_events (user_id, source_type, source_id, xp, coins)
  values (v_user, 'task', p_task_id::text, v_xp, v_coins)
  on conflict do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return public.gid_profile_snapshot(v_user) || jsonb_build_object(
      'already_completed', true,
      'xp_gained', 0,
      'coins_gained', 0,
      'leveled_up', false,
      'quests_completed', '[]'::jsonb,
      'achievements_unlocked', '[]'::jsonb
    );
  end if;

  update public.tasks
     set status = 'completed', completed_at = now()
   where id = p_task_id;

  -- ---- streak ----
  v_freezes := v_profile.streak_freezes;
  if v_profile.last_completed_date is null then
    v_streak := 1;
  elsif v_profile.last_completed_date = v_today then
    v_streak := greatest(v_profile.current_streak, 1);      -- already counted today
  elsif v_profile.last_completed_date = v_today - 1 then
    v_streak := v_profile.current_streak + 1;               -- consecutive day
  elsif v_profile.last_completed_date = v_today - 2 and v_freezes > 0 then
    v_streak  := v_profile.current_streak + 1;              -- one gap, bridged
    v_freezes := v_freezes - 1;                             -- freeze spends itself
  else
    v_streak := 1;                                          -- streak broken
  end if;

  v_old_level := v_profile.level;

  update public.profiles
     set xp                  = xp + v_xp,
         coins               = coins + v_coins,
         level               = public.gid_level_for_xp(xp + v_xp),
         current_streak      = v_streak,
         longest_streak      = greatest(longest_streak, v_streak),
         last_completed_date = v_today,
         streak_freezes      = v_freezes
   where id = v_user;

  -- ---- daily quests ----
  update public.daily_quests q
     set progress  = least(q.progress + 1, q.target),
         completed = (q.progress + 1 >= q.target)
   where q.user_id = v_user
     and q.quest_date = v_today
     and not q.completed
     and (
       q.quest_key = 'complete_tasks'
       or (q.quest_key = 'complete_hard_task' and v_task.difficulty = 'hard')
     );

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'key', quest_key,
           'xp', xp_reward, 'coins', coin_reward)), '[]'::jsonb)
    into v_quests
    from public.daily_quests
   where user_id = v_user and quest_date = v_today
     and completed and not claimed;

  -- ---- recurrence ----
  if v_task.recurrence <> 'none' and v_task.due_at is not null then
    v_next_due := case v_task.recurrence
      when 'daily'   then v_task.due_at + interval '1 day'
      when 'weekly'  then v_task.due_at + interval '1 week'
      when 'monthly' then v_task.due_at + interval '1 month'
      when 'weekdays' then
        case extract(isodow from v_task.due_at at time zone v_profile.timezone)
          when 5 then v_task.due_at + interval '3 days'   -- Fri -> Mon
          when 6 then v_task.due_at + interval '2 days'   -- Sat -> Mon
          else        v_task.due_at + interval '1 day'
        end
    end;

    -- Move the reminder by the same amount so its offset is preserved.
    v_shift := v_next_due - v_task.due_at;

    insert into public.tasks (
      user_id, title, notes, category_id, due_at, reminder_at,
      difficulty, recurrence, sort_order
    ) values (
      v_user, v_task.title, v_task.notes, v_task.category_id, v_next_due,
      case when v_task.reminder_at is null then null
           else v_task.reminder_at + v_shift end,
      v_task.difficulty, v_task.recurrence, v_task.sort_order
    );
  end if;

  v_ach := public.gid_sync_achievements(v_user);

  return public.gid_profile_snapshot(v_user) || jsonb_build_object(
    'already_completed', false,
    'xp_gained',    v_xp    + (v_ach ->> 'bonus_xp')::integer,
    'coins_gained', v_coins + (v_ach ->> 'bonus_coins')::integer,
    'leveled_up',   (public.gid_profile_snapshot(v_user) ->> 'level')::integer > v_old_level,
    'quests_completed', v_quests,
    'achievements_unlocked', v_ach -> 'unlocked'
  );
end;
$$;

-- ---------- uncomplete_task ----------
-- Undo. Deletes the ledger row so the task can legitimately be
-- completed (and paid out) again, and subtracts exactly what was
-- awarded — never a hardcoded guess at what it "should" have been.
create or replace function public.uncomplete_task(p_task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_event public.xp_events%rowtype;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  delete from public.xp_events
   where user_id = v_user and source_type = 'task' and source_id = p_task_id::text
  returning * into v_event;

  update public.tasks
     set status = 'pending', completed_at = null
   where id = p_task_id and user_id = v_user;

  if found and v_event.id is not null then
    update public.profiles
       set xp    = greatest(0, xp - v_event.xp),
           coins = greatest(0, coins - v_event.coins),
           level = public.gid_level_for_xp(greatest(0, xp - v_event.xp))
     where id = v_user;
  end if;

  return public.gid_profile_snapshot(v_user);
end;
$$;

-- ---------- complete_focus_session ----------
create or replace function public.complete_focus_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_session public.focus_sessions%rowtype;
  v_profile public.profiles%rowtype;
  v_minutes integer;
  v_xp      integer;
  v_coins   integer;
  v_rows    integer;
  v_today   date;
  v_ach     jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_session
    from public.focus_sessions
   where id = p_session_id and user_id = v_user
     for update;
  if not found then
    raise exception 'session % not found', p_session_id using errcode = 'P0002';
  end if;

  select * into v_profile from public.profiles where id = v_user for update;
  v_today := (now() at time zone v_profile.timezone)::date;

  -- Credit the time actually spent, capped at what was planned, so a
  -- clock change or a stale client can't mint XP.
  v_minutes := least(
    v_session.planned_minutes,
    greatest(0, ceil(extract(epoch from (least(now(), v_session.ends_at) - v_session.started_at)) / 60)::integer)
  );

  -- Breaks are part of the technique but they aren't work: no XP.
  v_xp    := case when v_session.kind = 'focus' then v_minutes else 0 end;
  v_coins := case when v_session.kind = 'focus' then greatest(1, v_minutes / 10) else 0 end;

  update public.focus_sessions
     set completed = true, actual_minutes = v_minutes
   where id = p_session_id;

  if v_xp = 0 then
    return public.gid_profile_snapshot(v_user) || jsonb_build_object(
      'xp_gained', 0, 'coins_gained', 0, 'minutes', v_minutes,
      'achievements_unlocked', '[]'::jsonb
    );
  end if;

  insert into public.xp_events (user_id, source_type, source_id, xp, coins)
  values (v_user, 'focus_session', p_session_id::text, v_xp, v_coins)
  on conflict do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return public.gid_profile_snapshot(v_user) || jsonb_build_object(
      'already_completed', true, 'xp_gained', 0, 'coins_gained', 0,
      'minutes', v_minutes, 'achievements_unlocked', '[]'::jsonb
    );
  end if;

  update public.profiles
     set xp    = xp + v_xp,
         coins = coins + v_coins,
         level = public.gid_level_for_xp(xp + v_xp)
   where id = v_user;

  update public.daily_quests q
     set progress  = least(q.progress + 1, q.target),
         completed = (q.progress + 1 >= q.target)
   where q.user_id = v_user and q.quest_date = v_today
     and not q.completed and q.quest_key = 'complete_focus_sessions';

  v_ach := public.gid_sync_achievements(v_user);

  return public.gid_profile_snapshot(v_user) || jsonb_build_object(
    'already_completed', false,
    'xp_gained',    v_xp    + (v_ach ->> 'bonus_xp')::integer,
    'coins_gained', v_coins + (v_ach ->> 'bonus_coins')::integer,
    'minutes', v_minutes,
    'achievements_unlocked', v_ach -> 'unlocked'
  );
end;
$$;

-- ---------- claim_quest ----------
create or replace function public.claim_quest(p_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_quest public.daily_quests%rowtype;
  v_rows  integer;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_quest
    from public.daily_quests
   where id = p_quest_id and user_id = v_user
     for update;
  if not found then
    raise exception 'quest % not found', p_quest_id using errcode = 'P0002';
  end if;

  if not v_quest.completed then
    raise exception 'quest not completed yet' using errcode = 'P0001';
  end if;

  insert into public.xp_events (user_id, source_type, source_id, xp, coins)
  values (v_user, 'quest', p_quest_id::text, v_quest.xp_reward, v_quest.coin_reward)
  on conflict do nothing;
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return public.gid_profile_snapshot(v_user)
        || jsonb_build_object('already_claimed', true, 'xp_gained', 0, 'coins_gained', 0);
  end if;

  update public.daily_quests set claimed = true where id = p_quest_id;

  update public.profiles
     set xp    = xp + v_quest.xp_reward,
         coins = coins + v_quest.coin_reward,
         level = public.gid_level_for_xp(xp + v_quest.xp_reward)
   where id = v_user;

  return public.gid_profile_snapshot(v_user) || jsonb_build_object(
    'already_claimed', false,
    'xp_gained', v_quest.xp_reward,
    'coins_gained', v_quest.coin_reward
  );
end;
$$;

-- ---------- ensure_daily_quests ----------
-- Called on first open of the day. The unique constraint means two
-- devices racing to generate today's quests produce one set, not two.
create or replace function public.ensure_daily_quests()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_today date;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select (now() at time zone timezone)::date into v_today
    from public.profiles where id = v_user;

  insert into public.daily_quests
    (user_id, quest_date, quest_key, target, xp_reward, coin_reward)
  values
    (v_user, v_today, 'complete_tasks',          3, 50, 5),
    (v_user, v_today, 'complete_focus_sessions', 2, 40, 4),
    (v_user, v_today, 'complete_hard_task',      1, 30, 3)
  on conflict (user_id, quest_date, quest_key) do nothing;

  return (
    select coalesce(jsonb_agg(to_jsonb(q) order by q.quest_key), '[]'::jsonb)
      from public.daily_quests q
     where q.user_id = v_user and q.quest_date = v_today
  );
end;
$$;

-- ---------- purchase_item ----------
create or replace function public.purchase_item(p_item_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_item    public.shop_items%rowtype;
  v_profile public.profiles%rowtype;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_item from public.shop_items where key = p_item_key;
  if not found then
    raise exception 'item % not found', p_item_key using errcode = 'P0002';
  end if;

  select * into v_profile from public.profiles where id = v_user for update;

  if v_profile.coins < v_item.cost then
    raise exception 'not enough coins' using errcode = 'P0001';
  end if;

  if v_item.type = 'consumable' then
    -- Consumables are repeatable, so they never enter the inventory;
    -- they take effect immediately instead.
    if v_item.payload ? 'streak_freezes' then
      update public.profiles
         set streak_freezes = streak_freezes + (v_item.payload ->> 'streak_freezes')::integer
       where id = v_user;
    end if;
  else
    if exists (select 1 from public.user_inventory
                where user_id = v_user and item_key = p_item_key) then
      raise exception 'already owned' using errcode = 'P0001';
    end if;
    insert into public.user_inventory (user_id, item_key) values (v_user, p_item_key);
  end if;

  update public.profiles set coins = coins - v_item.cost where id = v_user;

  return public.gid_profile_snapshot(v_user)
      || jsonb_build_object('purchased', p_item_key, 'cost', v_item.cost);
end;
$$;

-- ---------- execution grants ----------
-- Helpers stay internal; only the four entry points are callable.
revoke all on function public.gid_sync_achievements(uuid) from public, anon, authenticated;
revoke all on function public.gid_profile_snapshot(uuid)  from public, anon, authenticated;

grant execute on function public.complete_task(uuid)            to authenticated;
grant execute on function public.uncomplete_task(uuid)          to authenticated;
grant execute on function public.complete_focus_session(uuid)   to authenticated;
grant execute on function public.claim_quest(uuid)              to authenticated;
grant execute on function public.ensure_daily_quests()          to authenticated;
grant execute on function public.purchase_item(text)            to authenticated;
