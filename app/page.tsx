import Link from "next/link";
import { listEmployees, shiftsByDateForMonth } from "@/lib/queries";
import {
  WEEKDAYS,
  addMonths,
  datesInMonth,
  fiscalYearOf,
  todayStr,
  weekdayOf,
} from "@/lib/fiscal";
import { shiftStatus, type Employee, type Shift, type ShiftStatus } from "@/lib/types";

const STATUS_BADGE: Record<ShiftStatus, { label: string; cls: string } | null> = {
  match: { label: "✓", cls: "bg-emerald-100 text-emerald-700" },
  changed: { label: "変", cls: "bg-amber-100 text-amber-700" },
  unplanned: { label: "外", cls: "bg-violet-100 text-violet-700" },
  missing: { label: "未", cls: "bg-rose-100 text-rose-700" },
  pending: null,
};

function ShiftChip({ shift, employee, today }: { shift: Shift; employee?: Employee; today: string }) {
  const status = shiftStatus(shift, today);
  const badge = STATUS_BADGE[status];
  const planText =
    shift.plan_start && shift.plan_end ? `${shift.plan_start}-${shift.plan_end}` : "計画なし";
  const actualText =
    shift.actual_start && shift.actual_end ? `${shift.actual_start}-${shift.actual_end}` : null;
  return (
    <div
      className="rounded border-l-4 bg-white px-1 py-0.5 text-[10px] leading-tight shadow-sm"
      style={{ borderLeftColor: employee?.color ?? "#94a3b8" }}
    >
      <div className="flex items-center gap-1">
        <span className="font-semibold truncate">{employee?.name ?? "?"}</span>
        {badge && (
          <span className={`rounded px-0.5 font-bold ${badge.cls}`}>{badge.label}</span>
        )}
      </div>
      <div className="text-slate-500">{planText}</div>
      {status === "changed" && <div className="font-semibold text-amber-700">{actualText}</div>}
      {status === "unplanned" && <div className="font-semibold text-violet-700">{actualText}</div>}
    </div>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const params = await searchParams;
  const today = todayStr();
  const ym = /^\d{4}-\d{2}$/.test(params.ym ?? "") ? params.ym! : today.slice(0, 7);
  const [year, month] = ym.split("-").map(Number);
  const fy = fiscalYearOf(`${ym}-01`);

  const employees = listEmployees(true);
  const empById = new Map(employees.map((e) => [e.id, e]));
  const sortKey = (s: Shift) => {
    const e = empById.get(s.employee_id);
    return e ? e.sort_order * 10000 + e.id : 999999;
  };
  const shiftMap = shiftsByDateForMonth(ym);

  // 月曜始まりの週グリッドを組み立てる
  const dates = datesInMonth(ym);
  const cells: (string | null)[] = [
    ...Array<null>(weekdayOf(dates[0])).fill(null),
    ...dates,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          {year}年{month}月のシフト
          <span className="ml-3 text-sm font-normal text-slate-500">{fy}年度</span>
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/?ym=${addMonths(ym, -1)}`}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm hover:bg-slate-50"
          >
            ← 前月
          </Link>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm hover:bg-slate-50"
          >
            今月
          </Link>
          <Link
            href={`/?ym=${addMonths(ym, 1)}`}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm hover:bg-slate-50"
          >
            翌月 →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-slate-200 bg-slate-200">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`bg-slate-100 py-1.5 text-center text-xs font-semibold ${
              i === 5 ? "text-blue-600" : i === 6 ? "text-rose-600" : "text-slate-600"
            }`}
          >
            {w}
          </div>
        ))}
        {weeks.flat().map((date, i) =>
          date === null ? (
            <div key={`empty-${i}`} className="bg-slate-50 min-h-24" />
          ) : (
            <Link
              key={date}
              href={`/day/${date}`}
              className={`block min-h-24 p-1 hover:bg-sky-50 ${
                date === today ? "bg-amber-50" : "bg-white"
              }`}
            >
              <div
                className={`text-xs font-semibold mb-1 ${
                  i % 7 === 5 ? "text-blue-600" : i % 7 === 6 ? "text-rose-600" : "text-slate-700"
                }`}
              >
                {Number(date.slice(8))}
                {date === today && <span className="ml-1 text-amber-600">今日</span>}
              </div>
              <div className="space-y-0.5">
                {(shiftMap.get(date) ?? [])
                  .sort((a, b) => sortKey(a) - sortKey(b))
                  .map((s) => (
                    <ShiftChip key={s.id} shift={s} employee={empById.get(s.employee_id)} today={today} />
                  ))}
              </div>
            </Link>
          )
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        <span><span className="rounded px-1 font-bold bg-emerald-100 text-emerald-700">✓</span> 計画どおり</span>
        <span><span className="rounded px-1 font-bold bg-amber-100 text-amber-700">変</span> 計画と実績が異なる</span>
        <span><span className="rounded px-1 font-bold bg-rose-100 text-rose-700">未</span> 実績未入力(過去日)</span>
        <span><span className="rounded px-1 font-bold bg-violet-100 text-violet-700">外</span> 計画外勤務</span>
        <span>日付をクリックすると編集できます</span>
      </div>

      {employees.length === 0 && (
        <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm">
          まだ従業員が登録されていません。
          <Link href="/employees" className="text-sky-700 underline ml-1">
            従業員ページ
          </Link>
          で登録 →
          <Link href="/patterns" className="text-sky-700 underline ml-1">
            基本パターン
          </Link>
          を設定 → 年度計画を生成、の順に進めてください。
        </div>
      )}
    </div>
  );
}
