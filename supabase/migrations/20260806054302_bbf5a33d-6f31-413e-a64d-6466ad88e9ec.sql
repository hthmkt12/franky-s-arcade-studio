drop policy "admins read orders" on public.orders;
drop policy "admins update orders" on public.orders;
drop policy "admins read order items" on public.order_items;
drop policy "admins update products" on public.products;

create policy "admins read orders" on public.orders for select to authenticated
using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));

create policy "admins update orders" on public.orders for update to authenticated
using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'))
with check (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));

create policy "admins read order items" on public.order_items for select to authenticated
using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));

create policy "admins update products" on public.products for update to authenticated
using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'))
with check (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = 'admin'));