-- Enable Realtime for cross-tab sync on chats and messages tables
alter publication supabase_realtime add table chats;
alter publication supabase_realtime add table messages;
