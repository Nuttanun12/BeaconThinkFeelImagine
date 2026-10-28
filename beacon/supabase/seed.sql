-- ─────────────────────────────────────────────────────────────────────────────
-- seed.sql  (data-only — auth users must already exist in Supabase Dashboard)
-- Beacon MVP — Demo data
--
-- Run this AFTER:
--   1. 001_schema.sql
--   2. 002_rls.sql
--   3. Creating auth users via Supabase Dashboard → Authentication → Users
--
-- Users to create in the Dashboard (all with password: beacon123):
--   amara@beacon.demo, kwame@beacon.demo, fatima@beacon.demo,
--   peter@beacon.demo, sarah@beacon.demo
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  v_amara_id  uuid;
  v_kwame_id  uuid;
  v_fatima_id uuid;
  v_peter_id  uuid;
  v_sarah_id  uuid;

begin
  -- ── Resolve auth user IDs by email ────────────────────────────────────────
  select id into v_amara_id  from auth.users where email = 'amara@beacon.demo'  limit 1;
  select id into v_kwame_id  from auth.users where email = 'kwame@beacon.demo'  limit 1;
  select id into v_fatima_id from auth.users where email = 'fatima@beacon.demo' limit 1;
  select id into v_peter_id  from auth.users where email = 'peter@beacon.demo'  limit 1;
  select id into v_sarah_id  from auth.users where email = 'sarah@beacon.demo'  limit 1;

  if v_amara_id is null then
    raise exception 'amara@beacon.demo not found. Create her in the Supabase Auth Dashboard first.';
  end if;
  if v_kwame_id is null then
    raise exception 'kwame@beacon.demo not found. Create him in the Supabase Auth Dashboard first.';
  end if;
  if v_fatima_id is null then
    raise exception 'fatima@beacon.demo not found. Create her in the Supabase Auth Dashboard first.';
  end if;
  if v_peter_id is null then
    raise exception 'peter@beacon.demo not found. Create him in the Supabase Auth Dashboard first.';
  end if;
  if v_sarah_id is null then
    raise exception 'sarah@beacon.demo not found. Create her in the Supabase Auth Dashboard first.';
  end if;

  -- ── Wipe existing demo data (idempotent re-run) ───────────────────────────
  delete from public.meter_readings;
  delete from public.check_ins;
  delete from public.meters;
  delete from public.technician_assignments;
  delete from public.profiles;
  delete from public.villages;

  -- ── Profiles ──────────────────────────────────────────────────────────────
  insert into public.profiles (id, name, role) values
    (v_amara_id,  'Amara Diallo',    'operations_director'),
    (v_kwame_id,  'Kwame Mensah',    'technician'),
    (v_fatima_id, 'Fatima Al-Rashid','technician'),
    (v_peter_id,  'Peter Kamau',     'technician'),
    (v_sarah_id,  'Sarah Mutua',     'technician')
  on conflict (id) do update set name = excluded.name, role = excluded.role;

  -- ── Villages (10) ─────────────────────────────────────────────────────────
  insert into public.villages (id, name, region) values
    ('a1000000-0000-0000-0000-000000000001', 'Lodwar Central Microgrid',   'Turkana County'),
    ('a1000000-0000-0000-0000-000000000002', 'Lokichar Solar Hub',          'Turkana County'),
    ('a1000000-0000-0000-0000-000000000003', 'Marsabit East Water & Power', 'Marsabit County'),
    ('a1000000-0000-0000-0000-000000000004', 'Sero Village Grid',           'Samburu County'),
    ('a1000000-0000-0000-0000-000000000005', 'Wajir North Microgrid',       'Wajir County'),
    ('a1000000-0000-0000-0000-000000000006', 'Solo Sector 4 Solar Hub',     'Rift Valley'),
    ('a1000000-0000-0000-0000-000000000007', 'Moyale Border Microgrid',     'Marsabit County'),
    ('a1000000-0000-0000-0000-000000000008', 'Turkwel Solar Station',       'Turkana County'),
    ('a1000000-0000-0000-0000-000000000009', 'Kaikor Community Grid',       'Turkana County'),
    ('a1000000-0000-0000-0000-000000000010', 'El Wak Solar Access',         'Mandera County')
  on conflict (id) do nothing;

  -- ── Technician assignments ─────────────────────────────────────────────────
  insert into public.technician_assignments (technician_id, village_id) values
    (v_kwame_id,  'a1000000-0000-0000-0000-000000000001'),
    (v_kwame_id,  'a1000000-0000-0000-0000-000000000002'),
    (v_kwame_id,  'a1000000-0000-0000-0000-000000000003'),
    (v_fatima_id, 'a1000000-0000-0000-0000-000000000004'),
    (v_fatima_id, 'a1000000-0000-0000-0000-000000000005'),
    (v_fatima_id, 'a1000000-0000-0000-0000-000000000006'),
    (v_peter_id,  'a1000000-0000-0000-0000-000000000007'),
    (v_peter_id,  'a1000000-0000-0000-0000-000000000008'),
    (v_sarah_id,  'a1000000-0000-0000-0000-000000000009'),
    (v_sarah_id,  'a1000000-0000-0000-0000-000000000010')
  on conflict do nothing;

  -- ── Meters (2 per village) ─────────────────────────────────────────────────
  insert into public.meters (id, village_id, household_id) values
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', null),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'HH-LOD-001'),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', null),
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'HH-LOK-001'),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', null),
    ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'HH-MAR-001'),
    ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004', null),
    ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000004', 'HH-SER-001'),
    ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000005', null),
    ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000005', 'HH-WAJ-001'),
    ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000006', null),
    ('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000006', 'HH-SOL-001'),
    ('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000007', null),
    ('b1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000007', 'HH-MOY-001'),
    ('b1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000008', null),
    ('b1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000008', 'HH-TUR-001'),
    ('b1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000009', null),
    ('b1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000009', 'HH-KAI-001'),
    ('b1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000010', null),
    ('b1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000010', 'HH-ELW-001')
  on conflict (id) do nothing;

  -- ── Check-ins ──────────────────────────────────────────────────────────────
  -- Villages 1–8 → recent (< 24 h).  Villages 9 & 10 → STALE (> 24 h).
  insert into public.check_ins (id, technician_id, village_id, checked_in_at, location, notes) values
    (uuid_generate_v4(), v_kwame_id,  'a1000000-0000-0000-0000-000000000001',
     now() - interval '4 hours',  '3.1190, 35.5966',
     'All panels operational. Battery bank at 87%. Cleaned panel surfaces.'),

    (uuid_generate_v4(), v_kwame_id,  'a1000000-0000-0000-0000-000000000002',
     now() - interval '6 hours',  '2.9432, 35.6812',
     'Inverter showing error code E-07. Rebooted. Monitoring.'),

    (uuid_generate_v4(), v_kwame_id,  'a1000000-0000-0000-0000-000000000003',
     now() - interval '2 hours',  '2.3359, 37.9874',
     'Water pump pressure OK. Solar irradiance high today.'),

    (uuid_generate_v4(), v_fatima_id, 'a1000000-0000-0000-0000-000000000004',
     now() - interval '8 hours',  '1.5234, 37.1021',
     'Three households added to grid. Updated connection ledger.'),

    (uuid_generate_v4(), v_fatima_id, 'a1000000-0000-0000-0000-000000000005',
     now() - interval '10 hours', '1.7451, 40.0573',
     'Connectivity intermittent. Checked mesh node — antenna repositioned.'),

    (uuid_generate_v4(), v_fatima_id, 'a1000000-0000-0000-0000-000000000006',
     now() - interval '3 hours',  '0.5120, 35.2734',
     'Routine inspection. Everything nominal.'),

    (uuid_generate_v4(), v_peter_id,  'a1000000-0000-0000-0000-000000000007',
     now() - interval '12 hours', '3.5244, 39.0572',
     'Panel row C cracked. Reported to ops for replacement order.'),

    (uuid_generate_v4(), v_peter_id,  'a1000000-0000-0000-0000-000000000008',
     now() - interval '1 hour',   '2.0911, 35.3204',
     'Battery replacement completed successfully.'),

    -- STALE — no update in 24h+
    (uuid_generate_v4(), v_sarah_id,  'a1000000-0000-0000-0000-000000000009',
     now() - interval '32 hours', '3.8123, 35.9041',
     'Last visit before technician fell ill. Pending reassignment.'),

    (uuid_generate_v4(), v_sarah_id,  'a1000000-0000-0000-0000-000000000010',
     now() - interval '28 hours', '2.8001, 40.9232',
     'Generator backup started. Solar panels need realignment.');

  -- ── Meter readings ─────────────────────────────────────────────────────────
  -- Village 1 gets two readings (older + newer) to demonstrate anomaly detection.
  -- Villages 9 & 10 readings are stale.
  insert into public.meter_readings (id, meter_id, technician_id, value, unit, read_at) values
    -- Village 1 — two readings (previous reading feature demo)
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000001',
     v_kwame_id, 18420.5, 'kWh', now() - interval '7 days'),
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000001',
     v_kwame_id, 18950.0, 'kWh', now() - interval '4 hours'),

    -- Villages 2–8 (one recent reading each)
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000003',
     v_kwame_id,  9210.0, 'kWh',      now() - interval '6 hours'),
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000005',
     v_kwame_id,  4720.5, 'm3_water', now() - interval '2 hours'),
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000007',
     v_fatima_id, 6140.0, 'kWh',      now() - interval '8 hours'),
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000009',
     v_fatima_id, 3380.0, 'kWh',      now() - interval '10 hours'),
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000011',
     v_fatima_id,11020.5, 'kWh',      now() - interval '3 hours'),
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000013',
     v_peter_id,  7640.0, 'kWh',      now() - interval '12 hours'),
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000015',
     v_peter_id,  5510.0, 'kWh',      now() - interval '1 hour'),

    -- Villages 9 & 10 — STALE
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000017',
     v_sarah_id,  2980.0, 'kWh', now() - interval '33 hours'),
    (uuid_generate_v4(), 'b1000000-0000-0000-0000-000000000019',
     v_sarah_id,  1540.5, 'kWh', now() - interval '29 hours');

end $$;
