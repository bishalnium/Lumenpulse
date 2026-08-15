import React, { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import Header from './components/Header';
import WalletSection from './components/WalletSection';
import TransferSection from './components/TransferSection';
import FeedbackDAOSection from './components/FeedbackDAOSection';
import LiveEventsSection from './components/LiveEventsSection';
import TxModal from './components/TxModal';
import { ShieldCheck, Heart, Sparkles, Code2, Globe2 } from 'lucide-react';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      {/* Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Router */}
      <main style={{ minHeight: '60vh' }}>
        {activeTab === 'dashboard' && <WalletSection onNavigate={setActiveTab} />}
        {activeTab === 'transfer' && <TransferSection onTriggerTxModal={() => {}} />}
        {activeTab === 'dao' && <FeedbackDAOSection />}
        {activeTab === 'events' && <LiveEventsSection />}
      </main>

      {/* Wallet Selection Modal */}
      <TxModal />

      {/* Footer */}
      <footer
        className="glass-card"
        style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Built for <strong>Stellar Developer Challenge (Levels 1, 2 & 3)</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.84rem' }}>
          <a
            href="https://developers.stellar.org"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Globe2 size={14} />
            <span>Stellar Docs</span>
          </a>
          <a
            href="https://stellar.expert/explorer/testnet"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ShieldCheck size={14} />
            <span>Stellar.Expert</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
}
