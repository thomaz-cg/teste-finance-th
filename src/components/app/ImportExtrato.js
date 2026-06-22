import React, { useState, useRef } from 'react';
import { CATEGORIES, TIPOS, fmt, getResponsaveis } from '../../helpers';
import { Loader, CheckCircle, AlertCircle, Trash2, FileText } from 'lucide-react';

const RULES = [
  { kw: ['supermercado','hipermercado','supermercados','coopel','atacad','mercado','supermercados bh'], cat: 'Alimentação', tipo: 'casa' },
  { kw: ['posto','gasolina','combustivel','cabaceira','campinho','quati','central buriti'], cat: 'Transporte', tipo: 'casa' },
  { kw: ['uber','uberrid','99app','99 *','cabify','taxi'], cat: 'Transporte', tipo: 'pessoal' },
  { kw: ['restaurante','churrasc','churrasquinho','chopp','porcao','lanchonete','pizzaria','acai','cia do acai','snacks','bacio','latte','cafe','padaria','paiol','samucas','felix','delicias','vicentin','cotta','queijo','trem do','primos disk','jucimar','roziane','bar'], cat: 'Lazer', tipo: 'pessoal' },
  { kw: ['spotify','netflix','apple.com','google','amazon prime','youtube','hbo','disney','ebn *'], cat: 'Assinaturas', tipo: 'casa' },
  { kw: ['biomax','farmacia','drogaria','hospital','mater dei','americana saude','clinica','laboratorio','drogasil','pacheco'], cat: 'Saúde', tipo: 'casa' },
  { kw: ['moncler','hugo boss','centauro','bhs','lore','renner','riachuelo','zara','c&a','beleza na web','adriana silva','darlene','belo horizonte shopp'], cat: 'Vestuário', tipo: 'pessoal' },
  { kw: ['hotel','palace','airbnb','pousada','resort','nita palace'], cat: 'Lazer', tipo: 'pessoal' },
  { kw: ['floricultura','flores','presente','recanto'], cat: 'Lazer', tipo: 'pessoal' },
  { kw: ['zurich','seguro','seguros','porto seg'], cat: 'Outros', tipo: 'casa' },
  { kw: ['anuidade'], cat: 'Outros', tipo: 'casa' },
];

function classify(desc) {
  const d = desc.toLowerCase();
  for (const rule of RULES) if (rule.kw.some(k => d.includes(k))) return { cat: rule.cat, tipo: rule.tipo };
  return { cat: 'Outros', tipo: 'casa' };
}

const MONTHS_IDX = { JAN:0,FEV:1,MAR:2,ABR:3,MAI:4,JUN:5,JUL:6,AGO:7,SET:8,OUT:9,NOV:10,DEZ:11 };
const MONTHS_NUM = { JAN:'01',FEV:'02',MAR:'03',ABR:'04',MAI:'05',JUN:'06',JUL:'07',AGO:'08',SET:'09',OUT:'10',NOV:'11',DEZ:'12' };

function parseTransactions(text, cardOwner) {
  const items = [];
  const lines = text.replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);

  // Detecta vencimento da fatura: "VENCIMENTO 11 JUN 2026"
  let dueDay = '11', dueMonthIdx = null, dueYear = new Date().getFullYear();
  const vm = text.match(/VENCIMENTO\s+(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(\d{4})/i);
  if (vm) {
    dueDay = vm[1];
    dueMonthIdx = MONTHS_IDX[vm[2].toUpperCase()];
    dueYear = parseInt(vm[3]);
  }
  const dueDateStr = dueMonthIdx !== null
    ? `${dueYear}-${String(dueMonthIdx + 1).padStart(2, '0')}-${dueDay}`
    : null;

  const lineRe = /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.+?)\s+R?\$?\s*([\d.,]+)\s*$/i;

  for (const line of lines) {
    const m = line.match(lineRe);
    if (!m) continue;
    const dia = m[1];
    const mesAbbr = m[2].toUpperCase();
    let resto = m[3].trim();
    let valStr = m[4];
    const low = resto.toLowerCase();

    if (low.includes('pagamento') || low.includes('saldo') || low.includes('desc anuidade') ||
        low.includes('estorno') || low.includes('credito') || low.includes('anterior')) continue;
    if (line.includes('-R$') || line.includes('- R$')) continue;

    let val = 0;
    if (/,\d{3}\.\d{2}$/.test(valStr)) val = parseFloat(valStr.replace(/,/g, ''));
    else if (/\.\d{3},\d{2}$/.test(valStr)) val = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
    else val = parseFloat(valStr.replace(',', '.'));
    if (!val || val <= 0) continue;

    // É parcela? tem padrão XX/XX
    const parcMatch = resto.match(/(\d{2})\/(\d{2})/);
    const isParcela = !!parcMatch;

    let desc = resto
      .replace(/\s+\d{2}\/\d{2}\s*/g, ' ')
      .replace(/\s+(BELO HORIZONT\w*|SAO PAULO|POMPEU|PARAOPEBA|CURITIBA|CAJAMAR|OSASCO|ESMERALDAS|BH)\s*$/i, '')
      .trim();

    // Define data:
    // - parcela -> data de vencimento (mês do pagamento)
    // - à vista -> data real (ajustando ano se o mês for posterior ao vencimento = ano anterior)
    let finalDate;
    if (isParcela && dueDateStr) {
      finalDate = dueDateStr;
    } else {
      let y = dueYear;
      if (dueMonthIdx !== null && MONTHS_IDX[mesAbbr] > dueMonthIdx) y = dueYear - 1;
      finalDate = `${y}-${MONTHS_NUM[mesAbbr]}-${dia}`;
    }

    const obs = isParcela
      ? `Parcela ${parcMatch[0]} · Importado`
      : 'Importado do PDF';

    const { cat, tipo } = classify(desc);
    const resp = tipo === 'pessoal' ? cardOwner : 'Casal';
    items.push({ id: Date.now() + Math.random(), desc: desc || 'Lançamento', val, date: finalDate, cat, tipo, resp, obs, isParcela, selected: true });
  }
  return items;
}

export default function ImportExtrato({ profile, onSave }) {
  const [items, setItems]       = useState([]);
  const [status, setStatus]     = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving]     = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [fileName, setFileName] = useState('');
  const [cardOwner, setCardOwner] = useState(profile?.ownerName || 'Casal');
  const inputRef = useRef();
  const responsaveis = getResponsaveis(profile);

  const loadPdfJs = () => new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    s.onerror = reject;
    document.body.appendChild(s);
  });

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Envie um arquivo PDF.'); return; }
    setFileName(file.name);
    setStatus('loading'); setErrorMsg(''); setItems([]); setSavedCount(0);
    try {
      const pdfjsLib = await loadPdfJs();
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let fullText = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const rows = {};
        content.items.forEach(it => {
          const y = Math.round(it.transform[5]);
          if (!rows[y]) rows[y] = [];
          rows[y].push({ x: it.transform[4], s: it.str });
        });
        Object.keys(rows).map(Number).sort((a,b)=>b-a).forEach(y => {
          const line = rows[y].sort((a,b)=>a.x-b.x).map(r=>r.s).join(' ').replace(/\s+/g,' ').trim();
          if (line) fullText += line + '\n';
        });
      }
      const parsed = parseTransactions(fullText, cardOwner);
      if (!parsed.length) { setErrorMsg('Não encontrei lançamentos no PDF. O formato pode ser diferente do esperado.'); setStatus('error'); return; }
      setItems(parsed); setStatus('done');
    } catch (e) {
      console.error(e);
      setErrorMsg('Erro ao ler o PDF: ' + (e.message || 'desconhecido'));
      setStatus('error');
    }
  };

  const updateItem = (id, field, value) => setItems(prev => prev.map(it => it.id===id ? {...it,[field]:value} : it));
  const removeItem = (id) => setItems(prev => prev.filter(it => it.id!==id));
  const toggleItem = (id) => setItems(prev => prev.map(it => it.id===id ? {...it,selected:!it.selected} : it));
  const toggleAll = () => { const all = items.every(it=>it.selected); setItems(prev=>prev.map(it=>({...it,selected:!all}))); };

  const handleSave = async () => {
    const toSave = items.filter(it => it.selected && it.val > 0);
    if (!toSave.length) { alert('Nenhum item selecionado.'); return; }
    setSaving(true);
    for (const item of toSave) {
      await onSave({ desc: item.desc, val: item.val, date: item.date, cat: item.cat, tipo: item.tipo, resp: item.resp, obs: item.obs });
    }
    setSavedCount(toSave.length); setItems([]); setFileName(''); setStatus('idle'); setSaving(false);
  };

  const selectedCount = items.filter(it => it.selected).length;
  const selectedTotal = items.filter(it => it.selected).reduce((s,it)=>s+it.val,0);
  const parcelaCount  = items.filter(it => it.isParcela).length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Importar Fatura (PDF)</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-mid)', marginTop: 4 }}>
          Suba o PDF da fatura — lido e classificado automaticamente, sem custo
        </p>
      </div>

      {savedCount > 0 && (
        <div style={{ background:'var(--green-light)', color:'var(--green-dark)', borderRadius:'var(--radius-md)', padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:10, fontWeight:600 }}>
          <CheckCircle size={18}/> {savedCount} lançamento{savedCount!==1?'s':''} importado{savedCount!==1?'s':''} com sucesso!
        </div>
      )}

      <div className="form-card">
        <div className="form-section-title">1. De quem é este cartão?</div>
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          {(profile ? [profile.ownerName, profile.spouseName] : ['Eu','Cônjuge']).map(name => (
            <button key={name} onClick={()=>setCardOwner(name)}
              style={{ flex:1, height:48, border:`2px solid ${cardOwner===name?'var(--blue-mid)':'rgba(0,0,0,0.10)'}`,
                borderRadius:'var(--radius-sm)', background:cardOwner===name?'var(--blue-light)':'transparent',
                color:cardOwner===name?'var(--blue-dark)':'var(--gray-mid)', fontWeight:700, fontSize:15,
                cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              💳 {name}
            </button>
          ))}
        </div>
        <div style={{ fontSize:12.5, color:'var(--gray-mid)', lineHeight:1.5, padding:'10px 14px', background:'var(--gray-light)', borderRadius:8 }}>
          ℹ️ Despesas marcadas como <strong>Pessoal</strong> serão atribuídas a <strong>{cardOwner}</strong>. Despesas de <strong>Casa</strong> ficam como gasto compartilhado do casal.
        </div>
      </div>

      <div className="form-card">
        <div className="form-section-title">2. Suba o PDF da fatura</div>
        <div onClick={()=>inputRef.current?.click()}
          onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()}
          style={{ border:'2px dashed rgba(24,95,165,0.3)', borderRadius:'var(--radius-md)', padding:'36px 24px', textAlign:'center', cursor:'pointer', background:'var(--blue-light)', marginBottom:16 }}>
          <FileText size={32} color="var(--blue-mid)" style={{ marginBottom:10 }} />
          <div style={{ fontSize:15, fontWeight:600, color:'var(--blue-dark)', marginBottom:4 }}>
            {fileName || 'Clique ou arraste o PDF da fatura aqui'}
          </div>
          <div style={{ fontSize:13, color:'var(--blue-mid)' }}>100% no navegador — nada é enviado para servidores</div>
          <input ref={inputRef} type="file" accept="application/pdf" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])} />
        </div>

        {status==='loading' && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:16, color:'var(--blue-mid)', fontWeight:600 }}>
            <Loader size={18} className="spin"/> Lendo o PDF...
          </div>
        )}
        {status==='error' && (
          <div style={{ background:'var(--red-light)', color:'var(--red-dark)', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
            <AlertCircle size={16}/> {errorMsg}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="form-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div className="form-section-title" style={{ marginBottom:0 }}>3. Revise os {items.length} lançamentos</div>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--gray-mid)', cursor:'pointer' }}>
              <input type="checkbox" checked={items.every(it=>it.selected)} onChange={toggleAll}/> Selecionar todos
            </label>
          </div>

          {parcelaCount > 0 && (
            <div style={{ background:'var(--amber-light)', color:'var(--amber-dark)', borderRadius:8, padding:'10px 14px', fontSize:12.5, marginBottom:14, lineHeight:1.5 }}>
              ℹ️ {parcelaCount} parcela{parcelaCount!==1?'s':''} de compras antigas {parcelaCount!==1?'foram movidas':'foi movida'} para a data de vencimento da fatura. Compras à vista mantêm a data original.
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16, maxHeight:520, overflowY:'auto' }}>
            {items.map(item => {
              const tipoInfo = TIPOS.find(t=>t.id===item.tipo) || TIPOS[0];
              return (
                <div key={item.id} style={{ border:`1.5px solid ${item.selected?'rgba(24,95,165,0.25)':'rgba(0,0,0,0.08)'}`, borderRadius:'var(--radius-sm)', padding:'10px 12px', background:item.selected?'var(--blue-light)':'var(--gray-light)', opacity:item.selected?1:0.55 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="checkbox" checked={item.selected} onChange={()=>toggleItem(item.id)} style={{ flexShrink:0 }}/>
                    <div className="import-row-grid" style={{ flex:1, display:'grid', gridTemplateColumns:'2fr 1fr 1.1fr 1.2fr 1fr 1fr', gap:6, alignItems:'center', minWidth:0 }}>
                      <div>
                        <input value={item.desc} onChange={e=>updateItem(item.id,'desc',e.target.value)}
                          style={{ width:'100%', height:32, padding:'0 8px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:6, fontSize:12, fontFamily:'inherit', background:'white', outline:'none' }}/>
                        {item.isParcela && <span style={{ fontSize:9, fontWeight:700, color:'var(--amber-dark)' }}>↪ parcela movida p/ vencimento</span>}
                      </div>
                      <input type="number" value={item.val} onChange={e=>updateItem(item.id,'val',parseFloat(e.target.value)||0)}
                        style={{ height:32, padding:'0 8px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:6, fontSize:12, fontFamily:'inherit', background:'white', outline:'none' }}/>
                      <input type="date" value={item.date} onChange={e=>updateItem(item.id,'date',e.target.value)}
                        style={{ height:32, padding:'0 6px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:6, fontSize:11, fontFamily:'inherit', background:'white', outline:'none' }}/>
                      <select value={item.cat} onChange={e=>updateItem(item.id,'cat',e.target.value)}
                        style={{ height:32, padding:'0 6px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:6, fontSize:11, fontFamily:'inherit', background:'white', outline:'none' }}>
                        {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.id}</option>)}
                      </select>
                      <select value={item.tipo} onChange={e=>updateItem(item.id,'tipo',e.target.value)}
                        style={{ height:32, padding:'0 6px', border:`1.5px solid ${tipoInfo.color}`, borderRadius:6, fontSize:11, fontFamily:'inherit', background:tipoInfo.bg, color:tipoInfo.color, fontWeight:600, outline:'none' }}>
                        {TIPOS.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                      </select>
                      <select value={item.resp} onChange={e=>updateItem(item.id,'resp',e.target.value)}
                        style={{ height:32, padding:'0 6px', border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:6, fontSize:11, fontFamily:'inherit', background:'white', outline:'none' }}>
                        {responsaveis.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <button onClick={()=>removeItem(item.id)} className="btn-icon" style={{ flexShrink:0 }}><Trash2 size={14}/></button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background:'var(--blue-dark)', borderRadius:'var(--radius-sm)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ color:'white', fontSize:14 }}>
              <span style={{ fontWeight:700 }}>{selectedCount}</span> selecionado{selectedCount!==1?'s':''} · Total: <span style={{ fontWeight:700 }}>{fmt(selectedTotal)}</span>
            </div>
            <button onClick={handleSave} disabled={saving || !selectedCount}
              style={{ height:38, padding:'0 24px', background:'white', color:'var(--blue-dark)', border:'none', borderRadius:6, fontSize:14, fontWeight:700, cursor:selectedCount?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:8, opacity:selectedCount?1:0.5 }}>
              {saving ? <><Loader size={14} className="spin"/> Salvando...</> : <><CheckCircle size={14}/> Salvar selecionados</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
