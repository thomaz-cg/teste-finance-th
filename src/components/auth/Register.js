import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Register({ onSwitch }) {
  const [form, setForm] = useState({ email:'', password:'', confirm:'', ownerName:'', spouseName:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.ownerName.trim() || !form.spouseName.trim()) {
      return setError('Preencha seu nome e o nome do cônjuge.');
    }
    if (form.password.length < 6) {
      return setError('A senha deve ter pelo menos 6 caracteres.');
    }
    if (form.password !== form.confirm) {
      return setError('As senhas não coincidem.');
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email:      form.email,
        ownerName:  form.ownerName.trim(),
        spouseName: form.spouseName.trim(),
        blocked:    false,
        createdAt:  serverTimestamp(),
        uid:        cred.user.uid,
      });
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
        'auth/invalid-email':        'E-mail inválido.',
        'auth/weak-password':        'Senha muito fraca. Use pelo menos 6 caracteres.',
      };
      setError(msgs[err.code] || 'Erro ao criar conta. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">💰</span>
          <div className="auth-logo-title">Finanças do Casal</div>
          <div className="auth-logo-sub">Crie sua conta</div>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handleRegister}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:0 }}>
            <div className="auth-form-group">
              <label>Seu nome</label>
              <input type="text" placeholder="Ex: Thomaz" value={form.ownerName}
                onChange={e => set('ownerName', e.target.value)} required />
            </div>
            <div className="auth-form-group">
              <label>Nome do cônjuge</label>
              <input type="text" placeholder="Ex: Roberta" value={form.spouseName}
                onChange={e => set('spouseName', e.target.value)} required />
            </div>
          </div>

          <hr className="auth-divider" />

          <div className="auth-form-group">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={form.email}
              onChange={e => set('email', e.target.value)} required autoComplete="email" />
          </div>
          <div className="auth-form-group">
            <label>Senha</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={form.password}
              onChange={e => set('password', e.target.value)} required />
          </div>
          <div className="auth-form-group">
            <label>Confirmar senha</label>
            <input type="password" placeholder="Repita a senha" value={form.confirm}
              onChange={e => set('confirm', e.target.value)} required />
          </div>

          <div style={{ fontSize:12, color:'var(--gray-mid)', marginBottom:12, lineHeight:1.5 }}>
            ℹ️ As opções de responsável no app serão: <strong>Casal</strong>, <strong>{form.ownerName||'Seu nome'}</strong> e <strong>{form.spouseName||'Nome do cônjuge'}</strong>.
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-link" style={{ marginTop:20 }}>
          Já tem conta? <a onClick={onSwitch}>Entrar</a>
        </div>
      </div>
    </div>
  );
}
