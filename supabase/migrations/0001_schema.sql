-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Profiles: extends auth.users with app-specific data.
-- questions_used tracks anonymous 3-question limit (is_anonymous read from auth.users natively).
-- Auto-created via trigger on auth.users insert.
create table profiles (
  id             uuid        primary key references auth.users(id) on delete cascade,
  display_name   text,
  avatar_url     text,
  questions_used integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Chats
create table chats (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  title      text        not null default 'New Chat',
  model      text        not null default 'google/gemini-2.0-flash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chats_user_id_idx    on chats(user_id);
create index chats_created_at_idx on chats(created_at desc);

-- Messages: parts stores the AI SDK UIMessage parts array (text, image, tool-call etc.)
-- attachments stores uploaded image metadata [{type, url, name}]
create table messages (
  id          uuid        primary key default gen_random_uuid(),
  chat_id     uuid        not null references chats(id) on delete cascade,
  role        text        not null check (role in ('user', 'assistant')),
  parts       jsonb       not null default '[]'::jsonb,
  attachments jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index messages_chat_id_idx    on messages(chat_id);
create index messages_created_at_idx on messages(created_at asc);

-- Files: metadata for uploaded documents (PDF, DOCX, TXT, MD).
-- Actual file stored in Supabase Storage bucket "files".
create table files (
  id           uuid        primary key default gen_random_uuid(),
  chat_id      uuid        not null references chats(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null,
  file_type    text        not null,
  file_size    integer     not null,
  storage_path text        not null,
  tokens       integer     not null default 0,
  created_at   timestamptz not null default now()
);

create index files_chat_id_idx on files(chat_id);

-- File items: document chunks with vector embeddings for RAG.
-- embedding: Cohere embed-english-v3.0 → 1024 dimensions.
-- HNSW index enables fast approximate nearest-neighbour search.
create table file_items (
  id          uuid        primary key default gen_random_uuid(),
  file_id     uuid        not null references files(id) on delete cascade,
  chat_id     uuid        not null references chats(id) on delete cascade,
  content     text        not null,
  embedding   vector(1024),
  chunk_index integer     not null,
  created_at  timestamptz not null default now()
);

create index file_items_file_id_idx on file_items(file_id);
create index file_items_chat_id_idx on file_items(chat_id);

create index file_items_embedding_idx on file_items
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Message file items: tracks which file chunks (RAG context) were used per assistant message.
-- Enables showing sources/citations and debugging retrieval quality.
create table message_file_items (
  message_id   uuid not null references messages(id)    on delete cascade,
  file_item_id uuid not null references file_items(id)  on delete cascade,
  primary key (message_id, file_item_id)
);

create index message_file_items_message_id_idx   on message_file_items(message_id);
create index message_file_items_file_item_id_idx on message_file_items(file_item_id);

-- match_file_items: cosine similarity search used in the RAG retrieval pipeline.
-- Returns top-N chunks for a given chat ordered by similarity.
create or replace function match_file_items(
  query_embedding vector(1024),
  match_count     int,
  match_threshold float,
  p_chat_id       uuid
)
returns table (
  id          uuid,
  file_id     uuid,
  content     text,
  chunk_index int,
  similarity  float
)
language sql stable
as $$
  select
    fi.id,
    fi.file_id,
    fi.content,
    fi.chunk_index,
    1 - (fi.embedding <=> query_embedding) as similarity
  from file_items fi
  where fi.chat_id = p_chat_id
    and fi.embedding is not null
    and 1 - (fi.embedding <=> query_embedding) > match_threshold
  order by fi.embedding <=> query_embedding
  limit match_count;
$$;

-- check_and_increment_questions: atomically checks the limit and increments.
-- Returns true if the question was counted (under limit), false if limit reached.
create or replace function check_and_increment_questions(p_user_id uuid, p_limit int)
returns boolean
language plpgsql
as $$
declare
  updated int;
begin
  update profiles
  set questions_used = questions_used + 1
  where id = p_user_id and questions_used < p_limit;

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- Auto-update updated_at on row modification
create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

create trigger chats_updated_at
  before update on chats
  for each row execute procedure handle_updated_at();

-- Auto-create profile on Supabase Auth user signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Enable Realtime for cross-tab sync on chats and messages tables
alter publication supabase_realtime add table chats;
alter publication supabase_realtime add table messages;
