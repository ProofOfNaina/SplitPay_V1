import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeftRight, Copy, Check, ExternalLink, HelpCircle, Droplets, Loader2 } from "lucide-react";
import { ARC_ADD_PARAMS, ARC_CHAIN_HEX, ARC_FAUCET_URL, arcTestnet } from "@/lib/arc";
import { toast } from "sonner";

const fields = [
  { label: "Network name", value: arcTestnet.name },
  { label: "RPC URL", value: arcTestnet.rpcUrls.default.http[0] },
  { label: "Chain ID", value: String(arcTestnet.id) },
  { label: "Currency symbol", value: arcTestnet.nativeCurrency.symbol },
  { label: "Block explorer", value: arcTestnet.blockExplorers.default.url },
];

type BtnVariant = "ghost" | "outline" | "default" | "secondary" | "destructive" | "link";
type BtnSize = "sm" | "default" | "lg" | "icon";

export function ArcNetworkHelp({
  variant = "ghost",
  size = "sm",
}: { variant?: BtnVariant; size?: BtnSize } = {}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 1200);
  };

  const addToMetaMask = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      toast.error("MetaMask not detected. Install MetaMask first.");
      return;
    }
    setAdding(true);
    try {
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ARC_CHAIN_HEX }],
        });
        toast.success("Switched to Arc Testnet");
      } catch (err: any) {
        if (err?.code === 4902 || /Unrecognized chain/i.test(err?.message ?? "")) {
          await eth.request({ method: "wallet_addEthereumChain", params: [ARC_ADD_PARAMS] });
          toast.success("Arc Testnet added to MetaMask");
        } else {
          throw err;
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not add network");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5">
          <HelpCircle className="h-4 w-4" />
          Arc Testnet help
        </Button>
      </DialogTrigger>
      <DialogContent className="glass max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground text-xs font-bold">
              ◇
            </span>
            Connect MetaMask to Arc Testnet
          </DialogTitle>
          <DialogDescription>
            One-click add the network, or copy the details into MetaMask manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={addToMetaMask}
            disabled={adding}
            className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
          >
            {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
            Add / switch to Arc Testnet in MetaMask
          </Button>

          <div className="rounded-xl border border-border/60 bg-card/60 divide-y divide-border/60">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</div>
                  <div className="font-mono truncate">{f.value}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => copy(f.label, f.value)}
                >
                  {copied === f.label ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}
          </div>

          <a
            href={ARC_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center">
                <Droplets className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold">Get test USDC</div>
                <div className="text-xs text-muted-foreground">Circle faucet for Arc Testnet</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>

        <DialogFooter className="text-[11px] text-muted-foreground">
          Tip: open MetaMask → Networks → Add network manually, then paste the values above.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
