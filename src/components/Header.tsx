import { Link, useLocation } from "react-router-dom";
import { ConnectWallet } from "./ConnectWallet";
import { ArcNetworkHelp } from "./ArcNetworkHelp";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/splits", label: "My Splits" },
  { to: "/create", label: "Create" },
  { to: "/how", label: "How it works" },
];

export function Header() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg">SplitPay</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">on Arc</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                pathname === l.to
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ArcNetworkHelp />
          </div>
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
