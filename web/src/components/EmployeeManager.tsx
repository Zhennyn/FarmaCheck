import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '../lib/supabase';
import GlassCard from './ui/GlassCard';

interface Profile { id: string; role: string; name: string; sigla: string | null; number: string | null; regional: string | null; created_at: string; }

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [regionalFilter, setRegionalFilter] = useState('');

  const supabase = createClient();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('name');
    if (data) setEmployees(data as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const regionais = useMemo(() => [...new Set(employees.map(e => e.regional).filter(Boolean))] as string[], [employees]);

  const filtered = useMemo(() => employees.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !(e.sigla ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && e.role !== roleFilter) return false;
    if (regionalFilter && e.regional !== regionalFilter) return false;
    return true;
  }), [employees, search, roleFilter, regionalFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${name}"? Os logs associados também podem ser afetados.`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert(error.message);
    else await fetchEmployees();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Funcionários</h1>

      <GlassCard className="flex flex-wrap gap-3">
        <input className="inp-glass flex-1 min-w-[200px]" placeholder="Buscar por nome ou sigla..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="inp-glass" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Todos os Papéis</option>
          <option value="gerente">Gerente</option>
          <option value="funcionario">Funcionário</option>
        </select>
        <select className="inp-glass" value={regionalFilter} onChange={(e) => setRegionalFilter(e.target.value)}>
          <option value="">Todas as Regionais</option>
          {regionais.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                {['Nome', 'Sigla', 'Número', 'Regional', 'Papel', 'Cadastro', 'Ações'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">Nenhum funcionário encontrado.</td></tr>
              ) : filtered.map((emp) => (
                <tr key={emp.id}>
                  <td className="font-semibold">{emp.name}</td>
                  <td className="font-mono text-[var(--text-secondary)]">{emp.sigla ?? '—'}</td>
                  <td className="text-[var(--text-secondary)]">{emp.number ?? '—'}</td>
                  <td className="text-[var(--text-secondary)]">{emp.regional ?? '—'}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${emp.role === 'gerente' ? 'bg-[rgba(139,92,246,0.15)] border border-[var(--border-purple)] text-[var(--accent-purple)]' : 'bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-secondary)]'}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="text-[var(--text-secondary)]">{new Date(emp.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button onClick={() => handleDelete(emp.id, emp.name)} className="btn-danger text-[10px] py-1 px-2">Deletar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default EmployeeManager;
