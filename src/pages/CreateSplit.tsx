import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Equal, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useSigner } from "@/components/ConnectWallet";
import { arcTestnet } from "@/lib/arc";

type Row = { wallet_address: string; display_name: string; amount: string };

export default function CreateSplit() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const sign = useSigner();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [total, setTotal] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { wallet_address: "", display_name: "", amount: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const addRow = () => setRows((r) => [...r, { wallet_address: "", display_name: "", amount: "" }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const splitEqually = () => {
    const n = rows.length;
    const t = parseFloat(total);
    if (!n || !t) return toast.error("Enter total and add participants first");
    const each = (t / n).toFixed(2);
    setRows(rows.map((r) => ({ ...r, amount: each })));
  };

  const submit = async () => {
    if (!isConnected || !address) return toast.error("Connect your wallet first");
    if (chainId !== arcTestnet.id) {
      try {
        await switchChainAsync({ chainId: arcTestnet.id });
      } catch {
        return toast.error("Please switch to Arc Testnet to continue");
      }
    }
    if (!title.trim()) return toast.error("Add a title");
    const t = parseFloat(total);
    if (!t || t <= 0) return toast.error("Total must be greater than 0");
    for (const r of rows) {
      if (!isAddress(r.wallet_address)) return toast.error(`Invalid wallet: ${r.wallet_address || "(empty)"}`);
      const a = parseFloat(r.amount);
      if (!a || a <= 0) return toast.error("Each share must be > 0");
    }
    const sum = rows.reduce((s, r) => s + parseFloat(r.amount), 0);
    if (Math.abs(sum - t) > 0.01) return toast.error(`Shares (${sum.toFixed(2)}) ≠ total (${t.toFixed(2)})`);

    setSubmitting(true);
    try {
      toast.loading("Sign in your wallet to create the split…", { id: "sign" });
      const res = await api.createSplit(address, sign, {
        title: title.trim(),
        note: note.trim() || undefined,
        total_amount: t,
        participants: rows.map((r) => ({
          wallet_address: r.wallet_address,
          display_name: r.display_name || undefined,
          amount: parseFloat(r.amount),
        })),
      });
      toast.success("Split created!", { id: "sign" });
      nav(`/split/${res.split_id}`);
    } catch (e) {
      toast.error((e as Error).message, { id: "sign" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <h1 className="text-4xl font-bold tracking-tight">Create a split</h1>
      <p className="text-muted-foreground mt-2">
        You'll be the collector — friends will send their share in USDC to your wallet on Arc.
      </p>

      <Card className="glass mt-8 p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="Dinner at Olive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 bg-background/50"
            />
          </div>
          <div>
            <Label>Total amount (USDC)</Label>
            <Input
              type="number" step="0.01" min="0"
              placeholder="120.00"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="mt-2 bg-background/50 font-mono"
            />
          </div>
        </div>
        <div>
          <Label>Note (optional)</Label>
          <Textarea
            placeholder="Pizza + drinks, 5 ppl"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 bg-background/50"
          />
        </div>
      </Card>

      <Card className="glass mt-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Participants</h2>
            <p className="text-xs text-muted-foreground">Wallet addresses on Arc</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={splitEqually}>
              <Equal className="h-3.5 w-3.5 mr-1" /> Split equally
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Input
                placeholder="Name (optional)"
                value={r.display_name}
                onChange={(e) => update(i, { display_name: e.target.value })}
                className="col-span-3 bg-background/50"
              />
              <Input
                placeholder="0x…"
                value={r.wallet_address}
                onChange={(e) => update(i, { wallet_address: e.target.value })}
                className="col-span-6 bg-background/50 font-mono text-sm"
              />
              <Input
                type="number" step="0.01" min="0" placeholder="0.00"
                value={r.amount}
                onChange={(e) => update(i, { amount: e.target.value })}
                className="col-span-2 bg-background/50 font-mono"
              />
              <Button
                type="button" variant="ghost" size="icon"
                onClick={() => removeRow(i)} disabled={rows.length === 1}
                className="col-span-1"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-8 flex justify-end">
        {!isConnected ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Connect your wallet to create a split
          </div>
        ) : (
          <Button
            size="lg"
            onClick={submit}
            disabled={submitting}
            className="bg-gradient-primary text-primary-foreground shadow-glow font-semibold"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sign & create split
          </Button>
        )}
      </div>
    </div>
  );
}
