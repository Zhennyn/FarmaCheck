import { useState, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeManager from './components/EmployeeManager';
import ItemManager from './components/ItemManager';
import OrphanItemsManager from './components/OrphanItemsManager';
import ExpiryAlerts from './components/ExpiryAlerts';
import ProductivityRanking from './components/ProductivityRanking';
import Reports from './components/Reports';
import StockAlerts from './components/StockAlerts';
import Settings from './components/Settings';
import useRealtimeLogs from './hooks/useRealtimeLogs';

type Page = 'dashboard' | 'employees' | 'items' | 'reports' | 'alerts' | 'orphans' | 'ranking' | 'stock' | 'settings';

const App = () => {
  const [page, setPage] = useState<Page>('dashboard');
  const { logs } = useRealtimeLogs({ limit: 200 });

  const criticalCount = useMemo(() => {
    const today = new Date();
    return logs.filter((l) => {
      if (l.item_risk_level === 'critical') return true;
      if (!l.item_expiry_date) return false;
      const days = Math.ceil((new Date(l.item_expiry_date).getTime() - today.getTime()) / 86400000);
      return days <= 7;
    }).length;
  }, [logs]);

  return (
    <Layout active={page} onNavigate={(p) => setPage(p as Page)} criticalCount={criticalCount}>
      {page === 'dashboard'  && <Dashboard />}
      {page === 'employees'  && <EmployeeManager />}
      {page === 'items'      && <ItemManager />}
      {page === 'reports'    && <Reports />}
      {page === 'alerts'     && <ExpiryAlerts />}
      {page === 'orphans'    && <OrphanItemsManager />}
      {page === 'ranking'    && <ProductivityRanking />}
      {page === 'stock'      && <StockAlerts />}
      {page === 'settings'   && <Settings />}
    </Layout>
  );
};

export default App;
