import { Card } from "@/components/ui/card";
import { Wallet, Users, Send, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Wallet, title: "Connect wallet", desc: "Use any EVM-compatible wallet (e.g. MetaMask) on Arc Sepolia." },
  { icon: Users, title: "Create a split", desc: "Add a title, total amount, and participants. Sign the message — no gas needed for off-chain steps." },
  { icon: Send, title: "Friends pay their share", desc: "Each participant clicks Pay, signs the USDC transfer in their wallet, and Arc settles in under a second." },
  { icon: CheckCircle2, title: "Done", desc: "The dashboard updates in real time. Everyone sees who paid, with on-chain proof." },
];

export default function HowItWorks() {
  return (
    <div className="container mx-auto max-w-3xl py-16">
      <h1 className="text-5xl font-bold tracking-tight">How SplitPay works</h1>
      <p className="text-muted-foreground mt-4 text-lg">
        SplitPay uses direct wallet-to-wallet USDC transfers on Arc — no smart contract, no
        custody, no waiting. Your wallet is the only thing that signs.
      </p>

      <div className="mt-12 space-y-4">
        {steps.map((s, i) => (
          <Card key={s.title} className="glass p-6 flex gap-5 items-start">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow shrink-0">
              <s.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground">STEP {i + 1}</div>
              <h3 className="font-semibold text-lg mt-1">{s.title}</h3>
              <p className="text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass mt-10 p-6">
        <h3 className="font-semibold">Why Arc?</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Arc is Circle's purpose-built Layer-1 for stablecoin finance. USDC is the native gas
          asset, finality is sub-second, and fees are predictable in USD — perfect for
          everyday peer-to-peer payments.
        </p>
      </Card>
    </div>
  );
}
