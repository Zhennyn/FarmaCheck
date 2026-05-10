import React, { useState } from 'react';

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
  criticalCount: number;
}

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',       icon: '📊' },
  { id: 'employees',   label: 'Funcionários',     icon: '👥' },
  { id: 'items',       label: 'Itens',            icon: '📦' },
  { id: 'reports',     label: 'Relatórios',       icon: '📋' },
  { id: 'alerts',      label: 'Alertas',          icon: '🔔' },
  { id: 'orphans',     label: 'Órfãos',           icon: '🗑️' },
  { id: 'ranking',     label: 'Ranking',          icon: '🏆' },
  { id: 'stock',       label: 'Estoque',          icon: '📉' },
  { id: 'settings',    label: 'Configurações',    icon: '⚙️' },
];

const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate, criticalCount }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-gray-950 border-r border-gray-800
          transition-all duration-300
          ${collapsed ? 'w-16' : 'w-56'}
          md:relative md:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
          {!collapsed && (
            <span className="text-indigo-400 font-black text-lg tracking-tight">FarmaCheck</span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isAlerts = item.id === 'alerts';
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 relative
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {isAlerts && criticalCount > 0 && (
                  <span className={`
                    absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full
                    bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1
                    ${collapsed ? 'top-0.5 right-0.5' : ''}
                  `}>
                    {criticalCount > 99 ? '99+' : criticalCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-4">
          <div className={`text-[10px] text-gray-600 px-3 ${collapsed ? 'hidden' : ''}`}>
            Torre de Controle v2
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
