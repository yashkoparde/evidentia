# Evidentia Blockchain Integration Guide (Polygon & MetaMask)

This guide explains how to transition Evidentia's currently mocked blockchain functionality into a real, production-ready Web3 integration using the **Polygon** blockchain and **MetaMask**.

Polygon is an ideal layer-2 scaling solution for Ethereum, providing the security needed for chain-of-custody operations with low gas fees and high transaction throughput.

## 1. Smart Contract Development (Solidity)

First, write a smart contract to govern the evidence hashes.

**File:** `contracts/EvidentiaLedger.sol`
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EvidentiaLedger {
    struct EvidenceRecord {
        string fileHash;
        string caseId;
        string uploadedBy;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from fileHash to EvidenceRecord
    mapping(string => EvidenceRecord) private records;

    event EvidenceStored(string indexed fileHash, string caseId, string uploadedBy, uint256 timestamp);

    function storeEvidence(string memory _fileHash, string memory _caseId, string memory _uploadedBy) public {
        require(!records[_fileHash].exists, "Evidence hash already registered.");

        records[_fileHash] = EvidenceRecord({
            fileHash: _fileHash,
            caseId: _caseId,
            uploadedBy: _uploadedBy,
            timestamp: block.timestamp,
            exists: true
        });

        emit EvidenceStored(_fileHash, _caseId, _uploadedBy, block.timestamp);
    }

    function verifyEvidence(string memory _fileHash) public view returns (string memory, string memory, uint256, bool) {
        EvidenceRecord memory record = records[_fileHash];
        return (record.caseId, record.uploadedBy, record.timestamp, record.exists);
    }
}
```

## 2. Deploy to Polygon (Amoy Testnet or Mainnet)

1. Use a framework like [Hardhat](https://hardhat.org/) or [Foundry](https://getfoundry.sh/).
2. Get an RPC URL from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/) for the Polygon network.
3. Configure your deployment scripts. For Amoy (the Polygon Testnet), make sure to get test MATIC from the Polygon Faucet.
4. Deploy the contract and **save the deployed contract address** and the **Contract ABI**.

## 3. Frontend Integration (React & TypeScript)

Install `ethers` in the Evidentia web app:
```bash
npm install ethers
```

Create a new file `src/services/realBlockchainService.ts` to replace the current `blockchainService.ts`.

### Example Integration using Ethers.js
```typescript
import { ethers } from "ethers";

// The ABI generated after compiling your contract
const CONTRACT_ABI = [
  "function storeEvidence(string _fileHash, string _caseId, string _uploadedBy) public",
  "function verifyEvidence(string _fileHash) public view returns (string, string, uint256, bool)",
  "event EvidenceStored(string indexed fileHash, string caseId, string uploadedBy, uint256 timestamp)"
];

const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";

class RealBlockchainService {
  /**
   * Request user to connect their MetaMask wallet.
   */
  async connectWallet() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }
    
    // Switch to Polygon network (Amoy Testnet RPC for example)
    const chainId = "0x13882"; // Amoy chain ID (80002) in Hex
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network doesn't exist in MetaMask, add it here...
      }
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }

  /**
   * Stores the file hash securely on the Polygon blockchain.
   */
  async storeHash(fileHash: string, caseId: string, uploadedBy: string): Promise<string> {
    const signer = await this.connectWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const tx = await contract.storeEvidence(fileHash, caseId, uploadedBy);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    return receipt.hash; // The Transaction Hash on Polygon
  }

  /**
   * Verifies the file hash against the Polygon blockchain.
   */
  async getHash(fileHash: string) {
    if (!window.ethereum) return null;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const [caseId, uploadedBy, timestamp, exists] = await contract.verifyEvidence(fileHash);
    
    if (!exists) return null;

    return {
      hash: fileHash,
      caseId: caseId,
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      network: "Polygon"
    };
  }
}

export const realBlockchainService = new RealBlockchainService();
```

## 4. Hooking it Up

1. Replace all calls to `blockchainService` in `src/context/AppContext.tsx` with `realBlockchainService`.
2. When the user uploads a file, they will now be prompted by MetaMask to confirm the transaction.
3. They must have MATIC in their wallet to pay the gas fees.

## Best Practices

* **Hashes Only:** Never store the actual files or PII (Personally Identifiable Information) on the blockchain. You are correctly storing only the SHA-256 hash.
* **Gas Optimizations:** Ensure your smart contract has been optimized. In the example above, `string` fields map well to your DApp, but consider using `bytes32` for `fileHash` to save on gas if it is a strictly formatted hex string.
* **Fallback Mechanisms:** Even with a real blockchain, you can maintain your Supabase SQL tables (`audit_logs`) to cache data for faster queries, and query the blockchain directly only for "Integrity Scans".
