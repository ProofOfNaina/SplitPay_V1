import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";

export function UserSync() {
  const { user, authenticated, ready } = usePrivy();

  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    const syncUser = async () => {
      const wallet = user.wallet?.address;
      const email = user.email?.address;

      if (!wallet) return;

      const { error } = await supabase
        .from("profiles")
        .upsert(
          { 
            wallet_address: wallet.toLowerCase(),
            email: email || null,
            last_login: new Date().toISOString()
          },
          { onConflict: 'wallet_address' }
        );

      if (error) {
        console.error("Error syncing user profile:", error.message);
      }
    };

    syncUser();
  }, [ready, authenticated, user]);

  return null;
}
