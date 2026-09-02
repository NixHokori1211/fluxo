-- ============================================================
-- Schema da rede social (estilo Instagram)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- ============================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Perfis são públicos para leitura"
  on public.profiles for select
  using (true);

create policy "Usuário edita apenas o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuário cria apenas o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Cria o profile automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- POSTS ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Posts são públicos para leitura"
  on public.posts for select
  using (true);

create policy "Usuário cria apenas os próprios posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Usuário apaga apenas os próprios posts"
  on public.posts for delete
  using (auth.uid() = author_id);

create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);

-- ---------- FOLLOWS ----------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "Relações de follow são públicas para leitura"
  on public.follows for select
  using (true);

create policy "Usuário segue como ele mesmo"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Usuário deixa de seguir como ele mesmo"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---------- LIKES ----------
create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.likes enable row level security;

create policy "Likes são públicos para leitura"
  on public.likes for select
  using (true);

create policy "Usuário curte como ele mesmo"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Usuário descurte como ele mesmo"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ---------- COMMENTS ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Comentários são públicos para leitura"
  on public.comments for select
  using (true);

create policy "Usuário comenta como ele mesmo"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Usuário apaga apenas os próprios comentários"
  on public.comments for delete
  using (auth.uid() = author_id);

create index if not exists comments_post_id_idx on public.comments(post_id);

-- ---------- STORAGE (imagens dos posts) ----------
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

create policy "Imagens de posts são públicas para leitura"
  on storage.objects for select
  using (bucket_id = 'posts');

create policy "Usuário autenticado envia imagens"
  on storage.objects for insert
  with check (bucket_id = 'posts' and auth.role() = 'authenticated');

create policy "Usuário apaga apenas as próprias imagens"
  on storage.objects for delete
  using (bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- STORAGE (fotos de perfil) ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatares são públicos para leitura"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Usuário autenticado envia avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Usuário substitui apenas o próprio avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Usuário apaga apenas o próprio avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- MESSAGES (mensagens diretas 1 a 1) ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint no_self_message check (sender_id <> recipient_id)
);

alter table public.messages enable row level security;

create policy "Usuário vê apenas as próprias conversas"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Usuário envia mensagens como ele mesmo"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Usuário marca como lida apenas mensagens recebidas"
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_recipient_id_idx on public.messages(recipient_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

-- Habilita eventos em tempo real na tabela de mensagens
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

-- ---------- NOTIFICATIONS ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'follow')),
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.notifications enable row level security;

create policy "Usuário vê apenas as próprias notificações"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Usuário marca como lidas apenas as próprias notificações"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);

-- Habilita eventos em tempo real na tabela de notificações
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

-- Funções (security definer) que criam a notificação automaticamente.
-- Rodam com privilégio elevado, então não precisam de política de insert pro usuário comum.

create or replace function public.notify_on_like()
returns trigger as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (post_author, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row execute procedure public.notify_on_like();

create or replace function public.notify_on_comment()
returns trigger as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (post_author, new.author_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute procedure public.notify_on_comment();

create or replace function public.notify_on_follow()
returns trigger as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_follow_created on public.follows;
create trigger on_follow_created
  after insert on public.follows
  for each row execute procedure public.notify_on_follow();

-- ---------- REACTIONS (emojis além da curtida: 🔥😂😮👏) ----------
create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '😂', '😮', '👏')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.reactions enable row level security;

create policy "Reações são públicas para leitura"
  on public.reactions for select
  using (true);

create policy "Usuário reage como ele mesmo"
  on public.reactions for insert
  with check (auth.uid() = user_id);

create policy "Usuário troca apenas a própria reação"
  on public.reactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário remove apenas a própria reação"
  on public.reactions for delete
  using (auth.uid() = user_id);

create index if not exists reactions_post_id_idx on public.reactions(post_id);

-- ---------- STORIES (expiram em 24h) ----------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.stories enable row level security;

create policy "Stories não expirados são públicos para leitura"
  on public.stories for select
  using (expires_at > now());

create policy "Usuário cria apenas os próprios stories"
  on public.stories for insert
  with check (auth.uid() = author_id);

create policy "Usuário apaga apenas os próprios stories"
  on public.stories for delete
  using (auth.uid() = author_id);

create index if not exists stories_author_id_idx on public.stories(author_id);
create index if not exists stories_expires_at_idx on public.stories(expires_at);

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.story_views enable row level security;

create policy "Usuário vê apenas as próprias visualizações"
  on public.story_views for select
  using (auth.uid() = viewer_id);

create policy "Autor vê visualizações dos próprios stories"
  on public.story_views for select
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_views.story_id and s.author_id = auth.uid()
    )
  );

create policy "Usuário registra visualização como ele mesmo"
  on public.story_views for insert
  with check (auth.uid() = viewer_id);

insert into storage.buckets (id, name, public)
values ('stories', 'stories', true)
on conflict (id) do nothing;

create policy "Imagens de stories são públicas para leitura"
  on storage.objects for select
  using (bucket_id = 'stories');

create policy "Usuário autenticado envia stories"
  on storage.objects for insert
  with check (bucket_id = 'stories' and auth.role() = 'authenticated');

create policy "Usuário apaga apenas os próprios arquivos de stories"
  on storage.objects for delete
  using (bucket_id = 'stories' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- ENDURECIMENTO DE SEGURANÇA ----------

-- Valida o formato do username também no banco (defesa extra, além do
-- formulário no navegador) — minúsculas, números, ponto e underscore.
alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-z0-9_.]{3,30}$');

alter table public.profiles
  drop constraint if exists profiles_bio_length;
alter table public.profiles
  add constraint profiles_bio_length
  check (bio is null or char_length(bio) <= 300);

-- Limita o tamanho dos textos de posts, comentários e mensagens no banco
-- (o app já limita no formulário, isso é a garantia final).
alter table public.posts
  drop constraint if exists posts_caption_length;
alter table public.posts
  add constraint posts_caption_length
  check (caption is null or char_length(caption) <= 2200);

alter table public.comments
  drop constraint if exists comments_content_length;
alter table public.comments
  add constraint comments_content_length
  check (char_length(content) between 1 and 2200);

alter table public.messages
  drop constraint if exists messages_content_length;
alter table public.messages
  add constraint messages_content_length
  check (char_length(content) between 1 and 2000);

-- Limita o tamanho dos arquivos enviados pros buckets de imagem (5 MB).
update storage.buckets set file_size_limit = 5242880 where id in ('posts', 'avatars', 'stories');
