import { addEmployeeAction, updateEmployeeAction } from "@/app/actions";
import { listEmployees } from "@/lib/queries";

// DB の内容を常に最新表示するため、ビルド時の静的化を無効にする
export const dynamic = "force-dynamic";

const DEFAULT_COLORS = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#eab308"];

export default async function EmployeesPage() {
  const employees = listEmployees(true);
  const nextColor = DEFAULT_COLORS[employees.length % DEFAULT_COLORS.length];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-1">従業員</h1>
      <p className="text-sm text-slate-500 mb-4">
        退職した人は「在籍」のチェックを外してください。過去のシフト実績は残ったまま、
        新しい計画やパターンの対象から外れます。
      </p>

      <div className="space-y-2">
        {employees.map((e) => (
          <form
            key={e.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          >
            <input type="hidden" name="id" value={e.id} />
            <input
              type="color"
              name="color"
              defaultValue={e.color}
              className="h-8 w-10 cursor-pointer rounded border border-slate-300"
              title="表示色"
            />
            <input
              type="text"
              name="name"
              defaultValue={e.name}
              required
              className="flex-1 min-w-32 rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input type="checkbox" name="active" defaultChecked={e.active === 1} />
              在籍
            </label>
            <button
              formAction={updateEmployeeAction}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              保存
            </button>
          </form>
        ))}
        {employees.length === 0 && (
          <p className="text-sm text-slate-400">まだ登録がありません。下のフォームから追加してください。</p>
        )}
      </div>

      <form className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-3">
        <input
          type="color"
          name="color"
          defaultValue={nextColor}
          className="h-8 w-10 cursor-pointer rounded border border-slate-300"
          title="表示色"
        />
        <input
          type="text"
          name="name"
          placeholder="名前 (例: 山田)"
          required
          className="flex-1 min-w-32 rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          formAction={addEmployeeAction}
          className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          追加
        </button>
      </form>
    </div>
  );
}
