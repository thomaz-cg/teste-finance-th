import React, { useState } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onSwitch }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const msgs = {
        'auth/user-not-found':   'E-mail não encontrado.',
        'auth/wrong-password':   'Senha incorreta.',
        'auth/invalid-email':    'E-mail inválido.',
        'auth/too-many-requests':'Muitas tentativas. Tente novamente mais tarde.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
      };
      setError(msgs[err.code] || 'Erro ao entrar. Verifique suas credenciais.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">💰</span>
          <div className="auth-logo-title">Finanças do Casal</div>
          <div className="auth-logo-sub">Entre na sua conta</div>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="auth-form-group">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="auth-form-group">
            <label>Senha</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-link" style={{ marginTop: 20 }}>
          Não tem conta?{' '}
          <a onClick={onSwitch}>Criar conta gratuita</a>
        </div>
      </div>
    </div>
  );
}
