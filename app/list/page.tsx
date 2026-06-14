import { Fragment } from "react";
import Link from "next/link";
import { listEmployees, shiftsByDateForFiscalYear } from "@/lib/queries";
import {
  WEEKDAYS,
  datesInFiscalYear,
  fiscalYearOf,
  fmtMinutes,
  spanMinutes,
  todayStr,
  weekdayOf,
} from "@/lib/fiscal";
import { shiftStatus, type Shift, type ShiftStatus } from "@/lib/types";

// 実績セルの状態別の色付け (主役は予定なので控えめに)
const ACTUAL_CLS: Record<ShiftStatus, string> = {
  match: "text-emerald-700",
  changed: "text-amber-700 font-semibold",
  unplanned: "text-violet-700 font-semibold",
  missing: "text-rose-600",
  pending: "text-slate-300",
};

function timeRange(start: string | null, end: string | null): string | null {
  return start && end ? `${start}-${end}` : null;
}

export default async function ListPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const params = await searchParams;
  const today = todayStr();
  const currentFy = fiscalYearOf(today);
  const fy = /^\d{4}$/.test(params.fy ?? "") ? Number(params.fy) : currentFy;

  const employees = listEmployees(true);
  const shiftMap = shiftsByDateForFiscalYear(fy);

  // 年度内にデータのある従業員 + 在籍中の従業員を表示対象に (summary と同じ判定)
  const idsWithData = new Set<number>();
  for (const list of shiftMap.values()) for (const s of list) idsWithData.add(s.employee_id);
  const visible = employees.filter((e) => e.active === 1 || idsWithData.has(e.id));

  const sortKey = (e: { sort_order: number; id: number }) => e.sort_order * 10000 + e.id;
  visible.sort((a, b) => sortKey(a) - sortKey(b));

  const diffCls = (diff: number) =>
    diff === 0 ? "text-slate-400" : diff > 0 ? "text-violet-700" : "text-rose-700";
  const fmtDiff = (diff: number) => (diff > 0 ? `+${fmtMinutes(diff)}` : fmtMinutes(diff));

  const dates = datesInFiscalYear(fy);
  const colCount = 2 + visible.length * 3;
  let prevYm = "";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{fy}年度 年間予定・実績</h1>
        <div className="flex items-center gap-2 text-sm">
          <a href="#today" className="px-3 py-1.5 rounded-md border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100">
            今日へ
          </a>
          <Link href={`/list?fy=${fy - 1}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            ← {fy - 1}年度
          </Link>
          <Link href={`/list?fy=${currentFy}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            今年度
          </Link>
          <Link href={`/list?fy=${fy + 1}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            {fy + 1}年度 →
          </Link>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm">
          表示できる従業員がいません。
          <Link href="/employees" className="text-sky-700 underline ml-1">従業員ページ</Link>
          で登録してください。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left font-semibold" rowSpan={2}>日付</th>
                <th className="px-2 py-2 text-center font-semibold" rowSpan={2}>曜</th>
                {visible.map((e) => (
                  <th key={e.id} className="px-3 py-1.5 text-center font-semibold border-l border-slate-200" colSpan={3}>
                    <span className="inline-block h-2.5 w-2.5 rounded-full mr-1.5 align-middle" style={{ background: e.color }} />
                    {e.name}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                {visible.map((e) => (
                  <Fragment key={e.id}>
                    <th className="px-2 py-1 font-medium border-l border-slate-200">計画</th>
                    <th className="px-2 py-1 font-medium">実績</th>
                    <th className="px-2 py-1 font-medium">差</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => {
                const wd = weekdayOf(date);
                const ym = date.slice(0, 7);
                const isToday = date === today;
                const shifts = shiftMap.get(date) ?? [];
                const byEmp = new Map<number, Shift>(shifts.map((s) => [s.employee_id, s]));

                const monthHeader =
                  ym !== prevYm
                    ? (() => {
                        prevYm = ym;
                        const [y, m] = ym.split("-").map(Number);
                        return (
                          <tr key={`m-${ym}`} className="bg-slate-100 border-b border-slate-200">
                            <td colSpan={colCount} className="px-3 py-1.5 text-xs font-bold text-slate-600">
                              {y}年{m}月
                            </td>
                          </tr>
                        );
                      })()
                    : null;

                const rowTint = isToday
                  ? "bg-amber-50"
                  : wd === 6
                    ? "bg-rose-50/40"
                    : wd === 5
                      ? "bg-blue-50/40"
                      : "bg-white";

                return (
                  <Fragment key={date}>
                    {monthHeader}
                    <tr
                      id={isToday ? "today" : undefined}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${rowTint} scroll-mt-16`}
                    >
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <Link href={`/day/${date}`} className="text-sky-700 hover:underline tabular-nums">
                          {Number(date.slice(5, 7))}/{Number(date.slice(8))}
                        </Link>
                        {isToday && <span className="ml-1 text-xs text-amber-600">今日</span>}
                      </td>
                      <td
                        className={`px-2 py-1.5 text-center font-medium ${
                          wd === 5 ? "text-blue-600" : wd === 6 ? "text-rose-600" : "text-slate-600"
                        }`}
                      >
                        {WEEKDAYS[wd]}
                      </td>
                      {visible.map((e) => {
                        const s = byEmp.get(e.id);
                        const plan = s ? timeRange(s.plan_start, s.plan_end) : null;
                        const actual = s ? timeRange(s.actual_start, s.actual_end) : null;
                        const status = s ? shiftStatus(s, today) : null;
                        const diff =
                          s && s.plan_start && s.plan_end && s.actual_start && s.actual_end
                            ? spanMinutes(s.actual_start, s.actual_end) - spanMinutes(s.plan_start, s.plan_end)
                            : null;
                        return (
                          <Fragment key={e.id}>
                            <td className="px-2 py-1.5 text-center tabular-nums border-l border-slate-100">
                              {plan ?? <span className="text-slate-300">休</span>}
                            </td>
                            <td className={`px-2 py-1.5 text-center tabular-nums ${status ? ACTUAL_CLS[status] : ""}`}>
                              {actual ?? (
                                <span className={status === "missing" ? "text-rose-500" : "text-slate-300"}>
                                  {status === "missing" ? "未" : "—"}
                                </span>
                              )}
                            </td>
                            <td className={`px-2 py-1.5 text-right tabular-nums font-semibold ${diff !== null ? diffCls(diff) : ""}`}>
                              {diff !== null ? fmtDiff(diff) : ""}
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        1日1行で年度内の全日を表示します。差 = 実績 − 計画。「休」は計画なし、「未」は実績未入力(過去日)。日付クリックで編集できます。
      </p>
    </div>
  );
}
