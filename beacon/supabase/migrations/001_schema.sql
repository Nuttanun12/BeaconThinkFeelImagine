-- ─────────────────────────────────────────────────────────────────────────────
-- 001_schema.sql
-- Beacon MVP — core schema + village_status view
-- Run this first in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with a role and display name.
create table if not exists public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  name  text not null,
  role  text not null check (role in ('operations_director', 'technician', 'household'))
);
comment on table public.profiles is 'Application user profiles linked to auth.users';

-- ── villages ──────────────────────────────────────────────────────────────────
create table if not exists public.villages (
  id      uuid primary key default uuid_generate_v4(),
  name    text not null,
  region  text not null
);
comment on table public.villages is 'Solar microgrid villages being managed';

-- ── technician_assignments ────────────────────────────────────────────────────
-- Which technician is responsible for which village.
create table if not exists public.technician_assignments (
  technician_id  uuid not null references public.profiles(id) on delete cascade,
  village_id     uuid not null references public.villages(id) on delete cascade,
  primary key (technician_id, village_id)
);
comment on table public.technician_assignments is 'Maps technicians to the villages they are assigned to';

-- ── meters ────────────────────────────────────────────────────────────────────
create table if not exists public.meters (
  id            uuid primary key default uuid_generate_v4(),
  village_id    uuid not null references public.villages(id) on delete cascade,
  household_id  text  -- external reference, nullable for shared/grid meters
);
comment on table public.meters is 'Electricity/water meters installed in a village';

-- ── check_ins ─────────────────────────────────────────────────────────────────
create table if not exists public.check_ins (
  id             uuid primary key default uuid_generate_v4(),
  technician_id  uuid not null references public.profiles(id) on delete cascade,
  village_id     uuid not null references public.villages(id) on delete cascade,
  checked_in_at  timestamptz not null default now(),
  location       text,       -- "lat, lon" string (validated client-side)
  notes          text,
  created_at     timestamptz not null default now()
);
comment on table public.check_ins is 'Technician field check-ins per village visit';

create index if not exists check_ins_village_id_idx on public.check_ins(village_id);
create index if not exists check_ins_checked_in_at_idx on public.check_ins(checked_in_at desc);

-- ── meter_readings ────────────────────────────────────────────────────────────
do $$ begin
  create type public.meter_unit as enum ('kWh', 'm3_water', 'liters', 'v_amp');
exception when duplicate_object then null;
end $$;

create table if not exists public.meter_readings (
  id             uuid primary key default uuid_generate_v4(),
  meter_id       uuid not null references public.meters(id) on delete cascade,
  technician_id  uuid not null references public.profiles(id) on delete cascade,
  value          numeric(14, 2) not null,
  unit           public.meter_unit not null,
  read_at        timestamptz not null,
  created_at     timestamptz not null default now()
);
comment on table public.meter_readings is 'Individual meter readings submitted by technicians';

create index if not exists meter_readings_meter_id_idx on public.meter_readings(meter_id);
create index if not exists meter_readings_read_at_idx on public.meter_readings(read_at desc);

-- ── village_status view ───────────────────────────────────────────────────────
-- Aggregates latest check-in and reading per village, with a staleness flag.
create or replace view public.village_status as
with latest_checkin as (
  select distinct on (village_id)
    village_id,
    checked_in_at,
    technician_id
  from public.check_ins
  order by village_id, checked_in_at desc
),
latest_reading as (
  select distinct on (m.village_id)
    m.village_id,
    mr.value,
    mr.unit,
    mr.read_at
  from public.meter_readings mr
  join public.meters m on m.id = mr.meter_id
  order by m.village_id, mr.read_at desc
),
technician_names as (
  select id, name from public.profiles where role = 'technician'
)
select
  v.id                                           as village_id,
  v.name                                         as village_name,
  v.region,
  lc.checked_in_at                               as latest_checkin_at,
  tn.name                                        as latest_checkin_technician,
  lr.read_at                                     as latest_reading_at,
  lr.value                                       as latest_reading_value,
  lr.unit::text                                  as latest_reading_unit,
  -- flag true when NEITHER a check-in NOR a reading exists within last 24h
  (
    (lc.checked_in_at is null or lc.checked_in_at < now() - interval '24 hours')
    and
    (lr.read_at is null or lr.read_at < now() - interval '24 hours')
  )                                              as no_recent_update
from public.villages v
left join latest_checkin lc on lc.village_id = v.id
left join latest_reading lr on lr.village_id = v.id
left join technician_names tn on tn.id = lc.technician_id;

comment on view public.village_status is
  'Aggregated latest check-in and meter reading per village; no_recent_update=true means >24h of silence';
