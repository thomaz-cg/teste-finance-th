import React, { useState } from 'react';
import { CATEGORIES, CAT_MAP, TIPOS, fmt, today, getMonths, monthLabel, currentYM, fixedAsExpenses, getResponsaveis } from '../../helpers';
import { Plus, Trash2, RefreshCw, CheckSquare, Square, X } from 'lucide-react';

export default function Entries({ expenses, fixedList, profile, onAdd, onDelete }) {
  const [form, setForm] = useState({ desc:'', val:'', date:today(), cat:'Alimentação', resp:'Casal', tipo:'casa', obs:'' });
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterCat,   setFilterCat]   = useState('all');
  const [filterTipo,  setFilterTipo]  = useState('all');
  const [showFixed,   setShowFixed]   = useState(true);
  const [saving, setSaving] = useState(false);

  // selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]     = useState(new Set());
  const [deleting, setDeleting]     = useState(false);

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

  // só lançamentos reais (não fixos) podem ser selecionados/apagados
  const selectableFiltered = filtered.filter(e => !e.isFixed);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const allIds = selectableFiltered.map(e => e.id);
    const allSelected = allIds.every(id => selected.has(id));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Apagar ${selected.size} lançamento${selected.size!==1?'s':''} selecionado${selected.size!==1?'s':''}? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    for (const id of selected) {
      await onDelete(id);
    }
    setSelected(new Set());
    setSelectMode(false);
    setDeleting(false);
  };

  const selectedTotal = selectableFiltered.filter(e => selected.has(e.id)).reduce((s,e)=>s+e.val,0);

  return (
    <div>
      <div style={{ marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>Lançamentos</h1>
          <p style={{ fontSize:14, color:'var(--gray-mid)', marginTop:4 }}>Registre cada gasto na data real em que aconteceu</p>
        </div>
        {!selectMode ? (
          <button onClick={()=>setSelectMode(true)}
            style={{ display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', background:'white', color:'var(--blue-dark)', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <CheckSquare size={15}/> Selecionar
          </button>
        ) : (
          <button onClick={exitSelectMode}
            style={{ display:'flex', alignItems:'center', gap:6, height:38, padding:'0 16px', background:'white', color:'var(--gray-mid)', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <X size={15}/> Cancelar seleção
          </button>
        )}
      </div>

      {!selectMode && (
        <div className="form-card">
          <div className="form-section-title">Novo lançamento</div>
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
      )}

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
        {!selectMode && (
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--gray-mid)', cursor:'pointer' }}>
            <input type="checkbox" checked={showFixed} onChange={e=>setShowFixed(e.target.checked)}/> Mostrar fixos
          </label>
        )}
        {filtered.length>0 && !selectMode && <span style={{ marginLeft:'auto', fontSize:14, fontWeight:700, color:'var(--blue-dark)' }}>Total: {fmt(filteredTotal)}</span>}
      </div>

      {/* Select-all bar in select mode */}
      {selectMode && (
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, padding:'10px 14px', background:'var(--blue-light)', borderRadius:'var(--radius-sm)', flexWrap:'wrap' }}>
          <button onClick={selectAllVisible}
            style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--blue-dark)' }}>
            {selectableFiltered.length>0 && selectableFiltered.every(e=>selected.has(e.id))
              ? <><CheckSquare size={16}/> Desmarcar todos</>
              : <><Square size={16}/> Selecionar todos visíveis</>}
          </button>
          {showFixed && <span style={{ fontSize:11, color:'var(--gray-mid)' }}>(gastos fixos não podem ser apagados aqui)</span>}
        </div>
      )}

      <div className="card">
        {filtered.length===0
          ?<div className="empty-state"><div className="empty-state-icon">🧾</div>Nenhum lançamento encontrado.</div>
          :filtered.map(e=>{
            const cat  = CAT_MAP[e.cat]||{};
            const tipo = TIPOS.find(t=>t.id===(e.tipo||'casa'))||TIPOS[0];
            const isSel = selected.has(e.id);
            const canSelect = !e.isFixed;
            return (
              <div key={e.id} className="expense-item"
                style={{ opacity:e.isFixed?(selectMode?0.4:0.85):1, cursor: selectMode && canSelect ? 'pointer' : 'default', background: isSel ? 'var(--blue-light)' : undefined }}
                onClick={() => { if (selectMode && canSelect) toggleSelect(e.id); }}>
                {selectMode && (
                  <div style={{ flexShrink:0, color: canSelect ? (isSel?'var(--blue-mid)':'var(--gray-mid)') : 'rgba(0,0,0,0.15)' }}>
                    {isSel ? <CheckSquare size={20}/> : <Square size={20}/>}
                  </div>
                )}
                <div className="expense-icon" style={{ background:cat.bg||'#f5f5f5' }}>{cat.icon||'📦'}</div>
                <div className="expense-info">
                  <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                    <span className="expense-desc">{e.desc}</span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:tipo.bg, color:tipo.color }}>
                      {tipo.icon} {tipo.label}
                    </span>
                    {e.isFixed&&<span className="fixed-badge"><RefreshCw size={9}/> Fixo</span>}
                  </div>
                  <div className="expense-meta">{e.cat} · {e.resp} · {e.date}{e.obs?` · ${e.obs}`:''}</div>
                </div>
                <div className="expense-amount">{fmt(e.val)}</div>
                {!selectMode && !e.isFixed && (
                  <button className="btn-icon" onClick={(ev)=>{ev.stopPropagation(); if(window.confirm(`Remover "${e.desc}"?`))onDelete(e.id);}}>
                    <Trash2 size={15}/>
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Floating bulk delete bar */}
      {selectMode && selected.size > 0 && (
        <div style={{ position:'sticky', bottom:16, marginTop:16, background:'var(--blue-dark)', borderRadius:'var(--radius-md)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', boxShadow:'0 6px 24px rgba(0,0,0,0.25)' }}>
          <div style={{ color:'white', fontSize:14 }}>
            <span style={{ fontWeight:700 }}>{selected.size}</span> selecionado{selected.size!==1?'s':''} · Total: <span style={{ fontWeight:700 }}>{fmt(selectedTotal)}</span>
          </div>
          <button onClick={handleBulkDelete} disabled={deleting}
            style={{ height:38, padding:'0 20px', background:'#fff', color:'var(--red-dark)', border:'none', borderRadius:6, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
            {deleting ? <>Apagando...</> : <><Trash2 size={15}/> Apagar selecionados</>}
          </button>
        </div>
      )}
    </div>
  );
}
