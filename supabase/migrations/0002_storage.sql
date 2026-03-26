-- Storage bucket for message image attachments
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict do nothing;
