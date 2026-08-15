import React, { useState, useEffect } from 'react';
import { pollContractEvents, DEFAULT_CONTRACT_ID } from '../services/stellar';
import {
  Activity,
  Radio,
  RefreshCw,
  Sparkles,
  Heart,
  MessageSquare,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function LiveEventsSection() {
  const [events, setEvents] = useState([
    {
      id: '0000000000000000001-0000000001',
      topic: 'fb_new : general',
      ledger: 1042891,
      timestamp: '2026-08-15T02:40:00Z',
      value: { id: 1, message: 'Loving the fast finality on Stellar!', sender: 'GBBD47IF6...FLA5' },
    },
    {
      id: '0000000000000000002-0000000001',
      topic: 'fb_tip : 1',
      ledger: 1042898,
      timestamp: '2026-08-15T02:42:15Z',
      value: { feedbackId: 1, amount: '10 XLM', tipper: 'GC3C4ACWC...3N5' },
    },
    {
      id: '0000000000000000003-0000000001',
      topic: 'fb_new : smart-contracts',
      ledger: 1042910,
      timestamp: '2026-08-15T02:45:30Z',
      value: { id: 2, message: 'Soroban WASM v22 smart contract execution on testnet is smooth and predictable.', sender: 'GC3C4ACWC...3N5' },
    },
  ]);

  const [isPolling, setIsPolling] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await pollContractEvents(DEFAULT_CONTRACT_ID);
      if (res.success && res.events?.length > 0) {
        setEvents((prev) => [...res.events, ...prev].slice(0, 30));
      }
    } catch (err) {
      console.warn('Event fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(fetchEvents, 6000);
    return () => clearInterval(interval);
  }, [isPolling]);

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Real-Time Soroban Event Stream</h2>
            <span className="status-pill status-live">
              <span className="status-dot"></span>
              <span>{isPolling ? 'Live Streaming' : 'Paused'}</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.25rem' }}>
            Decentralized event logs emitted by Soroban smart contract instances on Stellar Testnet
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            className={`btn-secondary ${isPolling ? 'btn-faucet' : ''}`}
            onClick={() => setIsPolling(!isPolling)}
          >
            <Radio size={16} className={isPolling ? 'animate-pulse' : ''} />
            <span>{isPolling ? 'Live Stream On' : 'Resume Stream'}</span>
          </button>
          <button
            className="btn-secondary"
            onClick={fetchEvents}
            disabled={loading}
            title="Manual refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Events Feed Container */}
      <div
        className="glass-card-subtle"
        style={{
          maxHeight: '520px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {events.map((evt, idx) => (
          <div key={idx} className="event-item">
            <div
              className="event-icon"
              style={{
                background: evt.topic.includes('tip')
                  ? 'rgba(224, 64, 251, 0.18)'
                  : 'rgba(0, 229, 255, 0.18)',
                color: evt.topic.includes('tip') ? 'var(--accent-magenta)' : 'var(--accent-cyan)',
              }}
            >
              {evt.topic.includes('tip') ? <Heart size={18} /> : <MessageSquare size={18} />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    color: evt.topic.includes('tip') ? 'var(--accent-magenta)' : 'var(--accent-cyan)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '6px',
                  }}
                >
                  {evt.topic}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>Ledger #{evt.ledger}</span>
                  <span>• {new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  fontFamily: typeof evt.value === 'object' ? 'var(--font-sans)' : 'var(--font-mono)',
                }}
              >
                {typeof evt.value === 'object' ? (
                  <div>
                    {evt.value.message && <p>"{evt.value.message}"</p>}
                    {evt.value.amount && <p>Tipped: <strong style={{ color: 'var(--accent-emerald)' }}>{evt.value.amount}</strong></p>}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Author / Origin: {evt.value.sender || evt.value.tipper || 'On-chain user'}
                    </span>
                  </div>
                ) : (
                  String(evt.value)
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
