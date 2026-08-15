import {
  Horizon,
  Networks,
  Keypair,
  TransactionBuilder,
  TimeoutInfinite,
  rpc as SorobanRpc,
  Operation,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const CONTRACT_ID = 'CDS7U2RNC7JGQ3LQ72ALHWCU5AWVRQDPBS7QTBIPH4QUD6QTQJO2BBCZ';

async function testLiveInteraction() {
  console.log('===========================================================');
  console.log('⚡ TESTING LIVE ON-CHAIN INTERACTION WITH DEPLOYED CONTRACT');
  console.log(`📍 Contract Address: ${CONTRACT_ID}`);
  console.log('===========================================================\n');

  const horizon = new Horizon.Server(HORIZON_URL);
  const rpc = new SorobanRpc.Server(RPC_URL);

  // 1. Create and fund a test user wallet via Friendbot
  const user = Keypair.random();
  console.log(`1️⃣  Created Test User Wallet: ${user.publicKey()}`);
  console.log('    Funding user wallet with 10,000 XLM from Friendbot faucet...');
  const fundRes = await fetch(`https://friendbot.stellar.org?addr=${user.publicKey()}`);
  if (!fundRes.ok) throw new Error('Friendbot funding failed');
  console.log('    ✅ User Wallet Funded on Testnet!\n');

  // 2. Read initial contract vault stats
  console.log('2️⃣  Calling get_vault_stats() (Read-only simulation on chain)...');
  let account = await horizon.loadAccount(user.publicKey());
  
  let simTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'get_vault_stats',
        args: [],
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  let simRes = await rpc.simulateTransaction(simTx);
  if (SorobanRpc.Api.isSimulationError(simRes)) {
    throw new Error(`Simulation failed: ${simRes.error}`);
  }
  const initialStats = scValToNative(simRes.result.retval);
  console.log('    ✅ Current On-Chain Stats:', initialStats, '\n');

  // 3. Submit real on-chain feedback (Write transaction)
  console.log('3️⃣  Calling send_feedback() — Submitting new feedback to Stellar Testnet...');
  account = await horizon.loadAccount(user.publicKey());

  let sendTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'send_feedback',
        args: [
          new Address(user.publicKey()).toScVal(),
          nativeToScVal('Stellar Developer Challenge is awesome! Level 1-2-3 verified on-chain.', { type: 'string' }),
          nativeToScVal('general', { type: 'symbol' }),
        ],
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  const sendSim = await rpc.simulateTransaction(sendTx);
  if (SorobanRpc.Api.isSimulationError(sendSim)) {
    throw new Error(`send_feedback simulation failed: ${sendSim.error}`);
  }

  sendTx = SorobanRpc.assembleTransaction(sendTx, sendSim).build();
  sendTx.sign(user);

  console.log('    Broadcasting signed transaction to Soroban RPC...');
  const sendRes = await rpc.sendTransaction(sendTx);
  console.log(`    Submitted Tx Hash: ${sendRes.hash}`);

  // Wait for confirmation
  let status = await rpc.getTransaction(sendRes.hash);
  while (status.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1500));
    status = await rpc.getTransaction(sendRes.hash);
  }

  if (status.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed with status: ${status.status}`);
  }

  const newFeedbackId = scValToNative(status.returnValue);
  console.log(`    ✅ Feedback #${newFeedbackId} recorded permanently on Stellar ledger!`);
  console.log(`    🔗 Tx Explorer: https://stellar.expert/explorer/testnet/tx/${sendRes.hash}\n`);

  // 4. Query the feedback back from the contract (Read transaction)
  console.log(`4️⃣  Calling fetch_feedback(${newFeedbackId}) to read the stored state...`);
  account = await horizon.loadAccount(user.publicKey());

  let fetchTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: 'fetch_feedback',
        args: [nativeToScVal(newFeedbackId, { type: 'u64' })],
      })
    )
    .setTimeout(TimeoutInfinite)
    .build();

  const fetchSim = await rpc.simulateTransaction(fetchTx);
  const feedbackData = scValToNative(fetchSim.result.retval);
  console.log('    ✅ Retrieved Feedback Data from Stellar Ledger:');
  console.log('    -------------------------------------------------');
  console.log(`    ID        : ${feedbackData.id}`);
  console.log(`    Author    : ${feedbackData.author}`);
  console.log(`    Message   : "${feedbackData.message}"`);
  console.log(`    Category  : ${feedbackData.category}`);
  console.log(`    Timestamp : ${new Date(Number(feedbackData.timestamp) * 1000).toISOString()}`);
  console.log(`    Tips      : ${feedbackData.tips_received} stroops`);
  console.log('    -------------------------------------------------\n');

  console.log('🎉 ===========================================================');
  console.log('✅ 100% VERIFIED: SMART CONTRACT IS LIVE & FULLY OPERATIONAL!');
  console.log(`👉 View Contract on Explorer: https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`);
  console.log('===========================================================\n');
}

testLiveInteraction().catch((err) => {
  console.error('\n❌ Interaction error:', err);
});
