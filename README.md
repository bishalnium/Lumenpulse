# ⚡ LumenPulse — Stellar Vault & Feedback DAO

[![Stellar Testnet](https://img.shields.io/badge/Network-Stellar_Testnet-00e5ff?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet)
[![Soroban v22](https://img.shields.io/badge/Smart_Contracts-Soroban_v22-7c4dff?style=for-the-badge)](https://soroban.stellar.org)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-00e676?style=for-the-badge&logo=githubactions)](.github/workflows/ci.yml)
[![Level 1-2-3 Qualified](https://img.shields.io/badge/Challenge-Levels_1_2_3_Complete-ffd600?style=for-the-badge)](https://developers.stellar.org)

**LumenPulse** is an end-to-end, production-grade Stellar dApp and decentralized governance feedback protocol built for the **Stellar Developer Challenge (Levels 1, 2 & 3)**. It combines native Stellar XLM payments, multi-wallet integration, Soroban Rust smart contracts with persistent storage and event emissions, a real-time RPC event stream, and a cosmic glassmorphism UI.

---

## 🏛️ Architecture Overview

```mermaid
graph TD
    User([User Browser / Mobile]) -->|Freighter / StellarWalletsKit| Wallet[Connected Wallet]
    User -->|Modern Glassmorphism UI| Frontend[React + Vite Frontend]
    
    Frontend -->|Horizon REST API| Horizon[Stellar Horizon Testnet]
    Frontend -->|Soroban RPC JSON-RPC| SorobanRPC[Stellar Soroban RPC]
    Frontend -->|1-Click Faucet| Friendbot[Stellar Friendbot (+10,000 XLM)]
    
    Wallet -->|Sign Transaction XDR| Horizon
    Wallet -->|Sign Contract Invocations| SorobanRPC
    
    SorobanRPC -->|Execute WASM| Contract[FeedbackVault Smart Contract]
    Contract -->|Emit On-Chain Events| EventStream[Real-Time Event Streamer]
    EventStream -->|Live UI Synchronization| Frontend
```

---

## 🎯 Challenge Requirements Matrix

| Level | Focus Area | Requirement | LumenPulse Implementation | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Level 1** | **White Belt** | Wallet Connect & Disconnect | Freighter Wallet integration with `@stellar/freighter-api` | ✅ Complete |
| **Level 1** | **White Belt** | Display Balance & Funding | Real-time XLM balance + 1-Click Friendbot Faucet (+10k XLM) | ✅ Complete |
| **Level 1** | **White Belt** | XLM Payments on Testnet | Direct payment flow with amount, destination validation, memo, and explorer link | ✅ Complete |
| **Level 1** | **White Belt** | Transaction Feedback | Instant success/error status with transaction hash & Stellar.Expert link | ✅ Complete |
| **Level 2** | **Green Belt** | Multi-Wallet Support | Freighter, Albedo, and demo testnet key fallback | ✅ Complete |
| **Level 2** | **Green Belt** | 3+ Error Handling Types | Wallet rejected, Insufficient balance, Invalid destination address, Simulation revert | ✅ Complete |
| **Level 2** | **Green Belt** | Smart Contract on Testnet | Soroban Rust contract with persistent state storage, counters, and tipping logic | ✅ Complete |
| **Level 2** | **Green Belt** | Frontend Contract Calls | Frontend invokes `send_feedback`, `fetch_feedback`, `tip_feedback`, `get_vault_stats` | ✅ Complete |
| **Level 2** | **Green Belt** | Real-Time Events | Subscribes to Soroban RPC `getEvents` for live contract activity feed | ✅ Complete |
| **Level 3** | **Black Belt** | Advanced Smart Contracts | Structs, Enums, Maps, TTL management, Event emissions, and tipping DAO mechanics | ✅ Complete |
| **Level 3** | **Black Belt** | Comprehensive Unit Tests | 4 passing unit tests in Rust (`cargo test`) verifying all contract methods | ✅ Complete |
| **Level 3** | **Black Belt** | CI/CD Pipeline | Automated GitHub Actions workflow testing contracts and building frontend | ✅ Complete |
| **Level 3** | **Black Belt** | Mobile Responsive UI | Cosmic glassmorphism design system with responsive layouts for mobile & desktop | ✅ Complete |

---

## 📦 Project Structure

```
steller/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI/CD testing & build workflow
├── contracts/
│   └── feedback_vault/
│       ├── Cargo.toml           # Soroban Rust SDK v22 dependencies
│       └── src/
│           ├── lib.rs           # FeedbackVault contract implementation
│           └── test.rs          # 4 comprehensive Rust unit tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Navigation, network badge & wallet modal
│   │   │   ├── WalletSection.jsx# Hero balance, QR code & asset list
│   │   │   ├── TransferSection.jsx # Level 1 XLM payments on testnet
│   │   │   ├── FeedbackDAOSection.jsx # Level 2/3 Soroban contract interaction
│   │   │   ├── LiveEventsSection.jsx  # Real-time contract event stream
│   │   │   └── TxModal.jsx      # Multi-wallet connection dialog
│   │   ├── context/
│   │   │   └── WalletContext.jsx# Global wallet state & signature delegate
│   │   ├── services/
│   │   │   └── stellar.js       # Horizon, Soroban RPC & contract utilities
│   │   ├── App.jsx              # Main router & layout
│   │   ├── index.css            # Cosmic glassmorphism design system
│   │   └── main.jsx             # React entry point
│   ├── index.html               # Typography & metadata
│   ├── package.json             # Frontend dependencies & scripts
│   └── vite.config.js           # Vite configuration with Node polyfills
├── scripts/
│   └── deploy.js                # Contract deployment script
└── README.md                    # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Rust** (with `wasm32-unknown-unknown` target)
- **Freighter Wallet Extension** ([freighter.app](https://www.freighter.app/))

---

### 2. Run the Frontend Locally

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 3. Run Smart Contract Tests

```bash
# Navigate to contract directory
cd contracts/feedback_vault

# Run all unit tests
cargo test
```

**Expected Test Output:**
```
running 4 tests
test test::test_send_and_fetch_feedback ... ok
test test::test_multiple_feedbacks_and_recent_query ... ok
test test::test_tipping_and_vault_stats ... ok
test test::test_nonexistent_feedback_panic - should panic ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

---

### 4. Build Contract WASM

```bash
cd contracts/feedback_vault
cargo build --target wasm32-unknown-unknown --release
```

---

## 📜 Deployed Contract Details

* **Network**: Stellar Testnet
* **Contract Name**: `FeedbackVaultContract`
* **Live Deployed Contract ID**: [`CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE`](https://stellar.expert/explorer/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE)
* **WASM Hash**: `4dda959bb5616a427197a638090539de0a90561372778f75e2f5cfb368dea2d4`
* **CLI Deployment Tx**: [`215efecb8f7ba29509936c2b52521f0fe6bcdd332a95185203ae52709c3ca9ba`](https://stellar.expert/explorer/testnet/tx/215efecb8f7ba29509936c2b52521f0fe6bcdd332a95185203ae52709c3ca9ba)
* **Explorer Link**: [https://stellar.expert/explorer/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE](https://stellar.expert/explorer/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE)
* **Horizon RPC Endpoint**: `https://horizon-testnet.stellar.org`
* **Soroban RPC Endpoint**: `https://soroban-testnet.stellar.org`

---

## 🧪 Testing Scenarios & Checklist

### Level 1 (White Belt) Verification
1. **Wallet Connection**: Click "Connect Wallet" -> select Freighter or Instant Testnet Key.
2. **Faucet Funding**: Click "+ Faucet (+10k XLM)" -> account balance increments to 10,000 XLM.
3. **Send Payment**: Navigate to "Send XLM", enter a recipient public key (or use quick test buttons), enter amount, and click "Confirm & Send".
4. **Tx Feedback**: View transaction hash and click "View on Stellar.Expert" to see the on-chain confirmation.

### Level 2 (Green Belt) Verification
1. **Smart Contract Invocation**: Go to "Feedback DAO", select a category, enter a message, and click "Submit to Contract".
2. **Contract Query**: Use the "Query Feedback by ID" tool to call `fetch_feedback` and retrieve on-chain data.
3. **Error Handling**: Test sending with insufficient balance or invalid address to verify graceful error notices.

### Level 3 (Black Belt) Verification
1. **Event Streaming**: Navigate to "Live Stream" tab and observe real-time event logs polled from Soroban RPC.
2. **Automated CI/CD**: Verify `.github/workflows/ci.yml` passes tests and frontend builds on every commit.

---

## 📄 License
MIT License. Built for the Stellar Community & Developer Challenge.
