-- Link live chat conversations to tickets so each chat opens exactly one ticket.
ALTER TABLE public.support_conversations
  ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS support_conversations_ticket_id_idx
  ON public.support_conversations(ticket_id);

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'form',
  ADD COLUMN IF NOT EXISTS source_conversation_id uuid REFERENCES public.support_conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tickets_source_conversation_id_idx
  ON public.tickets(source_conversation_id);