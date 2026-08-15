import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  isConnected as checkFreighterConnected,
  getPublicKey as getFreighterPublicKey,
  signTransaction as signFreighterTx,
  requestAccess as requestFreighterAccess,
} from '@stellar/freighter-api';
import { fetchAccountBalances, requestFriendbotFunding } from '../services/stellar';

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
      const hasFreighter = await checkFreighterConnected();
      if (!hasFreighter) {
        throw new Error('Freighter wallet extension not found. Please install it from freighter.app');
      }

      const accessObj = await requestFreighterAccess();
      if (accessObj.error) {
        throw new Error(accessObj.error);
      }

      const pubKey = await getFreighterPublicKey();
      if (!pubKey) {
        throw new Error('Failed to retrieve public key from Freighter');
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
  const connectDemoAccount = async (customKey = null) => {
    setIsLoading(true);
    try {
      // Default funded testnet demo account
      const demoKey = customKey || 'GA22D77WJ3P6LYE27S5W6F3E6W8B9K2M4Z7Y3N5H8L3V8B9K2MCBWRFN';
      setPublicKey(demoKey);
      setWalletType('Demo / Manual Key');
      localStorage.setItem('lumenpulse_wallet', demoKey);
      localStorage.setItem('lumenpulse_wallet_type', 'Demo / Manual Key');
      setIsWalletModalOpen(false);
      await refreshBalances(demoKey);
      return { success: true, publicKey: demoKey };
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setPublicKey(null);
    setBalances([{ asset: 'XLM', balance: '0.0000', isNative: true }]);
    localStorage.removeItem('lumenpulse_wallet');
    localStorage.removeItem('lumenpulse_wallet_type');
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
      const signed = await signFreighterTx(xdrString, {
        networkPassphrase: 'Test SDF Network ; September 2015',
      });
      return signed;
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
