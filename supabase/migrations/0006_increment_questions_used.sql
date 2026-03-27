create or replace function increment_questions_used(user_id uuid)
returns void
language sql
security definer
as $$
  update profiles
  set questions_used = questions_used + 1
  where id = user_id;
$$;
