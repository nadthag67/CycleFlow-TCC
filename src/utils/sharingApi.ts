import { projectId, publicAnonKey } from "../../utils/supabase/info";
import type { SharingPermissions, CycleData, DayRecord } from "../auth/types";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4d766955/sharing`;
const HEADERS = { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` };

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
  return data as T;
}

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}${path}?${qs}`, { headers: HEADERS });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
  return data as T;
}

export const sharingApi = {
  generate: (ownerEmail: string) =>
    post<{ code: string; alreadyExisted?: boolean }>("/generate", { ownerEmail }),

  status: (ownerEmail: string) =>
    get<{ active: boolean; code?: string; permissions?: SharingPermissions; viewerEmail?: string }>(
      "/status", { ownerEmail }
    ),

  updatePermissions: (ownerEmail: string, permissions: SharingPermissions) =>
    post<{ ok: boolean }>("/permissions", { ownerEmail, permissions }),

  stop: (ownerEmail: string) =>
    post<{ ok: boolean }>("/stop", { ownerEmail }),

  validate: (code: string, viewerEmail: string): Promise<{ ownerEmail: string; permissions: SharingPermissions }> => {
    // dev shortcut — lets the team preview the SharedView without a live backend
    if (code.trim() === "102030") {
      return Promise.resolve({
        ownerEmail: "demo@cycleflow.dev",
        permissions: {
          can_view_cycle: true,
          can_view_calendar: true,
          can_view_notes: true,
          can_view_checkins: true,
        },
      });
    }
    return post<{ ownerEmail: string; permissions: SharingPermissions }>("/validate", { code, viewerEmail });
  },

  pushData: (ownerEmail: string, cycle: CycleData, records: DayRecord[]) =>
    post<{ ok: boolean }>("/push-data", { ownerEmail, cycle, records }),

  pullData: (code: string, viewerEmail: string) =>
    post<{
      permissions: SharingPermissions;
      syncedAt: string;
      cycle?: CycleData;
      calendarDates?: CycleData;
      records?: { date: string; humor?: string; sintomas?: string[]; notas?: string }[];
    }>("/pull-data", { code, viewerEmail }),
};
