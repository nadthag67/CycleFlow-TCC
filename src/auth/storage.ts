import type { StoredUser, UserProfile, CycleData, DayRecord, PartnerSession } from "./types";

const PARTNER_SESSION_KEY = "cf_partner_session";

const USERS_KEY = "cf_users";
const SESSION_KEY = "cf_session";
const PROFILE_PREFIX = "cf_profile_";

function parse<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}

// ── users ─────────────────────────────────────────────────
export function getUsers(): StoredUser[] {
  return parse<StoredUser[]>(USERS_KEY, []);
}

export function saveUser(user: StoredUser) {
  const users = getUsers().filter((u) => u.email !== user.email);
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
}

export function findUser(email: string): StoredUser | undefined {
  return getUsers().find((u) => u.email === email);
}

// ── session ───────────────────────────────────────────────
export function getSession(): StoredUser | null {
  return parse<StoredUser | null>(SESSION_KEY, null);
}

export function saveSession(user: StoredUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

// ── profile (cycle + records) ─────────────────────────────
function profileKey(email: string) {
  return `${PROFILE_PREFIX}${email}`;
}

export function getProfile(email: string): UserProfile | null {
  const user = findUser(email);
  if (!user) return null;
  const data = parse<{ cycle: CycleData | null; records: DayRecord[] } | null>(profileKey(email), null);
  return { user, cycle: data?.cycle ?? null, records: data?.records ?? [] };
}

export function saveCycle(email: string, cycle: CycleData) {
  const data = parse<{ cycle: CycleData | null; records: DayRecord[] }>(profileKey(email), { cycle: null, records: [] });
  localStorage.setItem(profileKey(email), JSON.stringify({ ...data, cycle }));
}

export function saveRecord(email: string, record: DayRecord) {
  const data = parse<{ cycle: CycleData | null; records: DayRecord[] }>(profileKey(email), { cycle: null, records: [] });
  const records = data.records.filter((r) => r.date !== record.date);
  localStorage.setItem(profileKey(email), JSON.stringify({ ...data, records: [...records, record] }));
}

export function getRecord(email: string, date: string): DayRecord | undefined {
  const data = parse<{ cycle: CycleData | null; records: DayRecord[] }>(profileKey(email), { cycle: null, records: [] });
  return data.records.find((r) => r.date === date);
}

// ── partner session ───────────────────────────────────────
export function getPartnerSession(): PartnerSession | null {
  return parse<PartnerSession | null>(PARTNER_SESSION_KEY, null);
}
export function savePartnerSession(s: PartnerSession | null) {
  if (s) localStorage.setItem(PARTNER_SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(PARTNER_SESSION_KEY);
}

// ── verification codes (prototype — em produção: backend envia por e-mail) ──
export function generateAndStoreCode(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  localStorage.setItem(`cf_code_${email}`, JSON.stringify({ code, exp: Date.now() + 10 * 60 * 1000 }));
  return code;
}

export function validateCode(email: string, input: string): boolean {
  try {
    const stored = JSON.parse(localStorage.getItem(`cf_code_${email}`) ?? "null");
    if (!stored) return false;
    if (Date.now() > stored.exp) return false;
    return stored.code === input;
  } catch { return false; }
}

export function clearCode(email: string) {
  localStorage.removeItem(`cf_code_${email}`);
}
