import React, { useState } from 'react';
import { CATEGORIES, CAT_MAP, TIPOS, fmt, today, getMonths, monthLabel, currentYM, fixedAsExpenses, getResponsaveis } from '../../helpers';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

export default function Entries({ expenses, fixedList, profile, onAdd, onDelete }) {
  const [form, setForm] = useState({ desc:'', val:'', date:today(), cat:'Alimentação', resp:'Casal', tipo:'casa', obs:'' });
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterCat,   setFilterCat]   = useState('all');
  const [filterTipo,  setFilterTipo]  = useState('all');
  const [showFixed,   setShowFixed]   = useState(true);
  const [saving, setSaving] = useState(false);

  const responsaveis = getResponsaveis(profile);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleAdd = async () => {
    if (!form.desc.trim()||!form.val||parseFloat(form.val)<=0) { alert('Preencha descrição e valor.'); return; }
    setSaving(true);
    await onAdd({ desc:form.desc.trim(), val:parseFloat(form.val), date:form.date||today(), cat:form.cat, resp:form.resp, tipo:form.tipo, obs:form.obs.trim() });
    setForm(f=>({...f,desc:'',val:'',obs:''}));
    setSaving(false);
  };

  const months = getMonths(expenses);
  const activeFixed = fixedAsExpenses(fixedList);
  const allEntries = [...expenses, ...(showFixed ? activeFixed : [])];

  const filtered = allEntries.filter(e =>
    (filterMonth==='all' || e.date?.slice(0,7)===filterMonth) &&
    (filterCat==='all'   || e.cat===filterCat) &&
    (filterTipo==='all'  || (e.tipo||'casa')===filterTipo)
  );
  const filteredTotal = filtered.reduce((s,e)=>s+e.val,0);

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:700 }}>Lançamentos</h1>
        <p style={{ fontSize:14, color:'var(--gray-mid)', marginTop:4 }}>Registre cada gasto na data real em que aconteceu</p>
      </div>

      <div className="form-card">
        <div className="form-section-title">Novo lançamento</div>

        {/* Tipo selector — destaque visual */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          {TIPOS.map(t=>(
            <button key={t.id} onClick={()=>set('tipo',t.id)}
              style={{ flex:1, height:44, border:`2px solid ${form.tipo===t.id?t.color:'rgba(0,0,0,0.10)'}`,
                borderRadius:'var(--radius-sm)', background:form.tipo===t.id?t.bg:'transparent',
                color:form.tipo===t.id?t.color:'var(--gray-mid)', fontWeight:700, fontSize:14,
                cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Descrição</label>
            <input type="text" placeholder={form.tipo==='casa'?'Ex: Supermercado, Aluguel':'Ex: Sorvete, Roupa'}
              value={form.desc} onChange={e=>set('desc',e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAdd()}/>
          </div>
          <div className="form-group">
            <label>Valor (R$)</label>
            <input type="number" placeholder="0,00" min="0" step="0.01" value={form.val} onChange={e=>set('val',e.target.value)}/>
          </div>
          <div className="form-group">
            <label>Data</label>
            <input type="date" value={form.date} onChange={e=>set('date',e.target.value)}/>
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <label>Categoria</label>
            <select value={form.cat} onChange={e=>set('cat',e.target.value)}>
              {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.id}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Responsável</label>
            <select value={form.resp} onChange={e=>set('resp',e.target.value)}>
              {responsaveis.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom:14 }}>
          <label>Observações (opcional)</label>
          <input type="text" placeholder="Ex: parcelado 3x" value={form.obs} onChange={e=>set('obs',e.target.value)}/>
        </div>
        <button className="btn-primary" onClick={handleAdd} disabled={saving}>
          <Plus size={16}/> {saving?'Salvando...':'Adicionar lançamento'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:13, color:'var(--gray-mid)', fontWeight:600 }}>Filtrar:</span>
        <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
          style={{ height:36, padding:'0 12px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:8, fontSize:13, background:'#fff', fontFamily:'inherit' }}>
          <option value="all">Todos os meses</option>
          {months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <select value={filterTipo} onChange={e=>setFilterTipo(e.target.value)}
          style={{ height:36, padding:'0 12px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:8, fontSize:13, background:'#fff', fontFamily:'inherit' }}>
          <option value="all">🏠👤 Todos os tipos</option>
          {TIPOS.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
        </select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
          style={{ height:36, padding:'0 12px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:8, fontSize:13, background:'#fff', fontFamily:'inherit' }}>
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.id}</option>)}
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--gray-mid)', cursor:'pointer' }}>
          <input type="checkbox" checked={showFixed} onChange={e=>setShowFixed(e.target.checked)}/> Mostrar fixos
        </label>
        {filtered.length>0&&<span style={{ marginLeft:'auto', fontSize:14, fontWeight:700, color:'var(--blue-dark)' }}>Total: {fmt(filteredTotal)}</span>}
      </div>

      <div className="card">
        {filtered.length===0
          ?<div className="empty-state"><div className="empty-state-icon">🧾</div>Nenhum lançamento encontrado.</div>
          :filtered.map(e=>{
            const cat  = CAT_MAP[e.cat]||{};
            const tipo = TIPOS.find(t=>t.id===(e.tipo||'casa'))||TIPOS[0];
            return (
              <div key={e.id} className="expense-item" style={{ opacity:e.isFixed?0.85:1 }}>
                <div className="expense-icon" style={{ background:cat.bg||'#f5f5f5' }}>{cat.icon||'📦'}</div>
                <div className="expense-info">
                  <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                    <span className="expense-desc">{e.desc}</span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700,
                      padding:'2px 7px', borderRadius:20, background:tipo.bg, color:tipo.color }}>
                      {tipo.icon} {tipo.label}
                    </span>
                    {e.isFixed&&<span className="fixed-badge"><RefreshCw size={9}/> Fixo</span>}
                  </div>
                  <div className="expense-meta">{e.cat} · {e.resp} · {e.date}{e.obs?` · ${e.obs}`:''}</div>
                </div>
                <div className="expense-amount">{fmt(e.val)}</div>
                {!e.isFixed&&(
                  <button className="btn-icon" onClick={()=>{if(window.confirm(`Remover "${e.desc}"?`))onDelete(e.id);}}>
                    <Trash2 size={15}/>
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
