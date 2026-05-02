import { Sparkles, Github } from "lucide-react";
import { ArcNetworkHelp } from "./ArcNetworkHelp";

export function Footer() {
  return (
    <footer className="relative border-t border-border/40 mt-32 bg-background/30 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
      <div className="container relative mx-auto py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-sm">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">SplitPay</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            The fastest way to split expenses on the Arc Network. 
            Native USDC settlement, zero friction, total transparency.
          </p>
          <div className="pt-2">
            <ArcNetworkHelp variant="outline" size="sm" className="glass hover:bg-primary/5 transition-colors" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/80">Product</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><a href="/how" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform">How it works</a></li>
            <li><a href="/create" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform">Create a split</a></li>
            <li><a href="/splits" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform">My splits</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/80">Resources</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><a href="https://docs.arc.network/integrate" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform">Arc Documentation</a></li>
            <li><a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform">Circle Faucet</a></li>
            <li><a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors hover:translate-x-1 inline-block transform">Arcscan Explorer</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="container mx-auto py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-medium text-muted-foreground/60 tracking-wider uppercase">
          <span>© {new Date().getFullYear()} SplitPay Protocol</span>
          
          <a
            href="https://github.com/proofofnaina"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 hover:text-foreground transition-all duration-300"
          >
            <span>Designed & developed by</span>
            <span className="text-foreground font-bold group-hover:gradient-text transition-all">proofofnaina</span>
            <Github className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          </a>

          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-success/5 border border-success/10 text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Built on Arc</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
