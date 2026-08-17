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
  Copy,
  Check,
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
          <Sparkles size={22} color="#ffffff" />
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

      {/* Header Actions / Connected Wallet */}
      <div className="header-actions">
        {isConnected ? (
          <>
            {/* 1-Click Faucet Button */}
            <button
              className="btn-primary btn-faucet"
              style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}
              onClick={fundWithFriendbot}
              disabled={isFunding}
              title="Request 10,000 Testnet XLM"
            >
              <Sparkles size={15} className={isFunding ? 'spin' : ''} />
              <span>{isFunding ? 'Funding...' : 'Faucet (+10k XLM)'}</span>
            </button>

            {/* Refresh Balance */}
            <button
              className="btn-secondary"
              style={{ padding: '0.65rem', borderRadius: '12px' }}
              onClick={() => refreshBalances()}
              disabled={isLoading}
              title="Refresh Balance"
            >
              <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            </button>

            {/* Wallet Dropdown with Account */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-secondary"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  borderColor: 'rgba(0, 229, 255, 0.35)',
                  padding: '0.6rem 1rem',
                  gap: '0.6rem',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent-emerald)',
                    boxShadow: '0 0 8px var(--accent-emerald)',
                  }}
                ></div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.86rem' }}>
                  {truncatedAddress}
                </span>
                <span
                  style={{
                    background: 'rgba(0, 229, 255, 0.15)',
                    color: 'var(--accent-cyan)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  {xlmBalance} XLM
                </span>
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
              </button>

              {isDropdownOpen && (
                <div
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '270px',
                    padding: '0.85rem',
                    zIndex: 100,
                    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    background: '#070a14',
                  }}
                >
                  <div style={{ padding: '0.4rem 0.5rem 0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Connected Account
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        wordBreak: 'break-all',
                        marginTop: '0.25rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {publicKey}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.65rem' }}>
                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'flex-start', border: 'none', background: 'rgba(255, 255, 255, 0.04)', padding: '0.55rem 0.75rem', fontSize: '0.82rem' }}
                      onClick={copyAddress}
                    >
                      {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied Address!' : 'Copy Address'}</span>
                    </button>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{
                        justifyContent: 'flex-start',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.04)',
                        textDecoration: 'none',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span>View on Explorer</span>
                      <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Disconnect Button on Main Header */}
            <button
              className="btn-disconnect"
              onClick={() => {
                disconnectWallet();
                setIsDropdownOpen(false);
              }}
              title="Disconnect Wallet"
            >
              <LogOut size={14} />
              <span>Disconnect</span>
            </button>
          </>
        ) : (
          <button
            className="btn-primary"
            style={{ padding: '0.7rem 1.4rem', fontSize: '0.92rem' }}
            onClick={() => setIsWalletModalOpen(true)}
          >
            <Wallet size={17} />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
