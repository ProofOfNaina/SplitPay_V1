-- Lock down profiles: no anonymous enumeration
DROP POLICY IF EXISTS "public read profiles" ON public.profiles;

-- Splits & participants: keep readable (shareable link is core feature),
-- but document this is intentional via a comment.
COMMENT ON TABLE public.splits IS 'Publicly readable by design — splits are shared via URL containing the UUID. Writes are gated by signature verification in the splits-api edge function.';
COMMENT ON TABLE public.participants IS 'Publicly readable by design — exposed via shareable split URLs. Writes are gated by signature verification.';

-- Profiles: only the owner (matched by wallet) can read their profile via the edge function.
-- Block anonymous SELECT entirely; profile data is non-essential to the app's public surface.
-- (No new SELECT policy = denied by default with RLS enabled.)
