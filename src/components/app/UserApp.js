import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { LayoutDashboard, ListChecks, BarChart2, Target, RefreshCw, LogOut, Wifi, WifiOff } from 'lucide-react';
import Overview from './Overview';
import Entries from './Entries';
import Fixed from './Fixed';
import Charts from './Charts';
import Budget from './Budget';

const TABS = [
  { id:'overview', label:'Visão Geral',  icon:LayoutDashboard },
  { id:'entries',  label:'Lançamentos',  icon:ListChecks },
  { id:'fixed',    label:'Gastos Fixos', icon:RefreshCw },
  { id:'charts',   label:'Gráficos',     icon:BarChart2 },
  { id:'budget',   label:'Orçamento',    icon:Target },
];

export default function UserApp({ user, profile }) {
  const [tab, setTab]             = useState('overview');
  const [expenses, setExpenses]   = useState([]);
  const [fixedList, setFixedList] = useState([]);
  const [budget, setBudgetState]  = useState({ total:0, cats:{} });
  const [online, setOnline]       = useState(true);

  const uid = user.uid;
  const base = (col) => collection(db, 'users', uid, col);

  useEffect(() => {
    const q = query(base('expenses'), orderBy('createdAt','desc'));
    return onSnapshot(q, s => { setExpenses(s.docs.map(d=>({id:d.id,...d.data()}))); setOnline(true); }, ()=>setOnline(false));
  }, [uid]);

  useEffect(() => {
    const q = query(base('fixed'), orderBy('createdAt','asc'));
    return onSnapshot(q, s => setFixedList(s.docs.map(d=>({id:d.id,...d.data()}))));
  }, [uid]);

  useEffect(() => {
    return onSnapshot(doc(db,'users',uid,'config','budget'), s => { if(s.exists()) setBudgetState(s.data()); });
  }, [uid]);

  const addExpense    = (e)       => addDoc(base('expenses'), {...e, createdAt:serverTimestamp()});
  const deleteExpense = (id)      => deleteDoc(doc(db,'users',uid,'expenses',id));
  const addFixed      = (f)       => addDoc(base('fixed'), {...f, createdAt:serverTimestamp()});
  const deleteFixed   = (id)      => deleteDoc(doc(db,'users',uid,'fixed',id));
  const toggleFixed   = (id,val)  => updateDoc(doc(db,'users',uid,'fixed',id), {active:val});
  const saveBudget    = (b)       => { setBudgetState(b); setDoc(doc(db,'users',uid,'config','budget'), b); };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="app-logo-icon">💰</span>
            <div>
              <div className="app-logo-title">Finanças do Casal</div>
              <div className="app-logo-sub">{profile?.ownerName} & {profile?.spouseName}</div>
            </div>
          </div>
          <nav className="app-nav">
            {TABS.map(({id,label,icon:Icon})=>(
              <button key={id} className={`nav-btn ${tab===id?'active':''}`} onClick={()=>setTab(id)}>
                <Icon size={16}/><span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="app-header-right">
            <div className="sync-badge">
              {online ? <><Wifi size={12}/><span>Online</span></> : <><WifiOff size={12}/><span>Offline</span></>}
            </div>
            <button className="logout-btn" onClick={()=>signOut(auth)}>
              <LogOut size={13}/> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab==='overview' && <Overview expenses={expenses} fixedList={fixedList} budget={budget} profile={profile} onNavigate={setTab}/>}
        {tab==='entries'  && <Entries  expenses={expenses} fixedList={fixedList} profile={profile} onAdd={addExpense} onDelete={deleteExpense}/>}
        {tab==='fixed'    && <Fixed    fixedList={fixedList} profile={profile} onAdd={addFixed} onDelete={deleteFixed} onToggle={toggleFixed}/>}
        {tab==='charts'   && <Charts   expenses={expenses} fixedList={fixedList} profile={profile}/>}
        {tab==='budget'   && <Budget   expenses={expenses} fixedList={fixedList} budget={budget} setBudget={saveBudget}/>}
      </main>
    </div>
  );
}
