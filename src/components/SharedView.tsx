import { useState, useEffect, useMemo } from "react";
import type { PartnerSession, CycleData } from "../auth/types";
import { sharingApi } from "../utils/sharingApi";
import { savePartnerSession } from "../auth/storage";

// ── helpers ───────────────────────────────────────────────
function addDays(date: Date, n: number) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function isoDate(d: Date) { return d.toISOString().split("T")[0]; }
function parseDate(s: string) { return new Date(s + "T12:00:00"); }
function fmtDate(d: Date) { return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }); }

function computeSharedCycle(cycle: CycleData) {
  const start = parseDate(cycle.dataInicio);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  let cs = new Date(start);
  while (addDays(cs, cycle.duracaoCiclo) <= today) cs = addDays(cs, cycle.duracaoCiclo);
  const dayOfCycle = Math.max(1, Math.floor((today.getTime() - cs.getTime()) / 86400000) + 1);
  const nextPeriod = addDays(cs, cycle.duracaoCiclo);
  const fertileStart = addDays(cs, 11);
  const fertileEnd = addDays(cs, 17);
  let phase = "Lútea"; let phaseColor = "#fd9644";
  if (dayOfCycle <= cycle.duracaoPeriodo) { phase = "Menstrual"; phaseColor = "#ff4757"; }
  else if (dayOfCycle <= 13) { phase = "Folicular"; phaseColor = "#26de81"; }
  else if (dayOfCycle === 14) { phase = "Ovulação"; phaseColor = "#5352ed"; }
  return { dayOfCycle, nextPeriod, fertileStart, fertileEnd, phase, phaseColor, currentStart: cs };
}

const humorOptions: { value: string; emoji: string; label: string }[] = [
  { value: "feliz", emoji: "😊", label: "Feliz" }, { value: "calma", emoji: "😌", label: "Calma" },
  { value: "triste", emoji: "😔", label: "Triste" }, { value: "ansiosa", emoji: "😰", label: "Ansiosa" },
  { value: "irritada", emoji: "😠", label: "Irritada" }, { value: "cansada", emoji: "😴", label: "Cansada" },
  { value: "enjoada", emoji: "🤢", label: "Enjoada" }, { value: "neutra", emoji: "😐", label: "Neutra" },
  { value: "sensivel", emoji: "🥺", label: "Sensível" }, { value: "grata", emoji: "🙏", label: "Grata" },
  { value: "sobrecarregada", emoji: "😫", label: "Sobrecarregada" }, { value: "confiante", emoji: "💪", label: "Confiante" },
  { value: "esperancosa", emoji: "🌟", label: "Esperançosa" }, { value: "surpresa", emoji: "😲", label: "Surpresa" },
  { value: "romantica", emoji: "🥰", label: "Romântica" }, { value: "energica", emoji: "⚡", label: "Enérgica" },
  { value: "melancolica", emoji: "🌧️", label: "Melancólica" }, { value: "foco", emoji: "🎯", label: "Focada" },
];
const sintomaOptions: { value: string; emoji: string; label: string }[] = [
  { value: "colicas", emoji: "🌀", label: "Cólicas" }, { value: "dor_cabeca", emoji: "🤕", label: "Dor de cabeça" },
  { value: "inchaco", emoji: "💧", label: "Inchaço" }, { value: "nausea", emoji: "🤢", label: "Náusea" },
  { value: "fadiga", emoji: "😴", label: "Fadiga" }, { value: "acne", emoji: "✨", label: "Acne" },
  { value: "alteracao_humor", emoji: "🔄", label: "Alt. de humor" }, { value: "insonia", emoji: "🌙", label: "Insônia" },
  { value: "dor_costas", emoji: "🔙", label: "Dor nas costas" }, { value: "sensibilidade", emoji: "💜", label: "Sensibilidade" },
  { value: "tontura", emoji: "💫", label: "Tontura" }, { value: "apetite", emoji: "🍫", label: "Muito apetite" },
];

type CalendarRecord = { date: string; humor?: string; sintomas?: string[]; notas?: string };

function SharedCalendar({ cycle, records }: { cycle: CycleData; records: CalendarRecord[] }) {
  const [offset, setOffset] = useState(0);
  const { currentStart, nextPeriod, fertileStart, fertileEnd } = useMemo(() => computeSharedCycle(cycle), [cycle]);
  const today = isoDate(new Date());

  const viewDate = new Date(); viewDate.setDate(1); viewDate.setMonth(viewDate.getMonth() + offset);
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const firstDow = viewDate.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => isoDate(new Date(year, month, i + 1)))];

  function getMark(dateStr: string) {
    const d = parseDate(dateStr);
    if ((d >= currentStart && d < addDays(currentStart, cycle.duracaoPeriodo)) || (d >= nextPeriod && d < addDays(nextPeriod, cycle.duracaoPeriodo)))
      return { bg: "#ff475728", dot: "#ff4757" };
    if (isoDate(d) === isoDate(addDays(currentStart, 14))) return { bg: "#5352ed20", dot: "#5352ed" };
    if (d >= fertileStart && d <= fertileEnd) return { bg: "#26de8120", dot: "#26de81" };
    return {};
  }
  const hasRecord = (d: string) => records.some((r) => r.date === d && (r.humor || r.sintomas?.length));

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #ebe7ff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => setOffset(o => o - 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#9490c0" }}>‹</button>
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 600, color: "#1a1640", textTransform: "capitalize" }}>{monthName}</span>
        <button onClick={() => setOffset(o => o + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#9490c0" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
        {["D","S","T","Q","Q","S","S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#a09cc0", paddingBottom: 6 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const mark = getMark(date);
          const isToday = date === today;
          const rec = hasRecord(date);
          return (
            <div key={date} style={{ padding: "8px 2px", borderRadius: 8, background: mark.bg ?? "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#5c3ef4" : "#1a1640" }}>
                {new Date(date + "T12:00:00").getDate()}
              </span>
              <div style={{ display: "flex", gap: 2 }}>
                {mark.dot && <div style={{ width: 4, height: 4, borderRadius: "50%", background: mark.dot }} />}
                {rec && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#5c3ef4" }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  session: PartnerSession;
  onExit: () => void;
  darkMode?: boolean;
}

export function SharedView({ session, onExit, darkMode = false }: Props) {
  const [data, setData] = useState<{
    cycle?: CycleData;
    records?: CalendarRecord[];
    syncedAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bg = darkMode ? "#0f0d1e" : "#f5f3ff";
  const card = darkMode ? "#1e1b30" : "#ffffff";
  const border = darkMode ? "#2e2a48" : "#ebe7ff";
  const text = darkMode ? "#e8e4ff" : "#1a1640";
  const muted = darkMode ? "#9490c0" : "#6b6890";
  const primary = darkMode ? "#7c6aff" : "#5c3ef4";
  const primaryLight = darkMode ? "#231e42" : "#ede9fe";

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true); setError("");
    try {
      const result = await sharingApi.pullData(session.code, session.viewerEmail);
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados compartilhados.");
    } finally {
      setLoading(false);
    }
  }

  const perms = session.permissions;
  const computed = data?.cycle ? computeSharedCycle(data.cycle) : null;
  const today = isoDate(new Date());
  const todayRecord = data?.records?.find((r) => r.date === today);
  const humorObj = todayRecord?.humor ? humorOptions.find((h) => h.value === todayRecord.humor) : null;

  const cardStyle: React.CSSProperties = { background: card, borderRadius: 20, padding: "22px 24px", border: `1px solid ${border}`, marginBottom: 16 };

  function handleExit() {
    savePartnerSession(null);
    onExit();
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "Outfit, sans-serif", transition: "background 0.3s" }}>
      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🌸</span>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: primary }}>Cycle Flow</div>
            <div style={{ fontSize: 11, color: muted }}>Acompanhamento Compartilhado</div>
          </div>
        </div>
        <button onClick={handleExit} style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${border}`, background: "transparent", color: muted, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
          Sair
        </button>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 60px" }}>
        {/* Título */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, color: text, margin: "0 0 6px" }}>
            Acompanhamento Compartilhado
          </h1>
          <p style={{ fontSize: 13, color: muted, margin: 0 }}>Informações compartilhadas com você — somente leitura.</p>
        </div>

        {loading && (
          <div style={cardStyle}>
            <div style={{ textAlign: "center", color: muted, padding: "24px 0" }}>Carregando dados...</div>
          </div>
        )}

        {error && (
          <div style={{ ...cardStyle, background: "#fff0f1", borderColor: "#ffcdd2" }}>
            <p style={{ color: "#c62828", fontSize: 14, margin: 0 }}>{error}</p>
            <button onClick={fetchData} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 10, border: "1px solid #c62828", background: "transparent", color: "#c62828", fontSize: 12, cursor: "pointer" }}>Tentar novamente</button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Ciclo geral */}
            {perms.can_view_cycle && computed && data.cycle && (
              <div style={cardStyle}>
                <div style={{ fontSize: 11, fontWeight: 700, color: primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Ciclo</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Fase atual", value: computed.phase, color: computed.phaseColor, bg: computed.phaseColor + "18" },
                    { label: "Dia do ciclo", value: `Dia ${computed.dayOfCycle}`, color: primary, bg: primaryLight },
                    { label: "Próxima menstruação", value: fmtDate(computed.nextPeriod), color: "#ff4757", bg: "#ff475718" },
                    { label: "Período fértil", value: `${fmtDate(computed.fertileStart)} – ${fmtDate(computed.fertileEnd)}`, color: "#26de81", bg: "#26de8118" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "14px 16px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: text, lineHeight: 1.2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Como ela está hoje */}
            {perms.can_view_checkins && (
              <div style={cardStyle}>
                <div style={{ fontSize: 11, fontWeight: 700, color: primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Como ela está hoje</div>
                {!todayRecord || (!todayRecord.humor && !todayRecord.sintomas?.length) ? (
                  <p style={{ fontSize: 13, color: muted, margin: 0 }}>Nenhum registro para hoje ainda.</p>
                ) : (
                  <>
                    {humorObj && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: 32 }}>{humorObj.emoji}</span>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: text }}>{humorObj.label}</div>
                          <div style={{ fontSize: 12, color: muted }}>Humor do dia</div>
                        </div>
                      </div>
                    )}
                    {todayRecord.sintomas && todayRecord.sintomas.length > 0 && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Sintomas</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {todayRecord.sintomas.map((s) => {
                            const opt = sintomaOptions.find((o) => o.value === s);
                            return opt ? (
                              <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 99, background: "#fff0f1", border: "1.5px solid #ff475730", color: "#ff4757", fontSize: 12, fontWeight: 600 }}>
                                {opt.emoji} {opt.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Anotações */}
            {perms.can_view_notes && todayRecord?.notas && (
              <div style={cardStyle}>
                <div style={{ fontSize: 11, fontWeight: 700, color: primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Anotação de hoje</div>
                <p style={{ fontSize: 14, color: text, lineHeight: 1.6, margin: 0 }}>{todayRecord.notas}</p>
              </div>
            )}

            {/* Calendário */}
            {perms.can_view_calendar && data.cycle && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Calendário do ciclo</div>
                <SharedCalendar cycle={data.cycle} records={data.records ?? []} />
                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  {[{ color: "#ff4757", label: "Menstruação" }, { color: "#26de81", label: "Fértil" }, { color: "#5352ed", label: "Ovulação" }, { color: "#5c3ef4", label: "Registro" }].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                      <span style={{ fontSize: 11, color: muted }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Última sincronização */}
            {data.syncedAt && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button onClick={fetchData} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: muted }}>
                  🔄 Atualizar · Sincronizado {new Date(data.syncedAt).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
