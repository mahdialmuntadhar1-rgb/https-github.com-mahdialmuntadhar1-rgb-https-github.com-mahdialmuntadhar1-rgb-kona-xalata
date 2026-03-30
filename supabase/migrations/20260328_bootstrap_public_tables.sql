-- Bootstrap public content tables for Iraq Compass.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id text primary key,
  name text not null,
  "nameAr" text,
  "nameKu" text,
  "imageUrl" text,
  "coverImage" text,
  "isPremium" boolean not null default false,
  "isFeatured" boolean not null default false,
  category text not null,
  subcategory text,
  rating numeric(3,2) not null default 0,
  distance numeric(8,2),
  status text,
  "isVerified" boolean not null default false,
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
  tags text[] default '{}',
  lat double precision,
  lng double precision
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  "businessId" text not null,
  "businessName" text not null,
  "businessAvatar" text,
  caption text not null default '',
  "imageUrl" text,
  "createdAt" timestamptz not null default now(),
  likes integer not null default 0,
  "isVerified" boolean not null default false,
  governorate text
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  discount integer not null,
  "businessLogo" text,
  title text not null,
  description text not null,
  "expiresIn" text not null,
  claimed integer not null default 0,
  total integer not null default 0,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  avatar text,
  name text not null,
  viewed boolean not null default false,
  verified boolean not null default false,
  thumbnail text,
  "userName" text,
  type text not null check (type in ('business', 'community')),
  "aiVerified" boolean not null default false,
  "isLive" boolean not null default false,
  media text[] not null default '{}',
  "timeAgo" text,
  governorate text,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  image text,
  title text not null,
  "titleKey" text,
  "aiRecommended" boolean not null default false,
  date timestamptz not null,
  venue text not null,
  "venueKey" text,
  location text,
  attendees integer not null default 0,
  price numeric(10,2) not null default 0,
  category text not null,
  governorate text not null,
  accessibility jsonb not null default '{}'::jsonb
);

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null,
  avatar text,
  role text not null check (role in ('owner', 'user', 'admin')),
  "businessId" text,
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.business_postcards (
  id text primary key,
  title text not null,
  city text not null,
  neighborhood text not null,
  governorate text not null,
  category_tag text not null check (category_tag in ('Cafe', 'Restaurant', 'Bakery', 'Hotel', 'Gym', 'Salon', 'Pharmacy', 'Supermarket')),
  phone text not null,
  website text,
  instagram text,
  hero_image text not null,
  image_gallery text[] not null default '{}',
  postcard_content text not null,
  google_maps_url text not null,
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  verified boolean not null default false,
  "updatedAt" timestamptz not null default now()
);

-- Enable Row Level Security + public read policies for initial launch.
alter table public.businesses enable row level security;
alter table public.posts enable row level security;
alter table public.deals enable row level security;
alter table public.stories enable row level security;
alter table public.events enable row level security;
alter table public.users enable row level security;
alter table public.business_postcards enable row level security;

alter table public.posts add column if not exists governorate text;
alter table public.stories add column if not exists governorate text;


drop policy if exists "public read businesses" on public.businesses;
create policy "public read businesses" on public.businesses
  for select to anon using (true);

drop policy if exists "public read posts" on public.posts;
create policy "public read posts" on public.posts
  for select to anon using (true);

drop policy if exists "public read deals" on public.deals;
create policy "public read deals" on public.deals
  for select to anon using (true);

drop policy if exists "public read stories" on public.stories;
create policy "public read stories" on public.stories
  for select to anon using (true);

drop policy if exists "public read events" on public.events;
create policy "public read events" on public.events
  for select to anon using (true);

drop policy if exists "public read users" on public.users;
drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile" on public.users
  for select to authenticated using (auth.uid()::text = id);

drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile" on public.users
  for insert to authenticated with check (auth.uid()::text = id);

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile" on public.users
  for update to authenticated using (auth.uid()::text = id) with check (auth.uid()::text = id);

drop policy if exists "authenticated can insert posts" on public.posts;
create policy "authenticated can insert posts" on public.posts
  for insert to authenticated with check (true);

drop policy if exists "authenticated can insert postcards" on public.business_postcards;
create policy "authenticated can insert postcards" on public.business_postcards
  for insert to authenticated with check (true);

drop policy if exists "authenticated can update postcards" on public.business_postcards;
create policy "authenticated can update postcards" on public.business_postcards
  for update to authenticated using (true) with check (true);

drop policy if exists "public read business_postcards" on public.business_postcards;
create policy "public read business_postcards" on public.business_postcards
  for select to anon using (true);

-- Seed data for visibility testing.
insert into public.businesses (
  id,
  name,
  "nameAr",
  category,
  subcategory,
  rating,
  "isFeatured",
  "isVerified",
  "reviewCount",
  governorate,
  city,
  address,
  phone,
  description,
  "openHours",
  "priceRange",
  tags,
  "imageUrl",
  "coverImage",
  lat,
  lng
)
values (
  'baghdad-river-cafe',
  'Baghdad River Cafe',
  'مقهى نهر بغداد',
  'Food & Drink',
  'Cafe',
  4.7,
  true,
  true,
  124,
  'Baghdad',
  'Karrada',
  'Abu Nawas St, Baghdad',
  '+9647701234567',
  'A modern riverside café with Iraqi and international drinks.',
  'Daily 8:00 AM - 11:00 PM',
  2,
  array['coffee', 'riverside', 'family-friendly'],
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
  33.3090,
  44.4320
)
on conflict (id) do update
set name = excluded.name,
    "nameAr" = excluded."nameAr",
    category = excluded.category,
    subcategory = excluded.subcategory,
    rating = excluded.rating,
    "isFeatured" = excluded."isFeatured",
    "isVerified" = excluded."isVerified",
    "reviewCount" = excluded."reviewCount",
    governorate = excluded.governorate,
    city = excluded.city,
    address = excluded.address,
    phone = excluded.phone,
    description = excluded.description,
    "openHours" = excluded."openHours",
    "priceRange" = excluded."priceRange",
    tags = excluded.tags,
    "imageUrl" = excluded."imageUrl",
    "coverImage" = excluded."coverImage",
    lat = excluded.lat,
    lng = excluded.lng;

insert into public.posts ("businessId", "businessName", "businessAvatar", caption, "imageUrl", likes, "isVerified", governorate)
values (
  'baghdad-river-cafe',
  'Baghdad River Cafe',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  'Freshly roasted beans just arrived this morning ☕️',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
  18,
  true,
  'Baghdad'
)
on conflict do nothing;

insert into public.deals (discount, "businessLogo", title, description, "expiresIn", claimed, total)
values (
  20,
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814',
  'Morning Coffee Deal',
  '20% off all coffee orders before 11 AM.',
  '2 days',
  8,
  40
)
on conflict do nothing;

insert into public.stories (avatar, name, viewed, verified, thumbnail, "userName", type, "aiVerified", "isLive", media, "timeAgo", governorate)
values (
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  'Baghdad River Cafe',
  false,
  true,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
  'baghdadrivercafe',
  'business',
  true,
  false,
  array['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'],
  '2h ago',
  'Baghdad'
)
on conflict do nothing;

insert into public.events (image, title, "aiRecommended", date, venue, location, attendees, price, category, governorate, accessibility)
values (
  'https://images.unsplash.com/photo-1511578314322-379afb476865',
  'Baghdad Coffee Tasting Night',
  true,
  now() + interval '7 days',
  'Baghdad River Cafe',
  'Abu Nawas St, Baghdad',
  85,
  10,
  'Food & Drink',
  'Baghdad',
  '{"wheelchairAccessible": true, "familyFriendly": true}'::jsonb
)
on conflict do nothing;

insert into public.business_postcards (
  id,
  title,
  city,
  neighborhood,
  governorate,
  category_tag,
  phone,
  website,
  instagram,
  hero_image,
  image_gallery,
  postcard_content,
  google_maps_url,
  rating,
  review_count,
  verified
)
values (
  'baghdad-river-cafe_karrada',
  'Baghdad River Cafe',
  'Karrada',
  'Abu Nawas',
  'Baghdad',
  'Cafe',
  '+9647701234567',
  'https://example.com',
  'https://instagram.com/baghdadrivercafe',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
  array['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'],
  'Signature Iraqi coffee, desserts, and live oud music every Friday.',
  'https://maps.google.com/?q=33.3090,44.4320',
  4.7,
  124,
  true
)
on conflict (id) do update
set title = excluded.title,
    city = excluded.city,
    neighborhood = excluded.neighborhood,
    governorate = excluded.governorate,
    category_tag = excluded.category_tag,
    phone = excluded.phone,
    website = excluded.website,
    instagram = excluded.instagram,
    hero_image = excluded.hero_image,
    image_gallery = excluded.image_gallery,
    postcard_content = excluded.postcard_content,
    google_maps_url = excluded.google_maps_url,
    rating = excluded.rating,
    review_count = excluded.review_count,
    verified = excluded.verified,
    "updatedAt" = now();
