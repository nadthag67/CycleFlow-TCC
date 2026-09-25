export interface StoredUser {
  nome: string;
  email: string;
  senha: string;
  verified: boolean;
  firstAccessDone: boolean;
  createdAt: string;
}

export interface CycleData {
  dataInicio: string;       // ISO date
  duracaoCiclo: number;     // dias
  duracaoPeriodo: number;   // dias
}

export interface DayRecord {
  date: string;             // ISO date
  humor?: HumorType;
  sintomas: SintomaType[];
  notas?: string;
}

export type HumorType = "feliz" | "calma" | "triste" | "ansiosa" | "irritada" | "cansada" | "enjoada" | "neutra" | "sensivel" | "grata" | "sobrecarregada" | "confiante" | "esperancosa" | "surpresa" | "romantica" | "energica" | "melancolica" | "foco";
export type SintomaType = "colicas" | "dor_cabeca" | "inchaco" | "nausea" | "fadiga" | "acne" | "alteracao_humor" | "insonia" | "dor_costas" | "sensibilidade" | "tontura" | "apetite";

export interface UserProfile {
  user: StoredUser;
  cycle: CycleData | null;
  records: DayRecord[];
}

export interface SharingPermissions {
  can_view_cycle: boolean;
  can_view_calendar: boolean;
  can_view_notes: boolean;
  can_view_checkins: boolean;
}

export interface PartnerSession {
  type: "partner";
  code: string;
  ownerEmail: string;
  viewerEmail: string;
  permissions: SharingPermissions;
}
