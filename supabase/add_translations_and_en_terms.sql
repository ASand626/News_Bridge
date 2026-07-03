-- ① translations テーブル（英日対訳キャッシュ・ユーザー共通）
-- Supabase Dashboard > SQL Editor で実行してください

create table if not exists translations (
  article_id  text primary key,
  title_ja    text not null default '',
  content_ja  text not null default '',
  created_at  timestamptz default now()
);

alter table translations enable row level security;

create policy "Anyone can read translations"
  on translations for select using (true);

create policy "Auth users can insert translations"
  on translations for insert with check (auth.uid() is not null);

create policy "Auth users can update translations"
  on translations for update using (auth.uid() is not null);


-- ② term_favorites テーブルに language カラムを追加
-- 既存データは language = 'ja' として扱われます

alter table term_favorites
  add column if not exists language text not null default 'ja';

-- 既存の unique 制約を削除して language を含む制約に変更
alter table term_favorites
  drop constraint if exists term_favorites_term_user_id_key;

alter table term_favorites
  add constraint term_favorites_term_user_id_language_key
  unique (term, user_id, language);
