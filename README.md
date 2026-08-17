# ⚡ LumenPulse — Decentralized Feedback DAO & Tipping Vault Protocol

[![Stellar Testnet](https://img.shields.io/badge/Network-Stellar_Testnet-00e5ff?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet)
[![Soroban v22](https://img.shields.io/badge/Smart_Contracts-Soroban_v22-7c4dff?style=for-the-badge)](https://soroban.stellar.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-00e676?style=for-the-badge)](LICENSE)

> **LumenPulse** is a decentralized governance feedback and community tipping protocol deployed on **Stellar Testnet** using **Soroban WASM smart contracts**. It enables verifiable, tamper-proof user reviews and micro-tipping for Stellar dApps, builders, and ecosystem protocols wrapped in a cosmic glassmorphism user interface.

---

## 📋 Smart Contract & Deployment Reference

| Parameter | On-Chain Value / Link |
| :--- | :--- |
| **Network** | **Stellar Testnet (Protocol 22 / Soroban v22)** |
| **Contract Name** | `FeedbackVault` |
| **Primary Deployed Contract ID** | [`CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE`](https://stellar.expert/explorer/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE) |
| **WASM Bytecode Hash** | `4dda959bb5616a427197a638090539de0a90561372778f75e2f5cfb368dea2d4` |
| **WASM Size** | `10,842 bytes` |
| **Contract Deployment Tx** | [`215efecb8f7ba29509936c2b52521f0fe6bcdd332a95185203ae52709c3ca9ba`](https://stellar.expert/explorer/testnet/tx/215efecb8f7ba29509936c2b52521f0fe6bcdd332a95185203ae52709c3ca9ba) |
| **Verified On-Chain Feedback #1 Tx** | [`e37efd1d4b4c4eec8b9f94804c3c55c7c998291ef72cb8b0840ec89f2d4de026`](https://stellar.expert/explorer/testnet/tx/e37efd1d4b4c4eec8b9f94804c3c55c7c998291ef72cb8b0840ec89f2d4de026) |
| **Deployer Public Key** | `GAW727V4MUPNUGW4RILTR3B5TX7T3LGYLFXMZXA53A26JOD4WCVJ3L7C` |
| **Horizon RPC Endpoint** | `https://horizon-testnet.stellar.org` |
| **Soroban RPC Endpoint** | `https://soroban-testnet.stellar.org` |
| **Unit Test Coverage** | **4 / 4 Passing Unit Tests (`cargo test`)** |

---

## 💡 Why LumenPulse? (The Problem & Solution)

### The Problem in Web3 Governance & Reviews
Traditional review and feedback systems are centralized, vulnerable to censorship, and plagued by sybil bot spam. Users lack incentives to provide honest, constructive reviews, and dApp creators have no verifiable reputation metrics.

### The LumenPulse Solution
LumenPulse creates an immutable, incentivized on-chain review layer on Stellar:
* **Tamper-Proof On-Chain Feedback:** Reviews, ratings (1–5 stars), and category tags are recorded directly in Soroban persistent storage.
* **Direct Community Tipping:** Protocols and community members can directly tip constructive reviews with Testnet XLM.
* **Aggregated Protocol Analytics:** Smart contracts calculate real-time protocol reputation metrics (average rating, total submissions, total tips).
* **Instant Settlement & Low Fees:** High-speed 3–5s finality and sub-cent fees powered by Stellar.

---

## 🏛️ System Architecture

```text
[ User / Reviewer / Protocol ] ──> [ Freighter / Demo Wallet ]
               │
               ▼
   [ React + Vite Cosmic UI ] 
               │
               ├───> [ Stellar Horizon Testnet ]  (Native XLM Payments & Balance Queries)
               ├───> [ Stellar Friendbot Faucet ] (1-Click Instant +10,000 XLM Funding)
               └───> [ Soroban RPC Node ]         (Smart Contract WASM Execution & Events)
                           │
                           ▼
             [ FeedbackVault Smart Contract ]
               ├── send_feedback  (Submit On-Chain Rating & Review)
               ├── tip_feedback   (Transfer Micro-Tipping to Reviewer)
               ├── fetch_feedback (Read Specific Review Details)
               └── get_vault_stats(Aggregated Protocol Stats)
```

---

## ✨ Key Features

1. **Decentralized Feedback & Rating Smart Contract (`FeedbackVault`)**
   * Rust Soroban contract with persistent storage and automatic 30-day TTL ledger extensions.
   * Categorized feedback taxonomy (`general`, `bug`, `feature`, `ui`, `security`).
   * On-chain rating calculation and review counters.

2. **Community Tipping & Micro-Rewards**
   * Direct smart contract tipping mechanism sending XLM rewards to reviewers with emitted `tip_sent` events.

3. **Native XLM Fast Payments**
   * Direct transfer module with recipient address validation, memo attachments, and Stellar.Expert explorer links.

4. **Multi-Wallet Authentication**
   * Seamless Freighter Wallet browser extension integration with instant Testnet Keypair fallback.

5. **Real-Time On-Chain Event Stream**
   * Real-time polling via Soroban RPC `getEvents` streaming contract activity feed with ledger numbers and timestamps.

---

## 🛠️ Tech Stack

* **Smart Contract:** Rust, `soroban-sdk = "22.0.11"`, `wasm32-unknown-unknown`
* **Frontend:** React 18, Vite 6, Cosmic Glassmorphism Vanilla CSS
* **SDK & Protocol:** `@stellar/stellar-sdk = "16.2.0"`, `@stellar/freighter-api = "3.1.0"`
* **Testing:** Rust unit test suite (`soroban-sdk::testutils`), 4 passing tests
* **CI/CD:** Automated GitHub Actions pipeline (`.github/workflows/ci.yml`)

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **Rust** (with `wasm32-unknown-unknown` target)
* **Freighter Wallet Extension** ([freighter.app](https://www.freighter.app/))

---

### 2. Run Locally

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 3. Run Smart Contract Tests

```bash
cd contracts/feedback_vault
cargo test
```

**Expected Test Output:**
```
running 4 tests
test test::test_nonexistent_feedback_panic - should panic ... ok
test test::test_send_and_fetch_feedback ... ok
test test::test_tip_feedback_and_stats ... ok
test test::test_stats_aggregation ... ok

test result: ok. 4 passed; 0 failed; finished in 0.04s
```

---

### 4. Build Contract WASM

```bash
cd contracts/feedback_vault
cargo build --target wasm32-unknown-unknown --release
```

---

## 📖 How to Use LumenPulse

1. **Connect Wallet:** Open [http://localhost:5173](http://localhost:5173), click **"Connect Wallet"**, and select **Freighter** or **Instant Demo Key**.
2. **Fund Wallet:** Click **"+ Faucet (+10k XLM)"** to receive free Testnet XLM.
3. **Send XLM:** Use the **Send XLM** tab to transfer funds with an on-chain memo.
4. **Submit Feedback:** Go to **Feedback DAO** ➔ Click **"Submit On-Chain Feedback"** ➔ Select a category (e.g. `UI/UX`), star rating (1–5), and write your review.
5. **Tip Reviewers:** Click **"Tip XLM"** on any community feedback card to reward constructive feedback.
6. **Watch Real-Time Events:** Switch to the **Live Stream** tab to observe on-chain contract events streaming live from Soroban RPC.

---

## 📄 License
MIT License. Built for the Stellar Community.
