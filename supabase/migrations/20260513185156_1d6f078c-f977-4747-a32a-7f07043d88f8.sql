
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'awaiting_customer', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Generate human-friendly ticket numbers
CREATE SEQUENCE public.ticket_number_seq START 1001;

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE DEFAULT ('NV-' || nextval('public.ticket_number_seq')::text),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  binance_uid text,
  category text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'normal',
  status ticket_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tickets_email_idx ON public.tickets(email);
CREATE INDEX tickets_status_idx ON public.tickets(status);
CREATE INDEX tickets_user_id_idx ON public.tickets(user_id);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can submit a ticket
CREATE POLICY "Anyone can create a ticket" ON public.tickets
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Users can view their own tickets (matched by user_id when logged in)
CREATE POLICY "Users can view their own tickets" ON public.tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can view & manage all tickets
CREATE POLICY "Admins can view all tickets" ON public.tickets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage tickets" ON public.tickets
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public lookup by ticket_number + email (so guests can track their ticket)
CREATE OR REPLACE FUNCTION public.lookup_ticket(_ticket_number text, _email text)
RETURNS TABLE (
  ticket_number text,
  subject text,
  category text,
  status ticket_status,
  priority ticket_priority,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.ticket_number, t.subject, t.category, t.status, t.priority,
         t.created_at, t.updated_at, t.resolved_at
  FROM public.tickets t
  WHERE t.ticket_number = _ticket_number
    AND lower(t.email) = lower(_email)
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.lookup_ticket(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_ticket(text, text) TO anon, authenticated;

-- Ticket replies thread
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  is_staff boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ticket_messages_ticket_id_idx ON public.ticket_messages(ticket_id);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ticket owners can view messages" ON public.ticket_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Ticket owners can post messages" ON public.ticket_messages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    AND author_id = auth.uid()
    AND is_staff = false
  );
CREATE POLICY "Admins can view all messages" ON public.ticket_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage messages" ON public.ticket_messages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER tickets_set_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
