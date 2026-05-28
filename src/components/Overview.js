import React from 'react';
import { fmt, currentYM, monthLabel, getLast6Months, expensesByMonth, totalByCategory, CAT_MAP, fixedAsExpenses } from '../helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Receipt, Tag, TrendingUp, Wallet, RefreshCw, ArrowRight } from 'lucide-react';

export default function Overview({ expenses, fixedList, budget, onNavigate }) {
  const ym = currentYM();
  const activeFixed  = fixedAsExpenses(fixedList);
  const thisMonth    = [...expensesByMonth(expenses, ym), ...activeFixed];
  const total        = thisMonth.reduce((s, e) => s + e.val, 0);
  const totalFixed   = activeFixed.reduce((s, f) => s + f.val, 0);
  const totalVar     = expensesByMonth(expenses, ym).reduce((s, e) => s + e.val, 0);
  const catTotals    = totalByCategory(thisMonth);
  const topCat       = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  const budgetRest   = budget.total > 0 ? budget.total - total : null;
  const budgetPct    = budget.total > 0 ? Math.round((total / budget.total) * 100) : null;

  const last6 = getLast6Months();
  const chartData = last6.map(m => {
    const varTotal   = expensesByMonth(expenses, m).reduce((s, e) => s + e.val, 0);
    const fixedTotal = m === ym ? totalFixed : fixedAsExpenses(fixedList).reduce((s,f)=>s+f.val,0);
    return { name: monthLabel(m), Variáveis: varTotal, Fixos: fixedTotal };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) return (
      <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'10px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>{label}</div>
        {payload.map((p,i) => <div key={i} style={{ fontSize:13, fontWeight:600, color:p.fill }}>{p.name}: {fmt(p.value)}</div>)}
        <div style={{ fontSize:13, fontWeight:700, marginTop:4, borderTop:'1px solid #eee', paddingTop:4 }}>Total: {fmt(payload.reduce((s,p)=>s+p.value,0))}</div>
      </div>
    );
    return null;
  };

  const recent = [...expensesByMonth(expenses, ym)].slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Visão Geral — {monthLabel(ym)}</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-mid)', marginTop: 4 }}>Resumo financeiro do mês atual (fixos + variáveis)</p>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label"><Receipt size={12}/> Total do mês</div>
          <div className="metric-value red">{fmt(total)}</div>
          <div className="metric-sub">fixos + variáveis</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><RefreshCw size={12}/> Gastos fixos</div>
          <div className="metric-value purple">{fmt(totalFixed)}</div>
          <div className="metric-sub">{fixedList.filter(f=>f.active).length} itens ativos</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><TrendingUp size={12}/> Gastos variáveis</div>
          <div className="metric-value amber">{fmt(totalVar)}</div>
          <div className="metric-sub">{expensesByMonth(expenses,ym).length} lançamentos</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Tag size={12}/> Maior categoria</div>
          <div className="metric-value blue" style={{ fontSize: 17 }}>
            {topCat ? `${CAT_MAP[topCat[0]]?.icon || ''} ${topCat[0]}` : '—'}
          </div>
          <div className="metric-sub">{topCat ? fmt(topCat[1]) : 'sem dados'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Wallet size={12}/> Orçamento restante</div>
          <div className={`metric-value ${budgetRest !== null ? (budgetRest >= 0 ? 'green' : 'red') : ''}`}>
            {budgetRest !== null ? fmt(Math.abs(budgetRest)) : '—'}
          </div>
          <div className="metric-sub">{budgetPct !== null ? `${budgetPct}% utilizado` : 'configure o orçamento'}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="section-title">Gastos dos últimos 6 meses</div>
        <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--gray-mid)' }}>
            <span style={{ width:10, height:10, borderRadius:2, background:'#185FA5', display:'inline-block' }}></span> Variáveis
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--gray-mid)' }}>
            <span style={{ width:10, height:10, borderRadius:2, background:'#533489', display:'inline-block' }}></span> Fixos
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#888' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#888' }} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(24,95,165,0.06)' }} />
            <Bar dataKey="Fixos"     fill="#533489" radius={[0,0,0,0]} stackId="a" />
            <Bar dataKey="Variáveis" fill="#185FA5" radius={[6,6,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent */}
      <div className="card">
        <div style={{ padding:'18px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div className="section-title" style={{ marginBottom:0 }}>Últimos lançamentos variáveis</div>
          <button onClick={() => onNavigate('entries')}
            style={{ fontSize:13, color:'var(--blue-mid)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
            Ver todos <ArrowRight size={14}/>
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          {recent.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📋</div>Nenhum lançamento variável este mês.</div>
            : recent.map(e => {
                const cat = CAT_MAP[e.cat] || {};
                return (
                  <div key={e.id} className="expense-item">
                    <div className="expense-icon" style={{ background: cat.bg }}>{cat.icon || '📦'}</div>
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
