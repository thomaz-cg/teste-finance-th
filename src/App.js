import React, { useState, useEffect } from 'react';
import Overview from './components/Overview';
import Entries from './components/Entries';
import Charts from './components/Charts';
import Budget from './components/Budget';
import { LayoutDashboard, ListChecks, BarChart2, Target } from 'lucide-react';
import './App.css';

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'entries', label: 'Lançamentos', icon: ListChecks },
  { id: 'charts', label: 'Gráficos', icon: BarChart2 },
  { id: 'budget', label: 'Orçamento', icon: Target },
];

const STORAGE_KEY = 'financas_casal_v2';
const BUDGET_KEY  = 'financas_casal_budget_v2';

function loadExpenses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function loadBudget() {
  try { return JSON.parse(localStorage.getItem(BUDGET_KEY)) || { total: 0, cats: {} }; } catch { return { total: 0, cats: {} }; }
}

export default function App() {
  const [tab, setTab]         = useState('overview');
  const [expenses, setExpenses] = useState(loadExpenses);
  const [budget, setBudget]   = useState(loadBudget);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); } catch {}
  }, [expenses]);

  useEffect(() => {
    try { localStorage.setItem(BUDGET_KEY, JSON.stringify(budget)); } catch {}
  }, [budget]);

  const addExpense    = (e) => setExpenses(prev => [e, ...prev]);
  const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            <span className="app-logo-icon">💰</span>
            <div>
              <div className="app-logo-title">Finanças do Casal</div>
              <div className="app-logo-sub">Controle seus gastos juntos</div>
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
        </div>
      </header>

      <main className="app-main">
        {tab === 'overview' && <Overview expenses={expenses} budget={budget} onNavigate={setTab} />}
        {tab === 'entries'  && <Entries  expenses={expenses} onAdd={addExpense} onDelete={deleteExpense} />}
        {tab === 'charts'   && <Charts   expenses={expenses} />}
        {tab === 'budget'   && <Budget   expenses={expenses} budget={budget} setBudget={setBudget} />}
      </main>
    </div>
  );
}
