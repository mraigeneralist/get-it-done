-- =============================================================
-- 0004_catalog — the achievement and shop catalogues
--
-- These are content, not user data, so they live in migrations and
-- ship with the schema. ON CONFLICT DO UPDATE means tuning a reward
-- later is just an edit plus a re-run.
-- =============================================================

insert into public.achievements
  (key, name, description, icon, tier, condition_type, threshold, xp_reward, coin_reward, sort_order)
values
  -- getting started
  ('first_blood',   'First Blood',      'Complete your first task',            'check',   1, 'tasks_completed',     1,   25,  5,  10),
  ('ten_down',      'Ten Down',         'Complete 10 tasks',                   'list',    1, 'tasks_completed',    10,   50, 10,  20),
  ('half_century',  'Half Century',     'Complete 50 tasks',                   'medal',   2, 'tasks_completed',    50,  150, 25,  30),
  ('centurion',     'Centurion',        'Complete 100 tasks',                  'trophy',  3, 'tasks_completed',   100,  300, 50,  40),
  ('five_hundred',  'Unstoppable',      'Complete 500 tasks',                  'crown',   4, 'tasks_completed',   500, 1000, 200, 50),

  -- streaks
  ('streak_3',      'Warming Up',       'Keep a 3-day streak',                 'flame',   1, 'streak_days',         3,   40,  5,  60),
  ('streak_7',      'Full Week',        'Keep a 7-day streak',                 'flame',   2, 'streak_days',         7,  100, 20,  70),
  ('streak_30',     'Iron Habit',       'Keep a 30-day streak',                'flame',   3, 'streak_days',        30,  400, 80,  80),
  ('streak_100',    'Force of Nature',  'Keep a 100-day streak',               'flame',   4, 'streak_days',       100, 1500, 300, 90),

  -- focus
  ('first_focus',   'In the Zone',      'Finish your first focus session',     'timer',   1, 'sessions_completed',  1,   25,  5, 100),
  ('focus_25',      'Deep Worker',      'Finish 25 focus sessions',            'timer',   2, 'sessions_completed', 25,  150, 30, 110),
  ('focus_600',     'Ten Hours Deep',   'Spend 600 minutes in focus',          'brain',   3, 'focus_minutes',     600,  300, 60, 120),
  ('focus_3000',    'Monk Mode',        'Spend 3000 minutes in focus',         'brain',   4, 'focus_minutes',    3000, 1000, 200, 130),

  -- levels
  ('level_5',       'Getting Serious',  'Reach level 5',                       'star',    1, 'level_reached',       5,   50, 10, 140),
  ('level_10',      'Seasoned',         'Reach level 10',                      'star',    2, 'level_reached',      10,  150, 30, 150),
  ('level_20',      'Relentless',       'Reach level 20',                      'star',    3, 'level_reached',      20,  400, 80, 160),
  ('level_35',      'Machine',          'Reach level 35',                      'star',    4, 'level_reached',      35, 1200, 250, 170)
on conflict (key) do update set
  name           = excluded.name,
  description    = excluded.description,
  icon           = excluded.icon,
  tier           = excluded.tier,
  condition_type = excluded.condition_type,
  threshold      = excluded.threshold,
  xp_reward      = excluded.xp_reward,
  coin_reward    = excluded.coin_reward,
  sort_order     = excluded.sort_order;


insert into public.shop_items (key, name, description, type, cost, payload, sort_order)
values
  -- consumables: repeatable, take effect immediately, never stored in inventory
  ('freeze_1',  'Streak Freeze',  'Protects your streak for one missed day', 'consumable', 60,
     '{"streak_freezes": 1}'::jsonb, 10),
  ('freeze_3',  'Freeze Bundle',  'Three streak freezes, slightly cheaper',  'consumable', 150,
     '{"streak_freezes": 3}'::jsonb, 20),

  -- themes: swap the single accent colour the whole UI is built around
  ('theme_midnight', 'Midnight',  'The default. Violet on near-black.',      'theme', 0,
     '{"accent": "#7C5CFF"}'::jsonb, 30),
  ('theme_ember',    'Ember',     'Warm orange on charcoal',                 'theme', 200,
     '{"accent": "#FF6B35"}'::jsonb, 40),
  ('theme_mint',     'Mint',      'Cool green on slate',                     'theme', 200,
     '{"accent": "#3DDC97"}'::jsonb, 50),
  ('theme_crimson',  'Crimson',   'Deep red on black',                       'theme', 350,
     '{"accent": "#FF4757"}'::jsonb, 60),
  ('theme_gold',     'Gold',      'For people who finish things',            'theme', 800,
     '{"accent": "#FFC93C"}'::jsonb, 70),

  -- avatars
  ('avatar_rookie',  'Rookie',    'Everyone starts here',                    'avatar', 0,
     '{"sprite": "rookie"}'::jsonb, 80),
  ('avatar_ninja',   'Ninja',     'Silent, efficient',                       'avatar', 250,
     '{"sprite": "ninja"}'::jsonb, 90),
  ('avatar_robot',   'Automaton', 'Never tires, never forgets',              'avatar', 400,
     '{"sprite": "robot"}'::jsonb, 100),
  ('avatar_dragon',  'Dragon',    'Hoards completed tasks',                  'avatar', 900,
     '{"sprite": "dragon"}'::jsonb, 110)
on conflict (key) do update set
  name        = excluded.name,
  description = excluded.description,
  type        = excluded.type,
  cost        = excluded.cost,
  payload     = excluded.payload,
  sort_order  = excluded.sort_order;
