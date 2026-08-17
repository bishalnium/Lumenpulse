import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  isConnected as checkFreighterConnected,
  signTransaction as signFreighterTx,
  requestAccess as requestFreighterAccess,
  getAddress as getFreighterAddress,
} from '@stellar/freighter-api';
import { Keypair } from '@stellar/stellar-sdk';
import { fetchAccountBalances, requestFriendbotFunding, NETWORK_PASSPHRASE } from '../services/stellar';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [publicKey, setPublicKey] = useState(() => localStorage.getItem('lumenpulse_wallet') || null);
  const [walletType, setWalletType] = useState(() => localStorage.getItem('lumenpulse_wallet_type') || 'Freighter');
  const [balances, setBalances] = useState([{ asset: 'XLM', balance: '0.0000', isNative: true }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [error, setError] = useState(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Refresh balances
  const refreshBalances = useCallback(async (pubKeyToFetch) => {
    const key = pubKeyToFetch || publicKey;
    if (!key) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAccountBalances(key);
      if (res.success) {
        setBalances(res.balances);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Connect Freighter Wallet
  const connectFreighter = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let connected = false;
      if (typeof checkFreighterConnected === 'function') {
        const connRes = await checkFreighterConnected();
        connected = typeof connRes === 'object' && connRes !== null ? !!connRes.isConnected : !!connRes;
      } else if (typeof window !== 'undefined' && (window.freighter || window.freighterApi)) {
        connected = true;
      }

      if (!connected) {
        throw new Error('Freighter extension not detected. Please install Freighter from freighter.app.');
      }

      let pubKey = null;
      if (typeof requestFreighterAccess === 'function') {
        try {
          const accessObj = await requestFreighterAccess();
          if (accessObj && accessObj.address) pubKey = accessObj.address;
          else if (typeof accessObj === 'string' && accessObj.startsWith('G')) pubKey = accessObj;
          else if (accessObj && accessObj.error) throw new Error(accessObj.error);
        } catch (e) {
          console.warn('requestFreighterAccess failed:', e);
        }
      }

      if (!pubKey && typeof getFreighterAddress === 'function') {
        try {
          const addrRes = await getFreighterAddress();
          if (addrRes && addrRes.address) pubKey = addrRes.address;
          else if (typeof addrRes === 'string' && addrRes.startsWith('G')) pubKey = addrRes;
          else if (addrRes && addrRes.error) throw new Error(addrRes.error);
        } catch (e) {
          console.warn('getFreighterAddress failed:', e);
        }
      }

      if (!pubKey && typeof window !== 'undefined' && window.freighter) {
        if (typeof window.freighter.requestAccess === 'function') {
          const res = await window.freighter.requestAccess();
          if (res && res.address) pubKey = res.address;
          else if (typeof res === 'string') pubKey = res;
        } else if (typeof window.freighter.getPublicKey === 'function') {
          pubKey = await window.freighter.getPublicKey();
        }
      }

      if (!pubKey) {
        throw new Error('No account selected or permission was denied in Freighter.');
      }

      setPublicKey(pubKey);
      setWalletType('Freighter');
      localStorage.setItem('lumenpulse_wallet', pubKey);
      localStorage.setItem('lumenpulse_wallet_type', 'Freighter');
      setIsWalletModalOpen(false);

      await refreshBalances(pubKey);
      return { success: true, publicKey: pubKey };
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Connect via Simulated / Demo Account (For instant testnet testing)
  const connectDemoAccount = async () => {
    setIsLoading(true);
    try {
      let secret = localStorage.getItem('lumenpulse_demo_secret');
      let keypair;
      if (secret) {
        keypair = Keypair.fromSecret(secret);
      } else {
        keypair = Keypair.random();
        localStorage.setItem('lumenpulse_demo_secret', keypair.secret());
      }
      const demoKey = keypair.publicKey();
      setPublicKey(demoKey);
      setWalletType('Demo / Manual Key');
      localStorage.setItem('lumenpulse_wallet', demoKey);
      localStorage.setItem('lumenpulse_wallet_type', 'Demo / Manual Key');
      setIsWalletModalOpen(false);

      const balRes = await fetchAccountBalances(demoKey);
      if (balRes.notFunded) {
        setIsFunding(true);
        await requestFriendbotFunding(demoKey);
        setIsFunding(false);
      }
      await refreshBalances(demoKey);
      return { success: true, publicKey: demoKey };
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setPublicKey(null);
    setWalletType(null);
    setBalances([{ asset: 'XLM', balance: '0.0000', isNative: true }]);
    localStorage.removeItem('lumenpulse_wallet');
    localStorage.removeItem('lumenpulse_wallet_type');
    localStorage.removeItem('lumenpulse_demo_secret');
  };

  // 1-Click Friendbot Faucet
  const fundWithFriendbot = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    setError(null);
    try {
      const res = await requestFriendbotFunding(publicKey);
      if (res.success) {
        await refreshBalances(publicKey);
        return { success: true, txHash: res.txHash };
      } else {
        throw new Error(res.error || 'Faucet request failed');
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsFunding(false);
    }
  };

  // Sign Transaction delegate
  const signTx = async (xdrString) => {
    if (walletType === 'Freighter') {
      let signedXdr = null;
      if (typeof signFreighterTx === 'function') {
        const signRes = await signFreighterTx(xdrString, {
          networkPassphrase: NETWORK_PASSPHRASE,
        });
        if (signRes && signRes.signedTxXdr) signedXdr = signRes.signedTxXdr;
        else if (typeof signRes === 'string') signedXdr = signRes;
        else if (signRes && signRes.error) throw new Error(signRes.error);
      }

      if (!signedXdr && typeof window !== 'undefined' && window.freighter && typeof window.freighter.signTransaction === 'function') {
        const signRes = await window.freighter.signTransaction(xdrString, {
          networkPassphrase: NETWORK_PASSPHRASE,
        });
        if (signRes && signRes.signedTxXdr) signedXdr = signRes.signedTxXdr;
        else if (typeof signRes === 'string') signedXdr = signRes;
      }

      if (!signedXdr) throw new Error('Transaction signing was canceled or rejected by user in Freighter');
      return signedXdr;
    } else if (walletType === 'Demo / Manual Key') {
      const secret = localStorage.getItem('lumenpulse_demo_secret');
      if (secret) {
        const keypair = Keypair.fromSecret(secret);
        const { TransactionBuilder } = await import('@stellar/stellar-sdk');
        const tx = TransactionBuilder.fromXDR(xdrString, NETWORK_PASSPHRASE);
        tx.sign(keypair);
        return tx.toXDR();
      }
    }
    throw new Error(`Signing not supported for wallet type: ${walletType}`);
  };

  useEffect(() => {
    if (publicKey) {
      refreshBalances(publicKey);
    }
  }, [publicKey, refreshBalances]);

  const xlmBalance = balances.find((b) => b.isNative)?.balance || '0.0000';

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        walletType,
        balances,
        xlmBalance,
        isConnected: !!publicKey,
        isLoading,
        isFunding,
        error,
        isWalletModalOpen,
        setIsWalletModalOpen,
        connectFreighter,
        connectDemoAccount,
        disconnectWallet,
        refreshBalances,
        fundWithFriendbot,
        signTx,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
