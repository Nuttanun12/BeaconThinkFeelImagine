-- ─────────────────────────────────────────────────────────────────────────────
-- 002_rls.sql
-- Beacon MVP — Row Level Security policies
-- Run this AFTER 001_schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enable RLS on every table ─────────────────────────────────────────────────
alter table public.profiles             enable row level security;
alter table public.villages             enable row level security;
alter table public.technician_assignments enable row level security;
alter table public.meters               enable row level security;
alter table public.check_ins            enable row level security;
alter table public.meter_readings       enable row level security;

-- ── Helper function: get the current user's role ──────────────────────────────
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Everyone can read their own profile; ops director can read all.
create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'operations_director');

create policy "profiles: insert own on signup"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid());

-- ── villages ──────────────────────────────────────────────────────────────────
-- All authenticated users can read villages.
-- Only ops director can create/update/delete villages.
create policy "villages: all authenticated can read"
  on public.villages for select
  using (auth.uid() is not null);

create policy "villages: ops director full access"
  on public.villages for all
  using (public.current_user_role() = 'operations_director')
  with check (public.current_user_role() = 'operations_director');

-- ── technician_assignments ────────────────────────────────────────────────────
-- Technicians can read their own assignments.
-- Ops director can read and manage all.
create policy "assignments: technician reads own"
  on public.technician_assignments for select
  using (
    technician_id = auth.uid()
    or public.current_user_role() = 'operations_director'
  );

create policy "assignments: ops director manages all"
  on public.technician_assignments for all
  using (public.current_user_role() = 'operations_director')
  with check (public.current_user_role() = 'operations_director');

-- ── meters ────────────────────────────────────────────────────────────────────
-- All authenticated users can read meters (technicians need to see meters for their villages).
-- Only ops director can create/update/delete meters.
create policy "meters: all authenticated can read"
  on public.meters for select
  using (auth.uid() is not null);

create policy "meters: ops director manages"
  on public.meters for all
  using (public.current_user_role() = 'operations_director')
  with check (public.current_user_role() = 'operations_director');

-- ── check_ins ─────────────────────────────────────────────────────────────────
-- Ops director can read everything.
-- Technicians can read all check_ins but can only INSERT for their assigned villages.
create policy "check_ins: ops director reads all"
  on public.check_ins for select
  using (public.current_user_role() = 'operations_director');

create policy "check_ins: technician reads all"
  on public.check_ins for select
  using (public.current_user_role() = 'technician');

create policy "check_ins: technician inserts for assigned village"
  on public.check_ins for insert
  with check (
    public.current_user_role() = 'technician'
    and technician_id = auth.uid()
    and exists (
      select 1 from public.technician_assignments ta
      where ta.technician_id = auth.uid()
        and ta.village_id = check_ins.village_id
    )
  );

-- ── meter_readings ────────────────────────────────────────────────────────────
-- Ops director can read everything.
-- Technicians can read all readings but can only INSERT for meters in their assigned villages.
create policy "meter_readings: ops director reads all"
  on public.meter_readings for select
  using (public.current_user_role() = 'operations_director');

create policy "meter_readings: technician reads all"
  on public.meter_readings for select
  using (public.current_user_role() = 'technician');

create policy "meter_readings: technician inserts for assigned village"
  on public.meter_readings for insert
  with check (
    public.current_user_role() = 'technician'
    and technician_id = auth.uid()
    and exists (
      select 1
      from public.meters m
      join public.technician_assignments ta on ta.village_id = m.village_id
      where m.id = meter_readings.meter_id
        and ta.technician_id = auth.uid()
    )
  );
