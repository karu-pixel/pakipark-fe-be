-- Vehicle table API setup for the NestJS BFF.
-- Apply this in Supabase, then expose the teller schema in:
-- Project Settings -> API -> Exposed schemas.
--
-- Runtime flow:
-- Frontend -> NestJS Backend API -> Supabase PostgREST -> teller.vehicles

grant usage on schema teller to authenticated;
grant select, insert, update, delete on table teller.vehicles to authenticated;

alter table teller.vehicles enable row level security;

drop policy if exists "Users can select own vehicles" on teller.vehicles;
create policy "Users can select own vehicles"
on teller.vehicles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own vehicles" on teller.vehicles;
create policy "Users can insert own vehicles"
on teller.vehicles
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own vehicles" on teller.vehicles;
create policy "Users can update own vehicles"
on teller.vehicles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own vehicles" on teller.vehicles;
create policy "Users can delete own vehicles"
on teller.vehicles
for delete
to authenticated
using (user_id = auth.uid());
