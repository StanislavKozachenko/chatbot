-- Public bucket for message image attachments
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict do nothing;

-- Private bucket for uploaded documents (PDF, DOCX, TXT, MD)
insert into storage.buckets (id, name, public)
values ('files', 'files', false)
on conflict do nothing;
