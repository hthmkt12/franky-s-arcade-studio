create type public.app_role as enum ('admin','staff','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

-- Admin access to orders + items
create policy "admins read orders"
on public.orders for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "admins update orders"
on public.orders for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "admins read order items"
on public.order_items for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

-- Admin stock management
create policy "admins update products"
on public.products for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

grant update on public.products to authenticated;