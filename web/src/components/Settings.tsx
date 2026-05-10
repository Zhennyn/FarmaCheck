import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '../lib/supabase';
import GlassCard from './ui/GlassCard';

interface Profile { id: string; name: string; sigla: string | null; number: string | null; regional: string | null; role: string; email?: string; }

const Settings: React.FC = () => {
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editSigla, setEditSigla] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editRegional, setEditRegional] = useState('');
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [dangerLoading, setDangerLoading] = useState(false);

  const supabase = createClient();

  const fetchMe = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('id, name, sigla, number, regional, role').eq('id', user.id).single();
    if (data) {
      const p = data as Profile;
      setMyProfile(p); setEditName(p.name); setEditSigla(p.sigla ?? ''); setEditNumber(p.number ?? ''); setEditRegional(p.regional ?? '');
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, name, sigla, number, regional, role').order('name');
    if (data) setEmployees(data as Profile[]);
  }, []);

  useEffect(() => { fetchMe(); fetchEmployees(); }, [fetchMe, fetchEmployees]);

  const saveProfile = async () => {
    if (!myProfile) return;
    setSaving(true); setMsg(null);
    const { error } = await supabase.from('profiles').update({ name: editName, sigla: editSigla || null, number: editNumber || null, regional: editRegional || null }).eq('id', myProfile.id);
    setMsg(error ? { type: 'err', text: error.message } : { type: 'ok', text: 'Perfil atualizado com sucesso!' });
    setSaving(false);
  };

  const toggleRole = async (emp: Profile) => {
    const newRole = emp.role === 'gerente' ? 'funcionario' : 'gerente';
    if (!window.confirm(`Alterar papel de "${emp.name}" para ${newRole}?`)) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', emp.id);
    if (!error) await fetchEmployees();
    else alert(error.message);
  };

  const cleanOrphans = async () => {
    if (!window.confirm('Deletar TODOS os itens órfãos? Esta ação é irreversível.')) return;
    setDangerLoading(true);
    const { data } = await supabase.rpc('get_orphan_items');
    if (data && (data as { id: string }[]).length > 0) {
      const ids = (data as { id: string }[]).map((i) => i.id);
      await supabase.from('items').delete().in('id', ids);
      alert(`${ids.length} item(ns) deletado(s).`);
    } else { alert('Nenhum item órfão encontrado.'); }
    setDangerLoading(false);
  };

  const cleanOldLogs = async () => {
    if (!window.confirm('Deletar todos os scan_logs com mais de 90 dias?')) return;
    setDangerLoading(true);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
    const { error, count } = await supabase.from('scan_logs').delete({ count: 'exact' }).lt('scanned_at', cutoff.toISOString());
    if (error) alert(error.message);
    else alert(`${count ?? 0} log(s) deletado(s).`);
    setDangerLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-black text-[var(--text-primary)]">Configurações</h1>

      <GlassCard accent="blue" className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--accent-blue)] uppercase">Meu Perfil</h2>
        {msg && <div className={`text-xs font-bold px-4 py-2 rounded-lg border ${msg.type === 'ok' ? 'bg-[rgba(52,211,153,0.1)] border-[var(--border-green)] text-[var(--accent-green)]' : 'bg-[rgba(248,113,113,0.1)] border-[var(--border-red)] text-[var(--accent-red)]'}`}>{msg.text}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Nome</label><input className="inp-glass w-full" value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
          <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Sigla</label><input className="inp-glass w-full" value={editSigla} onChange={(e) => setEditSigla(e.target.value)} /></div>
          <div><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Número</label><input className="inp-glass w-full" value={editNumber} onChange={(e) => setEditNumber(e.target.value)} /></div>
          <div className="col-span-2"><label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block font-bold">Regional</label><input className="inp-glass w-full" value={editRegional} onChange={(e) => setEditRegional(e.target.value)} /></div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary mt-2 disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </GlassCard>

      <GlassCard accent="purple" className="space-y-4 !p-0">
        <h2 className="text-sm font-bold text-[var(--accent-purple)] uppercase p-4 pb-0">Gerenciar Papéis</h2>
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead><tr>{['Nome', 'Sigla', 'Papel atual', 'Ação'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="font-semibold">{emp.name}</td>
                  <td className="font-mono text-[var(--text-secondary)] text-xs">{emp.sigla ?? '—'}</td>
                  <td>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${emp.role === 'gerente' ? 'bg-[rgba(139,92,246,0.15)] border-[var(--border-purple)] text-[var(--accent-purple)]' : 'bg-[var(--bg-surface)] border-[var(--border-glass)] text-[var(--text-secondary)]'}`}>{emp.role}</span>
                  </td>
                  <td>
                    {emp.id !== myProfile?.id && (
                      <button onClick={() => toggleRole(emp)} className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition ${emp.role === 'gerente' ? 'bg-transparent hover:bg-[var(--bg-surface-hover)] border-[var(--border-glass)] text-[var(--text-secondary)]' : 'bg-[rgba(139,92,246,0.15)] hover:bg-[rgba(139,92,246,0.25)] border-[var(--border-purple)] text-[var(--accent-purple)]'}`}>
                        {emp.role === 'gerente' ? 'Rebaixar' : 'Promover'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard accent="red" className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--accent-red)] uppercase flex items-center gap-2"><span className="animate-pulse">⚠️</span> Zona de Perigo</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-glass)] px-4 py-3 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Limpar todos os órfãos</p>
              <p className="text-[10px] text-[var(--text-muted)]">Deleta itens sem funcionário válido.</p>
            </div>
            <button onClick={cleanOrphans} disabled={dangerLoading} className="btn-danger !py-1.5 disabled:opacity-50">Limpar Órfãos</button>
          </div>
          <div className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-glass)] px-4 py-3 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Limpar logs antigos (&gt; 90 dias)</p>
              <p className="text-[10px] text-[var(--text-muted)]">Remove scan_logs com mais de 90 dias.</p>
            </div>
            <button onClick={cleanOldLogs} disabled={dangerLoading} className="btn-danger !py-1.5 disabled:opacity-50">Limpar Logs</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Settings;
