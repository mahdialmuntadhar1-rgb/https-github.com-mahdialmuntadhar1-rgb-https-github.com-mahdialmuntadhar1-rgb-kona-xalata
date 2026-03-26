-- Iraq Compass initial production schema + RLS
-- Apply with Supabase CLI: supabase db push

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar text not null,
  role text not null default 'user' check (role in ('user', 'owner', 'admin')),
  "businessId" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.businesses (
  id text primary key,
  "ownerId" uuid references public.users(id) on delete set null,
  name text not null,
  "nameAr" text,
  "nameKu" text,
  "coverImage" text,
  "imageUrl" text,
  image text,
  "isPremium" boolean not null default false,
  "isFeatured" boolean not null default false,
  category text not null,
  subcategory text,
  rating numeric not null default 0,
  "reviewCount" integer not null default 0,
  governorate text,
  city text,
  address text,
  phone text,
  whatsapp text,
  website text,
  description text,
  "descriptionAr" text,
  "descriptionKu" text,
  "openHours" text,
  "priceRange" smallint,
  tags text[] not null default '{}',
  lat double precision,
  lng double precision,
  "isVerified" boolean not null default false,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  "businessId" text not null references public.businesses(id) on delete cascade,
  "businessName" text not null,
  "businessAvatar" text not null,
  caption text not null,
  "imageUrl" text,
  likes integer not null default 0,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.events (
  id bigserial primary key,
  image text,
  title text not null,
  category text,
  governorate text,
  venue text,
  attendees integer not null default 0,
  price integer not null default 0,
  date timestamptz not null,
  accessibility jsonb,
  "aiRecommended" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.deals (
  id bigserial primary key,
  discount integer not null,
  "businessLogo" text,
  title text not null,
  description text,
  "expiresIn" text,
  claimed integer not null default 0,
  total integer not null default 0,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.stories (
  id bigserial primary key,
  avatar text,
  name text,
  thumbnail text,
  "userName" text,
  type text check (type in ('business', 'community')),
  "aiVerified" boolean not null default false,
  "isLive" boolean not null default false,
  media text[] not null default '{}',
  "timeAgo" text,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.business_postcards (
  id text primary key,
  "ownerId" uuid references public.users(id) on delete set null,
  title text not null,
  city text not null,
  neighborhood text,
  governorate text not null,
  category_tag text not null,
  phone text not null,
  website text,
  instagram text,
  hero_image text,
  image_gallery text[] not null default '{}',
  postcard_content text,
  google_maps_url text,
  rating numeric not null default 0,
  review_count integer not null default 0,
  verified boolean not null default false,
  "updatedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_businesses_category on public.businesses(category);
create index if not exists idx_businesses_governorate on public.businesses(governorate);
create index if not exists idx_events_category_date on public.events(category, date);
create index if not exists idx_posts_created_at on public.posts("createdAt" desc);

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.deals enable row level security;
alter table public.stories enable row level security;
alter table public.business_postcards enable row level security;

-- Public read access for discovery content
create policy if not exists "public read businesses" on public.businesses for select using (true);
create policy if not exists "public read posts" on public.posts for select using (true);
create policy if not exists "public read events" on public.events for select using (true);
create policy if not exists "public read deals" on public.deals for select using (true);
create policy if not exists "public read stories" on public.stories for select using (true);
create policy if not exists "public read postcards" on public.business_postcards for select using (true);

-- Profile security
create policy if not exists "users read own profile" on public.users
for select to authenticated using (auth.uid() = id);

create policy if not exists "users create own profile" on public.users
for insert to authenticated with check (auth.uid() = id and role in ('user', 'owner'));

create policy if not exists "users update own profile" on public.users
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id and role in ('user', 'owner', 'admin'));

-- Owner writes for business and posts
create policy if not exists "owners write businesses" on public.businesses
for insert to authenticated
with check ("ownerId" = auth.uid());

create policy if not exists "owners update own businesses" on public.businesses
for update to authenticated
using ("ownerId" = auth.uid())
with check ("ownerId" = auth.uid());

create policy if not exists "owners delete own businesses" on public.businesses
for delete to authenticated
using ("ownerId" = auth.uid());

create policy if not exists "admins write businesses" on public.businesses
for all to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);

create policy if not exists "owners create posts" on public.posts
for insert to authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = "businessId" and b."ownerId" = auth.uid()
  )
);

-- Admin-only postcard ingestion
create policy if not exists "admin write postcards" on public.business_postcards
for all to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);
