import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  Wallet,
  Sparkles,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronDown,
  Layers,
  Send,
  MessageSquare,
  Activity,
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const {
    publicKey,
    isConnected,
    xlmBalance,
    isLoading,
    isFunding,
    disconnectWallet,
    refreshBalances,
    fundWithFriendbot,
    setIsWalletModalOpen,
  } = useWallet();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : '';

  return (
    <header className="glass-card header-container">
      {/* Brand Logo */}
      <div className="brand-logo">
        <div className="logo-icon">
          <Sparkles size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-title">LumenPulse</span>
            <span className="brand-badge">Testnet</span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Stellar & Soroban Feedback DAO
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Layers size={16} />
          <span>Dashboard</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          <Send size={16} />
          <span>Send XLM</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'dao' ? 'active' : ''}`}
          onClick={() => setActiveTab('dao')}
        >
          <MessageSquare size={16} />
          <span>Feedback DAO</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Activity size={16} />
          <span>Live Stream</span>
        </button>
      </nav>

      {/* Header Right Actions */}
      <div className="header-actions">
        {isConnected ? (
          <>
            {/* 1-Click Friendbot Faucet */}
            <button
              className="btn-secondary btn-faucet"
              onClick={fundWithFriendbot}
              disabled={isFunding}
              title="Request 10,000 Testnet XLM"
            >
              <Sparkles size={16} className={isFunding ? 'animate-spin' : ''} />
              <span>{isFunding ? 'Funding...' : 'Faucet (+10k XLM)'}</span>
            </button>

            {/* Refresh Balance */}
            <button
              className="btn-secondary"
              style={{ padding: '0.75rem' }}
              onClick={() => refreshBalances()}
              disabled={isLoading}
              title="Refresh Balance"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* Wallet Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ borderColor: 'rgba(0, 229, 255, 0.3)' }}
              >
                <div className="status-dot" style={{ color: 'var(--accent-emerald)' }}></div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {truncatedAddress}
                </span>
                <span
                  style={{
                    background: 'rgba(0, 229, 255, 0.15)',
                    color: 'var(--accent-cyan)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                  }}
                >
                  {xlmBalance} XLM
                </span>
                <ChevronDown size={14} />
              </button>

              {isDropdownOpen && (
                <div
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    padding: '0.75rem',
                    zIndex: 100,
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
                  }}
                >
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected Account</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        wordBreak: 'break-all',
                        marginTop: '0.25rem',
                      }}
                    >
                      {publicKey}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                      onClick={copyAddress}
                    >
                      <span>{copied ? '✓ Copied Address' : 'Copy Address'}</span>
                    </button>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{
                        justifyContent: 'flex-start',
                        border: 'none',
                        background: 'transparent',
                        textDecoration: 'none',
                      }}
                    >
                      <span>View on Explorer</span>
                      <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
                    </a>
                    <button
                      className="btn-secondary"
                      style={{
                        justifyContent: 'flex-start',
                        border: 'none',
                        background: 'rgba(255, 23, 68, 0.12)',
                        color: 'var(--accent-rose)',
                      }}
                      onClick={() => {
                        disconnectWallet();
                        setIsDropdownOpen(false);
                      }}
                    >
                      <LogOut size={14} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <button className="btn-primary" onClick={() => setIsWalletModalOpen(true)}>
            <Wallet size={18} />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
