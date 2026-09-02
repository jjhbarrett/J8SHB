create table if not exists enquiries (
  id text primary key,
  kind text not null,
  created_at timestamptz not null default now(),
  reference text,
  name text not null,
  email text,
  instagram text,
  subject text not null,
  body text not null
);
create index if not exists enquiries_created_at_idx on enquiries (created_at desc);
