-- Drop permissive public read policies
DROP POLICY IF EXISTS "public read splits" ON public.splits;
DROP POLICY IF EXISTS "public read participants" ON public.participants;

-- Deny all direct SELECT access from clients; reads must go through SECURITY DEFINER RPCs below
CREATE POLICY "no direct read splits"
  ON public.splits FOR SELECT
  USING (false);

CREATE POLICY "no direct read participants"
  ON public.participants FOR SELECT
  USING (false);

-- RPC: fetch a single split by UUID (shareable-link flow). Returns null if not found.
CREATE OR REPLACE FUNCTION public.get_split_by_id(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(s) || jsonb_build_object(
    'participants', COALESCE(
      (SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at)
         FROM public.participants p
        WHERE p.split_id = s.id),
      '[]'::jsonb
    )
  )
  FROM public.splits s
  WHERE s.id = p_id;
$$;

-- RPC: list splits a wallet created or participates in
CREATE OR REPLACE FUNCTION public.list_splits_for_wallet(p_wallet text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH wallet AS (SELECT lower(p_wallet) AS w),
  ids AS (
    SELECT s.id FROM public.splits s, wallet WHERE s.payer_wallet = wallet.w
    UNION
    SELECT p.split_id FROM public.participants p, wallet WHERE p.wallet_address = wallet.w
  )
  SELECT COALESCE(jsonb_agg(
    to_jsonb(s) || jsonb_build_object(
      'participants', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
            'status', p.status,
            'wallet_address', p.wallet_address,
            'amount', p.amount
         ))
         FROM public.participants p WHERE p.split_id = s.id),
        '[]'::jsonb
      )
    )
    ORDER BY s.created_at DESC
  ), '[]'::jsonb)
  FROM public.splits s
  WHERE s.id IN (SELECT id FROM ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_split_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_splits_for_wallet(text) TO anon, authenticated;