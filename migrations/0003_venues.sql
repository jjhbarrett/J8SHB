create table if not exists venues (
  id text primary key,
  city text not null,
  name text not null,
  note text not null default '',
  recommended boolean not null default false,
  sort integer not null default 0
);

insert into venues (id, city, name, note, recommended, sort) values
  ('northampton', 'Northampton', 'Lite Studios, Weedon Bec', 'The room people wait for.', true, 1),
  ('london', 'London', 'Flash Studios, E16', 'Clean white studio.', false, 2),
  ('hampshire', 'Andover, Hampshire', 'The Andover Studio', 'Close, large, natural light.', false, 3)
on conflict (id) do nothing;
