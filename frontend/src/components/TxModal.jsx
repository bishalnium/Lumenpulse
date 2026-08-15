import React from 'react';
import { useWallet } from '../context/WalletContext';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  ExternalLink,
  Shield,
  Key,
} from 'lucide-react';

export default function TxModal() {
  const {
    isWalletModalOpen,
    setIsWalletModalOpen,
    connectFreighter,
    connectDemoAccount,
    isLoading,
    error,
  } = useWallet();

  if (!isWalletModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsWalletModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Wallet size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Connect Stellar Wallet</h3>
          </div>
          <button
            onClick={() => setIsWalletModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          Select your preferred wallet provider on the Stellar Testnet. Freighter is the official browser extension for Stellar & Soroban.
        </p>

        {error && (
          <div
            className="glass-card-subtle"
            style={{
              padding: '0.75rem 1rem',
              color: '#ff8a80',
              borderColor: 'rgba(255, 23, 68, 0.4)',
              fontSize: '0.84rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Option 1: Freighter */}
          <button
            className="glass-card-subtle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              background: 'rgba(0, 229, 255, 0.08)',
              color: '#ffffff',
              transition: 'all 0.2s ease',
            }}
            onClick={connectFreighter}
            disabled={isLoading}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}
              >
                F
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Freighter Wallet</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Stellar Extension</div>
              </div>
            </div>
            <span className="status-pill status-live" style={{ fontSize: '0.72rem' }}>Recommended</span>
          </button>

          {/* Option 2: Albedo / Web Wallet */}
          <button
            className="glass-card-subtle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              border: '1px solid var(--border-glass)',
              color: '#ffffff',
              transition: 'all 0.2s ease',
            }}
            onClick={() => connectDemoAccount('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')}
            disabled={isLoading}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: 'var(--accent-purple)',
                }}
              >
                A
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Albedo / StellarWalletsKit</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Web & Mobile Multi-Wallet</div>
              </div>
            </div>
          </button>

          {/* Option 3: Instant Demo Test Account */}
          <button
            className="glass-card-subtle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              border: '1px solid var(--border-glass)',
              color: '#ffffff',
              transition: 'all 0.2s ease',
            }}
            onClick={() => connectDemoAccount()}
            disabled={isLoading}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(0, 230, 118, 0.15)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Key size={18} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Instant Testnet Account</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1-Click Funded Key for Testing</div>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Instant</span>
          </button>
        </div>

        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          Never share your Secret Key with anyone. LumenPulse only requests public keys and transaction signatures.
        </div>
      </div>
    </div>
  );
}
