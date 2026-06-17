import React, { useState, useRef } from 'react';
import { CATEGORIES, TIPOS, fmt, today, getResponsaveis } from '../../helpers';
import { Upload, X, Loader, CheckCircle, AlertCircle, Plus, Trash2, ImagePlus } from 'lucide-react';

const GEMINI_KEY = 'AQ.Ab8RN6JngoeYX2Zq4A00I7PfGCs7H_p7Hm80B_IbRGmrlhep0A';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export default function ImportExtrato({ profile, onSave }) {
  const [images, setImages]       = useState([]); // [{file, preview, base64}]
  const [items, setItems]         = useState([]); // parsed items
  const [status, setStatus]       = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const inputRef = useRef();

  const responsaveis = getResponsaveis(profile);

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const handleFiles = async (files) => {
    const newImgs = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const base64  = await toBase64(file);
      const preview = URL.createObjectURL(file);
      newImgs.push({ file, preview, base64, mimeType: file.type });
    }
    setImages(prev => [...prev, ...newImgs]);
    setStatus('idle');
    setItems([]);
    setSavedCount(0);
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_,idx) => idx !== i));
    setItems([]);
    setStatus('idle');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const analyze = async () => {
    if (!images.length) return;
    setStatus('loading');
    setErrorMsg('');
    setItems([]);

    try {
      const prompt = `Você é um assistente financeiro. Analise ${images.length > 1 ? 'estas imagens de extrato de cartão de crédito' : 'esta imagem de extrato de cartão de crédito'} e extraia TODOS os lançamentos encontrados.

Para cada lançamento retorne um JSON array com objetos no formato:
{
  "desc": "descrição do gasto (limpa e legível)",
  "val": 0.00,
  "date": "YYYY-MM-DD",
  "cat": "uma de: Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Vestuário, Pets, Assinaturas, Outros",
  "tipo": "casa ou pessoal",
  "resp": "Casal"
}

Regras de classificação:
- tipo "casa": supermercado, aluguel, contas (água, luz, internet, gás), farmácia básica, material de limpeza
- tipo "pessoal": restaurante, roupa, lazer, streaming, academia, beleza, eletrônicos, delivery, bar
- Se a data não estiver clara, use a data de hoje (${today()})
- Retorne APENAS o JSON array, sem texto adicional, sem markdown, sem explicações

Se não encontrar lançamentos, retorne [].`;

      const parts = [{ text: prompt }];
      for (const img of images) {
        parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
      }

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GEMINI_KEY },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || 'Erro na API Gemini');
      }

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/```json|```/g, '').trim();

      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Resposta inesperada da IA');

      // sanitize
      const clean = parsed.map((item, i) => ({
        id:   Date.now() + i,
        desc: item.desc || 'Sem descrição',
        val:  parseFloat(item.val) || 0,
        date: item.date || today(),
        cat:  CATEGORIES.find(c => c.id === item.cat) ? item.cat : 'Outros',
        tipo: item.tipo === 'pessoal' ? 'pessoal' : 'casa',
        resp: responsaveis.includes(item.resp) ? item.resp : 'Casal',
        selected: true,
      }));

      setItems(clean);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Erro ao analisar as imagens.');
      setStatus('error');
    }
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const toggleItem = (id) => updateItem(id, 'selected', !items.find(it => it.id === id)?.selected);

  const toggleAll = () => {
    const allSelected = items.every(it => it.selected);
    setItems(prev => prev.map(it => ({ ...it, selected: !allSelected })));
  };

  const handleSave = async () => {
    const toSave = items.filter(it => it.selected && it.val > 0);
    if (!toSave.length) { alert('Nenhum item selecionado.'); return; }
    setSaving(true);
    for (const item of toSave) {
      await onSave({ desc: item.desc, val: item.val, date: item.date, cat: item.cat, tipo: item.tipo, resp: item.resp, obs: 'Importado do extrato' });
    }
    setSavedCount(toSave.length);
    setItems([]);
    setImages([]);
    setStatus('idle');
    setSaving(false);
  };

  const selectedCount = items.filter(it => it.selected).length;
  const selectedTotal = items.filter(it => it.selected).reduce((s, it) => s + it.val, 0);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Importar Extrato</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-mid)', marginTop: 4 }}>
          Suba prints do extrato do cartão — a IA classifica os gastos automaticamente
        </p>
      </div>

      {savedCount > 0 && (
        <div style={{ background: 'var(--green-light)', color: 'var(--green-dark)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
          <CheckCircle size={18}/> {savedCount} lançamento{savedCount !== 1 ? 's' : ''} importado{savedCount !== 1 ? 's' : ''} com sucesso!
        </div>
      )}

      {/* Upload area */}
      <div className="form-card">
        <div className="form-section-title">1. Suba os prints do extrato</div>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{ border: '2px dashed rgba(24,95,165,0.3)', borderRadius: 'var(--radius-md)', padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: 'var(--blue-light)', transition: 'all 0.15s', marginBottom: 16 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue-mid)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(24,95,165,0.3)'}
        >
          <ImagePlus size={32} color="var(--blue-mid)" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--blue-dark)', marginBottom: 4 }}>
            Clique ou arraste os prints aqui
          </div>
          <div style={{ fontSize: 13, color: 'var(--blue-mid)' }}>
            Suporta múltiplas imagens — JPG, PNG, WEBP
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => handleFiles(Array.from(e.target.files))} />
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative', width: 90, height: 90 }}>
                <img src={img.preview} alt={`extrato ${i+1}`}
                  style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--blue-light)' }} />
                <button onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--red-dark)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} color="white"/>
                </button>
                <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'white', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  Print {i+1}
                </div>
              </div>
            ))}
            {/* Add more button */}
            <div onClick={() => inputRef.current?.click()}
              style={{ width: 90, height: 90, border: '2px dashed rgba(24,95,165,0.3)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--blue-mid)', gap: 4 }}>
              <Plus size={20}/>
              <span style={{ fontSize: 10, fontWeight: 600 }}>Adicionar</span>
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={analyze} disabled={!images.length || status === 'loading'}
          style={{ background: images.length ? 'var(--blue-dark)' : 'var(--gray-mid)' }}>
          {status === 'loading'
            ? <><Loader size={16} className="spin"/> Analisando com IA...</>
            : <><Upload size={16}/> Analisar {images.length > 0 ? `${images.length} imagem${images.length > 1 ? 's' : ''}` : 'imagens'}</>}
        </button>

        {status === 'error' && (
          <div style={{ marginTop: 12, background: 'var(--red-light)', color: 'var(--red-dark)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16}/> {errorMsg}
          </div>
        )}
      </div>

      {/* Results */}
      {items.length > 0 && (
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="form-section-title" style={{ marginBottom: 0 }}>
              2. Revise e ajuste os lançamentos
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-mid)', cursor: 'pointer' }}>
              <input type="checkbox" checked={items.every(it => it.selected)} onChange={toggleAll}/>
              Selecionar todos
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {items.map(item => {
              const tipoInfo = TIPOS.find(t => t.id === item.tipo) || TIPOS[0];
              return (
                <div key={item.id} style={{ border: `1.5px solid ${item.selected ? 'rgba(24,95,165,0.25)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 'var(--radius-sm)', padding: '12px 14px', background: item.selected ? 'var(--blue-light)' : 'var(--gray-light)', opacity: item.selected ? 1 : 0.6, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.id)} style={{ marginTop: 3, flexShrink: 0 }}/>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, flexWrap: 'wrap' }}>
                      {/* desc */}
                      <input value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)}
                        style={{ height: 34, padding: '0 10px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none' }}/>
                      {/* val */}
                      <input type="number" value={item.val} onChange={e => updateItem(item.id, 'val', parseFloat(e.target.value)||0)}
                        style={{ height: 34, padding: '0 10px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none' }}/>
                      {/* date */}
                      <input type="date" value={item.date} onChange={e => updateItem(item.id, 'date', e.target.value)}
                        style={{ height: 34, padding: '0 10px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none' }}/>
                      {/* cat */}
                      <select value={item.cat} onChange={e => updateItem(item.id, 'cat', e.target.value)}
                        style={{ height: 34, padding: '0 8px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none' }}>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.id}</option>)}
                      </select>
                      {/* tipo */}
                      <select value={item.tipo} onChange={e => updateItem(item.id, 'tipo', e.target.value)}
                        style={{ height: 34, padding: '0 8px', border: `1.5px solid ${tipoInfo.color}`, borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: tipoInfo.bg, color: tipoInfo.color, fontWeight: 600, outline: 'none' }}>
                        {TIPOS.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                      </select>
                      {/* resp */}
                      <select value={item.resp} onChange={e => updateItem(item.id, 'resp', e.target.value)}
                        style={{ height: 34, padding: '0 8px', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none' }}>
                        {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="btn-icon" style={{ flexShrink: 0 }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save bar */}
          <div style={{ background: 'var(--blue-dark)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ color: 'white', fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>{selectedCount} lançamento{selectedCount !== 1 ? 's' : ''}</span> selecionado{selectedCount !== 1 ? 's' : ''} · Total: <span style={{ fontWeight: 700 }}>{fmt(selectedTotal)}</span>
            </div>
            <button onClick={handleSave} disabled={saving || !selectedCount}
              style={{ height: 38, padding: '0 24px', background: 'white', color: 'var(--blue-dark)', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: selectedCount ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, opacity: selectedCount ? 1 : 0.5 }}>
              {saving ? <><Loader size={14} className="spin"/> Salvando...</> : <><CheckCircle size={14}/> Salvar selecionados</>}
            </button>
          </div>
        </div>
      )}

      {status === 'done' && items.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            Nenhum lançamento encontrado nas imagens. Tente com outro print.
          </div>
        </div>
      )}
    </div>
  );
}
