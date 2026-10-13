/** Tarihleri sabit ve Türkçe biçimde yazar (RSS ve sayfalar aynı formatı kullanır). */
const AYLAR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

export function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2026-10-13" gibi makine okunur tarih (time[datetime] için). */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
