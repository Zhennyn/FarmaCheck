import React from 'react';
import GlassCard from './ui/GlassCard';

type Page = 'dashboard' | 'employees' | 'items' | 'reports' | 'alerts' | 'orphans' | 'ranking' | 'stock' | 'settings';

interface LayoutProps {
  active: Page;
  onNavigate: (p: Page) => void;
  criticalCount: number;
  children: React.ReactNode;
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'employees', label: 'Funcionários', icon: '👥' },
  { id: 'items', label: 'Itens', icon: '💊' },
  { id: 'reports', label: 'Relatórios', icon: '📄' },
  { id: 'alerts', label: 'Alertas', icon: '🔔' },
  { id: 'orphans', label: 'Órfãos', icon: '👻' },
  { id: 'ranking', label: 'Ranking', icon: '🏆' },
  { id: 'stock', label: 'Estoque', icon: '📦' },
  { id: 'settings', label: 'Configurações', icon: '⚙️' },
];

const Layout: React.FC<LayoutProps> = ({ active, onNavigate, criticalCount, children }) => {
  const [isDark, setIsDark] = React.useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  React.useEffect(() => {
    // Definir tema dark como padrão se não houver atributo
    if (!document.documentElement.hasAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }} className="text-[var(--text-primary)] font-sans">
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'var(--orb-blue)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '500px', height: '500px', background: 'var(--orb-purple)', pointerEvents: 'none', zIndex: 0 }} />
      
      <div className="flex h-screen relative z-10">
        <div className="w-[220px] p-4 flex flex-col gap-4">
          <GlassCard className="h-full flex flex-col !p-3">
            <div className="mb-6 px-3 py-2">
              <span className="text-[var(--accent-blue)] font-mono font-bold tracking-widest text-lg">FARMACHECK</span>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
              {NAV.map((item) => {
                const isActive = active === item.id;
                const isAlerts = item.id === 'alerts';
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id as Page)}
                    style={{
                      background: isActive ? 'rgba(56,189,248,0.12)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-r-lg text-sm font-semibold flex items-center justify-between transition-all duration-200 hover:bg-[var(--bg-surface-hover)]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </span>
                    {isAlerts && criticalCount > 0 && (
                      <span className="bg-[var(--accent-red)] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full" style={{ animation: 'pulse-dot 2s infinite' }}>
                        {criticalCount > 99 ? '99+' : criticalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </GlassCard>
        </div>

        <div className="flex-1 flex flex-col h-screen overflow-hidden py-4 pr-4">
          <GlassCard className="mb-4 flex items-center justify-between !py-3">
            <div className="text-[var(--text-muted)] text-sm font-semibold flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Regional:</span>
                <select className="bg-[var(--bg-surface-hover)] text-[var(--accent-blue)] outline-none cursor-pointer rounded px-2 py-1 border border-[var(--border-glass)]">
                  <option>Todas as Regionais</option>
                  <option>Norte</option>
                  <option>Sul</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Drogaria:</span>
                <select className="bg-[var(--bg-surface-hover)] text-[var(--accent-blue)] outline-none cursor-pointer rounded px-2 py-1 border border-[var(--border-glass)]">
                  <option>Todas as Lojas</option>
                  <option>Loja 01</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-glass)] transition-all cursor-pointer text-lg"
                title="Alternar Tema"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[var(--border-purple)] cursor-pointer transition-transform hover:scale-105">
                GER
              </div>
            </div>
          </GlassCard>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border-glass) transparent' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
