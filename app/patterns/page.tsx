import { addPatternAction, deletePatternAction, generateYearPlanAction } from "@/app/actions";
import { listEmployees, listPatterns } from "@/lib/queries";
import { WEEKDAYS, fiscalYearOf, todayStr } from "@/lib/fiscal";
import Link from "next/link";

// DB の内容を常に最新表示するため、ビルド時の静的化を無効にする
export const dynamic = "force-dynamic";

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; fy?: string }>;
}) {
  const params = await searchParams;
  const employees = listEmployees();
  const allEmployees = listEmployees(true);
  const empById = new Map(allEmployees.map((e) => [e.id, e]));
  const patterns = listPatterns();
  const currentFy = fiscalYearOf(todayStr());

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-1">基本パターン</h1>
      <p className="text-sm text-slate-500 mb-4">
        曜日ごとの「いつもの勤務」を登録しておくと、年度分の計画をまとめて作れます。
        同じ曜日に複数人を入れることもできます。
      </p>

      {params.generated !== undefined && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {params.fy}年度の計画を {params.generated} 件作成しました。
          <Link href="/" className="underline ml-2">シフト表を確認する</Link>
        </div>
      )}

      <div className="space-y-3">
        {WEEKDAYS.map((label, weekday) => {
          const dayPatterns = patterns.filter((p) => p.weekday === weekday);
          return (
            <div key={weekday} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 shrink-0 text-center text-lg font-bold ${
                    weekday === 5 ? "text-blue-600" : weekday === 6 ? "text-rose-600" : "text-slate-700"
                  }`}
                >
                  {label}
                </div>
                <div className="flex-1 space-y-1.5">
                  {dayPatterns.length === 0 && (
                    <p className="text-sm text-slate-400 py-1">休み (パターンなし)</p>
                  )}
                  {dayPatterns.map((p) => {
                    const emp = empById.get(p.employee_id);
                    return (
                      <form key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="hidden" name="id" value={p.id} />
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: emp?.color ?? "#94a3b8" }}
                        />
                        <span className="font-semibold w-24 truncate">{emp?.name ?? "?"}</span>
                        <span className="tabular-nums text-slate-600">
                          {p.start_time} 〜 {p.end_time}
                        </span>
                        <button
                          formAction={deletePatternAction}
                          className="ml-auto rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                        >
                          削除
                        </button>
                      </form>
                    );
                  })}
                  {employees.length > 0 && (
                    <form className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100 text-sm">
                      <input type="hidden" name="weekday" value={weekday} />
                      <select
                        name="employee_id"
                        className="rounded border border-slate-300 px-2 py-1"
                        defaultValue={employees[0]?.id}
                      >
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        name="start_time"
                        defaultValue="09:00"
                        className="rounded border border-slate-300 px-2 py-1"
                      />
                      <span className="text-slate-400">〜</span>
                      <input
                        type="time"
                        name="end_time"
                        defaultValue="17:00"
                        className="rounded border border-slate-300 px-2 py-1"
                      />
                      <button
                        formAction={addPatternAction}
                        className="rounded-md border border-sky-300 bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-100"
                      >
                        追加
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-bold mb-1">年度計画の一括生成</h2>
        <p className="text-sm text-slate-500 mb-3">
          上のパターンをもとに、選んだ年度 (4月1日〜翌3月31日) の計画をまとめて作成します。
          すでに入力済みの日付は上書きしないので、何度実行しても安全です。
        </p>
        <form className="flex items-center gap-2">
          <select name="fy" className="rounded border border-slate-300 px-2 py-1.5 text-sm" defaultValue={currentFy}>
            {[currentFy - 1, currentFy, currentFy + 1].map((fy) => (
              <option key={fy} value={fy}>
                {fy}年度 ({fy}/4 〜 {fy + 1}/3)
              </option>
            ))}
          </select>
          <button
            formAction={generateYearPlanAction}
            className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            計画を生成
          </button>
        </form>
      </div>
    </div>
  );
}
