import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ExpiryAlert from './components/ExpiryAlert';
import UserApproval from './components/UserApproval';
import WebLogin from './components/WebLogin';
import { createClient } from './lib/supabase';

type View = 'dashboard' | 'expiry';

const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'expiry', label: 'Validades', icon: '🔔' },
];

const App = () => {
  const [view, setView] = useState<View>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('getSession:', session ? 'logged in' : 'no session', error);
      if (mounted) setIsAuthenticated(!!session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange:', event, session ? 'has session' : 'no session');
      if (mounted) setIsAuthenticated(!!session);
    });

    return () => { 
      mounted = false;
      listener.subscription.unsubscribe(); 
    };
  }, []);

  if (isAuthenticated === null) {
    return <div style={{ background: '#0d0d1a', minHeight: '100vh' }} />;
  }

  if (!isAuthenticated) {
    return <WebLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = async () => {
    await createClient().auth.signOut();
  };

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
        <button
          onClick={handleLogout}
          style={{
            marginLeft: 'auto', background: 'transparent', border: '1px solid #ef4444',
            color: '#ef4444', padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
            fontSize: 13, fontWeight: 600
          }}
        >
          Sair
        </button>
      </nav>

      <main>
        {view === 'dashboard' && <Dashboard />}
        {view === 'expiry' && <ExpiryAlert />}
      </main>
    </div>
  );
};

export default App;
