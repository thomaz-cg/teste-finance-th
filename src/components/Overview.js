import React from 'react';
import { fmt, currentYM, monthLabel, getLast6Months, expensesByMonth, totalByCategory, CAT_MAP } from '../helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Receipt, Tag, Wallet, ArrowRight } from 'lucide-react';

export default function Overview({ expenses, budget, onNavigate }) {
  const ym = currentYM();
  const thisMonth = expensesByMonth(expenses, ym);
  const total = thisMonth.reduce((s, e) => s + e.val, 0);
  const catTotals = totalByCategory(thisMonth);
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  const budgetRest = budget.total > 0 ? budget.total - total : null;
  const budgetPct = budget.total > 0 ? Math.round((total / budget.total) * 100) : null;

  const last6 = getLast6Months();
  const chartData = last6.map(m => ({
    name: monthLabel(m),
    total: expensesByMonth(expenses, m).reduce((s, e) => s + e.val, 0),
  }));

  const recent = expenses.slice(0, 6);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '10px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(payload[0].value)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-dark)' }}>
          Visão Geral — {monthLabel(ym)}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-mid)', marginTop: 4 }}>
          Resumo financeiro do mês atual
        </p>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label"><Receipt size={13} /> Gasto este mês</div>
          <div className="metric-value red">{fmt(total)}</div>
          <div className="metric-sub">{thisMonth.length} lançamento{thisMonth.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Tag size={13} /> Maior categoria</div>
          <div className="metric-value blue" style={{ fontSize: 18 }}>
            {topCat ? `${CAT_MAP[topCat[0]]?.icon || ''} ${topCat[0]}` : '—'}
          </div>
          <div className="metric-sub">{topCat ? fmt(topCat[1]) : 'sem dados'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><TrendingUp size={13} /> Média por dia</div>
          <div className="metric-value amber">
            {thisMonth.length > 0 ? fmt(total / new Date().getDate()) : '—'}
          </div>
          <div className="metric-sub">até hoje</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Wallet size={13} /> Orçamento restante</div>
          <div className={`metric-value ${budgetRest !== null ? (budgetRest >= 0 ? 'green' : 'red') : ''}`}>
            {budgetRest !== null ? fmt(Math.abs(budgetRest)) : '—'}
          </div>
          <div className="metric-sub">
            {budgetPct !== null ? `${budgetPct}% utilizado` : 'configure o orçamento'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
        <div className="section-title">Gastos dos últimos 6 meses</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(24,95,165,0.06)' }} />
            <Bar dataKey="total" fill="#185FA5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Últimos lançamentos</div>
          <button
            onClick={() => onNavigate('entries')}
            style={{ fontSize: 13, color: 'var(--blue-mid)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
          >
            Ver todos <ArrowRight size={14} />
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              Nenhum gasto registrado ainda.
            </div>
          ) : recent.map(e => {
            const cat = CAT_MAP[e.cat] || {};
            return (
              <div key={e.id} className="expense-item">
                <div className="expense-icon" style={{ background: cat.bg }}>
                  {cat.icon || '📦'}
                </div>
                <div className="expense-info">
                  <div className="expense-desc">{e.desc}</div>
                  <div className="expense-meta">{e.cat} · {e.resp} · {e.date}</div>
                </div>
                <div className="expense-amount">{fmt(e.val)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
