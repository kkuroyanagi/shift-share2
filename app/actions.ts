"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addPattern,
  copyPlanToActual,
  createEmployee,
  deletePattern,
  generateYearPlan,
  saveShift,
  updateEmployee,
} from "@/lib/queries";

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

/** 空文字を null に */
function opt(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return v === "" ? null : v;
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

// ---- 従業員 ----

export async function addEmployeeAction(formData: FormData) {
  const name = str(formData, "name");
  if (!name) return;
  createEmployee(name, str(formData, "color") || "#3b82f6");
  revalidateAll();
}

export async function updateEmployeeAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = str(formData, "name");
  if (!id || !name) return;
  updateEmployee(id, name, str(formData, "color") || "#3b82f6", formData.get("active") === "on");
  revalidateAll();
}

// ---- 基本パターン ----

export async function addPatternAction(formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const weekday = Number(formData.get("weekday"));
  const start = str(formData, "start_time");
  const end = str(formData, "end_time");
  if (!employeeId || Number.isNaN(weekday) || !start || !end) return;
  addPattern(employeeId, weekday, start, end);
  revalidateAll();
}

export async function deletePatternAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  deletePattern(id);
  revalidateAll();
}

export async function generateYearPlanAction(formData: FormData) {
  const fy = Number(formData.get("fy"));
  if (!fy) return;
  const created = generateYearPlan(fy);
  revalidateAll();
  redirect(`/patterns?generated=${created}&fy=${fy}`);
}

// ---- シフト (日別入力) ----

export async function saveShiftAction(formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const date = str(formData, "date");
  if (!employeeId || !date) return;

  // 開始・終了は片方だけだと意味をなさないので、揃っていなければ両方なし扱いにする
  let planStart = opt(formData, "plan_start");
  let planEnd = opt(formData, "plan_end");
  if (!planStart || !planEnd) planStart = planEnd = null;
  let actualStart = opt(formData, "actual_start");
  let actualEnd = opt(formData, "actual_end");
  if (!actualStart || !actualEnd) actualStart = actualEnd = null;

  saveShift(employeeId, date, planStart, planEnd, actualStart, actualEnd, opt(formData, "note"));
  revalidateAll();
}

export async function copyPlanToActualAction(formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const date = str(formData, "date");
  if (!employeeId || !date) return;
  copyPlanToActual(employeeId, date);
  revalidateAll();
}
