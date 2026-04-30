
-- Profiles keyed by wallet address (lowercased)
CREATE TABLE public.profiles (
  wallet_address TEXT PRIMARY KEY,
  username TEXT,
  bio TEXT,
  reputation INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE public.escrow_status AS ENUM (
  'pending', 'funded', 'delivered', 'released', 'disputed', 'refunded'
);

CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_wallet TEXT NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_usdc NUMERIC(18,2) NOT NULL CHECK (price_usdc > 0),
  category TEXT NOT NULL,
  delivery_days INTEGER NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.listings(seller_wallet);
CREATE INDEX ON public.listings(category);

CREATE TABLE public.escrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  amount_usdc NUMERIC(18,2) NOT NULL CHECK (amount_usdc > 0),
  status public.escrow_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  description TEXT,
  fund_tx_hash TEXT,
  release_tx_hash TEXT,
  delivery_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.escrows(buyer_wallet);
CREATE INDEX ON public.escrows(seller_wallet);
CREATE INDEX ON public.escrows(status);

CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES public.escrows(id) ON DELETE CASCADE,
  raised_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_escrows_updated BEFORE UPDATE ON public.escrows
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS: public read; writes only via service role (edge functions)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "public read listings" ON public.listings FOR SELECT USING (true);
CREATE POLICY "public read escrows" ON public.escrows FOR SELECT USING (true);
CREATE POLICY "public read disputes" ON public.disputes FOR SELECT USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrows;
