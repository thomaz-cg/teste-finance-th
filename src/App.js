import React, { useState, useEffect } from 'react';
import { auth, db, ADMIN_EMAIL } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminPanel from './components/admin/AdminPanel';
import UserApp from './components/app/UserApp';
import { Loader } from 'lucide-react';

export default function App() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [authPage, setAuthPage] = useState('login'); // login | register
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // load profile
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) setProfile(snap.data());
        } catch {}
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16, color:'#888' }}>
      <Loader size={36} className="spin" color="#185FA5" />
      <div style={{ fontSize:15 }}>Carregando...</div>
    </div>
  );

  if (!user) {
    return authPage === 'login'
      ? <Login onSwitch={() => setAuthPage('register')} />
      : <Register onSwitch={() => setAuthPage('login')} />;
  }

  // blocked user
  if (profile?.blocked) return (
    <div className="auth-bg">
      <div className="auth-card" style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h2 style={{ color:'var(--red-dark)', marginBottom:8 }}>Conta bloqueada</h2>
        <p style={{ color:'var(--gray-mid)', fontSize:14 }}>Sua conta foi suspensa. Entre em contato com o administrador.</p>
        <button className="auth-btn" style={{ marginTop:20, background:'var(--gray-mid)' }} onClick={() => auth.signOut()}>Sair</button>
      </div>
    </div>
  );

  if (user.email === ADMIN_EMAIL) return <AdminPanel user={user} />;

  return <UserApp user={user} profile={profile} setProfile={setProfile} />;
}
