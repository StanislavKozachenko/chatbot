-- Enable row level security on every app table.
-- API routes use the service role key, which bypasses RLS, so server access is unchanged.
-- Without RLS the public anon key can read and modify all rows through the REST API.
alter table profiles           enable row level security;
alter table chats              enable row level security;
alter table messages           enable row level security;
alter table files              enable row level security;
alter table file_items         enable row level security;
alter table message_file_items enable row level security;

-- Realtime postgres_changes respects RLS: the browser client only receives its own rows.
create policy "Users can read own chats"
  on chats for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read messages of own chats"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from chats
      where chats.id = messages.chat_id
        and chats.user_id = (select auth.uid())
    )
  );
