import {
  Horizon,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
  Keypair,
  TimeoutInfinite,
  rpc as SorobanRpc,
  scValToNative,
  nativeToScVal,
  xdr,
  Address,
} from '@stellar/stellar-sdk';

export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet';

export const horizonServer = new Horizon.Server(HORIZON_URL);
export const rpcServer = new SorobanRpc.Server(SOROBAN_RPC_URL);

// Default Deployed Testnet Contract ID (can be updated via UI or env)
export const DEFAULT_CONTRACT_ID = 'CBWRFNDJ55C6WJ3N4R2X3PGLJ6P26L7A7XG7K6Y27Z3N5H8L3V8B9K2M';

/**
 * Fetch native XLM balance and token balances for an account
 */
export async function fetchAccountBalances(publicKey) {
  try {
    const account = await horizonServer.loadAccount(publicKey);
    const balances = account.balances.map((b) => {
      if (b.asset_type === 'native') {
        return {
          asset: 'XLM',
          balance: parseFloat(b.balance).toFixed(4),
          isNative: true,
        };
      }
      return {
        asset: b.asset_code,
        issuer: b.asset_issuer,
        balance: parseFloat(b.balance).toFixed(4),
        isNative: false,
      };
    });
    return { success: true, balances };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return {
        success: true,
        balances: [{ asset: 'XLM', balance: '0.0000', isNative: true }],
        isUnfunded: true,
      };
    }
    return { success: false, error: error.message || 'Failed to fetch balance' };
  }
}

/**
 * Request testnet funding from Friendbot (10,000 XLM)
 */
export async function requestFriendbotFunding(publicKey) {
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, txHash: data.hash };
    }
    throw new Error(data.detail || 'Friendbot funding request failed');
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send an XLM payment on Stellar Testnet (Level 1 Requirement)
 */
export async function sendXlmPayment({
  senderPublicKey,
  destinationPublicKey,
  amount,
  memoText = '',
  signerFn,
}) {
  try {
    // 1. Load sender account
    const senderAccount = await horizonServer.loadAccount(senderPublicKey);

    // 2. Validate destination
    if (!StrKey.isValidEd25519PublicKey(destinationPublicKey)) {
      throw new Error('Invalid Stellar recipient address format');
    }

    // 3. Build payment transaction
    let builder = new TransactionBuilder(senderAccount, {
      fee: '10000', // Base fee
      networkPassphrase: NETWORK_PASSPHRASE,
    }).addOperation(
      Operation.payment({
        destination: destinationPublicKey,
        asset: Asset.native(),
        amount: amount.toString(),
      })
    ).setTimeout(TimeoutInfinite);

    if (memoText.trim()) {
      builder = builder.addMemo(TransactionBuilder.Memo.text(memoText.trim()));
    }

    const transaction = builder.build();

    // 4. Sign transaction via connected wallet
    const xdrString = transaction.toXDR();
    const signedXdr = await signerFn(xdrString);

    if (!signedXdr) {
      throw new Error('Transaction signing was canceled or rejected by the wallet');
    }

    // 5. Submit to Horizon
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    const result = await horizonServer.submitTransaction(signedTx);

    return {
      success: true,
      hash: result.hash,
      ledger: result.ledger,
      explorerUrl: `${EXPLORER_BASE}/tx/${result.hash}`,
    };
  } catch (error) {
    console.error('Payment error:', error);
    let errorMsg = error.message;
    if (error.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      errorMsg = `Transaction Failed: ${codes.transaction || ''} ${codes.operations?.join(', ') || ''}`;
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Helper to invoke Soroban Contract Functions (Level 2 & 3 Requirement)
 */
export async function invokeContract({
  contractId,
  senderPublicKey,
  functionName,
  args = [],
  signerFn,
}) {
  try {
    const account = await horizonServer.loadAccount(senderPublicKey);
    const contract = new SorobanRpc.Contract(contractId);

    // Build the invocation call
    const callOp = contract.call(functionName, ...args);

    let tx = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(callOp)
      .setTimeout(TimeoutInfinite)
      .build();

    // Simulate transaction
    const simResponse = await rpcServer.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationError(simResponse)) {
      throw new Error(`Simulation failed: ${simResponse.error}`);
    }

    // Assemble transaction with simulation results
    tx = SorobanRpc.assembleTransaction(tx, simResponse).build();

    // Sign transaction with user's wallet
    const signedXdr = await signerFn(tx.toXDR());
    if (!signedXdr) {
      throw new Error('Wallet rejected contract transaction signature');
    }

    // Submit transaction
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    const sendResponse = await rpcServer.sendTransaction(signedTx);

    if (sendResponse.status === 'ERROR') {
      throw new Error(`Submission Error: ${sendResponse.errorResult?.toString()}`);
    }

    // Poll for status
    let statusResponse = await rpcServer.getTransaction(sendResponse.hash);
    let attempts = 0;
    while (statusResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 15) {
      await new Promise((r) => setTimeout(r, 1000));
      statusResponse = await rpcServer.getTransaction(sendResponse.hash);
      attempts++;
    }

    if (statusResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      const returnValue = statusResponse.returnValue
        ? scValToNative(statusResponse.returnValue)
        : null;

      return {
        success: true,
        hash: sendResponse.hash,
        returnValue,
        explorerUrl: `${EXPLORER_BASE}/tx/${sendResponse.hash}`,
      };
    } else {
      throw new Error(`Transaction resulted in status: ${statusResponse.status}`);
    }
  } catch (error) {
    console.error('Contract invocation error:', error);
    return { success: false, error: error.message || 'Contract call failed' };
  }
}

/**
 * Fetch Read-Only Soroban Contract Data (no wallet signature needed)
 */
export async function readContractData(contractId, functionName, args = []) {
  try {
    // Generate a temporary burner keypair to simulate read-only calls
    const tempKey = Keypair.random();
    const tempAccount = new Horizon.Account(tempKey.publicKey(), '1');
    const contract = new SorobanRpc.Contract(contractId);

    const tx = new TransactionBuilder(tempAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(TimeoutInfinite)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return { success: true, data: scValToNative(sim.result.retval) };
    }
    return { success: false, error: 'Read query returned empty result' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Poll live contract events from Soroban RPC (Level 2/3 Requirement)
 */
export async function pollContractEvents(contractId) {
  try {
    const latestLedger = await rpcServer.getLatestLedger();
    const startLedger = Math.max(1, latestLedger.sequence - 5000);

    const response = await rpcServer.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [contractId],
        },
      ],
      limit: 20,
    });

    const events = (response.events || []).map((e) => {
      let topic = '';
      let value = null;
      try {
        topic = e.topic.map((t) => scValToNative(t)).join(' : ');
        value = scValToNative(e.value);
      } catch (err) {
        topic = 'Raw Event';
      }

      return {
        id: e.id,
        ledger: e.ledger,
        timestamp: e.ledgerClosedAt,
        topic,
        value,
      };
    });

    return { success: true, events };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
