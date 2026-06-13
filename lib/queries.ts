import { getDb } from "./db";
import type { Employee, Pattern, Shift } from "./types";
import { datesInMonth, fiscalMonths, fiscalYearRange, spanMinutes, weekdayOf } from "./fiscal";

// ---- 従業員 ----

export function listEmployees(includeInactive = false): Employee[] {
  const db = getDb();
  const where = includeInactive ? "" : "WHERE active = 1";
  return db
    .prepare(`SELECT * FROM employees ${where} ORDER BY sort_order, id`)
    .all() as Employee[];
}

export function createEmployee(name: string, color: string) {
  const db = getDb();
  const max = db.prepare(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM employees`).get() as {
    m: number;
  };
  db.prepare(`INSERT INTO employees (name, color, sort_order) VALUES (?, ?, ?)`).run(
    name,
    color,
    max.m + 1
  );
}

export function updateEmployee(id: number, name: string, color: string, active: boolean) {
  getDb()
    .prepare(`UPDATE employees SET name = ?, color = ?, active = ? WHERE id = ?`)
    .run(name, color, active ? 1 : 0, id);
}

// ---- 基本パターン ----

export function listPatterns(): Pattern[] {
  return getDb()
    .prepare(`SELECT * FROM patterns ORDER BY weekday, start_time, id`)
    .all() as Pattern[];
}

export function addPattern(employeeId: number, weekday: number, start: string, end: string) {
  getDb()
    .prepare(`INSERT INTO patterns (employee_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)`)
    .run(employeeId, weekday, start, end);
}

export function deletePattern(id: number) {
  getDb().prepare(`DELETE FROM patterns WHERE id = ?`).run(id);
}

// ---- シフト ----

export function getShiftsForRange(start: string, end: string): Shift[] {
  return getDb()
    .prepare(`SELECT * FROM shifts WHERE date BETWEEN ? AND ? ORDER BY date`)
    .all(start, end) as Shift[];
}

export function getShiftsForDate(date: string): Shift[] {
  return getDb().prepare(`SELECT * FROM shifts WHERE date = ?`).all(date) as Shift[];
}

/** 計画・実績・メモをまとめて保存。すべて空なら行を削除する */
export function saveShift(
  employeeId: number,
  date: string,
  planStart: string | null,
  planEnd: string | null,
  actualStart: string | null,
  actualEnd: string | null,
  note: string | null
) {
  const db = getDb();
  if (!planStart && !planEnd && !actualStart && !actualEnd && !note) {
    db.prepare(`DELETE FROM shifts WHERE employee_id = ? AND date = ?`).run(employeeId, date);
    return;
  }
  db.prepare(
    `INSERT INTO shifts (employee_id, date, plan_start, plan_end, actual_start, actual_end, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (employee_id, date) DO UPDATE SET
       plan_start = excluded.plan_start,
       plan_end = excluded.plan_end,
       actual_start = excluded.actual_start,
       actual_end = excluded.actual_end,
       note = excluded.note`
  ).run(employeeId, date, planStart, planEnd, actualStart, actualEnd, note);
}

/** 計画の時刻をそのまま実績にコピー */
export function copyPlanToActual(employeeId: number, date: string) {
  getDb()
    .prepare(
      `UPDATE shifts SET actual_start = plan_start, actual_end = plan_end
       WHERE employee_id = ? AND date = ? AND plan_start IS NOT NULL`
    )
    .run(employeeId, date);
}

/**
 * 基本パターンから年度分の計画を生成する。
 * 既に行がある (employee_id, date) はスキップするので、手で直した計画や実績は消えない。
 * 戻り値は新規に作成した件数。
 */
export function generateYearPlan(fy: number): number {
  const db = getDb();
  const { start, end } = fiscalYearRange(fy);
  const activeIds = new Set(listEmployees().map((e) => e.id));
  const patterns = listPatterns().filter((p) => activeIds.has(p.employee_id));

  const byWeekday = new Map<number, Pattern[]>();
  for (const p of patterns) {
    const list = byWeekday.get(p.weekday) ?? [];
    list.push(p);
    byWeekday.set(p.weekday, list);
  }

  const insert = db.prepare(
    `INSERT INTO shifts (employee_id, date, plan_start, plan_end)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (employee_id, date) DO NOTHING`
  );

  let created = 0;
  const run = db.transaction(() => {
    for (let date = start; date <= end; ) {
      for (const p of byWeekday.get(weekdayOf(date)) ?? []) {
        const result = insert.run(p.employee_id, date, p.start_time, p.end_time);
        created += result.changes;
      }
      // addDays を import せず文字列で回すより素直に
      const d = new Date(date + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + 1);
      date = d.toISOString().slice(0, 10);
    }
  });
  run();
  return created;
}

// ---- 年度サマリー ----

export type MonthlySummary = {
  ym: string;
  /** employee_id ごとの集計 */
  byEmployee: Map<number, { planMin: number; actualMin: number; planDays: number; actualDays: number }>;
};

export function yearSummary(fy: number): MonthlySummary[] {
  const { start, end } = fiscalYearRange(fy);
  const shifts = getShiftsForRange(start, end);

  const result: MonthlySummary[] = fiscalMonths(fy).map((ym) => ({
    ym,
    byEmployee: new Map(),
  }));
  const byYm = new Map(result.map((r) => [r.ym, r]));

  for (const s of shifts) {
    const row = byYm.get(s.date.slice(0, 7));
    if (!row) continue;
    let agg = row.byEmployee.get(s.employee_id);
    if (!agg) {
      agg = { planMin: 0, actualMin: 0, planDays: 0, actualDays: 0 };
      row.byEmployee.set(s.employee_id, agg);
    }
    if (s.plan_start && s.plan_end) {
      agg.planMin += spanMinutes(s.plan_start, s.plan_end);
      agg.planDays += 1;
    }
    if (s.actual_start && s.actual_end) {
      agg.actualMin += spanMinutes(s.actual_start, s.actual_end);
      agg.actualDays += 1;
    }
  }
  return result;
}

/** 月カレンダー用: 日付 → シフト一覧 */
export function shiftsByDateForMonth(ym: string): Map<string, Shift[]> {
  const dates = datesInMonth(ym);
  const shifts = getShiftsForRange(dates[0], dates[dates.length - 1]);
  const map = new Map<string, Shift[]>();
  for (const s of shifts) {
    const list = map.get(s.date) ?? [];
    list.push(s);
    map.set(s.date, list);
  }
  return map;
}
