export type Employee = {
  id: number;
  name: string;
  color: string;
  active: number; // SQLite なので 0/1
  sort_order: number;
};

export type Pattern = {
  id: number;
  employee_id: number;
  weekday: number; // 0=月 .. 6=日
  start_time: string; // 'HH:MM'
  end_time: string;
};

export type Shift = {
  id: number;
  employee_id: number;
  date: string; // 'YYYY-MM-DD'
  plan_start: string | null;
  plan_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  note: string | null;
};

/**
 * シフト1件の状態
 * - match:     計画どおり勤務 (計画あり・実績あり・一致)
 * - changed:   計画と実績が異なる
 * - unplanned: 計画外勤務 (計画なし・実績あり)
 * - missing:   実績未入力 (計画あり・実績なし・過去日)
 * - pending:   これから (計画あり・実績なし・今日以降)
 */
export type ShiftStatus = "match" | "changed" | "unplanned" | "missing" | "pending";

export function shiftStatus(shift: Shift, today: string): ShiftStatus {
  const hasPlan = !!(shift.plan_start && shift.plan_end);
  const hasActual = !!(shift.actual_start && shift.actual_end);
  if (hasPlan && hasActual) {
    return shift.plan_start === shift.actual_start && shift.plan_end === shift.actual_end
      ? "match"
      : "changed";
  }
  if (!hasPlan && hasActual) return "unplanned";
  return shift.date < today ? "missing" : "pending";
}

export const STATUS_LABEL: Record<ShiftStatus, string> = {
  match: "計画どおり",
  changed: "変更あり",
  unplanned: "計画外勤務",
  missing: "実績未入力",
  pending: "予定",
};
