-- Update embedding dimension from 768 (Google text-embedding-004)
-- to 1024 (Mistral mistral-embed)
alter table file_items alter column embedding type vector(1024);

drop index if exists file_items_embedding_idx;
create index file_items_embedding_idx on file_items
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Update match_file_items function signature
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
