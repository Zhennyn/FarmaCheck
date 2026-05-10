import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '../lib/supabase';

interface Profile {
  id: string; name: string; sigla: string | null; number: string | null; regional: string | null; role: string; email?: string;
}

const INP = 'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition';
const LBL = 'text-xs font-semibold text-gray-400 uppercase mb-1 block';

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
      setMyProfile(p);
      setEditName(p.name); setEditSigla(p.sigla ?? ''); setEditNumber(p.number ?? ''); setEditRegional(p.regional ?? '');
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
    <div className="p-6 space-y-8 max-w-3xl">
      <h1 className="text-2xl font-black text-white">Configurações</h1>

      {/* My profile */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-300">Meu Perfil</h2>
        {msg && <div className={`text-sm px-4 py-2 rounded-xl ${msg.type === 'ok' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{msg.text}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className={LBL}>Nome</label><input className={INP} value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
          <div><label className={LBL}>Sigla</label><input className={INP} value={editSigla} onChange={(e) => setEditSigla(e.target.value)} /></div>
          <div><label className={LBL}>Número</label><input className={INP} value={editNumber} onChange={(e) => setEditNumber(e.target.value)} /></div>
          <div className="col-span-2"><label className={LBL}>Regional</label><input className={INP} value={editRegional} onChange={(e) => setEditRegional(e.target.value)} /></div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Role management */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-300">Gerenciar Papéis</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800">{['Nome', 'Sigla', 'Papel atual', 'Ação'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 text-gray-200">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{emp.sigla ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${emp.role === 'gerente' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-gray-700/50 text-gray-400'}`}>{emp.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {emp.id !== myProfile?.id && (
                      <button onClick={() => toggleRole(emp)} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${emp.role === 'gerente' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-400'}`}>
                        {emp.role === 'gerente' ? 'Rebaixar' : 'Promover'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-red-400">⚠️ Zona de Perigo</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-gray-900/50 px-4 py-3 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-300">Limpar todos os órfãos</p>
              <p className="text-xs text-gray-500">Deleta itens sem funcionário válido.</p>
            </div>
            <button onClick={cleanOrphans} disabled={dangerLoading} className="text-sm bg-red-900/50 hover:bg-red-900/70 text-red-400 font-bold px-4 py-2 rounded-xl border border-red-800 transition disabled:opacity-50">
              Limpar Órfãos
            </button>
          </div>
          <div className="flex items-center justify-between bg-gray-900/50 px-4 py-3 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-300">Limpar logs antigos (&gt; 90 dias)</p>
              <p className="text-xs text-gray-500">Remove scan_logs com mais de 90 dias de criação.</p>
            </div>
            <button onClick={cleanOldLogs} disabled={dangerLoading} className="text-sm bg-red-900/50 hover:bg-red-900/70 text-red-400 font-bold px-4 py-2 rounded-xl border border-red-800 transition disabled:opacity-50">
              Limpar Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
