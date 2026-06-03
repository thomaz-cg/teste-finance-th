import React, { useState } from 'react';
import { CATEGORIES, CAT_MAP, TIPOS, fmt, getResponsaveis } from '../../helpers';
import { Plus, Trash2, RefreshCw, Calendar } from 'lucide-react';

export function Fixed({ fixedList, profile, onAdd, onDelete, onToggle }) {
  const [form, setForm] = useState({ desc:'', val:'', cat:'Assinaturas', resp:'Casal', tipo:'casa', dueDay:'10', obs:'' });
  const [saving, setSaving] = useState(false);
  const responsaveis = getResponsaveis(profile);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleAdd = async () => {
    if (!form.desc.trim()||!form.val||parseFloat(form.val)<=0) { alert('Preencha descrição e valor.'); return; }
    const day=parseInt(form.dueDay);
    if (!day||day<1||day>31) { alert('Dia inválido (1–31).'); return; }
    setSaving(true);
    await onAdd({ desc:form.desc.trim(), val:parseFloat(form.val), cat:form.cat, resp:form.resp, tipo:form.tipo, dueDay:day, obs:form.obs.trim(), active:true });
    setForm({ desc:'', val:'', cat:'Assinaturas', resp:'Casal', tipo:'casa', dueDay:'10', obs:'' });
    setSaving(false);
  };

  const activeList   = fixedList.filter(f=>f.active);
  const inactiveList = fixedList.filter(f=>!f.active);
  const totalFixed   = activeList.reduce((s,f)=>s+f.val,0);
  const totalCasa    = activeList.filter(f=>(f.tipo||'casa')==='casa').reduce((s,f)=>s+f.val,0);
  const totalPessoal = activeList.filter(f=>f.tipo==='pessoal').reduce((s,f)=>s+f.val,0);

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:700 }}>Gastos Fixos</h1>
        <p style={{ fontSize:14, color:'var(--gray-mid)', marginTop:4 }}>Cadastre uma vez — somados automaticamente todo mês</p>
      </div>

      <div className="metric-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', marginBottom:20 }}>
        <div className="metric-card">
          <div className="metric-label"><RefreshCw size={12}/> Total fixo/mês</div>
          <div className="metric-value purple">{fmt(totalFixed)}</div>
          <div className="metric-sub">{activeList.length} ativo{activeList.length!==1?'s':''}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">🏠 Casa</div>
          <div className="metric-value blue">{fmt(totalCasa)}</div>
          <div className="metric-sub">{activeList.filter(f=>(f.tipo||'casa')==='casa').length} itens</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">👤 Pessoal</div>
          <div className="metric-value amber">{fmt(totalPessoal)}</div>
          <div className="metric-sub">{activeList.filter(f=>f.tipo==='pessoal').length} itens</div>
        </div>
        <div className="metric-card">
          <div className="metric-label"><Calendar size={12}/> Próx. vencimento</div>
          <div className="metric-value" style={{ fontSize:15 }}>
            {activeList.length>0
              ?(() => { const h=new Date().getDate(); const p=activeList.map(f=>({...f,diff:f.dueDay>=h?f.dueDay-h:31-h+f.dueDay})).sort((a,b)=>a.diff-b.diff); return p[0]?`Dia ${p[0].dueDay} — ${p[0].desc}`:'—'; })()
              :'—'}
          </div>
          <div className="metric-sub">mais próximo</div>
        </div>
      </div>

      <div className="form-card">
        <div className="form-section-title">+ Novo gasto fixo</div>
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
            <input type="text" placeholder={form.tipo==='casa'?'Ex: Internet, Aluguel':'Ex: Academia, Celular'} value={form.desc} onChange={e=>set('desc',e.target.value)}/>
          </div>
          <div className="form-group">
            <label>Valor (R$)</label>
            <input type="number" placeholder="0,00" min="0" step="0.01" value={form.val} onChange={e=>set('val',e.target.value)}/>
          </div>
          <div className="form-group">
            <label>Dia vencimento</label>
            <input type="number" placeholder="Ex: 10" min="1" max="31" value={form.dueDay} onChange={e=>set('dueDay',e.target.value)}/>
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
          <input type="text" placeholder="Ex: plano família" value={form.obs} onChange={e=>set('obs',e.target.value)}/>
        </div>
        <button className="btn-primary" onClick={handleAdd} disabled={saving}>
          <Plus size={16}/> {saving?'Salvando...':'Adicionar gasto fixo'}
        </button>
      </div>

      {activeList.length>0&&(
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ padding:'16px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div className="section-title" style={{ marginBottom:0 }}>✅ Ativos</div>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--purple-dark)' }}>{fmt(totalFixed)}/mês</span>
          </div>
          <div style={{ marginTop:8 }}>
            {activeList.sort((a,b)=>a.dueDay-b.dueDay).map(f=>{
              const cat  = CAT_MAP[f.cat]||{};
              const tipo = TIPOS.find(t=>t.id===(f.tipo||'casa'))||TIPOS[0];
              return (
                <div key={f.id} className="expense-item">
                  <div className="expense-icon" style={{ background:cat.bg||'#f5f5f5' }}>{cat.icon||'📦'}</div>
                  <div className="expense-info">
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span className="expense-desc">{f.desc}</span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:tipo.bg, color:tipo.color }}>{tipo.icon} {tipo.label}</span>
                      <span className="due-badge"><Calendar size={10}/> Todo dia {f.dueDay}</span>
                    </div>
                    <div className="expense-meta">{f.cat} · {f.resp}{f.obs?` · ${f.obs}`:''}</div>
                  </div>
                  <div className="expense-amount">{fmt(f.val)}</div>
                  <label className="toggle">
                    <input type="checkbox" checked={f.active} onChange={e=>onToggle(f.id,e.target.checked)}/>
                    <span className="toggle-slider"></span>
                  </label>
                  <button className="btn-icon" onClick={()=>{if(window.confirm(`Remover "${f.desc}"?`))onDelete(f.id);}}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {inactiveList.length>0&&(
        <div className="card">
          <div style={{ padding:'16px 20px 0' }}>
            <div className="section-title" style={{ marginBottom:0, color:'var(--gray-mid)' }}>⏸ Inativos</div>
          </div>
          <div style={{ marginTop:8 }}>
            {inactiveList.map(f=>{
              const cat=CAT_MAP[f.cat]||{};
              return (
                <div key={f.id} className="expense-item" style={{ opacity:0.5 }}>
                  <div className="expense-icon" style={{ background:cat.bg||'#f5f5f5' }}>{cat.icon||'📦'}</div>
                  <div className="expense-info">
                    <div className="expense-desc">{f.desc}</div>
                    <div className="expense-meta">{f.cat} · dia {f.dueDay}{f.obs?` · ${f.obs}`:''}</div>
                  </div>
                  <div className="expense-amount">{fmt(f.val)}</div>
                  <label className="toggle">
                    <input type="checkbox" checked={f.active} onChange={e=>onToggle(f.id,e.target.checked)}/>
                    <span className="toggle-slider"></span>
                  </label>
                  <button className="btn-icon" onClick={()=>{if(window.confirm(`Remover "${f.desc}"?`))onDelete(f.id);}}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {fixedList.length===0&&<div className="card"><div className="empty-state"><div className="empty-state-icon">🔄</div>Nenhum gasto fixo ainda.</div></div>}
    </div>
  );
}
export default Fixed;
