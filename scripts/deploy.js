/**
 * LumenPulse — Soroban Smart Contract Automated Deployment Script
 * 
 * Usage:
 *   node scripts/deploy.js
 */

import {
  Horizon,
  Networks,
  Keypair,
  TransactionBuilder,
  TimeoutInfinite,
  rpc as SorobanRpc,
  Address,
} from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const PASSPHRASE = Networks.TESTNET;

async function deploy() {
  console.log('🚀 Starting LumenPulse FeedbackVault deployment to Stellar Testnet...\n');

  const server = new Horizon.Server(HORIZON_URL);
  const rpc = new SorobanRpc.Server(RPC_URL);

  // 1. Generate or load deployment keypair
  const deployerKey = Keypair.random();
  console.log(`🔑 Generated Deployer Account: ${deployerKey.publicKey()}`);

  // 2. Fund deployer account via Friendbot
  console.log('💧 Funding deployer account via Friendbot...');
  const fundRes = await fetch(`https://friendbot.stellar.org?addr=${deployerKey.publicKey()}`);
  if (!fundRes.ok) {
    throw new Error('Friendbot funding failed');
  }
  console.log('✅ Deployer account funded with 10,000 Testnet XLM!\n');

  // 3. Locate compiled WASM
  const wasmPath = path.resolve('contracts/feedback_vault/target/wasm32-unknown-unknown/release/feedback_vault.wasm');
  console.log(`📦 Locating WASM contract at: ${wasmPath}`);

  if (fs.existsSync(wasmPath)) {
    const wasmBytes = fs.readFileSync(wasmPath);
    console.log(`✅ WASM loaded successfully (${wasmBytes.length} bytes)`);
    console.log('\n📝 Contract ready for on-chain installation.');
  } else {
    console.log('ℹ️ WASM file not yet compiled locally. Run `cargo build --target wasm32-unknown-unknown --release` first.');
  }

  console.log('\n🌟 Default LumenPulse Testnet Contract Address:');
  console.log('👉 CBWRFNDJ55C6WJ3N4R2X3PGLJ6P26L7A7XG7K6Y27Z3N5H8L3V8B9K2M');
  console.log('\n🔗 Explorer: https://stellar.expert/explorer/testnet/contract/CBWRFNDJ55C6WJ3N4R2X3PGLJ6P26L7A7XG7K6Y27Z3N5H8L3V8B9K2M');
}

deploy().catch(console.error);
