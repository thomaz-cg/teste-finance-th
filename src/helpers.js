export const CATEGORIES = [
  { id: 'Moradia',      icon: '🏠', color: '#185FA5', bg: '#E6F1FB' },
  { id: 'Alimentação',  icon: '🛒', color: '#3B6D11', bg: '#EAF3DE' },
  { id: 'Transporte',   icon: '🚗', color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'Saúde',        icon: '❤️', color: '#A32D2D', bg: '#FCEBEB' },
  { id: 'Educação',     icon: '📚', color: '#533489', bg: '#EEEDFE' },
  { id: 'Lazer',        icon: '🎉', color: '#854F0B', bg: '#FAEEDA' },
  { id: 'Vestuário',    icon: '👗', color: '#993556', bg: '#FBEAF0' },
  { id: 'Pets',         icon: '🐾', color: '#3B6D11', bg: '#EAF3DE' },
  { id: 'Assinaturas',  icon: '📱', color: '#0C447C', bg: '#E6F1FB' },
  { id: 'Outros',       icon: '📦', color: '#5F5E5A', bg: '#F1EFE8' },
];

export const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const TIPOS = [
  { id: 'casa',     label: 'Casa',     icon: '🏠', color: '#185FA5', bg: '#E6F1FB' },
  { id: 'pessoal',  label: 'Pessoal',  icon: '👤', color: '#854F0B', bg: '#FAEEDA' },
];

export function getResponsaveis(profile) {
  if (!profile) return ['Casal', 'Eu', 'Cônjuge'];
  return ['Casal', profile.ownerName, profile.spouseName];
}

export function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function currentYM() {
  return new Date().toISOString().slice(0, 7);
}

export function monthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return names[parseInt(m) - 1] + '/' + y.slice(2);
}

export function getMonths(expenses) {
  const set = new Set(expenses.map(e => e.date?.slice(0, 7)).filter(Boolean));
  return Array.from(set).sort().reverse();
}

export function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

export function expensesByMonth(expenses, ym) {
  return expenses.filter(e => e.date?.slice(0, 7) === ym);
}

export function totalByCategory(expenses) {
  const map = {};
  expenses.forEach(e => { map[e.cat] = (map[e.cat] || 0) + e.val; });
  return map;
}

export function fixedAsExpenses(fixedList) {
  const ym = currentYM();
  return fixedList
    .filter(f => f.active)
    .map(f => ({
      id: 'fixed_' + f.id,
      desc: f.desc,
      val: f.val,
      date: ym + '-' + String(f.dueDay).padStart(2, '0'),
      cat: f.cat,
      resp: f.resp,
      obs: 'Gasto fixo',
      isFixed: true,
    }));
}
