import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, ShieldCheck, Users, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="container relative mx-auto py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Powered by Arc — Circle's stablecoin chain
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Split bills.<br />
            <span className="gradient-text">Settle in seconds.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            No more "I'll pay you back later." Create a split, share the link, friends pay
            instantly in USDC on Arc. Wallet-native, no IOUs, no waiting.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow font-semibold">
              <Link to="/create">
                Create a split <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass">
              <Link to="/how">How it works</Link>
            </Button>
          </div>

          {/* Mini stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { k: "<1s", v: "Settlement" },
              { k: "USDC", v: "Native gas" },
              { k: "0", v: "IOUs left" },
            ].map((s) => (
              <div key={s.v} className="glass rounded-2xl p-5">
                <div className="text-2xl md:text-3xl font-bold gradient-text">{s.k}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Instant", desc: "Sub-second finality on Arc means money moves the moment your friend signs." },
            { icon: ShieldCheck, title: "Trustless", desc: "Each payment is a signed wallet transaction. No middlemen, no chargebacks." },
            { icon: Users, title: "Group-native", desc: "Equal splits, custom shares, recurring rent — everyone sees who paid in real time." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:shadow-glow transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto pb-20">
        <div className="relative overflow-hidden rounded-3xl glass p-10 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-hero opacity-50 pointer-events-none" />
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold">Ready to ditch the spreadsheet?</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Connect your wallet and split your first bill in under a minute.
          </p>
          <Button asChild size="lg" className="mt-6 bg-gradient-primary text-primary-foreground shadow-glow font-semibold">
            <Link to="/create">Create your first split</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
