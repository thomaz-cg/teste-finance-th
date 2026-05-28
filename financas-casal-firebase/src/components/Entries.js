import React, { useState } from 'react';
import { CATEGORIES, RESPONSAVEIS, CAT_MAP, fmt, today, getMonths, monthLabel } from '../helpers';
import { Plus, Trash2 } from 'lucide-react';

export default function Entries({ expenses, onAdd, onDelete }) {
  const [form, setForm] = useState({
    desc: '', val: '', date: today(), cat: 'Alimentação', resp: 'Casal', obs: '',
  });
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterCat, setFilterCat]     = useState('all');
  const [saving, setSaving]           = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.desc.trim() || !form.val || parseFloat(form.val) <= 0) {
      alert('Preencha a descrição e um valor válido.');
      return;
    }
    setSaving(true);
    await onAdd({
      desc: form.desc.trim(),
      val:  parseFloat(form.val),
      date: form.date || today(),
      cat:  form.cat,
      resp: form.resp,
      obs:  form.obs.trim(),
    });
    setForm(f => ({ ...f, desc: '', val: '', obs: '' }));
    setSaving(false);
  };

  const months  = getMonths(expenses);
  const filtered = expenses.filter(e =>
    (filterMonth === 'all' || e.date.slice(0, 7) === filterMonth) &&
    (filterCat   === 'all' || e.cat === filterCat)
  );
  const filteredTotal = filtered.reduce((s, e) => s + e.val, 0);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Lançamentos</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-mid)', marginTop: 4 }}>
          Registre cada gasto com a data real em que aconteceu
        </p>
      </div>

      <div className="form-card">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue-dark)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Novo lançamento
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Descrição</label>
            <input type="text" placeholder="Ex: Supermercado Extra"
              value={form.desc} onChange={e => set('desc', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <div className="form-group">
            <label>Valor (R$)</label>
            <input type="number" placeholder="0,00" min="0" step="0.01"
              value={form.val} onChange={e => set('val', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Data</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <label>Categoria</label>
            <select value={form.cat} onChange={e => set('cat', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.id}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Responsável</label>
            <select value={form.resp} onChange={e => set('resp', e.target.value)}>
              {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Observações (opcional)</label>
          <input type="text" placeholder="Ex: parcelado em 3x"
            value={form.obs} onChange={e => set('obs', e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleAdd} disabled={saving}>
          <Plus size={16} /> {saving ? 'Salvando...' : 'Adicionar gasto'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--gray-mid)', fontWeight: 600 }}>Filtrar:</span>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ height: 36, padding: '0 12px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, background: '#fff', fontFamily: 'inherit' }}>
          <option value="all">Todos os meses</option>
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ height: 36, padding: '0 12px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, background: '#fff', fontFamily: 'inherit' }}>
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.id}</option>)}
        </select>
        {filtered.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--blue-dark)' }}>
            Total: {fmt(filteredTotal)}
          </span>
        )}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧾</div>
            Nenhum lançamento encontrado.
          </div>
        ) : filtered.map(e => {
          const cat = CAT_MAP[e.cat] || {};
          return (
            <div key={e.id} className="expense-item">
              <div className="expense-icon" style={{ background: cat.bg || '#f5f5f5' }}>{cat.icon || '📦'}</div>
              <div className="expense-info">
                <div className="expense-desc">{e.desc}</div>
                <div className="expense-meta">{e.cat} · {e.resp} · {e.date}{e.obs ? ` · ${e.obs}` : ''}</div>
              </div>
              <div className="expense-amount">{fmt(e.val)}</div>
              <button className="btn-icon" onClick={() => {
                if (window.confirm(`Remover "${e.desc}"?`)) onDelete(e.id);
              }}>
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
