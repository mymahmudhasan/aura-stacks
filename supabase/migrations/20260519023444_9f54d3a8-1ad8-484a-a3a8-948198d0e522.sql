
-- Live support chat
create table public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  guest_name text not null,
  guest_email text,
  status text not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.support_conversations enable row level security;

create policy "Admins manage support conversations" on public.support_conversations
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'::app_role))
  with check (public.has_role(auth.uid(),'admin'::app_role));

create policy "Users view own support conversation" on public.support_conversations
  for select to authenticated
  using (user_id = auth.uid());

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender text not null check (sender in ('user','admin')),
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.support_messages enable row level security;
create index support_messages_conv_idx on public.support_messages (conversation_id, created_at);

create policy "Admins manage support messages" on public.support_messages
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'::app_role))
  with check (public.has_role(auth.uid(),'admin'::app_role));

create policy "Users view own support messages" on public.support_messages
  for select to authenticated
  using (exists (
    select 1 from public.support_conversations c
    where c.id = support_messages.conversation_id and c.user_id = auth.uid()
  ));

-- Bump last_message_at on each new message
create or replace function public.bump_support_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.support_conversations
     set last_message_at = now(),
         status = case when status = 'closed' then 'open' else status end
   where id = NEW.conversation_id;
  return NEW;
end $$;

create trigger on_support_message_insert
after insert on public.support_messages
for each row execute function public.bump_support_last_message();

-- Realtime (admin subscribes via RLS; guests use broadcast)
alter publication supabase_realtime add table public.support_conversations;
alter publication supabase_realtime add table public.support_messages;
