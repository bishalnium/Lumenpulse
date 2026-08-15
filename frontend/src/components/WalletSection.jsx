import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  QrCode,
} from 'lucide-react';

export default function WalletSection({ onNavigate }) {
  const {
    publicKey,
    isConnected,
    balances,
    xlmBalance,
    isLoading,
    isFunding,
    fundWithFriendbot,
    setIsWalletModalOpen,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const copyAddress = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(61, 90, 254, 0.2), rgba(0, 229, 255, 0.2))',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: 'var(--glow-cyan)',
          }}
        >
          <Wallet size={32} color="var(--accent-cyan)" />
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Connect to Stellar Testnet
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            maxWidth: '520px',
            margin: '0 auto 2rem',
            lineHeight: 1.6,
          }}
        >
          Connect your Freighter wallet, Albedo, or test with a simulated key to send XLM payments,
          interact with Soroban smart contracts, and explore real-time DAO feedback events.
        </p>
        <button
          className="btn-primary"
          style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}
          onClick={() => setIsWalletModalOpen(true)}
        >
          <Zap size={20} />
          <span>Connect Wallet Now</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero Balance Card */}
      <div className="glass-card balance-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Total Available Balance
              </span>
              <span className="status-pill status-live">
                <span className="status-dot"></span>
                <span>Testnet Active</span>
              </span>
            </div>
            <div className="balance-amount">{isLoading ? 'Loading...' : `${xlmBalance} XLM`}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="address-pill" onClick={copyAddress} title="Click to copy full address">
                <span style={{ color: 'var(--accent-cyan)' }}>G:</span>
                <span>{publicKey.slice(0, 8)}...{publicKey.slice(-8)}</span>
                {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              </div>
              <button
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                onClick={() => setShowQr(!showQr)}
              >
                <QrCode size={14} />
                <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
              </button>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', textDecoration: 'none' }}
              >
                <span>Explorer</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={() => onNavigate('transfer')}>
              <ArrowUpRight size={16} />
              <span>Send XLM Payment</span>
            </button>
            <button
              className="btn-secondary btn-faucet"
              onClick={fundWithFriendbot}
              disabled={isFunding}
            >
              <Sparkles size={16} className={isFunding ? 'animate-spin' : ''} />
              <span>{isFunding ? 'Requesting 10k XLM...' : 'Fund with Friendbot'}</span>
            </button>
          </div>
        </div>

        {/* QR Code Expansion */}
        {showQr && (
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${publicKey}&bgcolor=0b1022&color=00e5ff`}
              alt="Account QR Code"
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                padding: '0.35rem',
                background: '#070a14',
              }}
            />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                Scan to Receive Payments
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '360px', lineHeight: 1.5 }}>
                Share your public key via QR code to receive testnet lumens or custom tokens from any Stellar wallet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Assets & Stats */}
      <div className="dashboard-grid">
        {/* Token Balances */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Coins size={18} color="var(--accent-cyan)" />
              <span>Account Assets</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {balances.length} {balances.length === 1 ? 'Asset' : 'Assets'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {balances.map((token, idx) => (
              <div
                key={idx}
                className="glass-card-subtle"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: token.isNative
                        ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))'
                        : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                    }}
                  >
                    {token.asset.slice(0, 3)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{token.asset}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {token.isNative ? 'Native Stellar Lumens' : `Issuer: ${token.issuer?.slice(0, 6)}...`}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' }}>
                    {token.balance}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                    {token.asset}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network & Protocol Info */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--accent-emerald)" />
              <span>Protocol Specs</span>
            </h3>
            <span className="status-pill status-live">Online</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Network</span>
              <span style={{ fontWeight: 600 }}>Stellar Testnet (SEP-0041)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Consensus Protocol</span>
              <span style={{ fontWeight: 600 }}>SCP (Stellar Consensus)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Smart Contract Engine</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>Soroban WASM v22</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Block / Ledger Time</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>~3.5s Finality</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Base Fee</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>0.00001 XLM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
