
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.escrows CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TYPE IF EXISTS public.escrow_status CASCADE;

CREATE TYPE public.pay_status AS ENUM ('pending', 'paid');

CREATE TABLE public.splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  note TEXT,
  payer_wallet TEXT NOT NULL,
  total_amount NUMERIC(18,2) NOT NULL CHECK (total_amount > 0),
  currency TEXT NOT NULL DEFAULT 'USDC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.splits(payer_wallet);

CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES public.splits(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  display_name TEXT,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  status public.pay_status NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.participants(split_id);
CREATE INDEX ON public.participants(wallet_address);

CREATE TRIGGER trg_splits_updated BEFORE UPDATE ON public.splits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read splits" ON public.splits FOR SELECT USING (true);
CREATE POLICY "public read participants" ON public.participants FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.splits;
