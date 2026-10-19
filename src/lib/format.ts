// Formato de moneda y fechas para Bolivia: Bs.- 1.234,00

export function bob(value: number): string {
  const abs = Math.abs(value).toFixed(2);
  const [int, dec] = abs.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Bs.- ${value < 0 ? '-' : ''}${grouped},${dec}`;
}

export function bobShort(value: number): string {
  return bob(value).replace('Bs.- ', '');
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function longDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${shortDate(iso)} ${hh}:${mi}`;
}

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return 'hoy';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'ayer';
  return shortDate(iso);
}

export function optionLabel(options: Record<string, string>): string {
  const entries = Object.entries(options || {});
  if (!entries.length) return '';
  return entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
