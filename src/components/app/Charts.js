import React, { useState } from 'react';
import { CATEGORIES, CAT_MAP, TIPOS, fmt, getMonths, monthLabel, expensesByMonth, totalByCategory, currentYM, fixedAsExpenses, getResponsaveis } from '../../helpers';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Charts({ expenses, fixedList, profile }) {
  const ym = currentYM();
  const months = Array.from(new Set([ym,...getMonths(expenses)])).sort().reverse();
  const [selMonth, setSelMonth] = useState(months[0]||ym);
  const [view, setView] = useState('categoria'); // categoria | tipo | responsavel
  const responsaveis = getResponsaveis(profile);

  const activeFixed = fixedAsExpenses(fixedList);
  const varExp   = expensesByMonth(expenses, selMonth);
  const fixedExp = selMonth===ym ? activeFixed : [];
  const monthExp = [...varExp,...fixedExp];

  const catTotals = totalByCategory(monthExp);
  const pieData   = CATEGORIES.filter(c=>catTotals[c.id]>0).map(c=>({ name:c.id, value:catTotals[c.id], icon:c.icon, color:c.color }));

  const tipoData  = TIPOS.map(t=>({ name:t.label, value:monthExp.filter(e=>(e.tipo||'casa')===t.id).reduce((s,e)=>s+e.val,0), icon:t.icon, color:t.color })).filter(d=>d.value>0);

  const respColors=['#185FA5','#3B6D11','#854F0B'];
  const respTotals=Object.fromEntries(responsaveis.map(r=>[r,0]));
  monthExp.forEach(e=>{ if(respTotals[e.resp]!==undefined) respTotals[e.resp]+=e.val; });
  const respData=Object.entries(respTotals).map(([name,value])=>({name,value}));

  // pessoal por pessoa
  const pessoalData = responsaveis.slice(1).map((r,i)=>({
    name: r,
    value: monthExp.filter(e=>e.tipo==='pessoal'&&e.resp===r).reduce((s,e)=>s+e.val,0),
    color: ['#3B6D11','#854F0B'][i]||'#888',
  })).filter(d=>d.value>0);

  const TipPie=({active,payload})=>{
    if (!active||!payload?.length) return null;
    const d=payload[0].payload, total=monthExp.reduce((s,e)=>s+e.val,0);
    return <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'10px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>{d.icon} {d.name}</div>
      <div style={{ fontSize:15, fontWeight:700, color:d.color }}>{fmt(d.value)}</div>
      <div style={{ fontSize:12, color:'#888' }}>{total>0?Math.round(d.value/total*100):0}%</div>
    </div>;
  };

  const TipBar=({active,payload,label})=>{
    if (!active||!payload?.length) return null;
    return <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'10px 16px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:700 }}>{fmt(payload[0].value)}</div>
    </div>;
  };

  const renderLabel=({cx,cy,midAngle,innerRadius,outerRadius,percent})=>{
    if (percent<0.05) return null;
    const R=Math.PI/180,r=innerRadius+(outerRadius-innerRadius)*0.5;
    return <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>{`${(percent*100).toFixed(0)}%`}</text>;
  };

  const views=[{id:'categoria',label:'Por categoria'},{id:'tipo',label:'Casa × Pessoal'},{id:'responsavel',label:'Por responsável'}];

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:700 }}>Gráficos</h1>
        <p style={{ fontSize:14, color:'var(--gray-mid)', marginTop:4 }}>Análise visual dos seus gastos</p>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <select value={selMonth} onChange={e=>setSelMonth(e.target.value)}
          style={{ height:36, padding:'0 12px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:8, fontSize:13, background:'#fff', fontFamily:'inherit' }}>
          {months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <div style={{ display:'flex', gap:4, background:'var(--gray-light)', borderRadius:8, padding:4 }}>
          {views.map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)}
              style={{ padding:'5px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer',
                background:view===v.id?'white':'transparent', color:view===v.id?'var(--blue-dark)':'var(--gray-mid)',
                boxShadow:view===v.id?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s' }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {monthExp.length===0
        ?<div className="card"><div className="empty-state"><div className="empty-state-icon">📊</div>Sem dados para este mês.</div></div>
        :<>
          {view==='categoria'&&(
            <div className="card" style={{ padding:24 }}>
              <div className="section-title">Por categoria</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 18px', marginBottom:14 }}>
                {pieData.map(d=><span key={d.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--gray-mid)' }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:d.color, flexShrink:0 }}></span>{d.icon} {d.name} — {fmt(d.value)}
                </span>)}
              </div>
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={105} paddingAngle={2} dataKey="value" labelLine={false} label={renderLabel}>
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip content={<TipPie/>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {view==='tipo'&&(
            <>
              <div className="card" style={{ padding:24, marginBottom:20 }}>
                <div className="section-title">Casa × Pessoal</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 18px', marginBottom:14 }}>
                  {tipoData.map(d=><span key={d.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--gray-mid)' }}>
                    <span style={{ width:10, height:10, borderRadius:2, background:d.color, flexShrink:0 }}></span>{d.icon} {d.name} — {fmt(d.value)}
                  </span>)}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={tipoData} cx="50%" cy="50%" innerRadius={55} outerRadius={105} paddingAngle={3} dataKey="value" labelLine={false} label={renderLabel}>
                      {tipoData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip content={<TipPie/>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {pessoalData.length>0&&(
                <div className="card" style={{ padding:24 }}>
                  <div className="section-title">👤 Gastos pessoais por pessoa</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={pessoalData} barCategoryGap="50%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false}/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:13, fill:'#888' }}/>
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#888' }} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip content={<TipBar/>} cursor={{ fill:'rgba(24,95,165,0.06)' }}/>
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {pessoalData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {view==='responsavel'&&(
            <div className="card" style={{ padding:24 }}>
              <div className="section-title">Por responsável</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={respData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false}/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:13, fill:'#888' }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#888' }} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<TipBar/>} cursor={{ fill:'rgba(24,95,165,0.06)' }}/>
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {respData.map((e,i)=><Cell key={i} fill={respColors[i%respColors.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      }
    </div>
  );
}
