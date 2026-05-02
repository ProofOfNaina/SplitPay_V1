import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, Plus, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Split = {
  id: string; title: string; total_amount: number; payer_wallet: string;
  created_at: string;
  participants: { status: string; wallet_address: string; amount: number }[];
};

export default function MySplits() {
  const { address, isConnected } = useAccount();
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    const me = address.toLowerCase();
    (async () => {
      try {
        const { data, error } = await supabase.rpc('list_splits_for_wallet', { p_wallet: me });
        if (error) {
          console.error("Error loading splits:", error);
        } else {
          setSplits((data as any) || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [address]);

  if (!address) {
    return (
      <Empty
        title="Connect your wallet"
        desc="Sign in with your Arc-compatible wallet to view your splits."
      />
    );
  }

  if (loading) {
    return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!splits.length) {
    return (
      <Empty
        title="No splits yet"
        desc="Create your first split to start collecting from friends."
        cta
      />
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">My splits</h1>
          <p className="text-muted-foreground mt-1">All splits you created or are part of.</p>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
          <Link to="/create"><Plus className="h-4 w-4 mr-1.5" /> New split</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {splits.map((s) => {
          const paid = s.participants.filter((p) => p.status === "paid").length;
          const total = s.participants.length;
          const isPayer = s.payer_wallet.toLowerCase() === address?.toLowerCase();
          return (
            <Link to={`/split/${s.id}`} key={s.id}>
              <Card className="glass p-6 hover:shadow-glow transition-shadow group">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">{s.title}</h3>
                      <Badge variant={isPayer ? "default" : "secondary"} className={isPayer ? "bg-primary text-primary-foreground" : ""}>
                        {isPayer ? "You collect" : "You owe"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(s.created_at).toLocaleDateString()} · {total} participants
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xl">${Number(s.total_amount).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {paid}/{total} paid
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary transition-all"
                    style={{ width: `${total ? (paid / total) * 100 : 0}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-end text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowUpRight className="h-3 w-3 ml-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Empty({ title, desc, cta }: { title: string; desc: string; cta?: boolean }) {
  return (
    <div className="container mx-auto py-32 text-center">
      <div className="h-14 w-14 rounded-2xl bg-secondary grid place-items-center mx-auto mb-4">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground mt-2">{desc}</p>
      {cta && (
        <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground shadow-glow">
          <Link to="/create"><Plus className="h-4 w-4 mr-1.5" /> Create a split</Link>
        </Button>
      )}
    </div>
  );
}
