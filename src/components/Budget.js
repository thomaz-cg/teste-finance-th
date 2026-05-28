import React from 'react';
import { CATEGORIES, fmt, currentYM, expensesByMonth, totalByCategory, fixedAsExpenses } from '../helpers';

export default function Budget({ expenses, fixedList, budget, setBudget }) {
  const ym = currentYM();
  const varExp    = expensesByMonth(expenses, ym);
  const fixedExp  = fixedAsExpenses(fixedList);
  const allExp    = [...varExp, ...fixedExp];
  const catTotals = totalByCategory(allExp);
  const totalSpent = allExp.reduce((s,e)=>s+e.val,0);
  const totalFixed = fixedExp.reduce((s,f)=>s+f.val,0);

  const setTotal = v => setBudget({ ...budget, total: parseFloat(v)||0 });
  const setCat   = (cat,v) => setBudget({ ...budget, cats: { ...budget.cats, [cat]: parseFloat(v)||0 } });

  const getStatus = (spent, limit) => {
    if (!limit) return null;
    const pct = spent/limit;
    if (pct > 1)   return { label:'🔴 Excedido', color:'#A32D2D', bg:'#FCEBEB' };
    if (pct > 0.7) return { label:'⚠️ Atenção',  color:'#854F0B', bg:'#FAEEDA' };
    return               { label:'✅ OK',        color:'#3B6D11', bg:'#EAF3DE' };
  };

  const totalLimit  = budget.total;
  const totalStatus = getStatus(totalSpent, totalLimit);
  const totalPct    = totalLimit > 0 ? Math.min(100, Math.round(totalSpent/totalLimit*100)) : 0;
  const totalBar    = totalPct > 100 ? '#A32D2D' : totalPct > 70 ? '#854F0B' : '#185FA5';

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:700 }}>Orçamento</h1>
        <p style={{ fontSize:14, color:'var(--gray-mid)', marginTop:4 }}>Limites mensais — inclui fixos + variáveis</p>
      </div>

      {/* Info fixed total */}
      {totalFixed > 0 && (
        <div style={{ background:'var(--purple-light)', border:'1px solid rgba(83,52,137,0.15)', borderRadius:'var(--radius-md)', padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:18 }}>🔄</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--purple-dark)' }}>Gastos fixos ativos: {fmt(totalFixed)}/mês</div>
            <div style={{ fontSize:12, color:'var(--purple-dark)', opacity:0.8, marginTop:2 }}>Já incluídos automaticamente no cálculo abaixo</div>
          </div>
        </div>
      )}

      <div className="form-card" style={{ marginBottom:20 }}>
        <div className="form-section-title">Configurar limites</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18, paddingBottom:18, borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
          <span style={{ fontSize:14, fontWeight:600, minWidth:160 }}>💰 Total mensal</span>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--gray-mid)', pointerEvents:'none' }}>R$</span>
            <input type="number" min="0" step="100" value={budget.total||''} onChange={e=>setTotal(e.target.value)} placeholder="0,00"
              style={{ height:38, padding:'0 12px 0 30px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:8, fontSize:14, fontFamily:'inherit', width:150, color:'#0000FF', fontWeight:600, outline:'none' }} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:12 }}>
          {CATEGORIES.map(cat=>(
            <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>{cat.icon}</span>
              <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{cat.id}</span>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--gray-mid)', pointerEvents:'none' }}>R$</span>
                <input type="number" min="0" step="50" value={budget.cats[cat.id]||''} onChange={e=>setCat(cat.id,e.target.value)} placeholder="sem limite"
                  style={{ height:34, padding:'0 8px 0 26px', border:'1.5px solid rgba(0,0,0,0.10)', borderRadius:8, fontSize:13, fontFamily:'inherit', width:120, color:'#0000FF', outline:'none' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, fontSize:12, color:'var(--gray-mid)', fontStyle:'italic' }}>
          ℹ️ Valores em azul são editáveis. O realizado considera fixos + variáveis do mês atual.
        </div>
      </div>

      <div className="card" style={{ padding:24 }}>
        <div className="section-title">Progresso — {new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</div>

        {totalLimit > 0 && (
          <div className="budget-bar" style={{ paddingBottom:18, marginBottom:18, borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
            <div className="budget-bar-header">
              <div className="budget-bar-label" style={{ fontSize:14 }}>💰 Total geral</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className="budget-bar-amounts">{fmt(totalSpent)} de {fmt(totalLimit)}</div>
                {totalStatus && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:totalStatus.bg, color:totalStatus.color, fontWeight:700 }}>{totalStatus.label}</span>}
              </div>
            </div>
            <div className="budget-bar-track">
              <div className="budget-bar-fill" style={{ width:`${totalPct}%`, background:totalBar }}/>
            </div>
          </div>
        )}

        {CATEGORIES.map(cat => {
          const spent = catTotals[cat.id]||0;
          const limit = budget.cats[cat.id]||0;
          if (!limit && !spent) return null;
          const pct    = limit>0 ? Math.min(100,Math.round(spent/limit*100)) : 0;
          const status = getStatus(spent,limit);
          const bar    = pct>100?'#A32D2D':pct>70?'#854F0B':cat.color;
          return (
            <div key={cat.id} className="budget-bar">
              <div className="budget-bar-header">
                <div className="budget-bar-label">{cat.icon} {cat.id}</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="budget-bar-amounts">{fmt(spent)}{limit>0?` de ${fmt(limit)}`:' (sem limite)'}</div>
                  {status && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:status.bg, color:status.color, fontWeight:700 }}>{status.label}</span>}
                </div>
              </div>
              {limit>0 && <div className="budget-bar-track"><div className="budget-bar-fill" style={{ width:`${pct}%`, background:bar }}/></div>}
            </div>
          );
        })}

        {totalLimit===0 && Object.values(budget.cats).every(v=>!v) && (
          <div className="empty-state"><div className="empty-state-icon">🎯</div>Configure seus limites acima para ver o progresso.</div>
        )}
      </div>
    </div>
  );
}
