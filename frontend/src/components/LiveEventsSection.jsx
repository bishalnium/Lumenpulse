import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  pollContractEvents,
  invokeContract,
  DEFAULT_CONTRACT_ID,
} from '../services/stellar';
import { nativeToScVal } from '@stellar/stellar-sdk';
import confetti from 'canvas-confetti';
import {
  Activity,
  Radio,
  RefreshCw,
  Heart,
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';

export default function LiveEventsSection() {
  const { publicKey, isConnected, signTx, setIsWalletModalOpen } = useWallet();

  const [events, setEvents] = useState([]);
  const [isPolling, setIsPolling] = useState(true);
  const [loading, setLoading] = useState(false);

  // Thread discussion states (Reddit-style compact)
  const [expandedThreads, setExpandedThreads] = useState({});
  const [threadReplies, setThreadReplies] = useState(() => {
    try {
      const saved = localStorage.getItem('lumenpulse_threads');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [replyInput, setReplyInput] = useState({});
  const [isSubmittingReply, setIsSubmittingReply] = useState({});

  // Variable Tipping State
  const [selectedTipAmount, setSelectedTipAmount] = useState({}); // { [eventId]: amount }
  const [customTipInput, setCustomTipInput] = useState({});
  const [showTipModal, setShowTipModal] = useState({});
  const [isTippingEvent, setIsTippingEvent] = useState({});

  const saveThreads = (newThreads) => {
    setThreadReplies(newThreads);
    try {
      localStorage.setItem('lumenpulse_threads', JSON.stringify(newThreads));
    } catch (e) {
      console.warn('Storage save notice:', e);
    }
  };

  // Robust Event Parser for Soroban Tuples / Arrays / Objects
  const parseEvent = (evt) => {
    const topic = evt.topic || '';
    const val = evt.value;

    let id = null;
    let sender = 'On-chain user';
    let message = '';
    let rating = null;
    let amount = null;

    if (Array.isArray(val)) {
      if (topic.includes('fb_new')) {
        id = val[0] !== undefined ? String(val[0]) : null;
        sender = val[1] ? String(val[1]) : 'On-chain user';
        let raw = val[2] ? String(val[2]) : '';
        const match = raw.match(/^\[★([1-5])\/5\]\s*(.*)$/);
        if (match) {
          rating = parseInt(match[1]);
          message = match[2];
        } else {
          message = raw;
        }
      } else if (topic.includes('fb_tip')) {
        sender = val[0] ? String(val[0]) : 'On-chain user';
        const rawAmt = val[1] !== undefined ? Number(val[1]) : 100000000;
        amount = (rawAmt / 10000000).toFixed(2) + ' XLM';
        message = `Tipped ${amount} on-chain reward!`;
      }
    } else if (typeof val === 'object' && val !== null) {
      id = val.id || val.count || null;
      sender = val.sender || val.tipper || 'On-chain user';
      message = val.message || (val.amount ? `Tipped ${val.amount}` : '');
      amount = val.amount || null;
    } else if (val !== null && val !== undefined) {
      message = String(val);
    }

    return { id, sender, message, rating, amount };
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pollContractEvents(DEFAULT_CONTRACT_ID);
      if (res.success && res.events?.length > 0) {
        setEvents(res.events);
      }
    } catch (err) {
      console.warn('Event fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(fetchEvents, 6000);
    return () => clearInterval(interval);
  }, [isPolling, fetchEvents]);

  const toggleThread = (eventId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Variable Tip Submission
  const handleTipEvent = async (evt, customAmount) => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    const eventKey = evt.id;
    const tipAmount = customAmount || selectedTipAmount[eventKey] || 10;
    setIsTippingEvent((prev) => ({ ...prev, [eventKey]: true }));

    try {
      const parsed = parseEvent(evt);
      const feedbackId = parsed.id || 1;
      const stroopAmount = BigInt(Math.floor(Number(tipAmount) * 10000000));
      const tipScVal = nativeToScVal(stroopAmount, { type: 'i128' });
      const idScVal = nativeToScVal(BigInt(feedbackId), { type: 'u64' });
      const tipperScVal = nativeToScVal(publicKey, { type: 'address' });

      const res = await invokeContract({
        contractId: DEFAULT_CONTRACT_ID,
        senderPublicKey: publicKey,
        functionName: 'tip_feedback',
        args: [tipperScVal, idScVal, tipScVal],
        signerFn: signTx,
      });

      if (res.success) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        setShowTipModal((prev) => ({ ...prev, [eventKey]: false }));
        fetchEvents();
      }
    } catch (err) {
      console.error('Tipping event error:', err);
    } finally {
      setIsTippingEvent((prev) => ({ ...prev, [eventKey]: false }));
    }
  };

  // Post Reply in Thread (Reddit-style)
  const handlePostReply = async (eventId, evtTopic) => {
    if (!isConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    const text = (replyInput[eventId] || '').trim();
    if (!text) return;

    setIsSubmittingReply((prev) => ({ ...prev, [eventId]: true }));

    try {
      const newComment = {
        id: Date.now(),
        author: publicKey,
        text,
        timestamp: new Date().toISOString(),
      };

      const existing = threadReplies[eventId] || [];
      const updated = {
        ...threadReplies,
        [eventId]: [...existing, newComment],
      };
      saveThreads(updated);

      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } });
      setReplyInput((prev) => ({ ...prev, [eventId]: '' }));
    } finally {
      setIsSubmittingReply((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Real-Time Soroban Event Stream & Discussions</h2>
            <span className="status-pill status-live">
              <span className="status-dot"></span>
              <span>{isPolling ? 'Live Polling' : 'Paused'}</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '0.2rem' }}>
            Live smart contract event feeds — tip authors directly and discuss topics in Reddit-style compact threads!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn-secondary ${isPolling ? 'btn-faucet' : ''}`}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
            onClick={() => setIsPolling(!isPolling)}
          >
            <Radio size={15} className={isPolling ? 'animate-pulse' : ''} />
            <span>{isPolling ? 'Live Stream On' : 'Resume'}</span>
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '0.5rem 0.75rem' }}
            onClick={fetchEvents}
            disabled={loading}
            title="Manual refresh"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Events Feed Container */}
      <div
        className="glass-card-subtle"
        style={{
          maxHeight: '620px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          padding: '0.5rem',
        }}
      >
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
            <Activity size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 0.6rem auto', opacity: 0.6 }} />
            <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Listening for On-Chain Events</h4>
            <p style={{ fontSize: '0.84rem', maxWidth: '400px', margin: '0 auto' }}>
              Submit feedback or tip a reviewer in the Feedback DAO tab to emit and view live Soroban smart contract events here!
            </p>
          </div>
        ) : (
          events.map((evt, idx) => {
            const parsed = parseEvent(evt);
            const comments = threadReplies[evt.id] || [];
            const isExpanded = !!expandedThreads[evt.id];
            const isTipping = isTippingEvent[evt.id];
            const showTipSelector = !!showTipModal[evt.id];
            const currentTipVal = selectedTipAmount[evt.id] || 10;

            return (
              <div
                key={evt.id || idx}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '12px',
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                {/* Event Top Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: evt.topic.includes('tip') ? 'var(--accent-magenta)' : 'var(--accent-cyan)',
                        background: 'rgba(0, 0, 0, 0.35)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                      }}
                    >
                      {evt.topic}
                    </span>
                    {parsed.rating && (
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[...Array(parsed.rating)].map((_, i) => (
                          <Star key={i} size={11} fill="#ffd600" color="#ffd600" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Ledger #{evt.ledger}</span>
                    <span>• {new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Message & Author Content */}
                <div>
                  <p style={{ fontSize: '0.94rem', lineHeight: 1.45, color: '#f8fafc', fontWeight: 500, margin: '0.2rem 0' }}>
                    {parsed.message ? `"${parsed.message}"` : 'Event recorded on-chain'}
                  </p>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Author: {parsed.sender.length > 15 ? `${parsed.sender.slice(0, 8)}...${parsed.sender.slice(-6)}` : parsed.sender}
                  </span>
                </div>

                {/* Event Actions: Thread toggle + Variable Tip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button
                    className="btn-secondary"
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.76rem',
                      border: 'none',
                      background: 'transparent',
                      color: isExpanded ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      gap: '0.35rem',
                    }}
                    onClick={() => toggleThread(evt.id)}
                  >
                    <MessageSquare size={13} />
                    <span>{comments.length} Comments</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {/* Variable Tip Button & Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {showTipSelector ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.4rem', borderRadius: '8px' }}>
                        {[5, 10, 25, 50].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            style={{
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.72rem',
                              borderRadius: '6px',
                              border: currentTipVal === amt ? '1px solid var(--accent-magenta)' : '1px solid transparent',
                              background: currentTipVal === amt ? 'rgba(224, 64, 251, 0.25)' : 'transparent',
                              color: currentTipVal === amt ? '#fff' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                            onClick={() => setSelectedTipAmount((prev) => ({ ...prev, [evt.id]: amt }))}
                          >
                            {amt}
                          </button>
                        ))}
                        <button
                          className="btn-secondary"
                          style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.74rem',
                            background: 'var(--accent-magenta)',
                            color: '#fff',
                            fontWeight: 700,
                          }}
                          disabled={isTipping}
                          onClick={() => handleTipEvent(evt, currentTipVal)}
                        >
                          {isTipping ? <Loader2 size={11} className="spin" /> : `Send ${currentTipVal} XLM`}
                        </button>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', padding: '0 0.2rem' }}
                          onClick={() => setShowTipModal((prev) => ({ ...prev, [evt.id]: false }))}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-secondary"
                        style={{
                          padding: '0.3rem 0.75rem',
                          fontSize: '0.78rem',
                          borderColor: 'rgba(224, 64, 251, 0.3)',
                          background: 'rgba(224, 64, 251, 0.08)',
                          color: 'var(--accent-magenta)',
                        }}
                        onClick={() => setShowTipModal((prev) => ({ ...prev, [evt.id]: true }))}
                        title="Choose variable tip amount (5, 10, 25, 50 XLM)"
                      >
                        <Heart size={12} />
                        <span>Tip XLM</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reddit-Style Compact Nested Thread */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '0.35rem',
                      paddingLeft: '0.85rem',
                      borderLeft: '2px solid rgba(0, 229, 255, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    {/* Existing Comments list */}
                    {comments.map((c) => (
                      <div key={c.id} style={{ padding: '0.25rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            {c.author ? `${c.author.slice(0, 6)}...${c.author.slice(-4)}` : 'user'}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>• {new Date(c.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ fontSize: '0.86rem', color: '#e2e8f0', margin: '0.15rem 0 0 0', lineHeight: 1.35 }}>
                          {c.text}
                        </p>
                      </div>
                    ))}

                    {/* Compact Reply Input */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        className="glass-input"
                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', borderRadius: '8px' }}
                        placeholder="Add a comment..."
                        value={replyInput[evt.id] || ''}
                        onChange={(e) =>
                          setReplyInput((prev) => ({
                            ...prev,
                            [evt.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handlePostReply(evt.id, evt.topic);
                          }
                        }}
                      />
                      <button
                        className="btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '8px' }}
                        disabled={isSubmittingReply[evt.id]}
                        onClick={() => handlePostReply(evt.id, evt.topic)}
                      >
                        {isSubmittingReply[evt.id] ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
