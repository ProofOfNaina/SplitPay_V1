import { supabase } from "@/integrations/supabase/client";

type SignFn = (msg: string) => Promise<string>;

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/splits-api`;

async function call(action: string, wallet: string, sign: SignFn, payload: Record<string, unknown>) {
  const timestamp = Date.now();
  const message = `SplitPay\nAction: ${action}\nTimestamp: ${timestamp}\nPayload: ${JSON.stringify(payload)}`;
  const signature = await sign(message);
  const res = await fetch(`${FN_URL}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ wallet, signature, timestamp, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  createSplit: (wallet: string, sign: SignFn, p: {
    title: string; note?: string; total_amount: number;
    participants: { wallet_address: string; display_name?: string; amount: number }[];
  }) => call("create_split", wallet, sign, p),
  markPaid: (wallet: string, sign: SignFn, participant_id: string, tx_hash?: string) =>
    call("mark_paid", wallet, sign, { participant_id, tx_hash }),
  confirmPaid: (wallet: string, sign: SignFn, participant_id: string) =>
    call("confirm_paid", wallet, sign, { participant_id }),
};

export { supabase };
