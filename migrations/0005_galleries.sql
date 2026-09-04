create table if not exists galleries (
  id text primary key,
  name text not null,
  instagram text,
  pin text not null,
  status text not null default 'open',
  picks text not null default '',
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);
create index if not exists galleries_created_at_idx on galleries (created_at desc);

create table if not exists gallery_photos (
  gallery_id text not null references galleries(id) on delete cascade,
  n integer not null,
  bytes integer not null default 0,
  body text not null,
  created_at timestamptz not null default now(),
  primary key (gallery_id, n)
);
