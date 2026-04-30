// Arc Network configuration (Circle's stablecoin chain, EVM-compatible).
// Source: https://docs.arc.network/integrate/connect-to-arc
import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network"] },
    public: { http: ["https://rpc.testnet.arc.network"] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

// Backwards-compatible alias used elsewhere
export const arcSepolia = arcTestnet;

// Hex chain id for EIP-3085 / wallet_addEthereumChain
export const ARC_CHAIN_HEX = `0x${arcTestnet.id.toString(16)}`;

export const ARC_ADD_PARAMS = {
  chainId: ARC_CHAIN_HEX,
  chainName: arcTestnet.name,
  nativeCurrency: arcTestnet.nativeCurrency,
  rpcUrls: arcTestnet.rpcUrls.default.http,
  blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
};

export const ARC_FAUCET_URL = "https://faucet.circle.com";
