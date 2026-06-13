import { Fragment } from "react";
import Link from "next/link";
import { listEmployees, yearSummary } from "@/lib/queries";
import { fiscalYearOf, fmtMinutes, todayStr } from "@/lib/fiscal";

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const params = await searchParams;
  const currentFy = fiscalYearOf(todayStr());
  const fy = /^\d{4}$/.test(params.fy ?? "") ? Number(params.fy) : currentFy;

  const employees = listEmployees(true);
  const summary = yearSummary(fy);

  // 年度内にデータのある従業員 + 在籍中の従業員を表示対象に
  const idsWithData = new Set<number>();
  for (const row of summary) for (const id of row.byEmployee.keys()) idsWithData.add(id);
  const visible = employees.filter((e) => e.active === 1 || idsWithData.has(e.id));

  const totals = new Map<number, { planMin: number; actualMin: number; planDays: number; actualDays: number }>();
  for (const row of summary) {
    for (const [id, agg] of row.byEmployee) {
      let t = totals.get(id);
      if (!t) {
        t = { planMin: 0, actualMin: 0, planDays: 0, actualDays: 0 };
        totals.set(id, t);
      }
      t.planMin += agg.planMin;
      t.actualMin += agg.actualMin;
      t.planDays += agg.planDays;
      t.actualDays += agg.actualDays;
    }
  }

  const diffCls = (diff: number) =>
    diff === 0 ? "text-slate-400" : diff > 0 ? "text-violet-700" : "text-rose-700";
  const fmtDiff = (diff: number) => (diff > 0 ? `+${fmtMinutes(diff)}` : fmtMinutes(diff));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{fy}年度サマリー</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/summary?fy=${fy - 1}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            ← {fy - 1}年度
          </Link>
          <Link href={`/summary?fy=${currentFy}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            今年度
          </Link>
          <Link href={`/summary?fy=${fy + 1}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            {fy + 1}年度 →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left font-semibold" rowSpan={2}>月</th>
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
            {summary.map((row) => {
              const [y, m] = row.ym.split("-").map(Number);
              return (
                <tr key={row.ym} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/?ym=${row.ym}`} className="text-sky-700 hover:underline">
                      {y}年{m}月
                    </Link>
                  </td>
                  {visible.map((e) => {
                    const agg = row.byEmployee.get(e.id);
                    if (!agg || (agg.planMin === 0 && agg.actualMin === 0)) {
                      return (
                        <Fragment key={e.id}>
                          <td className="px-2 py-2 text-center text-slate-300 border-l border-slate-100" colSpan={3}>—</td>
                        </Fragment>
                      );
                    }
                    const diff = agg.actualMin - agg.planMin;
                    return (
                      <Fragment key={e.id}>
                        <td className="px-2 py-2 text-right tabular-nums border-l border-slate-100">
                          {fmtMinutes(agg.planMin)}
                          <span className="text-xs text-slate-400 ml-1">({agg.planDays}日)</span>
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {agg.actualMin > 0 ? (
                            <>
                              {fmtMinutes(agg.actualMin)}
                              <span className="text-xs text-slate-400 ml-1">({agg.actualDays}日)</span>
                            </>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className={`px-2 py-2 text-right tabular-nums font-semibold ${diffCls(diff)}`}>
                          {agg.actualMin > 0 ? fmtDiff(diff) : ""}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-3 py-2">年度合計</td>
              {visible.map((e) => {
                const t = totals.get(e.id);
                if (!t) {
                  return (
                    <td key={e.id} className="px-2 py-2 text-center text-slate-300 border-l border-slate-100" colSpan={3}>—</td>
                  );
                }
                const diff = t.actualMin - t.planMin;
                return (
                  <Fragment key={e.id}>
                    <td className="px-2 py-2 text-right tabular-nums border-l border-slate-100">{fmtMinutes(t.planMin)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{t.actualMin > 0 ? fmtMinutes(t.actualMin) : "—"}</td>
                    <td className={`px-2 py-2 text-right tabular-nums ${diffCls(diff)}`}>
                      {t.actualMin > 0 ? fmtDiff(diff) : ""}
                    </td>
                  </Fragment>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        時間は「時:分」表示です。差 = 実績 − 計画 (実績が入力済みの月のみ表示)。
      </p>
    </div>
  );
}

