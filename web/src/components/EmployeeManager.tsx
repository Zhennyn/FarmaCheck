import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '../lib/supabase';

interface Employee {
  id: string;
  name: string;
  sigla: string | null;
  number: string | null;
  regional: string | null;
  role: 'funcionario' | 'gerente';
  email?: string;
}

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  data: Partial<Employee> & { email?: string; password?: string };
}

const MODAL_INITIAL: ModalState = { open: false, mode: 'create', data: {} };
const INP = 'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition';
const LBL = 'text-xs font-semibold text-gray-400 uppercase mb-1 block';

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(MODAL_INITIAL);
  const [search, setSearch] = useState('');
  const [filterRegional, setFilterRegional] = useState('');
  const [filterNumber, setFilterNumber] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClient();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, name, sigla, number, regional, role')
      .order('name');
    if (!err && data) setEmployees(data as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const regionais = [...new Set(employees.map((e) => e.regional).filter(Boolean))] as string[];
  const numbers = [...new Set(employees.map((e) => e.number).filter(Boolean))] as string[];

  const filtered = employees.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !(e.sigla ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRegional && e.regional !== filterRegional) return false;
    if (filterNumber && e.number !== filterNumber) return false;
    if (filterRole && e.role !== filterRole) return false;
    return true;
  });

  const openCreate = () => setModal({ open: true, mode: 'create', data: {} });
  const openEdit = (emp: Employee) => setModal({ open: true, mode: 'edit', data: { ...emp } });
  const closeModal = () => { setModal(MODAL_INITIAL); setError(null); };

  const setField = <K extends keyof (Employee & { password: string })>(k: K, v: string) =>
    setModal((m) => ({ ...m, data: { ...m.data, [k]: v } }));

  const handleSave = async () => {
    setActionLoading(true); setError(null);
    try {
      if (modal.mode === 'create') {
        if (!modal.data.email || !modal.data.password) throw new Error('Email e senha obrigatórios.');
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email: modal.data.email,
          password: modal.data.password,
          email_confirm: true,
        });
        if (authErr || !authData.user) throw new Error(authErr?.message ?? 'Erro ao criar usuário.');
        const { error: pErr } = await supabase.from('profiles').insert({
          id: authData.user.id,
          name: modal.data.name ?? '',
          sigla: modal.data.sigla ?? null,
          number: modal.data.number ?? null,
          regional: modal.data.regional ?? null,
          role: modal.data.role ?? 'funcionario',
        });
        if (pErr) throw new Error(pErr.message);
      } else {
        const { error: pErr } = await supabase.from('profiles').update({
          name: modal.data.name,
          sigla: modal.data.sigla ?? null,
          number: modal.data.number ?? null,
          regional: modal.data.regional ?? null,
          role: modal.data.role,
        }).eq('id', modal.data.id!);
        if (pErr) throw new Error(pErr.message);
      }
      await fetchEmployees();
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    const { count } = await supabase.from('scan_logs').select('id', { count: 'exact', head: true }).eq('employee_id', emp.id);
    const msg = (count ?? 0) > 0
      ? `Atenção: este funcionário possui ${count} log(s). Deletar irá remover os logs em cascata. Confirmar?`
      : `Deletar "${emp.name}"? Esta ação é irreversível.`;
    if (!window.confirm(msg)) return;
    setActionLoading(true);
    const { error: err } = await supabase.from('profiles').delete().eq('id', emp.id);
    if (err) alert(err.message);
    else await fetchEmployees();
    setActionLoading(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Funcionários</h1>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
          + Novo Funcionário
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input className={INP + ' flex-1 min-w-[200px]'} placeholder="🔍 Buscar por nome ou sigla..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={INP} value={filterRegional} onChange={(e) => setFilterRegional(e.target.value)}>
          <option value="">Regional</option>
          {regionais.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={INP} value={filterNumber} onChange={(e) => setFilterNumber(e.target.value)}>
          <option value="">Nº Drogaria</option>
          {numbers.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select className={INP} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">Papel</option>
          <option value="funcionario">Funcionário</option>
          <option value="gerente">Gerente</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Nome', 'Sigla', 'Número', 'Regional', 'Papel', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-600">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-600">Nenhum resultado.</td></tr>
              ) : filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-4 py-3 text-gray-200 font-semibold">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{emp.sigla ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{emp.number ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{emp.regional ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${emp.role === 'gerente' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-gray-700/50 text-gray-400'}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(emp)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition">Editar</button>
                    <button onClick={() => handleDelete(emp)} disabled={actionLoading} className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-400 px-3 py-1.5 rounded-lg transition">Deletar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{modal.mode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            {error && <div className="bg-red-900/30 text-red-400 text-sm px-4 py-2 rounded-xl">{error}</div>}
            <div className="space-y-3">
              <div><label className={LBL}>Nome *</label><input className={INP} value={modal.data.name ?? ''} onChange={(e) => setField('name', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LBL}>Sigla</label><input className={INP} value={modal.data.sigla ?? ''} onChange={(e) => setField('sigla', e.target.value)} /></div>
                <div><label className={LBL}>Número</label><input className={INP} value={modal.data.number ?? ''} onChange={(e) => setField('number', e.target.value)} /></div>
              </div>
              <div><label className={LBL}>Regional</label><input className={INP} value={modal.data.regional ?? ''} onChange={(e) => setField('regional', e.target.value)} /></div>
              <div>
                <label className={LBL}>Papel</label>
                <select className={INP} value={modal.data.role ?? 'funcionario'} onChange={(e) => setField('role', e.target.value)}>
                  <option value="funcionario">Funcionário</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
              {modal.mode === 'create' && (
                <>
                  <div><label className={LBL}>Email *</label><input type="email" className={INP} value={modal.data.email ?? ''} onChange={(e) => setField('email', e.target.value)} /></div>
                  <div><label className={LBL}>Senha *</label><input type="password" className={INP} value={modal.data.password ?? ''} onChange={(e) => setField('password', e.target.value)} /></div>
                </>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition">Cancelar</button>
              <button onClick={handleSave} disabled={actionLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50">
                {actionLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
