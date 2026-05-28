import React from 'react';
import { CATEGORIES, fmt, currentYM, expensesByMonth, totalByCategory } from '../helpers';

export default function Budget({ expenses, budget, setBudget }) {
  const ym       = currentYM();
  const thisMonth = expensesByMonth(expenses, ym);
  const catTotals = totalByCategory(thisMonth);
  const totalSpent = thisMonth.reduce((s, e) => s + e.val, 0);

  const setTotal = (v) => setBudget(b => ({ ...b, total: parseFloat(v) || 0 }));
  const setCat   = (cat, v) => setBudget(b => ({ ...b, cats: { ...b.cats, [cat]: parseFloat(v) || 0 } }));

  const getStatus = (spent, limit) => {
    if (!limit) return null;
    const pct = spent / limit;
    if (pct > 1)    return { label: '🔴 Excedido', color: '#A32D2D', bg: '#FCEBEB' };
    if (pct > 0.7)  return { label: '⚠️ Atenção',  color: '#854F0B', bg: '#FAEEDA' };
    return              { label: '✅ OK',          color: '#3B6D11', bg: '#EAF3DE' };
  };

  const totalLimit  = budget.total;
  const totalStatus = getStatus(totalSpent, totalLimit);
  const totalPct    = totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0;
  const totalBarColor = totalPct > 100 ? '#A32D2D' : totalPct > 70 ? '#854F0B' : '#185FA5';

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Orçamento</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-mid)', marginTop: 4 }}>
          Define limites mensais e acompanhe em tempo real
        </p>
      </div>

      {/* Config */}
      <div className="form-card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue-dark)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Configurar limites
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-dark)', minWidth: 160 }}>💰 Total mensal</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--gray-mid)', pointerEvents: 'none' }}>R$</span>
            <input
              type="number"
              min="0"
              step="100"
              value={budget.total || ''}
              onChange={e => setTotal(e.target.value)}
              placeholder="0,00"
              style={{ height: 38, padding: '0 12px 0 32px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', width: 150, color: '#0000FF', fontWeight: 600, outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {CATEGORIES.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>{cat.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-dark)', flex: 1 }}>{cat.id}</span>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--gray-mid)', pointerEvents: 'none' }}>R$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={budget.cats[cat.id] || ''}
                  onChange={e => setCat(cat.id, e.target.value)}
                  placeholder="sem limite"
                  style={{ height: 34, padding: '0 8px 0 26px', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', width: 120, color: '#0000FF', outline: 'none' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--gray-mid)', fontStyle: 'italic' }}>
          ℹ️ Valores em azul são editáveis. O realizado é calculado automaticamente para o mês atual.
        </div>
      </div>

      {/* Bars */}
      <div className="card" style={{ padding: 24 }}>
        <div className="section-title">Progresso — mês atual</div>

        {totalLimit > 0 && (
          <div className="budget-bar" style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="budget-bar-header">
              <div className="budget-bar-label" style={{ fontSize: 14 }}>💰 Total geral</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="budget-bar-amounts">{fmt(totalSpent)} de {fmt(totalLimit)}</div>
                {totalStatus && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: totalStatus.bg, color: totalStatus.color, fontWeight: 700 }}>
                    {totalStatus.label}
                  </span>
                )}
              </div>
            </div>
            <div className="budget-bar-track">
              <div className="budget-bar-fill" style={{ width: `${totalPct}%`, background: totalBarColor }} />
            </div>
          </div>
        )}

        {CATEGORIES.map(cat => {
          const spent = catTotals[cat.id] || 0;
          const limit = budget.cats[cat.id] || 0;
          if (!limit && !spent) return null;
          const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          const status = getStatus(spent, limit);
          const barColor = pct > 100 ? '#A32D2D' : pct > 70 ? '#854F0B' : cat.color;
          return (
            <div key={cat.id} className="budget-bar">
              <div className="budget-bar-header">
                <div className="budget-bar-label">{cat.icon} {cat.id}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="budget-bar-amounts">
                    {fmt(spent)}{limit > 0 ? ` de ${fmt(limit)}` : ' (sem limite)'}
                  </div>
                  {status && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: status.bg, color: status.color, fontWeight: 700 }}>
                      {status.label}
                    </span>
                  )}
                </div>
              </div>
              {limit > 0 && (
                <div className="budget-bar-track">
                  <div className="budget-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                </div>
              )}
            </div>
          );
        })}

        {totalLimit === 0 && Object.values(budget.cats).every(v => !v) && (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            Configure seus limites acima para ver o progresso aqui.
          </div>
        )}
      </div>
    </div>
  );
}
