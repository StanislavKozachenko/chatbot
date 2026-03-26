-- Private storage bucket for uploaded documents (PDF, DOCX, TXT, MD)
insert into storage.buckets (id, name, public)
values ('files', 'files', false)
on conflict do nothing;
