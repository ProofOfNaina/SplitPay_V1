import { Sparkles, Github, Heart } from "lucide-react";
import { ArcNetworkHelp } from "./ArcNetworkHelp";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container mx-auto py-10 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-primary grid place-items-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">SplitPay</span>
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-md">
            Instant bill splitting in USDC, settled on Arc — Circle's purpose-built
            stablecoin chain.
          </p>
          <div className="mt-4">
            <ArcNetworkHelp variant="outline" size="sm" />
          </div>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-3">Product</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="/how" className="hover:text-foreground">How it works</a></li>
            <li><a href="/create" className="hover:text-foreground">Create a split</a></li>
            <li><a href="/splits" className="hover:text-foreground">My splits</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-3">Resources</div>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="https://docs.arc.network/integrate" target="_blank" rel="noreferrer" className="hover:text-foreground">Arc docs</a></li>
            <li><a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="hover:text-foreground">Arc faucet</a></li>
            <li><a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="hover:text-foreground">Arcscan explorer</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} SplitPay</span>
          <a
            href="https://github.com/proofofnaina"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            Designed & developed with
            <Heart className="h-3 w-3 text-destructive group-hover:scale-110 transition-transform" />
            by
            <span className="font-semibold gradient-text">proofofnaina</span>
            <Github className="h-3.5 w-3.5" />
          </a>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Built on Arc
          </span>
        </div>
      </div>
    </footer>
  );
}
