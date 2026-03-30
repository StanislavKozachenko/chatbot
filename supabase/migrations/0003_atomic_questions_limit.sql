-- Replaces increment_questions_used with an atomic check-and-increment.
-- Returns true if the question was counted (under limit), false if limit reached.
-- Eliminates the race condition where two concurrent requests both pass the check
-- before either increments the counter.
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
