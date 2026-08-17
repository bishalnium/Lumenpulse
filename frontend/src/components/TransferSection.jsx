import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { sendXlmPayment, EXPLORER_BASE } from '../services/stellar';
import { StrKey } from '@stellar/stellar-sdk';
import confetti from 'canvas-confetti';
import {
  Send,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function TransferSection({ onTriggerTxModal }) {
  const { publicKey, isConnected, xlmBalance, refreshBalances, signTx, setIsWalletModalOpen } = useWallet();

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState(null); // 'submitting' | 'success' | 'error'
  const [txResult, setTxResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Sample quick test recipient addresses
  const sampleAddresses = [
    { label: 'Demo Validator', address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5' },
    { label: 'Community Pool', address: 'GC3C4ACWCA7UC2KM4NL2Y4DCWJ64R2X3PGLJ6P26L7A7XG7K6Y27Z3N5' },
  ];

  const handleMaxClick = () => {
    const num = parseFloat(xlmBalance);
    if (num > 1) {
      // Leave 1 XLM for base reserve & fees
      setAmount((num - 1).toFixed(4));
    } else {
      setAmount(num.toString());
    }
  };

  const handleSendPayment = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    // Validation
    const dest = destination.trim();
    if (!dest) {
      setErrorMsg('Please enter a destination Stellar address');
      return;
    }

    if (!StrKey.isValidEd25519PublicKey(dest)) {
      setErrorMsg('Invalid Stellar address. Must start with "G" and be 56 characters.');
      return;
    }

    if (dest === publicKey) {
      setErrorMsg('Cannot send payment to your own address.');
      return;
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setErrorMsg('Please enter a valid positive payment amount');
      return;
    }

    if (payAmount > parseFloat(xlmBalance)) {
      setErrorMsg('Insufficient balance to cover payment and network reserve fees');
      return;
    }

    setErrorMsg('');
    setStatus('submitting');
    setTxResult(null);

    try {
      const result = await sendXlmPayment({
        senderPublicKey: publicKey,
        destinationPublicKey: dest,
        amount: payAmount.toString(),
        memoText: memo,
        signerFn: signTx,
      });

      if (result.success) {
        setStatus('success');
        setTxResult(result);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00e5ff', '#3d5afe', '#00e676'],
        });
        await refreshBalances(publicKey);
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'Transaction failed to complete');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'An unexpected error occurred during transfer');
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Send XLM Payment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
              Transfer native Stellar Lumens on Testnet with instant finality
            </p>
          </div>
        </div>

        <form onSubmit={handleSendPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Destination Address */}
          <div className="input-group">
            <label className="input-label">
              <span>Recipient Public Address</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Starts with 'G'</span>
            </label>
            <input
              type="text"
              className="glass-input"
              style={{ fontFamily: 'var(--font-mono)' }}
              placeholder="e.g. GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={status === 'submitting'}
            />

            {/* Quick Fill Sample Addresses */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Quick test:</span>
              {sampleAddresses.map((s, idx) => (
                <button
                  type="button"
                  key={idx}
                  className="btn-secondary"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.74rem' }}
                  onClick={() => setDestination(s.address)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="input-group">
            <div className="input-label">
              <span>Amount to Send (XLM)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Available: {xlmBalance} XLM
                </span>
                <button
                  type="button"
                  onClick={handleMaxClick}
                  style={{
                    background: 'rgba(0, 229, 255, 0.15)',
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    color: 'var(--accent-cyan)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  MAX
                </button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                className="glass-input"
                style={{ fontFamily: 'var(--font-mono)', paddingRight: '4.5rem' }}
                placeholder="100.0000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={status === 'submitting'}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  fontSize: '0.85rem',
                }}
              >
                XLM
              </span>
            </div>
          </div>

          {/* Optional Memo */}
          <div className="input-group">
            <label className="input-label">
              <span>Transaction Memo (Optional)</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max 28 chars</span>
            </label>
            <input
              type="text"
              maxLength={28}
              className="glass-input"
              placeholder="e.g. LumenPulse Protocol Tip"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={status === 'submitting'}
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              className="glass-card-subtle"
              style={{
                padding: '0.85rem 1rem',
                borderColor: 'rgba(255, 23, 68, 0.3)',
                background: 'rgba(255, 23, 68, 0.08)',
                color: '#ff8a80',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.88rem',
              }}
            >
              <AlertCircle size={18} color="var(--accent-rose)" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0.95rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <Clock size={18} className="animate-spin" />
                <span>Submitting to Stellar Testnet...</span>
              </>
            ) : (
              <>
                <span>Confirm & Send Payment</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Transaction Success Feedback (Level 1 Requirement) */}
        {status === 'success' && txResult && (
          <div
            className="glass-card"
            style={{
              marginTop: '1.75rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1), rgba(0, 229, 255, 0.08))',
              borderColor: 'rgba(0, 230, 118, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={22} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                Payment Successfully Submitted!
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Your testnet transaction has been confirmed on the ledger by the Stellar Consensus Protocol.
            </p>

            <div
              className="glass-card-subtle"
              style={{
                padding: '0.85rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                marginBottom: '1rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Hash: </span>
              <span style={{ color: 'var(--accent-cyan)' }}>{txResult.hash}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a
                href={txResult.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{
                  padding: '0.6rem 1.1rem',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))',
                }}
              >
                <span>View on Stellar.Expert</span>
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}
                onClick={() => {
                  setStatus(null);
                  setAmount('');
                  setDestination('');
                  setMemo('');
                }}
              >
                Send Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
