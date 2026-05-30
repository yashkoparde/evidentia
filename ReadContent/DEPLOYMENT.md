# EvidenceVault Deployment Guide

Follow these steps to deploy the `EvidenceVault` smart contract to Polygon Mumbai (or Amoy).

## 1. Prerequisites
- [MetaMask](https://metamask.io/) installed.
- Some test MATIC (from a [faucet](https://faucet.polygon.technology/)).
- [Remix IDE](https://remix.ethereum.org/) (easiest for quick deployment).

## 2. Deployment via Remix
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a new file `EvidenceVault.sol` and paste the contract code from our project.
3. Go to the **Solidity Compiler** tab:
   - Select compiler version `0.8.19` or higher.
   - Click **Compile EvidenceVault.sol**.
4. Go to the **Deploy & Run Transactions** tab:
   - Environment: Select **Injected Provider - MetaMask**.
   - Ensure your MetaMask is on the **Polygon Amoy/Mumbai** network.
   - Select `EvidenceVault` from the contract dropdown.
   - Click **Deploy**.
5. Confirm the transaction in MetaMask.

## 3. Configuration
Once deployed, copy the **Contract Address**.

Go to your `.env` file or environment variables in AI Studio and add:
```env
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

## 4. ABI Generation
The `blockchainService.ts` relies on the following minimal ABI. If you change the contract, update this array in the service.

```json
[
  "function storeEvidence(string _hash) public",
  "function verifyEvidence(string _hash) public view returns (bool exists, uint256 timestamp, address uploader)",
  "event EvidenceStored(string indexed fileHash, address indexed uploader, uint256 timestamp)"
]
```

## 5. Netlify Deployment (Frontend)
1. **Connect to GitHub:** Push your code to a GitHub repository.
2. **Create New Site:** In Netlify, click "Add new site" > "Import an existing project" and select your repository.
3. **Build Settings:**
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. **Environment Variables:**
   Go to **Site configuration > Environment variables** and add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `VITE_CONTRACT_ADDRESS`: The deployed contract address from Step 3.
5. **Routing:** The included `netlify.toml` handles SPA routing automatically.

