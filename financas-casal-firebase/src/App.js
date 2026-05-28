import React, { useState, useEffect } from 'react';
import Overview from './components/Overview';
import Entries from './components/Entries';
import Charts from './components/Charts';
import Budget from './components/Budget';
import { LayoutDashboard, ListChecks, BarChart2, Target, Wifi, WifiOff, Loader } from 'lucide-react';
import { db } from './firebase';
import {
  collection, onSnapshot, addDoc, deleteDoc,
  doc, setDoc, getDoc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import './App.css';

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'entries',  label: 'Lançamentos', icon: ListChecks },
  { id: 'charts',   label: 'Gráficos',    icon: BarChart2 },
  { id: 'budget',   label: 'Orçamento',   icon: Target },
];

export default function App() {
  const [tab, setTab]           = useState('overview');
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudgetState]= useState({ total: 0, cats: {} });
  const [status, setStatus]     = useState('loading'); // loading | online | offline

  // ── listen to expenses ───────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setExpenses(data);
        setStatus('online');
      },
      () => setStatus('offline')
    );
    return unsub;
  }, []);

  // ── listen to budget ─────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'budget'),
      (snap) => {
        if (snap.exists()) setBudgetState(snap.data());
      },
      () => {}
    );
    return unsub;
  }, []);

  const addExpense = async (e) => {
    await addDoc(collection(db, 'expenses'), {
      ...e,
      createdAt: serverTimestamp(),
    });
  };

  const deleteExpense = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  const saveBudget = async (newBudget) => {
    setBudgetState(newBudget);
    await setDoc(doc(db, 'config', 'budget'), newBudget);
  };

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, color: '#888' }}>
        <Loader size={36} className="spin" color="#185FA5" />
        <div style={{ fontSize: 15 }}>Conectando ao banco de dados...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="app-logo-icon">💰</span>
            <div>
              <div className="app-logo-title">Finanças do Casal</div>
              <div className="app-logo-sub">Sincronizado em tempo real</div>
            </div>
          </div>
          <nav className="app-nav">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`nav-btn ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="sync-badge" title={status === 'online' ? 'Sincronizado' : 'Sem conexão'}>
            {status === 'online'
              ? <><Wifi size={13} /> <span>Online</span></>
              : <><WifiOff size={13} /> <span>Offline</span></>
            }
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab === 'overview' && <Overview expenses={expenses} budget={budget} onNavigate={setTab} />}
        {tab === 'entries'  && <Entries  expenses={expenses} onAdd={addExpense} onDelete={deleteExpense} />}
        {tab === 'charts'   && <Charts   expenses={expenses} />}
        {tab === 'budget'   && <Budget   expenses={expenses} budget={budget} setBudget={saveBudget} />}
      </main>
    </div>
  );
}
