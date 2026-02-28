1️⃣ ENUMS (Chuẩn hóa trạng thái)
create type user_role_enum as enum ('user', 'admin');

create type order_status_enum as enum (
  'pending',
  'confirmed',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
  'returned'
);

create type payment_status_enum as enum (
  'pending',
  'success',
  'failed',
  'refunded'
);

create type inventory_action_enum as enum (
  'import',
  'export',
  'return',
  'adjustment'
);

create type actor_type_enum as enum ('admin', 'user', 'system');
2️⃣ USERS
create table users (
  id bigint primary key generated always as identity,
  username text not null unique,
  email text not null unique,
  password text not null,
  role user_role_enum default 'user',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login timestamptz
);

Index:

create index idx_users_email on users(email);
3️⃣ PRODUCTS (Soft delete + chống oversell)
create table products (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  stock_available int not null check (stock_available >= 0),
  stock_reserved int not null default 0 check (stock_reserved >= 0),
  min_stock int default 5,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

Search index:

create index idx_product_search 
on products using gin (to_tsvector('simple', name));

Low stock query sẽ dựa vào:

stock_available <= min_stock
4️⃣ CART
create table cart (
  id bigint primary key generated always as identity,
  user_id bigint not null references users(id) on delete cascade,
  created_at timestamptz default now()
);

create table cart_items (
  id bigint primary key generated always as identity,
  cart_id bigint not null references cart(id) on delete cascade,
  product_id bigint not null references products(id),
  quantity int not null check (quantity > 0),
  unique (cart_id, product_id)
);
5️⃣ ORDERS
create table orders (
  id bigint primary key generated always as identity,
  user_id bigint not null references users(id),
  total_price numeric(10,2) not null check (total_price >= 0),
  status order_status_enum not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

Index:

create index idx_orders_status on orders(status);
create index idx_orders_user on orders(user_id);
6️⃣ ORDER ITEMS
create table order_items (
  id bigint primary key generated always as identity,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint not null references products(id),
  quantity int not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0),
  unique (order_id, product_id)
);
7️⃣ PAYMENT (1 order = 1 payment chính)
create table payments (
  id bigint primary key generated always as identity,
  order_id bigint not null unique references orders(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  method text not null,
  transaction_id text unique,
  status payment_status_enum default 'pending',
  created_at timestamptz default now(),
  paid_at timestamptz
);
8️⃣ INVENTORY LOG (Bắt buộc để audit kho)
create table inventory_log (
  id bigint primary key generated always as identity,
  product_id bigint not null references products(id),
  action inventory_action_enum not null,
  quantity int not null,
  reference_id bigint,
  created_at timestamptz default now()
);

create index idx_inventory_product on inventory_log(product_id);
9️⃣ RETURNS (Đúng cấp order_item)
create table returns (
  id bigint primary key generated always as identity,
  order_item_id bigint not null references order_items(id),
  quantity int not null check (quantity > 0),
  reason text,
  status text default 'requested',
  created_at timestamptz default now()
);
🔟 ORDER STATUS HISTORY
create table order_status_history (
  id bigint primary key generated always as identity,
  order_id bigint not null references orders(id) on delete cascade,
  old_status order_status_enum,
  new_status order_status_enum not null,
  changed_by bigint,
  changed_at timestamptz default now()
);
11️⃣ NOTIFICATIONS
create table notifications (
  id bigint primary key generated always as identity,
  user_id bigint not null references users(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_notification_user on notifications(user_id);
12️⃣ USER ACTIVITY (AI phân tích)
create table user_activity_log (
  id bigint primary key generated always as identity,
  user_id bigint references users(id),
  action text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index idx_activity_user on user_activity_log(user_id);
13️⃣ WISHLIST
create table wishlist (
  id bigint primary key generated always as identity,
  user_id bigint not null references users(id) on delete cascade,
  product_id bigint not null references products(id),
  created_at timestamptz default now(),
  unique (user_id, product_id)
);
14️⃣ REVIEWS
create table reviews (
  id bigint primary key generated always as identity,
  user_id bigint not null references users(id),
  product_id bigint not null references products(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);
15️⃣ INVOICES
create table invoices (
  id bigint primary key generated always as identity,
  order_id bigint not null unique references orders(id),
  invoice_number text unique not null,
  total_amount numeric(10,2) not null,
  issued_at timestamptz default now()
);
16️⃣ AUDIT LOG (Chuẩn compliance)
create table audit_log (
  id bigint primary key generated always as identity,
  actor_type actor_type_enum not null,
  actor_id bigint,
  target_type text,
  target_id bigint,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

create index idx_audit_actor on audit_log(actor_id);