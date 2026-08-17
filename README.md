# ⚡ LumenPulse — Decentralized Feedback DAO & Tipping Vault Protocol

[![Live Production App](https://img.shields.io/badge/Live_App-lumenpulse.netlify.app-00e5ff?style=for-the-badge&logo=netlify)](https://lumenpulse.netlify.app/)
[![YouTube Video Demo](https://img.shields.io/badge/YouTube-Video_Walkthrough-ff0000?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=ZRX6abfxqLg)
[![Stellar Testnet](https://img.shields.io/badge/Network-Stellar_Testnet-7c4dff?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE)
[![GitHub Repository](https://img.shields.io/badge/GitHub-bishalnium%2FLumenpulse-181717?style=for-the-badge&logo=github)](https://github.com/bishalnium/Lumenpulse)
[![License: MIT](https://img.shields.io/badge/License-MIT-00e676?style=for-the-badge)](LICENSE)

> **LumenPulse** is a decentralized governance feedback, on-chain reputation, and community micro-tipping protocol deployed on **Stellar Testnet** using **Soroban Rust WASM smart contracts**. It empowers Web3 users to submit immutable reviews with star ratings (1–5 stars), engage in Reddit-style discussion threads, search feedback by Stellar wallet address, and tip authors directly with Testnet XLM in a sleek cosmic glassmorphism interface.

---

## 📋 Quick Project Links & On-Chain Reference

| Resource / Parameter | Details / Link |
| :--- | :--- |
| **🌐 Live Deployed Application** | [**https://lumenpulse.netlify.app/**](https://lumenpulse.netlify.app/) |
| **🎥 Video Demonstration Walkthrough** | [**YouTube: LumenPulse Protocol Overview**](https://www.youtube.com/watch?v=ZRX6abfxqLg) |
| **📦 GitHub Repository** | [**github.com/bishalnium/Lumenpulse**](https://github.com/bishalnium/Lumenpulse) |
| **⛓️ Network** | **Stellar Testnet (Protocol 22 / Soroban v22)** |
| **📜 Contract Name** | `FeedbackVault` |
| **🔑 Deployed Contract ID** | [`CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE`](https://stellar.expert/explorer/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE) |
| **📦 WASM Bytecode Hash** | `4dda959bb5616a427197a638090539de0a90561372778f75e2f5cfb368dea2d4` |
| **📏 WASM Binary Size** | `10,842 bytes` (Highly optimized) |
| **🚀 Contract Deployment Transaction** | [`215efecb8f7ba29509936c2b52521f0fe6bcdd332a95185203ae52709c3ca9ba`](https://stellar.expert/explorer/testnet/tx/215efecb8f7ba29509936c2b52521f0fe6bcdd332a95185203ae52709c3ca9ba) |
| **⭐ Verified On-Chain Feedback Tx** | [`e37efd1d4b4c4eec8b9f94804c3c55c7c998291ef72cb8b0840ec89f2d4de026`](https://stellar.expert/explorer/testnet/tx/e37efd1d4b4c4eec8b9f94804c3c55c7c998291ef72cb8b0840ec89f2d4de026) |
| **📡 Horizon RPC Endpoint** | `https://horizon-testnet.stellar.org` |
| **⚡ Soroban RPC Endpoint** | `https://soroban-testnet.stellar.org` |
| **🧪 Unit Test Coverage** | **4 / 4 Passing Unit Tests (`cargo test`)** |

---

## 💡 Why LumenPulse? (Problem & Solution)

### The Problem in Web3 Governance & Reviews
Traditional review systems are centralized, vulnerable to censorship, and plagued by sybil bot spam. Reviewers have no financial incentive to provide high-quality, constructive feedback, and protocols have no cryptographically verifiable reputation metrics.

### The LumenPulse Solution
LumenPulse creates an immutable, incentivized review and tipping layer on Stellar:
1. **Tamper-Proof Feedback:** All reviews, star ratings (1–5 stars), and category taxonomy are stored directly in Soroban persistent storage with automatic TTL ledger extensions.
2. **Decentralized Micro-Tipping:** Community members and protocols can directly tip constructive reviews with variable amounts of Testnet XLM (`5`, `10`, `25`, `50` XLM).
3. **Universal On-Chain Querying:** Anyone can search feedback by Stellar wallet address (`GDON...`), post number, or keywords in real-time.
4. **Live Event Feeds & Compact Discussions:** Emits Soroban contract events (`fb_new`, `fb_tip`) streamed live with Reddit-style compact discussion threads.
5. **Instant Settlement & Low Fees:** High-speed ~3.5s finality and negligible base fees (0.00001 XLM) powered by Stellar.

---

## 🏛️ System Architecture

```text
               ┌────────────────────────────────────────────────────────┐
               │              LumenPulse Frontend (React + Vite)        │
               │   • Cosmic Glassmorphism UI   • Real-Time RPC Query    │
               │   • Star Rating Selector      • Universal Search       │
               └───────────────┬────────────────────────┬───────────────┘
                               │                        │
                    Wallet Auth & Signing       RPC & Horizon Queries
                               │                        │
               ┌───────────────▼────────┐      ┌────────▼────────────────┐
               │ Freighter / Demo Key   │      │ Stellar Testnet Horizon │
               │ • Freighter API v3     │      │ • Account Balances      │
               │ • 1-Click Friendbot    │      │ • Native XLM Transfers  │
               └───────────────┬────────┘      └─────────────────────────┘
                               │
                               ▼
               ┌────────────────────────────────────────────────────────┐
               │             Soroban RPC (Protocol 22 Node)             │
               │   • simulateTransaction    • sendTransaction           │
               │   • getLatestLedger        • getEvents Polling         │
               └───────────────┬────────────────────────────────────────┘
                               │
                               ▼
               ┌────────────────────────────────────────────────────────┐
               │        FeedbackVault Soroban Smart Contract (Rust)     │
               │   • send_feedback(sender, msg, cat) -> u64             │
               │   • fetch_feedback(id) -> Feedback                     │
               │   • tip_feedback(tipper, id, amount)                   │
               │   • get_vault_stats() -> VaultStats                    │
               │   • get_feedback_count() -> u64                        │
               │   • Events: fb_new, fb_tip                             │
               └────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. 🌟 Star-Rated On-Chain Feedback
* Users select a category (`General`, `Smart Contracts`, `UI/UX`, `DAO Governance`), choose an interactive **Star Rating (1 to 5 Stars ⭐)**, and write their review.
* Stored permanently in Soroban persistent contract storage with TTL auto-extension.

### 2. 🔍 Universal Search & "My Submissions"
* **1-Click "My Submissions":** Instantly filters the live feed to display only reviews submitted by the connected wallet address.
* **Search by Stellar Address:** Paste any public key (`GDON...`) to see all reviews by that creator.
* **Search by Post Number or Keyword:** Type `#1`, `speed`, `Soroban`, or `UI` to query on-chain records in real-time.

### 3. 💖 Variable XLM Tipping
* Tip feedback creators on-chain directly with variable amounts: **`5`**, **`10`**, **`25`**, **`50` XLM** (or custom amounts).
* Automatically triggers on-chain balance transfers and celebratory confetti animations.

### 4. 🧵 Live Event Stream & Reddit-Style Compact Threads
* Real-time polling via Soroban RPC `getEvents` streaming contract activity feed (`fb_new`, `fb_tip`).
* Features **Reddit-style compact discussion threads** allowing community members to comment and debate topics under any event.

### 5. ⚡ Native XLM Transfer & 1-Click Faucet
* Built-in instant **Friendbot Faucet (+10,000 Testnet XLM)**.
* Fast payments module with recipient public key validation, on-chain memo attachments, and explorer links.

---

## 🛠️ Smart Contract Specification (`FeedbackVault`)

| Function | Signature | Description |
| :--- | :--- | :--- |
| `send_feedback` | `(env, sender: Address, message: String, category: Symbol) -> u64` | Submits on-chain feedback with star rating, updates instance counters, and emits `fb_new` event. |
| `fetch_feedback` | `(env, id: u64) -> Feedback` | Read-only query retrieving feedback struct `(id, sender, message, category, timestamp, tips)`. |
| `tip_feedback` | `(env, tipper: Address, id: u64, amount: i128)` | Rewards reviewer, records tip amount, and emits `fb_tip` event. |
| `get_vault_stats` | `(env) -> VaultStats` | Returns aggregated protocol metrics `(total_feedbacks, total_tips)`. |
| `get_feedback_count` | `(env) -> u64` | Returns total registered on-chain feedback count. |

---

## 🧪 Smart Contract Unit Test Coverage

LumenPulse includes comprehensive Rust test coverage verifying all state changes, panic bounds, and event emissions.

```bash
cd contracts/feedback_vault
cargo test
```

### ✅ Test Suite Results:
```text
running 4 tests
test test::test_nonexistent_feedback_panic - should panic ... ok
test test::test_send_and_fetch_feedback ... ok
test test::test_tip_feedback_and_stats ... ok
test test::test_stats_aggregation ... ok

test result: ok. 4 passed; 0 failed; finished in 0.04s
```

---

## 💻 Tech Stack

* **Smart Contracts:** Rust, `soroban-sdk = "22.0.11"`, `wasm32-unknown-unknown`
* **Frontend:** React 19, Vite 6, Cosmic Glassmorphism Vanilla CSS, Lucide Icons, Canvas Confetti
* **Stellar Integration:** `@stellar/stellar-sdk = "16.2.0"`, `@stellar/freighter-api = "3.1.0"`
* **Deployment & CI/CD:** Netlify (`netlify.toml`), GitHub Actions (`.github/workflows/ci.yml`)

---

## 🚀 Local Development Setup

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **Rust & Cargo** with `wasm32-unknown-unknown` target
* **Freighter Wallet Extension** ([freighter.app](https://www.freighter.app/))

### 2. Clone & Install Frontend
```bash
git clone https://github.com/bishalnium/Lumenpulse.git
cd Lumenpulse/frontend
npm install --legacy-peer-deps
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Build & Test Smart Contracts
```bash
cd ../contracts/feedback_vault
# Run unit tests
cargo test

# Compile optimized WASM
cargo build --target wasm32-unknown-unknown --release
```

---

## 📖 How to Use LumenPulse

1. **Connect Wallet:** Open the app and connect with **Freighter Wallet** or click **Demo Keypair**.
2. **Fund Wallet:** Click **"Faucet (+10k XLM)"** in the top bar to fund your account instantly.
3. **Submit Feedback:**
   * Go to **"Feedback DAO"**.
   * Pick a category, select your **Star Rating (⭐⭐⭐⭐⭐)**, type your review message, and click **"Submit to Contract"**.
4. **Search & Filter Reviews:**
   * Click **"My Submissions"** to filter reviews from your wallet.
   * Or search by any Stellar address (`GDON...`), keyword, or post number.
5. **Tip Reviewers:** Click **"Tip"** on any card to send an on-chain tipping reward.
6. **Live Stream & Discussions:** Switch to **"Live Stream"** to view real-time smart contract events and participate in Reddit-style topic discussions!

---

## 📄 License
MIT License. Built for the Stellar & Soroban Ecosystem.
