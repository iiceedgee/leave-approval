export const BUDDHIST_YEAR_OFFSET = 543;

export function toBuddhistYear(year: number): number {
  return year + BUDDHIST_YEAR_OFFSET;
}

export function currentBuddhistYear(): number {
  return toBuddhistYear(new Date().getFullYear());
}

export function recentYears(count: number): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => current - i);
}

export function formatThaiDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const options: Intl.DateTimeFormatOptions = { ...(opts ?? { day: 'numeric', month: 'short' }), timeZone: 'UTC' };
  return new Date(dateStr).toLocaleDateString('th-TH', options);
}

export function formatThaiDateRange(start: string, end: string): string {
  if (start === end || isSameDay(start, end)) {
    return formatThaiDate(start);
  }
  return `${formatThaiDate(start)} - ${formatThaiDate(end)}`;
}

export function isSameDay(a: string, b: string): boolean {
  return new Date(a).getTime() === new Date(b).getTime();
}
