# 📦 PROJECT 1 DEPLOYMENT SUMMARY: LumenPulse (Stellar Vault & Feedback DAO)

> **Status**: ✅ 100% Deployed & Live on Stellar Testnet  
> **Challenge Coverage**: Level 1 (White Belt), Level 2 (Green Belt), Level 3 (Black Belt) Complete  
> **Timestamp**: August 15, 2026  

---

## 🔑 On-Chain Identities & Deployer Accounts

| Identity | Public Key / Address | Secret Key (Testnet) | Purpose |
| :--- | :--- | :--- | :--- |
| **CLI Deployer (`my-deployer-account`)** | `GAW727V4MUPNUGW4RILTR3B5TX7T3LGYLFXMZXA53A26JOD4WCVJ3L7C` | Stored in `~/.config/stellar/identity/` | Deployed contract via `stellar-cli` |
| **SDK Deployer** | `GDMPL5UVXMAKEVJ4SQDKUGVLCEPSHAN4FWQEC54UZBCRDLN7M6BXGNV2` | `SCLYND4UFXHRHO7POFYBHUUIRWT5AEJWHIYZAFSZMCMRWFNTHUGDZHOS` | Deployed contract via `@stellar/stellar-sdk` |
| **Test Interaction User** | `GBPGOKOWHUBUZS57AZ3OBBOJTMXOTU3MBOBSOSS2MOGZFBQRIXHIZHVZ` | Random Keypair | Created feedback #1 and verified ledger |

---

## 📜 Deployed Smart Contracts & WASM Hashes

### Primary Contract (CLI Deployed)
* **Contract ID**: [`CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE`](https://stellar.expert/explorer/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE)
* **WASM Hash**: `4dda959bb5616a427197a638090539de0a90561372778f75e2f5cfb368dea2d4`
* **WASM Size**: 5,609 bytes
* **Deployment Tx**: [`215efecb8f7ba29509936c2b52521f0fe6bcdd332a95185203ae52709c3ca9ba`](https://stellar.expert/explorer/testnet/tx/215efecb8f7ba29509936c2b52521f0fe6bcdd332a95185203ae52709c3ca9ba)
* **Stellar Lab**: [https://lab.stellar.org/r/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE](https://lab.stellar.org/r/testnet/contract/CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE)

### Secondary Contract (SDK Deployed)
* **Contract ID**: [`CDS7U2RNC7JGQ3LQ72ALHWCU5AWVRQDPBS7QTBIPH4QUD6QTQJO2BBCZ`](https://stellar.expert/explorer/testnet/contract/CDS7U2RNC7JGQ3LQ72ALHWCU5AWVRQDPBS7QTBIPH4QUD6QTQJO2BBCZ)
* **Instantiation Tx**: [`8de2fc667327e4e82854d4770117ae32178bed6a2133fbf20ee9b0d09711673d`](https://stellar.expert/explorer/testnet/tx/8de2fc667327e4e82854d4770117ae32178bed6a2133fbf20ee9b0d09711673d)

---

## 🌐 Network & Infrastructure Endpoints

* **Horizon REST API**: `https://horizon-testnet.stellar.org`
* **Soroban RPC Server**: `https://soroban-testnet.stellar.org`
* **Friendbot Faucet**: `https://friendbot.stellar.org?addr={PUBLIC_KEY}`
* **Network Passphrase**: `Test SDF Network ; September 2015`
* **Stellar Explorer**: `https://stellar.expert/explorer/testnet`

---

## 🧪 Verified On-Chain Contract Methods

```rust
// 1. Send Feedback (State Write)
send_feedback(sender: Address, message: String, category: Symbol) -> u64
// Verified with Tx: e37efd1d4b4c4eec8b9f94804c3c55c7c998291ef72cb8b0840ec89f2d4de026 (Feedback #1 saved)

// 2. Fetch Feedback (State Read)
fetch_feedback(id: u64) -> Feedback

// 3. Tip Feedback (State Write + XLM/Stroops)
tip_feedback(tipper: Address, feedback_id: u64, amount: i128) -> i128

// 4. Get Vault Stats (State Read)
get_vault_stats() -> VaultStats

// 5. Fetch Recent (Batch Read)
fetch_recent(limit: u32) -> Vec<Feedback>
```

---

## 💻 Tech Stack & Installed Tooling

* **Stellar CLI**: `stellar 27.1.0` located at `C:\Users\bisha\.cargo\bin\stellar.exe`
* **Rust Toolchain**: `rustc 1.97.1` with `wasm32-unknown-unknown`
* **Soroban SDK**: `soroban-sdk = "22.0.11"`
* **JavaScript SDK**: `@stellar/stellar-sdk = "16.2.0"`
* **Frontend**: React 18, Vite 6, Cosmic Glassmorphism CSS, Lucide Icons, Canvas Confetti
* **CI/CD**: GitHub Actions workflow at `.github/workflows/ci.yml`

---

## 🛠️ Quick Commands Cheat-Sheet

```bash
# Test contract
cargo test --manifest-path contracts/feedback_vault/Cargo.toml

# Build contract WASM
cargo build --manifest-path contracts/feedback_vault/Cargo.toml --target wasm32-unknown-unknown --release

# Query contract stats via CLI
stellar contract invoke --id CCQVCDQ6H5O5PS6XN5YJSF7FNLU2SDZHNF5XEI4W7D3VSIURB364QHAE --source my-deployer-account --network testnet -- get_vault_stats

# Run live JS deployment script
node scripts/deploy_live_testnet.js

# Run live on-chain interaction script
node scripts/interact_live_testnet.js

# Run Frontend Dev Server
npm run dev --prefix frontend
```
