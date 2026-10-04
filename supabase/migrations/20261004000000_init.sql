-- =====================================================================
-- Coffee shop: schema, row level security, RPCs, storage, realtime
-- =====================================================================
--
-- Access model
--   * Mobile app (anon key, no login): reads the menu, places orders through
--     place_order(), and tracks its own orders through get_orders() using the
--     order UUIDs it stored on the device. It can never read the orders table.
--   * Admin dashboard (signed-in user listed in public.admins): full access.

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type public.order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
create type public.order_type as enum ('takeaway', 'dine_in');

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  icon text not null default '☕' check (char_length(icon) between 1 and 8),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- sizes: [{ "name": "M", "price_delta": 1500 }, ...]; empty array = no size choice
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  price integer not null check (price >= 0),
  image_url text,
  sizes jsonb not null default '[]'::jsonb check (jsonb_typeof(sizes) = 'array'),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer generated always as identity (start with 1001) unique,
  customer_name text not null check (char_length(customer_name) between 1 and 60),
  customer_phone text not null check (customer_phone ~ '^\+?[0-9]{8,15}$'),
  order_type public.order_type not null default 'takeaway',
  note text check (char_length(note) <= 300),
  status public.order_status not null default 'pending',
  total integer not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Line items keep a copy of name and price so menu edits never rewrite history.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  position integer not null default 0,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  size text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 50),
  line_total integer generated always as (unit_price * quantity) stored
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Orders are only reachable from the mobile app through the RPCs below.
revoke all on public.admins, public.orders, public.order_items from anon;

grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select, update, delete on public.orders to authenticated;
grant select on public.order_items, public.admins to authenticated;

create policy "Users can see their own admin membership"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Anyone can read categories"
  on public.categories for select to anon, authenticated
  using (true);
create policy "Admins can create categories"
  on public.categories for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update categories"
  on public.categories for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins can delete categories"
  on public.categories for delete to authenticated
  using ((select public.is_admin()));

create policy "Anyone can read products"
  on public.products for select to anon, authenticated
  using (true);
create policy "Admins can create products"
  on public.products for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update products"
  on public.products for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins can delete products"
  on public.products for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins can read orders"
  on public.orders for select to authenticated
  using ((select public.is_admin()));
create policy "Admins can update orders"
  on public.orders for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins can delete orders"
  on public.orders for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins can read order items"
  on public.order_items for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- RPC: place_order (called by the mobile app without login)
-- Prices are always computed here from the products table; the client only
-- sends product ids, sizes and quantities.
-- ---------------------------------------------------------------------
create or replace function public.place_order(
  p_customer_name text,
  p_customer_phone text,
  p_order_type public.order_type,
  p_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_size text;
  v_size_delta integer;
  v_unit_price integer;
  v_total integer := 0;
  v_lines jsonb := '[]'::jsonb;
  v_order_id uuid;
  v_order_number integer;
begin
  p_customer_name := btrim(coalesce(p_customer_name, ''));
  p_customer_phone := regexp_replace(coalesce(p_customer_phone, ''), '[\s()-]', '', 'g');
  p_note := nullif(btrim(coalesce(p_note, '')), '');

  if char_length(p_customer_name) not between 1 and 60 then
    raise exception 'Нэрээ зөв оруулна уу' using errcode = '22023';
  end if;
  if p_customer_phone !~ '^\+?[0-9]{8,15}$' then
    raise exception 'Утасны дугаар буруу байна' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 300 then
    raise exception 'Тэмдэглэл хэт урт байна' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Сагс хоосон байна' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'Нэг захиалгад хэт олон бараа байна' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product
      from public.products
      where id = (v_item ->> 'product_id')::uuid;

    if not found then
      raise exception 'Бүтээгдэхүүн олдсонгүй' using errcode = 'P0002';
    end if;
    if not v_product.is_available then
      raise exception '"%" одоогоор дууссан байна', v_product.name using errcode = '22023';
    end if;

    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_quantity not between 1 and 50 then
      raise exception 'Тоо ширхэг буруу байна' using errcode = '22023';
    end if;

    v_size := nullif(v_item ->> 'size', '');
    v_size_delta := 0;
    if jsonb_array_length(v_product.sizes) > 0 then
      select coalesce((s ->> 'price_delta')::integer, 0) into v_size_delta
        from jsonb_array_elements(v_product.sizes) as s
        where s ->> 'name' = v_size
        limit 1;
      if not found then
        raise exception '"%"-ийн хэмжээг сонгоно уу', v_product.name using errcode = '22023';
      end if;
    else
      v_size := null;
    end if;

    v_unit_price := v_product.price + v_size_delta;
    v_total := v_total + v_unit_price * v_quantity;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'size', v_size,
      'unit_price', v_unit_price,
      'quantity', v_quantity
    ));
  end loop;

  insert into public.orders (customer_name, customer_phone, order_type, note, total)
  values (p_customer_name, p_customer_phone, coalesce(p_order_type, 'takeaway'), p_note, v_total)
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, position, product_id, product_name, size, unit_price, quantity)
  select
    v_order_id,
    l.ordinality::integer,
    (l.line ->> 'product_id')::uuid,
    l.line ->> 'product_name',
    l.line ->> 'size',
    (l.line ->> 'unit_price')::integer,
    (l.line ->> 'quantity')::integer
  from jsonb_array_elements(v_lines) with ordinality as l (line, ordinality);

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total);
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: get_orders (called by the mobile app without login)
-- The order UUID acts as an unguessable receipt; the phone number is never
-- returned.
-- ---------------------------------------------------------------------
create or replace function public.get_orders(p_order_ids uuid[])
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'status', o.status,
        'order_type', o.order_type,
        'customer_name', o.customer_name,
        'note', o.note,
        'total', o.total,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'items', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', i.id,
              'product_name', i.product_name,
              'size', i.size,
              'unit_price', i.unit_price,
              'quantity', i.quantity,
              'line_total', i.line_total
            )
            order by i.position
          )
          from public.order_items i
          where i.order_id = o.id
        ), '[]'::jsonb)
      )
      order by o.created_at desc
    ),
    '[]'::jsonb
  )
  from public.orders o
  where o.id = any (p_order_ids[1:50]);
$$;

-- ---------------------------------------------------------------------
-- RPC: dashboard_summary (admin dashboard; RLS applies, so non-admins get zeros)
-- ---------------------------------------------------------------------
create or replace function public.dashboard_summary(p_timezone text default 'Asia/Ulaanbaatar')
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select
      (date_trunc('day', now() at time zone p_timezone)) at time zone p_timezone as today_start,
      (now() at time zone p_timezone)::date as today
  ),
  today_orders as (
    select o.*
    from public.orders o, bounds b
    where o.created_at >= b.today_start
      and o.status <> 'cancelled'
  ),
  top_products as (
    select i.product_name, sum(i.quantity)::integer as quantity, sum(i.line_total)::integer as revenue
    from public.order_items i
    join public.orders o on o.id = i.order_id
    cross join bounds b
    where o.created_at >= b.today_start - interval '6 days'
      and o.status <> 'cancelled'
    group by i.product_name
    order by quantity desc, revenue desc
    limit 5
  ),
  days as (
    select (b.today - n)::date as day
    from bounds b, generate_series(6, 0, -1) as n
  ),
  daily as (
    select
      d.day,
      count(o.id)::integer as orders,
      coalesce(sum(o.total), 0)::integer as revenue
    from days d
    left join public.orders o
      on (o.created_at at time zone p_timezone)::date = d.day
      and o.status <> 'cancelled'
    group by d.day
    order by d.day
  )
  select jsonb_build_object(
    'orders_today', (select count(*) from today_orders),
    'revenue_today', (select coalesce(sum(total), 0) from today_orders),
    'average_order_today', (select coalesce(round(avg(total)), 0) from today_orders),
    'active_orders', (
      select count(*) from public.orders where status in ('pending', 'preparing', 'ready')
    ),
    'top_products', (select coalesce(jsonb_agg(t), '[]'::jsonb) from top_products t),
    'daily', (select coalesce(jsonb_agg(d), '[]'::jsonb) from daily d)
  );
$$;

revoke execute on function public.place_order(text, text, public.order_type, text, jsonb) from public;
revoke execute on function public.get_orders(uuid[]) from public;
revoke execute on function public.dashboard_summary(text) from public;
revoke execute on function public.is_admin() from public;

grant execute on function public.place_order(text, text, public.order_type, text, jsonb) to anon, authenticated;
grant execute on function public.get_orders(uuid[]) to anon, authenticated;
grant execute on function public.dashboard_summary(text) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Realtime: the admin order board listens to new orders and status changes
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.orders;

-- ---------------------------------------------------------------------
-- Storage: public product images, writable by admins only
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins can read product images"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
