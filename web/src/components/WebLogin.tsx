import React, { useState } from 'react';
import { createClient } from '../lib/supabase';

interface WebLoginProps {
  onLogin: () => void;
}

const WebLogin: React.FC<WebLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('Drogaria874');
  const [password, setPassword] = useState('Drogaria@10');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    // Converte nome de usuário para formato de email exigido pelo Supabase
    const emailToUse = username.includes('@') ? username : `${username}@farmacheck.com`;

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
      if (error) throw error;

      // Check if user is gerente
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .single();

      if (!profile || profile.role !== 'gerente' || profile.status !== 'approved') {
        await supabase.auth.signOut();
        throw new Error('Acesso negado: Apenas gerentes aprovados podem acessar o painel web.');
      }

      onLogin();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      const emailToUse = username.includes('@') ? username : `${username}@farmacheck.com`;
      
      let userId = '';
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailToUse,
        password,
        options: { data: { name: 'Gerente Principal', role: 'gerente' } }
      });
      
      if (signUpError && !signUpError.message.includes('already registered')) {
        throw signUpError;
      }

      if (signUpData?.user) {
        userId = signUpData.user.id;
      } else {
        // If already registered, we need to sign in to get the ID, or use an RPC.
        // Actually, just sign in quickly to get the ID and fix the profile!
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
        if (signInError) throw new Error('Conta existe mas senha incorreta: ' + signInError.message);
        userId = signInData.user.id;
      }
      
      // Force update profile (wait 1s to ensure trigger finished if just created)
      await new Promise(r => setTimeout(r, 1000));
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'gerente', status: 'approved' })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      setErrorMsg('✅ Conta de admin validada com sucesso! Você já pode entrar.');
      
      // If we signed in to fix it, sign out so they can log in normally via the button
      await supabase.auth.signOut();
      
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao criar conta de admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d1a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <form onSubmit={handleLogin} style={{
        background: '#111827', padding: 40, borderRadius: 16, width: '100%', maxWidth: 400,
        border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: 20
      }}>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 48 }}>💊</span>
          <h1 style={{ fontSize: 24, margin: '10px 0 0', fontWeight: 800 }}>FarmaCheck Web</h1>
          <p style={{ color: '#9ca3af', margin: '5px 0 0', fontSize: 14 }}>Acesso exclusivo para Gerentes</p>
        </div>

        {errorMsg && (
          <div style={{
            background: errorMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
            color: errorMsg.startsWith('✅') ? '#4ade80' : '#fca5a5', padding: 12,
            borderRadius: 8, fontSize: 14, 
            border: `1px solid ${errorMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Usuário</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{
              background: '#1f2937', border: '1px solid #374151', padding: '12px 16px',
              borderRadius: 8, color: '#fff', fontSize: 15
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              background: '#1f2937', border: '1px solid #374151', padding: '12px 16px',
              borderRadius: 8, color: '#fff', fontSize: 15
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#6366f1', color: '#fff', padding: '14px', borderRadius: 8,
            border: 'none', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: 10
          }}
        >
          {loading ? 'Aguarde...' : 'Entrar no Dashboard'}
        </button>

        <button
          type="button"
          onClick={handleCreateAdmin}
          disabled={loading}
          style={{
            background: 'transparent', color: '#9ca3af', padding: '10px', borderRadius: 8,
            border: '1px solid #374151', fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Criar essa conta como Admin
        </button>
      </form>
    </div>
  );
};

export default WebLogin;
