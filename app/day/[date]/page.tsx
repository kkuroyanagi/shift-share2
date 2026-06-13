import Link from "next/link";
import { notFound } from "next/navigation";
import { copyPlanToActualAction, saveShiftAction } from "@/app/actions";
import { getShiftsForDate, listEmployees } from "@/lib/queries";
import { WEEKDAYS, addDays, isValidDateStr, todayStr, weekdayOf } from "@/lib/fiscal";
import { STATUS_LABEL, shiftStatus, type Employee, type Shift } from "@/lib/types";

function EmployeeRow({ employee, shift, date }: { employee: Employee; shift?: Shift; date: string }) {
  const status = shift ? shiftStatus(shift, todayStr()) : null;
  const statusColor = {
    match: "text-emerald-700 bg-emerald-50",
    changed: "text-amber-700 bg-amber-50",
    unplanned: "text-violet-700 bg-violet-50",
    missing: "text-rose-700 bg-rose-50",
    pending: "text-slate-500 bg-slate-100",
  } as const;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: employee.color }} />
        <span className="font-bold">{employee.name}</span>
        {employee.active === 0 && <span className="text-xs text-slate-400">(退職済み)</span>}
        {status && (
          <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>

      <form className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="employee_id" value={employee.id} />
        <input type="hidden" name="date" value={date} />

        <fieldset className="rounded-md border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-500">計画</legend>
          <div className="flex items-center gap-2">
            <input
              type="time"
              name="plan_start"
              defaultValue={shift?.plan_start ?? ""}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <span className="text-slate-400">〜</span>
            <input
              type="time"
              name="plan_end"
              defaultValue={shift?.plan_end ?? ""}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
        </fieldset>

        <fieldset className="rounded-md border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold text-slate-500">実績</legend>
          <div className="flex items-center gap-2">
            <input
              type="time"
              name="actual_start"
              defaultValue={shift?.actual_start ?? ""}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <span className="text-slate-400">〜</span>
            <input
              type="time"
              name="actual_end"
              defaultValue={shift?.actual_end ?? ""}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
        </fieldset>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="note"
            placeholder="メモ (任意)"
            defaultValue={shift?.note ?? ""}
            className="flex-1 min-w-40 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            formAction={saveShiftAction}
            className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            保存
          </button>
          {shift?.plan_start && shift?.plan_end && (
            <button
              formAction={copyPlanToActualAction}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
              title="計画の時刻をそのまま実績として記録します"
            >
              計画どおりに勤務した
            </button>
          )}
        </div>
      </form>
      <p className="mt-2 text-xs text-slate-400">
        時刻をすべて空にして保存すると、この日のシフトを削除します。
      </p>
    </div>
  );
}

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isValidDateStr(date)) notFound();

  const employees = listEmployees(true);
  const shifts = getShiftsForDate(date);
  const shiftByEmp = new Map(shifts.map((s) => [s.employee_id, s]));

  // 表示対象: 在籍中の従業員 + (退職済みでもこの日にシフトがある人)
  const visible = employees.filter((e) => e.active === 1 || shiftByEmp.has(e.id));

  const [y, m, d] = date.split("-").map(Number);
  const wd = WEEKDAYS[weekdayOf(date)];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          {y}年{m}月{d}日 ({wd})
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/day/${addDays(date, -1)}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            ← 前日
          </Link>
          <Link href={`/day/${addDays(date, 1)}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            翌日 →
          </Link>
          <Link href={`/?ym=${date.slice(0, 7)}`} className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50">
            月表示へ
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {visible.map((e) => (
          <EmployeeRow key={e.id} employee={e} shift={shiftByEmp.get(e.id)} date={date} />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-slate-500">
            従業員が登録されていません。<Link href="/employees" className="text-sky-700 underline">従業員ページ</Link>から登録してください。
          </p>
        )}
      </div>
    </div>
  );
}
