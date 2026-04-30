import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { arcTestnet } from "./arc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const PRIVY_APP_ID = "cmokfns0n00m70dk1iex8lifh";

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  transports: { [arcTestnet.id]: http() },
});

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["wallet", "email", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#10F5A3",
          showWalletLoginFirst: true,
          walletList: ["metamask", "coinbase_wallet", "wallet_connect", "rainbow"],
        },
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
