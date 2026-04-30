import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAccount, useChainId, useSendTransaction, useSwitchChain } from "wagmi";
import { parseEther } from "viem";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Check, Copy, Loader2, Share2, Wallet, Clock, ExternalLink, Sparkles, ShieldCheck, Link2, QrCode, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useSigner, short } from "@/components/ConnectWallet";
import { arcTestnet } from "@/lib/arc";

type Participant = {
  id: string; wallet_address: string; display_name: string | null;
  amount: number; status: "pending" | "paid"; tx_hash: string | null; paid_at: string | null;
};
type Split = {
  id: string; title: string; note: string | null; payer_wallet: string;
  total_amount: number; currency: string; created_at: string;
  participants: Participant[];
};

export default function SplitDetail() {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const sign = useSigner();
  const { sendTransactionAsync } = useSendTransaction();
  const [split, setSplit] = useState<Split | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualHash, setManualHash] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase
        .from("splits")
        .select("*, participants(*)")
        .eq("id", id)
        .single();
      if (data) {
        const sorted = { ...(data as any) };
        sorted.participants = [...(data as any).participants].sort((a: any, b: any) =>
          a.created_at.localeCompare(b.created_at),
        );
        setSplit(sorted as any);
      }
    };
    load();
    const ch = supabase
      .channel(`split-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `split_id=eq.${id}` },
        (payload) => {
          load();
          if (payload.eventType === "UPDATE" && (payload.new as any)?.status === "paid") {
            toast.success(`💸 Payment received from ${short((payload.new as any).wallet_address)}`);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=0F1118&color=10F5A3&data=${encodeURIComponent(shareUrl)}`,
    [shareUrl],
  );

  if (!split) return (
    <div className="container mx-auto py-32 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground mt-3 text-sm">Loading split…</p>
    </div>
  );

  const paidCount = split.participants.filter((p) => p.status === "paid").length;
  const total = split.participants.length;
  const collected = split.participants.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const isPayer = address?.toLowerCase() === split.payer_wallet.toLowerCase();
  const myParticipant = split.participants.find((p) => p.wallet_address.toLowerCase() === address?.toLowerCase());
  const progress = total ? (paidCount / total) * 100 : 0;
  const allPaid = paidCount === total && total > 0;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied", { description: "Send it to your friends to collect their share." });
  };

  const ensureChain = async () => {
    if (chainId !== arcTestnet.id) {
      try { await switchChainAsync({ chainId: arcTestnet.id }); }
      catch { throw new Error("Please switch to Arc Testnet to pay"); }
    }
  };

  const pay = async (p: Participant) => {
    if (!address) return toast.error("Connect your wallet");
    setBusyId(p.id);
    try {
      await ensureChain();
      toast.loading("Confirm payment in your wallet…", { id: "pay" });
      const value = parseEther(String(p.amount));
      const hash = await sendTransactionAsync({
        to: split.payer_wallet as `0x${string}`,
        value,
        chainId: arcTestnet.id,
      });
      toast.loading("Verifying transaction on Arc…", { id: "pay" });
      // Sign & report — backend re-checks the tx on-chain
      await api.markPaid(address, sign, p.id, hash);
      toast.success("Payment verified on-chain ✓", { id: "pay" });
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Payment failed", { id: "pay" });
    } finally {
      setBusyId(null);
    }
  };

  const submitManual = async () => {
    if (!address || !myParticipant) return;
    if (!/^0x[0-9a-fA-F]{64}$/.test(manualHash.trim())) {
      return toast.error("That doesn't look like a valid tx hash");
    }
    setManualSubmitting(true);
    try {
      toast.loading("Verifying on Arc…", { id: "man" });
      await api.markPaid(address, sign, myParticipant.id, manualHash.trim());
      toast.success("Verified ✓", { id: "man" });
      setManualOpen(false);
      setManualHash("");
    } catch (e: any) {
      toast.error(e?.message || "Verification failed", { id: "man" });
    } finally {
      setManualSubmitting(false);
    }
  };

  const confirmManual = async (p: Participant) => {
    if (!address) return;
    setBusyId(p.id);
    try {
      toast.loading("Sign to confirm…", { id: "conf" });
      await api.confirmPaid(address, sign, p.id);
      toast.success("Marked as paid", { id: "conf" });
    } catch (e) {
      toast.error((e as Error).message, { id: "conf" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-12">
      {/* Header card — diagonal accent */}
      <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-10">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="font-mono">{split.currency}</Badge>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                <Zap className="h-2.5 w-2.5 mr-1" /> Arc Testnet
              </Badge>
              {allPaid && <Badge className="bg-success/20 text-success border-success/30">Settled</Badge>}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{split.title}</h1>
            {split.note && <p className="text-muted-foreground mt-2 max-w-2xl">{split.note}</p>}
            <div className="text-xs text-muted-foreground mt-4">
              Collector <span className="font-mono text-foreground ml-1">{short(split.payer_wallet)}</span>
              {isPayer && <Badge className="ml-2 bg-primary/15 text-primary border-primary/30">You</Badge>}
            </div>
          </div>

          {/* Share dialog with QR */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow shrink-0">
                <Share2 className="h-4 w-4 mr-2" /> Share split
              </Button>
            </DialogTrigger>
            <DialogContent className="glass max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">Invite your friends</DialogTitle>
                <DialogDescription>
                  Share the link or QR. Anyone with the link can pay their share — no signup required.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-2xl bg-card/60 p-5 grid place-items-center">
                <img src={qrUrl} alt="Split QR code" className="rounded-xl" width={200} height={200} loading="lazy" />
              </div>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="bg-background/50 font-mono text-xs" />
                <Button onClick={copyLink} className="bg-gradient-primary text-primary-foreground shrink-0">
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Link2 className="h-3 w-3" /> Tip: posts to iMessage, Telegram, or WhatsApp render this perfectly.
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Big numbers + progress */}
        <div className="relative mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Total" value={`$${Number(split.total_amount).toFixed(2)}`} />
          <Stat label="Collected" value={`$${collected.toFixed(2)}`} accent="success" />
          <Stat label="Remaining" value={`$${(Number(split.total_amount) - collected).toFixed(2)}`} />
          <Stat label="Paid" value={`${paidCount}/${total}`} />
        </div>
        <div className="relative mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-secondary/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="mt-10 flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Participants</h2>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Updates live as people pay
          </p>
        </div>
        {myParticipant && myParticipant.status === "pending" && (
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="glass">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> I already paid
              </Button>
            </DialogTrigger>
            <DialogContent className="glass max-w-md">
              <DialogHeader>
                <DialogTitle>Verify your payment</DialogTitle>
                <DialogDescription>
                  Paste the transaction hash from your wallet. We'll check on Arc that it came from{" "}
                  <span className="font-mono">{short(address)}</span> to{" "}
                  <span className="font-mono">{short(split.payer_wallet)}</span> for{" "}
                  <span className="font-mono">${Number(myParticipant.amount).toFixed(2)} USDC</span>.
                </DialogDescription>
              </DialogHeader>
              <Input
                placeholder="0x…"
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                className="bg-background/50 font-mono text-xs"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
                <Button
                  onClick={submitManual}
                  disabled={manualSubmitting}
                  className="bg-gradient-primary text-primary-foreground"
                >
                  {manualSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Verify on-chain
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {split.participants.map((p, idx) => {
          const isMe = p.wallet_address.toLowerCase() === address?.toLowerCase();
          const pct = total ? ((idx + 1) / total) * 100 : 0;
          return (
            <div key={p.id} className="relative">
              {/* timeline dot */}
              <Card className={`glass p-4 md:p-5 flex items-center gap-4 transition-all hover:border-primary/30 ${
                p.status === "paid" ? "border-success/30" : ""
              }`}>
                <div className={`relative h-12 w-12 rounded-2xl grid place-items-center text-sm font-bold shrink-0 ${
                  p.status === "paid"
                    ? "bg-gradient-to-br from-success/30 to-success/10 text-success"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {p.status === "paid" ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  {p.status === "paid" && (
                    <span className="absolute inset-0 rounded-2xl ring-2 ring-success/40 animate-pulse pointer-events-none" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">
                      {p.display_name || short(p.wallet_address)}
                    </span>
                    {isMe && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">You</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate flex items-center gap-2 mt-0.5">
                    {short(p.wallet_address)}
                    {p.tx_hash && (
                      <a
                        href={`${arcTestnet.blockExplorers.default.url}/tx/${p.tx_hash}`}
                        target="_blank" rel="noreferrer"
                        className="text-primary inline-flex items-center hover:underline"
                      >
                        view tx <ExternalLink className="h-3 w-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-lg">${Number(p.amount).toFixed(2)}</div>
                  {p.status === "paid" ? (
                    <div className="text-xs text-success flex items-center justify-end gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </div>
                  ) : isMe ? (
                    <Button
                      size="sm"
                      className="mt-1 bg-gradient-primary text-primary-foreground shadow-glow"
                      onClick={() => pay(p)}
                      disabled={busyId === p.id}
                    >
                      {busyId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Wallet className="h-3 w-3 mr-1" /> Pay now</>}
                    </Button>
                  ) : isPayer ? (
                    <Button
                      size="sm" variant="outline" className="mt-1"
                      onClick={() => confirmManual(p)} disabled={busyId === p.id}
                    >
                      {busyId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark paid"}
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground">Pending</div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {!isConnected && (
        <Card className="glass mt-8 p-6 text-center">
          <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Connect your wallet to pay your share or manage this split.
          </p>
        </Card>
      )}

      {allPaid && (
        <Card className="glass mt-8 p-6 text-center border-success/30">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="font-bold text-lg">All settled!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Every participant has paid in USDC on Arc. Nothing left to collect.
          </p>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "success" }) {
  return (
    <div className="rounded-2xl bg-background/40 border border-border/50 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-2xl md:text-3xl font-bold font-mono mt-1 ${accent === "success" ? "text-success" : ""}`}>
        {value}
      </div>
    </div>
  );
}
