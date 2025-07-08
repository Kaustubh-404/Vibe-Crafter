# 🚀 Smart Contract Deployment Guide

## Recommended Chain: **Base Sepolia Testnet**

### Why Base Sepolia?
- ✅ **Zora Compatible**: Base is Zora's preferred L2
- ✅ **Low Gas Fees**: Minimal deployment costs
- ✅ **Great Tooling**: Excellent block explorer and faucets
- ✅ **Active Ecosystem**: Many DeFi protocols for trading

### Network Details:
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Deployment Steps:

### 1. Get Testnet ETH
Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### 2. Deploy with Remix
1. Open https://remix.ethereum.org
2. Create new files and paste the contract code
3. Compile with Solidity 0.8.19+
4. Connect MetaMask to Base Sepolia
5. Deploy VibeToken first, then ChallengeManager

### 3. Update Contract Addresses
After deployment, update these files:
- `lib/blockchain.ts` - Add contract addresses
- `.env.local` - Add environment variables

\`\`\`env
NEXT_PUBLIC_VIBE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_CHALLENGE_MANAGER_ADDRESS=0x...
\`\`\`

### 4. Verify Contracts (Optional)
Use Base Sepolia Etherscan to verify your contracts for transparency.

## Alternative Chains:

### Zora Sepolia Testnet
- **Chain ID**: 999999999
- **RPC URL**: https://sepolia.rpc.zora.energy
- **Block Explorer**: https://sepolia.explorer.zora.energy

### Optimism Sepolia
- **Chain ID**: 11155420
- **RPC URL**: https://sepolia.optimism.io
- **Block Explorer**: https://sepolia-optimism.etherscan.io
