import React, { useState } from 'react';
import { CATEGORIES, CAT_MAP, fmt, getMonths, monthLabel, expensesByMonth, totalByCategory } from '../helpers';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

export default function Charts({ expenses }) {
  const months = getMonths(expenses);
  const [selMonth, setSelMonth] = useState(months[0] || '');

  const monthExp  = expensesByMonth(expenses, selMonth);
  const catTotals = totalByCategory(monthExp);

  const pieData = CATEGORIES
    .filter(c => catTotals[c.id] > 0)
    .map(c => ({ name: c.id, value: catTotals[c.id], icon: c.icon, color: c.color }));

  const respTotals = { Casal: 0, Thomaz: 0, Roberta: 0 };
  monthExp.forEach(e => { respTotals[e.resp] = (respTotals[e.resp] || 0) + e.val; });
  const respData = Object.entries(respTotals).map(([name, value]) => ({ name, value }));
  const respColors = ['#185FA5', '#3B6D11', '#854F0B'];

  const CustomTooltipPie = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '10px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.icon} {d.name}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: d.color }}>{fmt(d.value)}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {monthExp.length > 0 ? Math.round(d.value / monthExp.reduce((s, e) => s + e.val, 0) * 100) : 0}%
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipBar = ({ active, payload, label }) => {
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

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Gráficos</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-mid)', marginTop: 4 }}>
          Análise visual dos seus gastos
        </p>
      </div>

      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-mid)' }}>Mês:</span>
        {months.length === 0 ? (
          <span style={{ fontSize: 13, color: 'var(--gray-mid)' }}>Sem dados ainda</span>
        ) : (
          <select value={selMonth} onChange={e => setSelMonth(e.target.value)}
            style={{ height: 36, padding: '0 12px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, background: '#fff', fontFamily: 'inherit' }}>
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        )}
      </div>

      {monthExp.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            Nenhum dado para este mês. Adicione lançamentos!
          </div>
        </div>
      ) : (
        <>
          {/* Pie chart */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div className="section-title">Gastos por categoria</div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: 16 }}>
              {pieData.map(d => (
                <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-mid)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }}></span>
                  {d.icon} {d.name} — {fmt(d.value)}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart by responsavel */}
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div className="section-title">Gastos por responsável</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={respData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(24,95,165,0.06)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {respData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={respColors[index % respColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
