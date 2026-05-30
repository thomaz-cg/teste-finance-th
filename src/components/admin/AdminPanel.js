import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { Users, ShieldCheck, LogOut, Lock, Unlock, RefreshCw, Mail, TrendingUp, UserCheck, UserX } from 'lucide-react';
import { fmt } from '../../helpers';

export default function AdminPanel({ user }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, async (snap) => {
      const usersData = await Promise.all(
        snap.docs.map(async (d) => {
          const userData = { id: d.id, ...d.data() };
          // count expenses + fixed
          try {
            const expSnap = await getDocs(collection(db, 'users', d.id, 'expenses'));
            const fixSnap = await getDocs(collection(db, 'users', d.id, 'fixed'));
            const totalExp = expSnap.docs.reduce((s, e) => s + (e.data().val || 0), 0);
            const totalFix = fixSnap.docs.filter(f => f.data().active).reduce((s, f) => s + (f.data().val || 0), 0);
            userData.totalExpenses  = totalExp;
            userData.totalFixed     = totalFix;
            userData.expenseCount   = expSnap.size;
          } catch {}
          return userData;
        })
      );
      setUsers(usersData);
      setLoading(false);
    });
  }, []);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const toggleBlock = async (u) => {
    await updateDoc(doc(db, 'users', u.id), { blocked: !u.blocked });
    showMsg(u.blocked ? `✅ ${u.ownerName} foi desbloqueado(a).` : `🔒 ${u.ownerName} foi bloqueado(a).`);
  };

  const resetPassword = async (u) => {
    if (!window.confirm(`Enviar e-mail de redefinição de senha para ${u.email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, u.email);
      showMsg(`📧 E-mail de redefinição enviado para ${u.email}`);
    } catch {
      showMsg('❌ Erro ao enviar e-mail.');
    }
  };

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    u.spouseName?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount  = users.filter(u => !u.blocked).length;
  const blockedCount = users.filter(u => u.blocked).length;
  const totalSpend   = users.reduce((s, u) => s + (u.totalExpenses || 0) + (u.totalFixed || 0), 0);

  const formatDate = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString('pt-BR');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="app-logo-icon">💰</span>
            <div>
              <div className="app-logo-title">Finanças do Casal</div>
              <div className="app-logo-sub">Painel Administrativo</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div className="sync-badge"><ShieldCheck size={13}/> Admin Master</div>
            <button className="logout-btn" onClick={() => signOut(auth)}>
              <LogOut size={13}/> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:22, fontWeight:700 }}>Painel do Administrador</h1>
          <p style={{ fontSize:14, color:'var(--gray-mid)', marginTop:4 }}>Gerencie todos os usuários cadastrados</p>
        </div>

        {msg && (
          <div style={{ background:'var(--green-light)', color:'var(--green-dark)', borderRadius:'var(--radius-sm)', padding:'12px 16px', marginBottom:20, fontWeight:600, fontSize:14 }}>
            {msg}
          </div>
        )}

        {/* Metrics */}
        <div className="metric-grid" style={{ marginBottom:24 }}>
          <div className="metric-card">
            <div className="metric-label"><Users size={12}/> Total de usuários</div>
            <div className="metric-value blue">{users.length}</div>
            <div className="metric-sub">contas cadastradas</div>
          </div>
          <div className="metric-card">
            <div className="metric-label"><UserCheck size={12}/> Ativos</div>
            <div className="metric-value green">{activeCount}</div>
            <div className="metric-sub">contas ativas</div>
          </div>
          <div className="metric-card">
            <div className="metric-label"><UserX size={12}/> Bloqueados</div>
            <div className="metric-value red">{blockedCount}</div>
            <div className="metric-sub">contas suspensas</div>
          </div>
          <div className="metric-card">
            <div className="metric-label"><TrendingUp size={12}/> Total na plataforma</div>
            <div className="metric-value amber">{fmt(totalSpend)}</div>
            <div className="metric-sub">somando todos os usuários</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom:16 }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', maxWidth:360, height:40, padding:'0 14px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:'var(--radius-sm)', fontSize:14, outline:'none', fontFamily:'inherit' }}
          />
        </div>

        {/* Table */}
        <div className="card" style={{ overflowX:'auto' }}>
          {loading ? (
            <div className="empty-state">Carregando usuários...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">👥</div>Nenhum usuário encontrado.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Cônjuge</th>
                  <th>E-mail</th>
                  <th>Cadastro</th>
                  <th>Gastos</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight:600 }}>{u.ownerName || '—'}</div>
                    </td>
                    <td style={{ color:'var(--gray-mid)' }}>{u.spouseName || '—'}</td>
                    <td style={{ color:'var(--gray-mid)', fontSize:13 }}>{u.email}</td>
                    <td style={{ color:'var(--gray-mid)', fontSize:13 }}>{formatDate(u.createdAt)}</td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{fmt((u.totalExpenses||0)+(u.totalFixed||0))}</div>
                      <div style={{ fontSize:11, color:'var(--gray-mid)' }}>{u.expenseCount||0} lançamentos</div>
                    </td>
                    <td>
                      <span className={`status-badge ${u.blocked ? 'blocked' : 'active'}`}>
                        {u.blocked ? '🔒 Bloqueado' : '✅ Ativo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button
                          onClick={() => toggleBlock(u)}
                          title={u.blocked ? 'Desbloquear' : 'Bloquear'}
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:6, background:u.blocked?'var(--green-light)':'var(--red-light)', color:u.blocked?'var(--green-dark)':'var(--red-dark)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          {u.blocked ? <><Unlock size={12}/> Desbloquear</> : <><Lock size={12}/> Bloquear</>}
                        </button>
                        <button
                          onClick={() => resetPassword(u)}
                          title="Redefinir senha"
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:6, background:'var(--amber-light)', color:'var(--amber-dark)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          <RefreshCw size={12}/> Reset senha
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop:16, fontSize:12, color:'var(--gray-mid)', textAlign:'center' }}>
          O "Reset senha" envia um e-mail automático do Firebase para o usuário redefinir a própria senha.
        </div>
      </main>
    </div>
  );
}
