// SplitPay backend: signature-verified writes + on-chain tx verification on Arc
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  verifyMessage, getAddress, isAddress, createPublicClient, http, defineChain, parseEther,
} from "https://esm.sh/viem@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
});

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySig(wallet: string, message: string, signature: string) {
  if (!isAddress(wallet)) return false;
  try {
    return await verifyMessage({
      address: getAddress(wallet),
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}

function buildMessage(action: string, payload: Record<string, unknown>, ts: number) {
  return `SplitPay\nAction: ${action}\nTimestamp: ${ts}\nPayload: ${JSON.stringify(payload)}`;
}

async function verifyTxOnArc(txHash: string, fromWallet: string, toWallet: string, amount: number) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return { ok: false, reason: "Invalid tx hash format" };
  }
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
    if (!receipt || receipt.status !== "success") {
      return { ok: false, reason: "Transaction not confirmed yet — try again in a moment" };
    }
    const tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
    if (!tx) return { ok: false, reason: "Transaction not found" };

    if (tx.from.toLowerCase() !== fromWallet.toLowerCase()) {
      return { ok: false, reason: "Transaction sender does not match your wallet" };
    }
    if (!tx.to || tx.to.toLowerCase() !== toWallet.toLowerCase()) {
      return { ok: false, reason: "Transaction recipient does not match the collector" };
    }
    const expected = parseEther(String(amount));
    // allow small overpayment, never underpayment
    if (tx.value < expected) {
      return { ok: false, reason: `Amount too low. Expected ${amount} USDC` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message || "Could not verify transaction" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    const body = await req.json();
    const { wallet, signature, timestamp, payload } = body ?? {};

    if (!wallet || !signature || !timestamp || !payload) {
      return json({ error: "Missing wallet/signature/timestamp/payload" }, 400);
    }
    if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) {
      return json({ error: "Signature expired, please retry" }, 400);
    }

    const message = buildMessage(action!, payload, Number(timestamp));
    const ok = await verifySig(wallet, message, signature);
    if (!ok) return json({ error: "Invalid signature" }, 401);

    const me = getAddress(wallet).toLowerCase();

    if (action === "create_split") {
      const { title, note, total_amount, participants } = payload;
      if (!title || !total_amount || !Array.isArray(participants) || participants.length === 0) {
        return json({ error: "Invalid split payload" }, 400);
      }
      const { data: split, error: e1 } = await supabase
        .from("splits")
        .insert({ title, note: note || null, payer_wallet: me, total_amount })
        .select()
        .single();
      if (e1) return json({ error: e1.message }, 500);

      const rows = participants.map((p: any) => ({
        split_id: split.id,
        wallet_address: isAddress(p.wallet_address)
          ? getAddress(p.wallet_address).toLowerCase()
          : p.wallet_address.toLowerCase(),
        display_name: p.display_name || null,
        amount: p.amount,
      }));
      const { error: e2 } = await supabase.from("participants").insert(rows);
      if (e2) return json({ error: e2.message }, 500);

      return json({ split_id: split.id });
    }

    // mark_paid: participant submits a tx_hash; backend verifies it on-chain.
    if (action === "mark_paid") {
      const { participant_id, tx_hash } = payload as { participant_id: string; tx_hash?: string };
      const { data: p, error: e1 } = await supabase
        .from("participants")
        .select("*, splits(payer_wallet)")
        .eq("id", participant_id)
        .single();
      if (e1 || !p) return json({ error: "Participant not found" }, 404);
      if (p.wallet_address.toLowerCase() !== me) {
        return json({ error: "Not your participant slot" }, 403);
      }
      if (!tx_hash) return json({ error: "Transaction hash required" }, 400);

      // @ts-ignore join
      const collector = p.splits.payer_wallet as string;
      const verified = await verifyTxOnArc(tx_hash, me, collector, Number(p.amount));
      if (!verified.ok) return json({ error: verified.reason }, 400);

      const { error: e2 } = await supabase
        .from("participants")
        .update({ status: "paid", tx_hash, paid_at: new Date().toISOString() })
        .eq("id", participant_id);
      if (e2) return json({ error: e2.message }, 500);
      return json({ ok: true, verified: true });
    }

    // confirm_paid: payer manually confirms (e.g. off-chain settlement)
    if (action === "confirm_paid") {
      const { participant_id } = payload;
      const { data: p } = await supabase
        .from("participants")
        .select("*, splits(payer_wallet)")
        .eq("id", participant_id)
        .single();
      if (!p) return json({ error: "Not found" }, 404);
      // @ts-ignore join
      if (p.splits.payer_wallet.toLowerCase() !== me) {
        return json({ error: "Only the payer can confirm" }, 403);
      }
      const { error } = await supabase
        .from("participants")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", participant_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 404);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
