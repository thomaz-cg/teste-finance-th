import React from 'react';
import { fmt, currentYM, monthLabel, getLast6Months, expensesByMonth, totalByCategory, CAT_MAP, fixedAsExpenses } from '../../helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Receipt, Tag, Wallet, RefreshCw, ArrowRight, Home } from 'lucide-react';

export default function Overview({ expenses, fixedList, budget, profile, onNavigate }) {
  const ym          = currentYM();
  const activeFixed = fixedAsExpenses(fixedList);
  const thisMonth   = [...expensesByMonth(expenses,ym), ...activeFixed];
  const total       = thisMonth.reduce((s,e)=>s+e.val,0);
  const totalFixed  = activeFixed.reduce((s,f)=>s+f.val,0);

  // casa vs pessoal
  const totalCasa       = thisMonth.filter(e=>(e.tipo||'casa')==='casa').reduce((s,e)=>s+e.val,0);
  const totalPessoalOwner  = thisMonth.filter(e=>e.tipo==='pessoal'&&e.resp===profile?.ownerName).reduce((s,e)=>s+e.val,0);
  const totalPessoalSpouse = thisMonth.filter(e=>e.tipo==='pessoal'&&e.resp===profile?.spouseName).reduce((s,e)=>s+e.val,0);
  const totalPessoal    = totalPessoalOwner + totalPessoalSpouse;

  const catTotals  = totalByCategory(thisMonth);
  const topCat     = Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0];
  const budgetRest = budget.total>0 ? budget.total-total : null;
  const budgetPct  = budget.total>0 ? Math.round(total/budget.total*100) : null;

  const last6 = getLast6Months();
  const chartData = last6.map(m => {
    const all = [...expensesByMonth(expenses,m), ...(m===ym?activeFixed:[])];
    return {
      name: monthLabel(m),
      Casa:    all.filter(e=>(e.tipo||'casa')==='casa').reduce((s,e)=>s+e.val,0),
      [profile?.ownerName||'Eu']:    all.filter(e=>e.tipo==='pessoal'&&e.resp===profile?.ownerName).reduce((s,e)=>s+e.val,0),
      [profile?.spouseName||'Cônjuge']: all.filter(e=>e.tipo==='pessoal'&&e.resp===profile?.spouseName).reduce((s,e)=>s+e.val,0),
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null;
    return (
      <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'10px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>{label}</div>
        {payload.map((p,i)=><div key={i} style={{ fontSize:13, fontWeight:600, color:p.fill }}>{p.name}: {fmt(p.value)}</div>)}
        <div style={{ fontSize:13, fontWeight:700, marginTop:4, borderTop:'1px solid #eee', paddingTop:4 }}>Total: {fmt(payload.reduce((s,p)=>s+p.value,0))}</div>
      </div>
    );
  };

  const recent = expensesByMonth(expenses,ym).slice(0,5);
  const ownerName  = profile?.ownerName  || 'Eu';
  const spouseName = profile?.spouseName || 'Cônjuge';

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700 }}>Olá, {ownerName}! 👋</h1>
        <p style={{ fontSize:14, color:'var(--gray-mid)', marginTop:4 }}>Resumo de {monthLabel(ym)}</p>
      </div>

      {/* Top metrics */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label"><Receipt size={12}/> Total do mês</div>
          <div className="metric-value red">{fmt(total)}</div>
          <div className="metric-sub">fixos + variáveis</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Home size={12}/> Despesas de casa</div>
          <div className="metric-value blue">{fmt(totalCasa)}</div>
          <div className="metric-sub">{thisMonth.filter(e=>(e.tipo||'casa')==='casa').length} lançamentos</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><RefreshCw size={12}/> Fixos ativos</div>
          <div className="metric-value purple">{fmt(totalFixed)}</div>
          <div className="metric-sub">{fixedList.filter(f=>f.active).length} itens</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Tag size={12}/> Maior categoria</div>
          <div className="metric-value" style={{ fontSize:17 }}>
            {topCat ? `${CAT_MAP[topCat[0]]?.icon||''} ${topCat[0]}` : '—'}
          </div>
          <div className="metric-sub">{topCat?fmt(topCat[1]):'sem dados'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Wallet size={12}/> Orçamento restante</div>
          <div className={`metric-value ${budgetRest!==null?(budgetRest>=0?'green':'red'):''}`}>
            {budgetRest!==null?fmt(Math.abs(budgetRest)):'—'}
          </div>
          <div className="metric-sub">{budgetPct!==null?`${budgetPct}% utilizado`:'configure o orçamento'}</div>
        </div>
      </div>

      {/* Casa × Pessoal breakdown */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <div className="section-title">Casa × Pessoal — {monthLabel(ym)}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
          {/* Casa */}
          <div style={{ background:'var(--blue-light)', borderRadius:'var(--radius-sm)', padding:'16px 18px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--blue-mid)', marginBottom:6 }}>🏠 Casa</div>
            <div style={{ fontSize:22, fontWeight:700, color:'var(--blue-dark)' }}>{fmt(totalCasa)}</div>
            <div style={{ fontSize:11, color:'var(--blue-mid)', marginTop:4 }}>
              {total>0?Math.round(totalCasa/total*100):0}% do total
            </div>
          </div>
          {/* Pessoal owner */}
          <div style={{ background:'var(--amber-light)', borderRadius:'var(--radius-sm)', padding:'16px 18px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--amber-dark)', marginBottom:6 }}>👤 {ownerName}</div>
            <div style={{ fontSize:22, fontWeight:700, color:'var(--amber-dark)' }}>{fmt(totalPessoalOwner)}</div>
            <div style={{ fontSize:11, color:'var(--amber-dark)', marginTop:4 }}>
              {total>0?Math.round(totalPessoalOwner/total*100):0}% do total
            </div>
          </div>
          {/* Pessoal spouse */}
          <div style={{ background:'var(--green-light)', borderRadius:'var(--radius-sm)', padding:'16px 18px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--green-dark)', marginBottom:6 }}>👤 {spouseName}</div>
            <div style={{ fontSize:22, fontWeight:700, color:'var(--green-dark)' }}>{fmt(totalPessoalSpouse)}</div>
            <div style={{ fontSize:11, color:'var(--green-dark)', marginTop:4 }}>
              {total>0?Math.round(totalPessoalSpouse/total*100):0}% do total
            </div>
          </div>
        </div>

        {/* Proportion bar */}
        {total>0&&(
          <div style={{ height:10, borderRadius:20, overflow:'hidden', display:'flex', gap:2 }}>
            <div style={{ width:`${Math.round(totalCasa/total*100)}%`, background:'#185FA5', transition:'width 0.4s' }}/>
            <div style={{ width:`${Math.round(totalPessoalOwner/total*100)}%`, background:'#854F0B', transition:'width 0.4s' }}/>
            <div style={{ flex:1, background:'#3B6D11' }}/>
          </div>
        )}
        <div style={{ display:'flex', gap:16, marginTop:10, flexWrap:'wrap' }}>
          {[['#185FA5','🏠 Casa'],['#854F0B',`👤 ${ownerName}`],['#3B6D11',`👤 ${spouseName}`]].map(([c,l])=>(
            <span key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--gray-mid)' }}>
              <span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }}></span>{l}
            </span>
          ))}
        </div>
      </div>

      {/* 6 months chart */}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <div className="section-title">Últimos 6 meses</div>
        <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
          {[['#185FA5','🏠 Casa'],['#854F0B',`👤 ${ownerName}`],['#3B6D11',`👤 ${spouseName}`]].map(([c,l])=>(
            <span key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--gray-mid)' }}>
              <span style={{ width:10, height:10, borderRadius:2, background:c, display:'inline-block' }}></span>{l}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false}/>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#888' }}/>
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#888' }} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
            <Tooltip content={<CustomTooltip/>} cursor={{ fill:'rgba(24,95,165,0.06)' }}/>
            <Bar dataKey="Casa"       fill="#185FA5" radius={[0,0,0,0]} stackId="a"/>
            <Bar dataKey={ownerName}  fill="#854F0B" radius={[0,0,0,0]} stackId="a"/>
            <Bar dataKey={spouseName} fill="#3B6D11" radius={[6,6,0,0]} stackId="a"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent */}
      <div className="card">
        <div style={{ padding:'18px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div className="section-title" style={{ marginBottom:0 }}>Últimos lançamentos</div>
          <button onClick={()=>onNavigate('entries')}
            style={{ fontSize:13, color:'var(--blue-mid)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
            Ver todos <ArrowRight size={14}/>
          </button>
        </div>
        <div style={{ marginTop:10 }}>
          {recent.length===0
            ?<div className="empty-state"><div className="empty-state-icon">📋</div>Nenhum lançamento este mês.</div>
            :recent.map(e=>{
              const cat=CAT_MAP[e.cat]||{};
              const isPessoal=e.tipo==='pessoal';
              const tipoColor = isPessoal&&e.resp===spouseName ? {bg:'#EAF3DE',color:'#3B6D11'} : isPessoal ? {bg:'#FAEEDA',color:'#854F0B'} : {bg:'#E6F1FB',color:'#185FA5'};
              const tipoIcon  = isPessoal ? '👤' : '🏠';
              return (
                <div key={e.id} className="expense-item">
                  <div className="expense-icon" style={{ background:cat.bg }}>{cat.icon||'📦'}</div>
                  <div className="expense-info">
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span className="expense-desc">{e.desc}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:tipoColor.bg, color:tipoColor.color }}>{tipoIcon} {isPessoal?e.resp:'Casa'}</span>
                    </div>
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
