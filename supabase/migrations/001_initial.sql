-- Articles: URL/テキストから取得した記事本文
create table if not exists articles (
  id           text        primary key,
  title        text        not null,
  url          text,
  content      text        not null default '',
  image_url    text,
  is_english   boolean     not null default false,
  source       text        not null default 'manual',
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- Explanations: Claudeが生成した解説のキャッシュ
create table if not exists explanations (
  article_id text        primary key,
  raw        text        not null,
  created_at timestamptz not null default now()
);

-- History: 解説した記事の履歴（同じ記事は最新日時に更新）
create table if not exists history (
  id         uuid        primary key default gen_random_uuid(),
  article_id text        not null unique,
  title      text        not null,
  url        text,
  saved_at   timestamptz not null default now()
);

-- Favorite sites: お気に入りサイト
create table if not exists favorite_sites (
  id         text        primary key,
  name       text        not null,
  url        text        not null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

-- RLS有効化
alter table articles       enable row level security;
alter table explanations   enable row level security;
alter table history        enable row level security;
alter table favorite_sites enable row level security;

-- 全操作を許可（個人利用アプリ）
create policy "allow all" on articles       for all to anon using (true) with check (true);
create policy "allow all" on explanations   for all to anon using (true) with check (true);
create policy "allow all" on history        for all to anon using (true) with check (true);
create policy "allow all" on favorite_sites for all to anon using (true) with check (true);
