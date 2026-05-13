export function getGMT8Date(offsetDays: number = 0): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const targetMs = utc + (8 * 3600000) + (offsetDays * 86400000);
  return new Date(targetMs);
}

export function getGMT8Timestamp(): string {
  const gmt8 = getGMT8Date(0);
  const yyyy = gmt8.getFullYear();
  const mm = String(gmt8.getMonth() + 1).padStart(2, '0');
  const dd = String(gmt8.getDate()).padStart(2, '0');
  const hh = String(gmt8.getHours()).padStart(2, '0');
  const min = String(gmt8.getMinutes()).padStart(2, '0');
  const ss = String(gmt8.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+08:00`;
}

export function formatDateISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
