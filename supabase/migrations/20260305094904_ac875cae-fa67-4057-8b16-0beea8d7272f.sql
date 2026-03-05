CREATE TABLE public.event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid,
  target_id uuid,
  target_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view event logs"
  ON public.event_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_event_logs_event_type ON public.event_logs(event_type);
CREATE INDEX idx_event_logs_created_at ON public.event_logs(created_at DESC);
CREATE INDEX idx_event_logs_actor_id ON public.event_logs(actor_id);
CREATE INDEX idx_event_logs_target_id ON public.event_logs(target_id);