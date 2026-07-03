-- article_bookmarks テーブル
-- Supabase Dashboard > SQL Editor で実行してください

create table if not exists article_bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  article_id  text not null,
  title       text not null,
  url         text,
  created_at  timestamptz default now(),
  unique(user_id, article_id)
);

-- RLS: 自分のブックマークのみ操作可能
alter table article_bookmarks enable row level security;

create policy "Users can manage own bookmarks"
  on article_bookmarks for all
  using (auth.uid() = user_id);
