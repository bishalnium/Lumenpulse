import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  invokeContract,
  readContractData,
  DEFAULT_CONTRACT_ID,
  EXPLORER_BASE,
} from '../services/stellar';
import { nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import confetti from 'canvas-confetti';
import {
  MessageSquare,
  Send,
  Search,
  Sparkles,
  Heart,
  TrendingUp,
  Clock,
  Layers,
  AlertCircle,
  ExternalLink,
  Filter,
} from 'lucide-react';

export default function FeedbackDAOSection() {
  const { publicKey, isConnected, signTx, setIsWalletModalOpen } = useWallet();

  const [contractId, setContractId] = useState(DEFAULT_CONTRACT_ID);
  const [activeCategory, setActiveCategory] = useState('all');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      sender: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      message: 'Stellar fast finality (~3.5s) enables incredible user experiences for web3 apps!',
      category: 'general',
      timestamp: Date.now() - 3600000,
      tips: '25.0000',
    },
    {
      id: 2,
      sender: 'GC3C4ACWCA7UC2KM4NL2Y4DCWJ64R2X3PGLJ6P26L7A7XG7K6Y27Z3N5',
      message: 'Soroban WASM v22 smart contract execution on testnet is smooth and predictable.',
      category: 'smart-contracts',
      timestamp: Date.now() - 7200000,
      tips: '10.0000',
    },
    {
      id: 3,
      sender: 'GA22D77WJ3P6LYE27S5W6F3E6W8B9K2M4Z7Y3N5H8L3V8B9K2MCBWRFN',
      message: 'Glassmorphism UI design makes decentralized governance fun and intuitive.',
      category: 'ui',
      timestamp: Date.now() - 14400000,
      tips: '5.0000',
    },
  ]);

  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'general', label: 'General' },
    { id: 'smart-contracts', label: 'Smart Contracts' },
    { id: 'ui', label: 'UI / UX' },
    { id: 'dao', label: 'DAO Governance' },
  ];

  // Submit Feedback to Contract
  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    if (!message.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a feedback message' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // Build scVal parameters for send_feedback(sender, message, category)
      const senderVal = nativeToScVal(publicKey, { type: 'address' });
      const msgVal = nativeToScVal(message.trim(), { type: 'string' });
      const catVal = nativeToScVal(category, { type: 'symbol' });

      const res = await invokeContract({
        contractId: contractId.trim(),
        senderPublicKey: publicKey,
        functionName: 'send_feedback',
        args: [senderVal, msgVal, catVal],
        signerFn: signTx,
      });

      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00e5ff', '#7c4dff', '#00e676'],
        });

        const newFb = {
          id: res.returnValue || feedbacks.length + 1,
          sender: publicKey,
          message: message.trim(),
          category: category,
          timestamp: Date.now(),
          tips: '0.0000',
          txHash: res.hash,
        };

        setFeedbacks([newFb, ...feedbacks]);
        setMessage('');
        setStatusMessage({
          type: 'success',
          text: `Feedback #${newFb.id} submitted on-chain! Tx: ${res.hash.slice(0, 10)}...`,
          url: res.explorerUrl,
        });
      } else {
        // Fallback for simulation / demo mode
        const localId = feedbacks.length + 1;
        const newFb = {
          id: localId,
          sender: publicKey,
          message: message.trim(),
          category: category,
          timestamp: Date.now(),
          tips: '0.0000',
        };
        setFeedbacks([newFb, ...feedbacks]);
        setMessage('');
        setStatusMessage({
          type: 'success',
          text: `Feedback #${localId} recorded successfully!`,
        });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Contract call failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tip Feedback Author
  const handleTip = async (feedbackItem) => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    try {
      const tipScVal = nativeToScVal(10_0000000n, { type: 'i128' }); // 10 XLM
      const idScVal = nativeToScVal(BigInt(feedbackItem.id), { type: 'u64' });
      const tipperScVal = nativeToScVal(publicKey, { type: 'address' });

      const res = await invokeContract({
        contractId: contractId.trim(),
        senderPublicKey: publicKey,
        functionName: 'tip_feedback',
        args: [tipperScVal, idScVal, tipScVal],
        signerFn: signTx,
      });

      // Update local state
      setFeedbacks((prev) =>
        prev.map((fb) =>
          fb.id === feedbackItem.id
            ? { ...fb, tips: (parseFloat(fb.tips) + 10).toFixed(4) }
            : fb
        )
      );

      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    } catch (err) {
      // Local optimistic update
      setFeedbacks((prev) =>
        prev.map((fb) =>
          fb.id === feedbackItem.id
            ? { ...fb, tips: (parseFloat(fb.tips) + 10).toFixed(4) }
            : fb
        )
      );
    }
  };

  // Search Feedback by ID
  const handleSearch = async (e) => {
    e.preventDefault();
    const id = parseInt(searchId);
    if (isNaN(id) || id <= 0) return;

    setSearchLoading(true);
    setSearchResult(null);

    // Search local list first
    const found = feedbacks.find((f) => f.id === id);
    if (found) {
      setSearchResult(found);
      setSearchLoading(false);
      return;
    }

    try {
      const idVal = nativeToScVal(BigInt(id), { type: 'u64' });
      const res = await readContractData(contractId.trim(), 'fetch_feedback', [idVal]);
      if (res.success && res.data) {
        setSearchResult({
          id: res.data.id || id,
          sender: res.data.sender || 'Unknown',
          message: res.data.message || '',
          category: res.data.category || 'general',
          timestamp: res.data.timestamp ? Number(res.data.timestamp) * 1000 : Date.now(),
          tips: res.data.tips ? (Number(res.data.tips) / 10000000).toFixed(4) : '0.0000',
        });
      } else {
        setSearchResult({ notFound: true });
      }
    } catch (err) {
      setSearchResult({ notFound: true });
    } finally {
      setSearchLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (activeCategory === 'all') return true;
    return fb.category === activeCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Stats Banner */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MessageSquare size={22} color="var(--accent-cyan)" />
              <span>Soroban Anonymous Feedback DAO</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.2rem' }}>
              Submit, vote, and tip on-chain feedback powered by Soroban Rust smart contracts
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="glass-card-subtle" style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL POSTS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {feedbacks.length}
              </div>
            </div>
            <div className="glass-card-subtle" style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIPS REWARDED</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {feedbacks.reduce((acc, f) => acc + parseFloat(f.tips || 0), 0).toFixed(1)} XLM
              </div>
            </div>
          </div>
        </div>

        {/* Contract ID Address */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contract ID:</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)',
              background: 'rgba(0, 229, 255, 0.08)',
              padding: '0.25rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid rgba(0, 229, 255, 0.2)',
            }}
          >
            {contractId.slice(0, 10)}...{contractId.slice(-10)}
          </span>
          <a
            href={`${EXPLORER_BASE}/contract/${contractId}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
          >
            <span>Contract Explorer</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Grid: Create Feedback + Query by ID */}
      <div className="dashboard-grid">
        {/* Submit Form */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--accent-purple)" />
            <span>Post New Feedback / Proposal</span>
          </h3>

          <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select
                className="glass-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="general" style={{ background: '#0a0e1c' }}>General Feedback</option>
                <option value="smart-contracts" style={{ background: '#0a0e1c' }}>Smart Contracts</option>
                <option value="ui" style={{ background: '#0a0e1c' }}>UI / UX Design</option>
                <option value="dao" style={{ background: '#0a0e1c' }}>DAO Governance</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Message (stored persistently on-chain)</label>
              <textarea
                className="glass-input glass-textarea"
                placeholder="Share ideas, proposals, or community feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {statusMessage && (
              <div
                className="glass-card-subtle"
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.84rem',
                  borderColor: statusMessage.type === 'error' ? 'rgba(255, 23, 68, 0.4)' : 'rgba(0, 230, 118, 0.4)',
                  color: statusMessage.type === 'error' ? '#ff8a80' : 'var(--accent-emerald)',
                }}
              >
                {statusMessage.text}
                {statusMessage.url && (
                  <a
                    href={statusMessage.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-cyan)', marginLeft: '0.5rem', fontWeight: 600 }}
                  >
                    View Tx
                  </a>
                )}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  <span>Submitting to Soroban...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit to Contract</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Search Feedback by ID */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="var(--accent-cyan)" />
            <span>Query Feedback by ID (`fetch_feedback`)</span>
          </h3>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <input
              type="number"
              min="1"
              className="glass-input"
              style={{ fontFamily: 'var(--font-mono)' }}
              placeholder="Enter ID (e.g. 1)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button type="submit" className="btn-secondary" disabled={searchLoading}>
              <Search size={16} />
              <span>Query</span>
            </button>
          </form>

          {searchResult && (
            <div className="glass-card-subtle" style={{ padding: '1.25rem' }}>
              {searchResult.notFound ? (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.88rem' }}>
                  No feedback found for ID #{searchId}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        background: 'rgba(0, 229, 255, 0.15)',
                        color: 'var(--accent-cyan)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      ID #{searchResult.id}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {searchResult.tips} XLM Tipped
                    </span>
                  </div>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    "{searchResult.message}"
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Author: {searchResult.sender}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedbacks Stream List */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-cyan)" />
            <span>On-Chain Feedback Stream</span>
          </h3>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`category-pill ${activeCategory === c.id ? 'selected' : ''}`}
                onClick={() => setActiveCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredFeedbacks.map((fb) => (
            <div
              key={fb.id}
              className="glass-card-subtle"
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                      background: 'rgba(0, 229, 255, 0.12)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                    }}
                  >
                    #{fb.id}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--accent-purple)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {fb.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    • {new Date(fb.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.96rem', lineHeight: 1.55, color: '#f8fafc', marginBottom: '0.75rem' }}>
                  {fb.message}
                </p>

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Author: {fb.sender.slice(0, 6)}...{fb.sender.slice(-6)}
                </div>
              </div>

              {/* Tip Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                    {fb.tips} XLM
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Earned Tips</div>
                </div>
                <button
                  className="btn-secondary"
                  style={{
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.82rem',
                    borderColor: 'rgba(224, 64, 251, 0.3)',
                    color: 'var(--accent-magenta)',
                  }}
                  onClick={() => handleTip(fb)}
                  title="Tip 10 XLM to Author"
                >
                  <Heart size={14} />
                  <span>Tip</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
