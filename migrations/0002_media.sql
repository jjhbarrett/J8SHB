create table if not exists media (
  key text primary key,
  mime text not null default 'image/jpeg',
  body text not null,
  bytes integer not null default 0,
  updated_at timestamptz not null default now()
);
