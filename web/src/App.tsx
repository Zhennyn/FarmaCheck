import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ExpiryAlert from './components/ExpiryAlert';

type View = 'dashboard' | 'expiry';

const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'expiry', label: 'Validades', icon: '🔔' },
];

const App = () => {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 32px',
        background: '#111827',
        borderBottom: '1px solid #1f2937',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 18, marginRight: 24 }}>
          💊 FarmaCheck
        </span>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              background: view === item.id ? '#6366f1' : 'transparent',
              color: view === item.id ? '#ffffff' : '#9ca3af',
              border: '1px solid',
              borderColor: view === item.id ? '#6366f1' : '#374151',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      <main>
        {view === 'dashboard' && <Dashboard />}
        {view === 'expiry' && <ExpiryAlert />}
      </main>
    </div>
  );
};

export default App;
