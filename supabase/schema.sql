create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('funcionario', 'gerente')),
  name text not null
);

create table if not exists items (
  id uuid primary key default uuid_generate_v4(),
  barcode text not null unique,
  name text not null,
  category text not null,
  quantity int not null default 0,
  expiry_date date,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scan_logs (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references items(id) on delete cascade,
  employee_id uuid not null references profiles(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  action text not null check (action in ('entrada', 'saida')),
  quantity int not null,
  synced bool not null default false
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_updated_at on items;
create trigger items_updated_at
  before update on items
  for each row execute function set_updated_at();

alter table profiles enable row level security;
alter table items enable row level security;
alter table scan_logs enable row level security;

create policy "profiles: user reads own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: gerente reads all"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'gerente'
    )
  );

create policy "items: authenticated read"
  on items for select
  using (auth.role() = 'authenticated');

create policy "items: gerente insert update"
  on items for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'gerente'
    )
  );

create policy "scan_logs: funcionario insert own"
  on scan_logs for insert
  with check (auth.uid() = employee_id);

create policy "scan_logs: funcionario read own"
  on scan_logs for select
  using (auth.uid() = employee_id);

create policy "scan_logs: gerente read all"
  on scan_logs for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'gerente'
    )
  );

create policy "scan_logs: gerente update"
  on scan_logs for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'gerente'
    )
  );
