
CREATE TABLE public.investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL CHECK (service IN ('ai_trading','mining','staking')),
  name text NOT NULL,
  min_amount numeric NOT NULL DEFAULT 0,
  max_amount numeric,
  daily_rate_pct numeric,
  apy_pct numeric,
  duration_days integer,
  total_roi_pct numeric,
  flex text,
  badge text,
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_plans_service ON public.investment_plans(service, sort_order);

ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active plans"
  ON public.investment_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage plans"
  ON public.investment_plans FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_investment_plans_updated
  BEFORE UPDATE ON public.investment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed Mining
INSERT INTO public.investment_plans (service,name,min_amount,max_amount,daily_rate_pct,duration_days,total_roi_pct,is_popular,sort_order) VALUES
('mining','Mining Starter',100,999,1.2,30,36,false,1),
('mining','Mining Advanced',1000,4999,1.6,45,72,true,2),
('mining','Mining Premium',5000,24999,2.0,60,120,false,3),
('mining','Mining VIP',25000,250000,2.4,90,216,false,4);

-- Seed AI Trading
INSERT INTO public.investment_plans (service,name,min_amount,max_amount,daily_rate_pct,duration_days,total_roi_pct,is_popular,sort_order) VALUES
('ai_trading','AI Starter',100,999,1.5,30,45,false,1),
('ai_trading','AI Pro',1000,9999,2.0,45,90,true,2),
('ai_trading','AI Elite',10000,100000,2.5,60,150,false,3);

-- Seed Staking
INSERT INTO public.investment_plans (service,name,min_amount,apy_pct,duration_days,flex,is_popular,sort_order) VALUES
('staking','1 Month',50,12,30,'Flexible',false,1),
('staking','3 Months',250,18,90,'Fixed',false,2),
('staking','6 Months',1000,26,180,'Fixed',false,3),
('staking','12 Months',2500,38,365,'Fixed',true,4);
