import {
  Horizon,
  Networks,
  Keypair,
  TransactionBuilder,
  TimeoutInfinite,
  rpc as SorobanRpc,
  Operation,
  Address,
  scValToNative,
} from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

async function deployToLiveTestnet() {
  console.log('===========================================================');
  console.log('🌟 LUMENPULSE: LIVE STELLAR TESTNET CONTRACT DEPLOYMENT 🌟');
  console.log('===========================================================\n');

  const horizon = new Horizon.Server(HORIZON_URL);
  const rpc = new SorobanRpc.Server(RPC_URL);

  // 1. Generate a new Deployer Account Keypair
  const deployer = Keypair.random();
  console.log(`1️⃣  Generated Deployer Account:`);
  console.log(`    Public Key : ${deployer.publicKey()}`);
  console.log(`    Secret Key : ${deployer.secret()}\n`);

  // 2. Fund the Deployer Account on Testnet with Friendbot (10,000 XLM)
  console.log('2️⃣  Requesting 10,000 XLM from Friendbot Faucet on Testnet...');
  const friendbotRes = await fetch(`https://friendbot.stellar.org?addr=${deployer.publicKey()}`);
  if (!friendbotRes.ok) {
    throw new Error(`Friendbot funding failed: ${await friendbotRes.text()}`);
  }
  console.log('    ✅ Account successfully funded on-chain with 10,000 XLM!\n');

  // 3. Load Compiled WASM File
  const wasmPath = path.resolve('contracts/feedback_vault/target/wasm32-unknown-unknown/release/feedback_vault.wasm');
  console.log(`3️⃣  Reading compiled WASM from: ${wasmPath}`);
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`WASM file not found at ${wasmPath}. Run cargo build first.`);
  }
  const wasmBytes = fs.readFileSync(wasmPath);
  console.log(`    ✅ WASM Bytecode loaded (${wasmBytes.length} bytes)\n`);

  // 4. Upload WASM Bytecode to Stellar Testnet
  console.log('4️⃣  Uploading Contract WASM to Stellar Testnet (uploadContractWasm)...');
  let account = await horizon.loadAccount(deployer.publicKey());

  let uploadTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.uploadContractWasm({ wasm: wasmBytes }))
    .setTimeout(TimeoutInfinite)
    .build();

  console.log('    Simulating WASM upload transaction via Soroban RPC...');
  const uploadSim = await rpc.simulateTransaction(uploadTx);
  if (SorobanRpc.Api.isSimulationError(uploadSim)) {
    throw new Error(`Upload simulation failed: ${uploadSim.error}`);
  }

  uploadTx = SorobanRpc.assembleTransaction(uploadTx, uploadSim).build();
  uploadTx.sign(deployer);

  console.log('    Submitting signed WASM upload to Stellar Testnet...');
  const uploadSend = await rpc.sendTransaction(uploadTx);
  if (uploadSend.status === 'ERROR') {
    throw new Error(`WASM upload submission error: ${JSON.stringify(uploadSend)}`);
  }
  console.log(`    Transaction Hash: ${uploadSend.hash}`);

  // Wait for WASM upload confirmation
  let uploadStatus = await rpc.getTransaction(uploadSend.hash);
  while (uploadStatus.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1500));
    uploadStatus = await rpc.getTransaction(uploadSend.hash);
  }

  if (uploadStatus.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`WASM upload transaction failed: ${uploadStatus.status}`);
  }

  const wasmHash = scValToNative(uploadStatus.returnValue);
  const wasmHashHex = Buffer.from(wasmHash).toString('hex');
  console.log(`    ✅ WASM Installed On-Chain! WASM Hash: ${wasmHashHex}\n`);

  // 5. Instantiate Contract on Testnet (createCustomContract)
  console.log('5️⃣  Instantiating Contract on Stellar Testnet (createCustomContract)...');
  account = await horizon.loadAccount(deployer.publicKey());

  let createTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.createCustomContract({
        address: new Address(deployer.publicKey()),
        wasmHash: Buffer.from(wasmHashHex, 'hex'),
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  console.log('    Simulating contract instantiation via Soroban RPC...');
  const createSim = await rpc.simulateTransaction(createTx);
  if (SorobanRpc.Api.isSimulationError(createSim)) {
    throw new Error(`Instantiation simulation failed: ${createSim.error}`);
  }

  createTx = SorobanRpc.assembleTransaction(createTx, createSim).build();
  createTx.sign(deployer);

  console.log('    Submitting signed contract creation to Stellar Testnet...');
  const createSend = await rpc.sendTransaction(createTx);
  if (createSend.status === 'ERROR') {
    throw new Error(`Contract creation submission error: ${JSON.stringify(createSend)}`);
  }
  console.log(`    Transaction Hash: ${createSend.hash}`);

  // Wait for Contract instantiation confirmation
  let createStatus = await rpc.getTransaction(createSend.hash);
  while (createStatus.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1500));
    createStatus = await rpc.getTransaction(createSend.hash);
  }

  if (createStatus.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Contract creation transaction failed: ${createStatus.status}`);
  }

  const deployedContractAddress = Address.fromScVal(createStatus.returnValue).toString();

  console.log('\n🎉 ===========================================================');
  console.log('🚀 CONTRACT DEPLOYMENT SUCCESSFUL ON STELLAR TESTNET!');
  console.log('===========================================================');
  console.log(`\n📋 DEPLOYED CONTRACT ADDRESS:`);
  console.log(`👉 ${deployedContractAddress}`);
  console.log(`\n🔗 STELLAR.EXPERT EXPLORER:`);
  console.log(`👉 https://stellar.expert/explorer/testnet/contract/${deployedContractAddress}`);
  console.log(`\n🔗 TRANSACTION EXPLORER:`);
  console.log(`👉 https://stellar.expert/explorer/testnet/tx/${createSend.hash}`);
  console.log('===========================================================\n');

  return {
    contractAddress: deployedContractAddress,
    deployerKey: deployer.publicKey(),
    txHash: createSend.hash,
  };
}

deployToLiveTestnet().catch((err) => {
  console.error('\n❌ Deployment failed with error:', err);
});
