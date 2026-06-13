// 日付は 'YYYY-MM-DD'、年月は 'YYYY-MM'、時刻は 'HH:MM' の文字列で統一して扱う。
// タイムゾーンのずれを避けるため、日付計算は UTC ベースで行う。

export const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;

/** JS の getDay() (0=日) を月曜始まりの添字 (0=月 .. 6=日) に変換 */
export function mondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function toDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** ローカル時刻での今日 */
export function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

/** 0=月 .. 6=日 */
export function weekdayOf(dateStr: string): number {
  return mondayIndex(toDate(dateStr).getUTCDay());
}

export function addDays(dateStr: string, days: number): string {
  const d = toDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

export function addMonths(ym: string, months: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 7);
}

/** その日付が属する年度 (4月〜翌3月) */
export function fiscalYearOf(dateStr: string): number {
  const [y, m] = dateStr.split("-").map(Number);
  return m >= 4 ? y : y - 1;
}

/** 年度の期間 (両端含む) */
export function fiscalYearRange(fy: number): { start: string; end: string } {
  return { start: `${fy}-04-01`, end: `${fy + 1}-03-31` };
}

/** 年度に含まれる12か月の 'YYYY-MM' リスト (4月始まり) */
export function fiscalMonths(fy: number): string[] {
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    months.push(addMonths(`${fy}-04`, i));
  }
  return months;
}

/** その月の日付リスト */
export function datesInMonth(ym: string): string[] {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dates: string[] = [];
  for (let d = 1; d <= last; d++) {
    dates.push(`${ym}-${String(d).padStart(2, "0")}`);
  }
  return dates;
}

export function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = toDate(s);
  return toDateStr(d) === s;
}

// ---- 時刻まわり ----

export function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 開始〜終了の分数。終了が開始以前なら日またぎとして扱う */
export function spanMinutes(start: string, end: string): number {
  let span = timeToMin(end) - timeToMin(start);
  if (span <= 0) span += 24 * 60;
  return span;
}

/** 分数を '152:30' 形式に */
export function fmtMinutes(min: number): string {
  const sign = min < 0 ? "-" : "";
  const abs = Math.abs(min);
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
}
