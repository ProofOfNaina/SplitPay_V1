import { useAccount, useChainId, useSignMessage, useSwitchChain } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, Check, AlertTriangle, Loader2, ArrowLeftRight, User } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import { ARC_ADD_PARAMS, ARC_CHAIN_HEX, arcTestnet } from "@/lib/arc";

export function short(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

async function ensureArcNetwork() {
  const eth = (window as any).ethereum;
  if (!eth) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_CHAIN_HEX }] });
  } catch (err: any) {
    if (err?.code === 4902 || /Unrecognized chain/i.test(err?.message ?? "")) {
      await eth.request({ method: "wallet_addEthereumChain", params: [ARC_ADD_PARAMS] });
    }
  }
}

export function ConnectWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const [copied, setCopied] = useState(false);

  const wrongChain = isConnected && chainId !== arcTestnet.id;
  const displayAddr = address ?? (wallets[0]?.address as `0x${string}` | undefined);

  const copy = async () => {
    if (!displayAddr) return;
    await navigator.clipboard.writeText(displayAddr);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLogin = async () => {
    try {
      await login();
      // After login, try to ensure Arc Testnet
      try {
        await switchChainAsync({ chainId: arcTestnet.id });
      } catch {
        await ensureArcNetwork();
      }
    } catch (e: any) {
      if (!/cancel|reject/i.test(e?.message ?? "")) {
        toast.error(e?.message || "Failed to connect");
      }
    }
  };

  const switchToArc = async () => {
    try {
      // Prefer the active wallet's switch (works with Privy embedded + injected)
      const active = wallets[0];
      if (active?.switchChain) {
        await active.switchChain(arcTestnet.id);
      } else {
        await switchChainAsync({ chainId: arcTestnet.id });
      }
      toast.success("Switched to Arc Testnet");
    } catch {
      await ensureArcNetwork();
    }
  };

  if (!ready) {
    return (
      <Button disabled className="bg-gradient-primary text-primary-foreground font-semibold opacity-70">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading
      </Button>
    );
  }

  if (!authenticated || !displayAddr) {
    return (
      <Button
        onClick={handleLogin}
        className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow font-semibold"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {wrongChain && (
        <Button
          variant="outline"
          size="sm"
          onClick={switchToArc}
          disabled={switching}
          className="border-warning/40 text-warning hover:bg-warning/10"
        >
          {switching ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
          Switch to Arc
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="glass font-mono">
            <span className={`h-2 w-2 rounded-full mr-2 ${wrongChain ? "bg-warning" : "bg-success animate-pulse"}`} />
            {short(displayAddr)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass w-64">
          <DropdownMenuLabel className="font-mono text-xs text-muted-foreground">
            {short(displayAddr)}
          </DropdownMenuLabel>
          <DropdownMenuLabel className="text-[10px] text-muted-foreground -mt-2">
            {wrongChain ? `Wrong network (${chainId})` : `Arc Testnet · ${chainId}`}
          </DropdownMenuLabel>
          {user?.email?.address && (
            <DropdownMenuLabel className="text-[10px] text-muted-foreground -mt-2 truncate">
              <User className="inline h-2.5 w-2.5 mr-1" />{user.email.address}
            </DropdownMenuLabel>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copy}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy address
          </DropdownMenuItem>
          {wrongChain && (
            <DropdownMenuItem onClick={switchToArc}>
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Switch to Arc
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function useSigner() {
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  return (msg: string) => {
    if (!address) throw new Error("Wallet not connected");
    return signMessageAsync({ account: address, message: msg });
  };
}
