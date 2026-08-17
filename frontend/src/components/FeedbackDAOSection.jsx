import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  invokeContract,
  readContractData,
  DEFAULT_CONTRACT_ID,
  EXPLORER_BASE,
} from '../services/stellar';
import { nativeToScVal } from '@stellar/stellar-sdk';
import confetti from 'canvas-confetti';
import {
  MessageSquare,
  Send,
  Search,
  Sparkles,
  Heart,
  Layers,
  ExternalLink,
  RefreshCw,
  Loader2,
  Star,
  User,
  X,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

export default function FeedbackDAOSection() {
  const { publicKey, isConnected, signTx, setIsWalletModalOpen } = useWallet();

  const [contractId, setContractId] = useState(DEFAULT_CONTRACT_ID);
  const [activeCategory, setActiveCategory] = useState('all');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true);
  const [vaultStats, setVaultStats] = useState({ total_feedbacks: 0, total_tips: '0.0' });

  // Query & Search State (Address, Post Number, or Keywords)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedItem, setSearchedItem] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'general', label: 'General' },
    { id: 'smart-contracts', label: 'Smart Contracts' },
    { id: 'ui', label: 'UI / UX' },
    { id: 'dao', label: 'DAO Governance' },
  ];

  // Fetch all on-chain feedbacks from Soroban contract
  const loadLiveFeedbacks = useCallback(async () => {
    setIsLoadingFeedbacks(true);
    try {
      // 1. Fetch total count from smart contract
      const countRes = await readContractData(contractId.trim(), 'get_feedback_count');
      const totalCount = countRes.success && countRes.data !== undefined ? Number(countRes.data) : 0;

      // 2. Fetch stats
      const statsRes = await readContractData(contractId.trim(), 'get_vault_stats');
      if (statsRes.success && statsRes.data) {
        setVaultStats({
          total_feedbacks: Number(statsRes.data.total_feedbacks || totalCount),
          total_tips: statsRes.data.total_tips ? (Number(statsRes.data.total_tips) / 10000000).toFixed(1) : '0.0',
        });
      } else {
        setVaultStats({ total_feedbacks: totalCount, total_tips: '0.0' });
      }

      // 3. Fetch each feedback entry from the contract
      if (totalCount > 0) {
        const items = [];
        for (let i = 1; i <= totalCount; i++) {
          try {
            const idVal = nativeToScVal(BigInt(i), { type: 'u64' });
            const fbRes = await readContractData(contractId.trim(), 'fetch_feedback', [idVal]);
            if (fbRes.success && fbRes.data) {
              const rawMsg = fbRes.data.message || '';
              let parsedRating = 5;
              let cleanMsg = rawMsg;
              const ratingMatch = rawMsg.match(/^\[★([1-5])\/5\]\s*(.*)$/);
              if (ratingMatch) {
                parsedRating = parseInt(ratingMatch[1]);
                cleanMsg = ratingMatch[2];
              }

              items.push({
                id: fbRes.data.id ? Number(fbRes.data.id) : i,
                sender: fbRes.data.sender || 'Unknown',
                message: cleanMsg,
                rawMessage: rawMsg,
                rating: parsedRating,
                category: fbRes.data.category || 'general',
                timestamp: fbRes.data.timestamp ? Number(fbRes.data.timestamp) * 1000 : Date.now(),
                tips: fbRes.data.tips ? (Number(fbRes.data.tips) / 10000000).toFixed(4) : '0.0000',
              });
            }
          } catch (e) {
            console.warn(`Failed to fetch on-chain feedback #${i}:`, e);
          }
        }
        items.reverse(); // Newest first
        setFeedbacks(items);
      } else {
        setFeedbacks([]);
      }
    } catch (err) {
      console.warn('Failed to load on-chain feedbacks:', err);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadLiveFeedbacks();
  }, [loadLiveFeedbacks]);

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
      const senderVal = nativeToScVal(publicKey, { type: 'address' });
      const encodedMsg = `[★${rating}/5] ${message.trim()}`;
      const msgVal = nativeToScVal(encodedMsg, { type: 'string' });
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

        setMessage('');
        setStatusMessage({
          type: 'success',
          text: `Feedback submitted on-chain! Tx: ${res.hash.slice(0, 10)}...`,
          url: res.explorerUrl,
        });

        await loadLiveFeedbacks();
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Transaction failed' });
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

      if (res.success) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
        await loadLiveFeedbacks();
      }
    } catch (err) {
      console.error('Tipping error:', err);
    }
  };

  // Query & Search Handler
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchedItem(null);
      return;
    }

    // Check if numeric ID (e.g. 1, #1)
    const cleanNum = query.replace(/^#/, '');
    const numericId = parseInt(cleanNum);
    if (!isNaN(numericId) && numericId > 0 && cleanNum === numericId.toString()) {
      setSearchLoading(true);
      setSearchedItem(null);
      try {
        const idVal = nativeToScVal(BigInt(numericId), { type: 'u64' });
        const res = await readContractData(contractId.trim(), 'fetch_feedback', [idVal]);
        if (res.success && res.data) {
          const rawMsg = res.data.message || '';
          let parsedRating = 5;
          let cleanMsg = rawMsg;
          const ratingMatch = rawMsg.match(/^\[★([1-5])\/5\]\s*(.*)$/);
          if (ratingMatch) {
            parsedRating = parseInt(ratingMatch[1]);
            cleanMsg = ratingMatch[2];
          }

          setSearchedItem({
            id: res.data.id ? Number(res.data.id) : numericId,
            sender: res.data.sender || 'Unknown',
            message: cleanMsg,
            rating: parsedRating,
            category: res.data.category || 'general',
            timestamp: res.data.timestamp ? Number(res.data.timestamp) * 1000 : Date.now(),
            tips: res.data.tips ? (Number(res.data.tips) / 10000000).toFixed(4) : '0.0000',
          });
        } else {
          setSearchedItem({ notFound: true, query });
        }
      } catch (err) {
        setSearchedItem({ notFound: true, query });
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchedItem(null);
  };

  // Filter feedback items in real time based on activeCategory AND searchQuery
  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (activeCategory !== 'all' && fb.category !== activeCategory) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const matchAuthor = (fb.sender || '').toLowerCase().includes(q);
    const matchMsg = (fb.message || '').toLowerCase().includes(q);
    const matchCategory = (fb.category || '').toLowerCase().includes(q);
    const matchId = String(fb.id) === q.replace(/^#/, '');

    return matchAuthor || matchMsg || matchCategory || matchId;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Stats Banner */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MessageSquare size={22} color="var(--accent-cyan)" />
              <span>LumenPulse Feedback DAO</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.2rem' }}>
              Submit, vote, and tip on-chain feedback powered by Soroban Rust smart contracts
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn-secondary"
              onClick={loadLiveFeedbacks}
              disabled={isLoadingFeedbacks}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              title="Refresh on-chain data"
            >
              <RefreshCw size={14} className={isLoadingFeedbacks ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <div className="glass-card-subtle" style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL POSTS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {vaultStats.total_feedbacks}
              </div>
            </div>
            <div className="glass-card-subtle" style={{ padding: '0.6rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIPS REWARDED</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {vaultStats.total_tips} XLM
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
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.76rem' }}
          >
            <ExternalLink size={12} />
            <span>Stellar.Expert</span>
          </a>
        </div>
      </div>

      {/* Grid: Submit Form + Search by Wallet / Keywords */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Submit Form */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} color="var(--accent-cyan)" />
            <span>Submit On-Chain Feedback</span>
          </h3>

          <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label className="input-label">Category</label>
              <select
                className="glass-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ background: 'rgba(15, 23, 42, 0.8)', cursor: 'pointer' }}
              >
                <option value="general">General Feedback</option>
                <option value="smart-contracts">Smart Contracts</option>
                <option value="ui">UI / UX Design</option>
                <option value="dao">DAO Governance</option>
              </select>
            </div>

            {/* Interactive Star Rating Selector */}
            <div>
              <label className="input-label">
                <span>Rating</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{rating} of 5 Stars</span>
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      size={24}
                      fill={(hoverRating || rating) >= star ? '#ffd600' : 'transparent'}
                      color={(hoverRating || rating) >= star ? '#ffd600' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">
                <span>Feedback Message</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recorded to Soroban</span>
              </label>
              <textarea
                className="glass-input"
                rows={3}
                placeholder="Share ideas, proposals, or community feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {statusMessage && (
              <div
                className="glass-card-subtle"
                style={{
                  padding: '0.75rem 1rem',
                  color: statusMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{statusMessage.text}</span>
                {statusMessage.url && (
                  <a
                    href={statusMessage.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem' }}
                  >
                    <span>View Tx</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.35rem' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Submitting to Contract...</span>
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

        {/* Search by Wallet Address, Keyword, or Post # */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="var(--accent-cyan)" />
            <span>Search & Query On-Chain</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5 }}>
            Filter reviews in real-time by <strong>wallet address</strong>, <strong>keywords</strong>, or look up a specific <strong>post number</strong>.
          </p>

          {/* Quick Filter Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {isConnected && (
              <button
                type="button"
                className="btn-secondary"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.8rem',
                  borderColor: searchQuery === publicKey ? 'var(--accent-cyan)' : 'rgba(0, 229, 255, 0.4)',
                  color: 'var(--accent-cyan)',
                  background: searchQuery === publicKey ? 'rgba(0, 229, 255, 0.2)' : 'rgba(0, 229, 255, 0.08)',
                }}
                onClick={() => {
                  setSearchQuery(publicKey);
                  setSearchedItem(null);
                }}
              >
                <User size={13} />
                <span>My Submissions</span>
              </button>
            )}
            {searchQuery && (
              <button
                type="button"
                className="btn-secondary"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.8rem',
                  borderColor: 'rgba(255, 23, 68, 0.4)',
                  color: 'var(--accent-rose)',
                  background: 'rgba(255, 23, 68, 0.08)',
                }}
                onClick={clearSearch}
              >
                <X size={13} />
                <span>Clear Search</span>
              </button>
            )}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <input
              type="text"
              className="glass-input"
              style={{ fontSize: '0.88rem' }}
              placeholder="Search keyword (e.g. speed, UI) or paste GDON..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchedItem(null);
              }}
            />
            <button type="submit" className="btn-secondary" disabled={searchLoading} style={{ whiteSpace: 'nowrap' }}>
              {searchLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              <span>Search</span>
            </button>
          </form>

          {/* Quick Guide on What to Type */}
          <div
            className="glass-card-subtle"
            style={{
              padding: '0.85rem 1rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <HelpCircle size={14} />
              <span>What can you search here?</span>
            </div>
            <div>• Click <strong>"My Submissions"</strong> to see all reviews posted by your connected wallet.</div>
            <div>• Paste any Stellar address (e.g. <code>GDON...</code>) to filter by that creator.</div>
            <div>• Type keywords (e.g. <code>smart contract</code>, <code>fast</code>) to find matching reviews.</div>
          </div>

          {/* Single Queried Post Result */}
          {searchedItem && (
            <div className="glass-card-subtle" style={{ padding: '1.25rem', marginTop: '1rem', border: '1px solid rgba(0, 229, 255, 0.25)' }}>
              {searchedItem.notFound ? (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.88rem' }}>
                  ❌ No on-chain feedback found for query: "{searchedItem.query}"
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
                      Post #{searchedItem.id}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(searchedItem.rating || 5)].map((_, i) => (
                          <Star key={i} size={13} fill="#ffd600" color="#ffd600" />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        {searchedItem.tips} XLM Tipped
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.94rem', lineHeight: 1.5, color: '#fff' }}>
                    "{searchedItem.message}"
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Author: {searchedItem.sender}
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
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-cyan)" />
              <span>On-Chain Feedback Stream</span>
            </h3>
            {searchQuery && (
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
                Filtering by: {searchQuery.startsWith('G') ? `${searchQuery.slice(0, 8)}...${searchQuery.slice(-6)}` : `"${searchQuery}"`} ({filteredFeedbacks.length} found)
              </span>
            )}
          </div>

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
        {isLoadingFeedbacks ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={28} className="spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-cyan)' }} />
            <p>Loading live on-chain feedback from Soroban RPC...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div
            className="glass-card-subtle"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <MessageSquare size={36} color="var(--accent-cyan)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.6 }} />
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
              {searchQuery ? 'No matching feedback found' : 'No on-chain feedback submitted yet'}
            </h4>
            <p style={{ fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto' }}>
              {searchQuery ? 'Try searching for a different address, keyword, or clicking "Clear Search".' : 'Be the first to submit on-chain feedback to the Soroban vault above!'}
            </p>
          </div>
        ) : (
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
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      {[...Array(fb.rating || 5)].map((_, i) => (
                        <Star key={i} size={12} fill="#ffd600" color="#ffd600" />
                      ))}
                    </div>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>Author: {fb.sender.slice(0, 6)}...{fb.sender.slice(-6)}</span>
                    {publicKey && fb.sender === publicKey && (
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>(You)</span>
                    )}
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
        )}
      </div>
    </div>
  );
}
