import { useState, useMemo } from "react";
import type { StoredUser, CycleData, DayRecord, HumorType, SintomaType } from "../auth/types";
import { saveRecord, getRecord, getProfile, saveCycle, saveUser } from "../auth/storage";
import { ShareSettings } from "./ShareSettings";

// ── helpers ───────────────────────────────────────────────
function addDays(date: Date, n: number) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function isoDate(d: Date) { return d.toISOString().split("T")[0]; }
function parseDate(s: string) { return new Date(s + "T12:00:00"); }
function fmtDate(d: Date, opts?: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString("pt-BR", opts ?? { day: "numeric", month: "long" });
}
function computeCycle(cycle: CycleData) {
  const start = parseDate(cycle.dataInicio);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  let cs = new Date(start);
  while (addDays(cs, cycle.duracaoCiclo) <= today) cs = addDays(cs, cycle.duracaoCiclo);
  const dayOfCycle = Math.floor((today.getTime() - cs.getTime()) / 86400000) + 1;
  const nextPeriod = addDays(cs, cycle.duracaoCiclo);
  const fertileStart = addDays(cs, 11);
  const fertileEnd = addDays(cs, 17);
  const ovulation = addDays(cs, 14);
  let phase: string; let phaseColor: string;
  if (dayOfCycle <= cycle.duracaoPeriodo) { phase = "Menstrual"; phaseColor = "#ff4757"; }
  else if (dayOfCycle <= 13) { phase = "Folicular"; phaseColor = "#26de81"; }
  else if (dayOfCycle === 14) { phase = "Ovulação"; phaseColor = "#5352ed"; }
  else { phase = "Lútea"; phaseColor = "#fd9644"; }
  return { currentStart: cs, dayOfCycle, nextPeriod, fertileStart, fertileEnd, ovulation, phase, phaseColor };
}

// ── phase info (Clue-inspired) ────────────────────────────
const phaseInfo: Record<string, {
  icon: string; color: string; title: string;
  desc: string; body: string; tips: string[];
  energy: number; mood: string;
}> = {
  Menstrual: {
    icon: "🩸", color: "#ff4757", title: "Menstruação",
    desc: "O revestimento do útero está se desprendendo. Os níveis de estrogênio e progesterona estão baixos.",
    body: "Seu corpo está trabalhando intensamente. Cólicas, fadiga e sensibilidade são respostas naturais a esse processo.",
    tips: ["Hidrate-se bastante", "Descanse quando possível", "Alimentos ricos em ferro ajudam a repor o que é perdido", "Calor local alivia as cólicas"],
    energy: 1, mood: "Introspectiva",
  },
  Folicular: {
    icon: "🌱", color: "#26de81", title: "Fase Folicular",
    desc: "Os folículos do ovário estão amadurecendo. O estrogênio começa a subir gradualmente.",
    body: "Você provavelmente vai sentir energia crescente, clareza mental e disposição para novas atividades e projetos.",
    tips: ["Ótimo momento para novos projetos", "Sua resistência física está em alta", "Aproveite para socializar", "Experimente coisas novas"],
    energy: 4, mood: "Energizada",
  },
  Ovulação: {
    icon: "⭐", color: "#5352ed", title: "Ovulação",
    desc: "Um óvulo maduro é liberado pelo ovário. É o pico de fertilidade do seu ciclo.",
    body: "Você pode se sentir no auge da energia, confiança e comunicação. É o momento de maior fertilidade.",
    tips: ["Pico de energia e confiança", "Libido naturalmente mais alta", "Ótimo para apresentações e reuniões", "Observe possível dor leve no lado esquerdo ou direito"],
    energy: 5, mood: "Confiante",
  },
  Lútea: {
    icon: "🌙", color: "#fd9644", title: "Fase Lútea",
    desc: "O corpo se prepara para uma possível gravidez. A progesterona sobe e depois cai.",
    body: "É normal sentir variações de humor, inchaço e menor disposição. O corpo está sinalizando o fim do ciclo.",
    tips: ["Reduza a cafeína e o açúcar", "Exercícios leves como yoga ajudam", "Dê prioridade ao descanso", "TPM é real — acolha seus sentimentos"],
    energy: 2, mood: "Sensível",
  },
};

// ── emotion & symptom data ────────────────────────────────
const humorOptions: { value: string; emoji: string; label: string }[] = [
  { value: "feliz",          emoji: "😊", label: "Feliz" },
  { value: "calma",          emoji: "😌", label: "Calma" },
  { value: "triste",         emoji: "😔", label: "Triste" },
  { value: "ansiosa",        emoji: "😰", label: "Ansiosa" },
  { value: "irritada",       emoji: "😠", label: "Irritada" },
  { value: "cansada",        emoji: "😴", label: "Cansada" },
  { value: "enjoada",        emoji: "🤢", label: "Enjoada" },
  { value: "neutra",         emoji: "😐", label: "Neutra" },
  { value: "sensivel",       emoji: "🥺", label: "Sensível" },
  { value: "grata",          emoji: "🙏", label: "Grata" },
  { value: "sobrecarregada", emoji: "😫", label: "Sobrecarregada" },
  { value: "confiante",      emoji: "💪", label: "Confiante" },
  { value: "esperancosa",    emoji: "🌟", label: "Esperançosa" },
  { value: "surpresa",       emoji: "😲", label: "Surpresa" },
  { value: "romantica",      emoji: "🥰", label: "Romântica" },
  { value: "energica",       emoji: "⚡", label: "Enérgica" },
  { value: "melancolica",    emoji: "🌧️", label: "Melancólica" },
  { value: "foco",           emoji: "🎯", label: "Focada" },
];
const sintomaOptions: { value: string; emoji: string; label: string }[] = [
  { value: "colicas",         emoji: "🌀", label: "Cólicas" },
  { value: "dor_cabeca",      emoji: "🤕", label: "Dor de cabeça" },
  { value: "inchaco",         emoji: "💧", label: "Inchaço" },
  { value: "nausea",          emoji: "🤢", label: "Náusea" },
  { value: "fadiga",          emoji: "😴", label: "Fadiga" },
  { value: "acne",            emoji: "✨", label: "Acne" },
  { value: "alteracao_humor", emoji: "🔄", label: "Alt. de humor" },
  { value: "insonia",         emoji: "🌙", label: "Insônia" },
  { value: "dor_costas",      emoji: "🔙", label: "Dor nas costas" },
  { value: "sensibilidade",   emoji: "💜", label: "Sensibilidade" },
  { value: "tontura",         emoji: "💫", label: "Tontura" },
  { value: "apetite",         emoji: "🍫", label: "Muito apetite" },
];

// ── theme tokens ──────────────────────────────────────────
const lightTk = {
  bg: "#f5f3ff", sidebar: "#ffffff", card: "#ffffff", border: "#ebe7ff",
  primary: "#5c3ef4", primaryLight: "#ede9fe",
  rose: "#ff4757", roseLight: "#fff0f1",
  menstrual: "#ff4757", folicular: "#26de81", ovulacao: "#5352ed", lutea: "#fd9644",
  text: "#1a1640", muted: "#6b6890", label: "#a09cc0",
};
const darkTk = {
  bg: "#0f0d1e", sidebar: "#161428", card: "#1e1b30", border: "#2e2a48",
  primary: "#7c6aff", primaryLight: "#231e42",
  rose: "#ff6b7a", roseLight: "#2a1020",
  menstrual: "#ff6b7a", folicular: "#26de81", ovulacao: "#7c7cff", lutea: "#fd9644",
  text: "#e8e4ff", muted: "#9490c0", label: "#6b6890",
};
let tk = lightTk;

// ── nav btn helper ────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, border: "none",
  background: "transparent", cursor: "pointer", fontSize: 16, transition: "all 0.15s",
};

// ── phase modal ───────────────────────────────────────────
function PhaseModal({ phase, phaseColor, day, total, onClose }: {
  phase: string; phaseColor: string; day: number; total: number; onClose: () => void;
}) {
  const info = phaseInfo[phase] ?? phaseInfo["Lútea"];
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: tk.card, borderRadius: 24, width: "100%", maxWidth: 480,
        overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
      }}>
        {/* header */}
        <div style={{ background: info.color + "22", padding: "28px 28px 20px", borderBottom: `1px solid ${tk.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 36 }}>{info.icon}</span>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: tk.text, margin: "8px 0 4px" }}>{info.title}</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: info.color, padding: "3px 10px", borderRadius: 99 }}>Dia {day} de {total}</span>
                <span style={{ fontSize: 12, color: tk.muted }}>Humor esperado: {info.mood}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: tk.muted, cursor: "pointer" }}>✕</button>
          </div>
        </div>
        {/* body */}
        <div style={{ padding: "24px 28px" }}>
          <p style={{ fontSize: 14, color: tk.muted, lineHeight: 1.7, marginTop: 0 }}>{info.desc}</p>
          <p style={{ fontSize: 14, color: tk.text, lineHeight: 1.7 }}>{info.body}</p>

          {/* energy bar */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Nível de energia esperado</p>
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 8, borderRadius: 99, background: i < info.energy ? info.color : tk.border, transition: "background 0.3s" }} />
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Dicas para esta fase</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {info.tips.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: info.color, flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontSize: 13, color: tk.text, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 28px", borderTop: `1px solid ${tk.border}` }}>
          <button onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: info.color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Entendi</button>
        </div>
      </div>
    </div>
  );
}

// ── update cycle mini-page ────────────────────────────────
function UpdateCyclePage({ current, email, onSaved, onBack }: {
  current: CycleData; email: string;
  onSaved: (c: CycleData) => void; onBack: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [dataInicio, setDataInicio] = useState("");
  const [duracaoCiclo, setDuracaoCiclo] = useState("");
  const [duracaoPeriodo, setDuracaoPeriodo] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const saveField = (field: "data" | "ciclo" | "periodo") => {
    const next: CycleData = { ...current };
    if (field === "data" && dataInicio) next.dataInicio = dataInicio;
    if (field === "ciclo" && duracaoCiclo) next.duracaoCiclo = parseInt(duracaoCiclo);
    if (field === "periodo" && duracaoPeriodo) next.duracaoPeriodo = parseInt(duracaoPeriodo);
    saveCycle(email, next);
    onSaved(next);
    setSaved(field);
    setTimeout(() => setSaved(null), 2000);
  };

  const actionCard = (
    icon: string, title: string, subtitle: string, color: string,
    content: React.ReactNode, field: "data" | "ciclo" | "periodo"
  ) => (
    <div style={{ background: tk.card, borderRadius: 20, border: `1px solid ${tk.border}`, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${tk.border}`, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
        <div>
          <h3 style={{ margin: 0, fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700, color: tk.text }}>{title}</h3>
          <p style={{ margin: 0, fontSize: 12, color: tk.muted, marginTop: 2 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: "20px 24px" }}>
        {content}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={() => saveField(field)}
            style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: saved === field ? "#26de81" : color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.3s" }}>
            {saved === field ? "✓ Salvo!" : "Atualizar"}
          </button>
        </div>
        {field === "data" && <p style={{ fontSize: 11, color: tk.label, margin: "8px 0 0", textAlign: "center" }}>Deixe em branco para manter: {current.dataInicio}</p>}
        {field === "ciclo" && <p style={{ fontSize: 11, color: tk.label, margin: "8px 0 0", textAlign: "center" }}>Atual: {current.duracaoCiclo} dias</p>}
        {field === "periodo" && <p style={{ fontSize: 11, color: tk.label, margin: "8px 0 0", textAlign: "center" }}>Atual: {current.duracaoPeriodo} dias</p>}
      </div>
    </div>
  );

  const numControl = (value: string, set: (v: string) => void, min: number, max: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={() => set(String(Math.max(min, (parseInt(value) || min) - 1)))}
        style={{ width: 40, height: 40, borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.bg, cursor: "pointer", fontSize: 20, color: tk.primary, flexShrink: 0 }}>−</button>
      <input type="number" min={min} max={max} value={value} onChange={(e) => set(e.target.value)}
        placeholder={`${min}–${max}`}
        style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.bg, fontSize: 22, fontWeight: 700, textAlign: "center", fontFamily: "Fraunces, serif", color: tk.text, outline: "none", boxSizing: "border-box" }}
        onFocus={(e) => { e.currentTarget.style.borderColor = tk.primary; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = tk.border; }}
      />
      <button onClick={() => set(String(Math.min(max, (parseInt(value) || min) + 1)))}
        style={{ width: 40, height: 40, borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.bg, cursor: "pointer", fontSize: 20, color: tk.primary, flexShrink: 0 }}>+</button>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.card, cursor: "pointer", fontSize: 18, color: tk.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: tk.text, margin: 0 }}>Atualizar ciclo</h2>
          <p style={{ fontSize: 13, color: tk.muted, margin: "4px 0 0" }}>Atualize apenas o que mudou. Campos em branco mantêm o valor atual.</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {actionCard("🩸", "Início da menstruação", "Quando começou seu último período?", tk.menstrual,
          <input type="date" max={today} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.bg, fontSize: 15, color: tk.text, fontFamily: "Outfit, sans-serif", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = tk.menstrual; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = tk.border; }}
          />, "data"
        )}

        {actionCard("🔄", "Duração do ciclo", "Quantos dias dura seu ciclo completo?", tk.primary,
          numControl(duracaoCiclo, setDuracaoCiclo, 21, 35), "ciclo"
        )}

        {actionCard("📅", "Duração da menstruação", "Quantos dias dura sua menstruação?", tk.lutea,
          numControl(duracaoPeriodo, setDuracaoPeriodo, 2, 7), "periodo"
        )}
      </div>
    </div>
  );
}

// ── cycle ring ────────────────────────────────────────────
function CycleRing({ day, total, phase, phaseColor, onInfo }: {
  day: number; total: number; phase: string; phaseColor: string; onInfo: () => void;
}) {
  const r = 90; const cx = 110; const cy = 110;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(day / total, 1);
  const phases = [
    { name: "Menstrual", frac: 5 / total, color: tk.menstrual },
    { name: "Folicular", frac: 8 / total, color: tk.folicular },
    { name: "Ovulação",  frac: 1 / total, color: tk.ovulacao },
    { name: "Lútea",     frac: (total - 14) / total, color: tk.lutea },
  ];
  let cumFrac = 0;
  const arcs = phases.map((p) => { const start = cumFrac; cumFrac += p.frac; return { ...p, start, end: Math.min(cumFrac, 1) }; });
  const toRad = (frac: number) => (frac * 2 * Math.PI) - Math.PI / 2;
  const ptX = (frac: number) => cx + r * Math.cos(toRad(frac));
  const ptY = (frac: number) => cy + r * Math.sin(toRad(frac));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={220} height={220} viewBox="0 0 220 220">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={tk.border} strokeWidth={18} />
        {arcs.map((arc) => {
          const span = arc.end - arc.start;
          const dashArray = span * circ;
          return (
            <circle key={arc.name} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={18}
              strokeLinecap="butt" strokeDasharray={`${dashArray} ${circ - dashArray}`}
              strokeDashoffset={-arc.start * circ}
              style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
              opacity={arc.name === phase ? 1 : 0.25}
            />
          );
        })}
        <circle cx={ptX(progress)} cy={ptY(progress)} r={9} fill={phaseColor} stroke={tk.card} strokeWidth={3} />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={42} fontWeight={700} fill={tk.text} fontFamily="Fraunces, serif">{day}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={12} fill={tk.muted}>dia do ciclo</text>
        <text x={cx} y={cy + 30} textAnchor="middle" fontSize={11} fill={tk.label}>de {total} dias</text>
      </svg>

      <button onClick={onInfo}
        style={{ marginTop: 8, padding: "8px 20px", borderRadius: 99, border: `1.5px solid ${phaseColor}`, background: phaseColor + "18", color: phaseColor, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        onMouseOver={(e) => { e.currentTarget.style.background = phaseColor + "30"; }}
        onMouseOut={(e) => { e.currentTarget.style.background = phaseColor + "18"; }}
      >
        <span style={{ fontSize: 16 }}>{phaseInfo[phase]?.icon ?? "ℹ️"}</span>
        Entender esta fase
      </button>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
        {arcs.map((arc) => (
          <div key={arc.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: arc.color, opacity: arc.name === phase ? 1 : 0.35 }} />
            <span style={{ fontSize: 11, color: arc.name === phase ? tk.text : tk.label, fontWeight: arc.name === phase ? 700 : 400 }}>{arc.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── calendar ──────────────────────────────────────────────
function Calendar({ cycle, records, selectedDay, onSelectDay }: {
  cycle: CycleData; records: DayRecord[]; selectedDay: string; onSelectDay: (d: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const { currentStart, nextPeriod, fertileStart, fertileEnd, ovulation } = useMemo(() => computeCycle(cycle), [cycle]);
  const today = isoDate(new Date());

  const viewDate = new Date(); viewDate.setDate(1); viewDate.setMonth(viewDate.getMonth() + offset);
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const firstDow = viewDate.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function getDayMark(dateStr: string) {
    const d = parseDate(dateStr);
    const { duracaoPeriodo } = cycle;
    if ((d >= currentStart && d < addDays(currentStart, duracaoPeriodo)) || (d >= nextPeriod && d < addDays(nextPeriod, duracaoPeriodo)))
      return { bg: tk.menstrual + "28", dot: tk.menstrual };
    if (isoDate(d) === isoDate(ovulation)) return { bg: tk.ovulacao + "20", dot: tk.ovulacao };
    if (d >= fertileStart && d <= fertileEnd) return { bg: tk.folicular + "20", dot: tk.folicular };
    return {};
  }
  const hasRecord = (date: string) => records.some((r) => r.date === date && (r.humor || r.sintomas?.length));
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => isoDate(new Date(year, month, i + 1)))];

  return (
    <div style={{ background: tk.card, borderRadius: 20, padding: 28, border: `1px solid ${tk.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={() => setOffset(o => o - 1)} style={{ ...navBtnStyle, color: tk.muted, fontSize: 20 }}>‹</button>
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600, color: tk.text, textTransform: "capitalize" }}>{monthName}</span>
        <button onClick={() => setOffset(o => o + 1)} style={{ ...navBtnStyle, color: tk.muted, fontSize: 20 }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
        {["D","S","T","Q","Q","S","S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: tk.label, paddingBottom: 8 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const mark = getDayMark(date);
          const isToday = date === today;
          const isSel = date === selectedDay;
          const recorded = hasRecord(date);
          return (
            <button key={date} onClick={() => onSelectDay(date)}
              style={{
                padding: "9px 4px", borderRadius: 10,
                border: `2px solid ${isSel ? tk.primary : "transparent"}`,
                background: isSel ? tk.primaryLight : (mark.bg ?? "transparent"),
                color: isToday ? tk.primary : tk.text,
                fontSize: 13, fontWeight: isToday || isSel ? 700 : 400,
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}
              onMouseOver={(e) => { if (!isSel) e.currentTarget.style.background = tk.primaryLight; }}
              onMouseOut={(e) => { if (!isSel) e.currentTarget.style.background = mark.bg ?? "transparent"; }}
            >
              {new Date(date + "T12:00:00").getDate()}
              <div style={{ display: "flex", gap: 2 }}>
                {mark.dot && <div style={{ width: 4, height: 4, borderRadius: "50%", background: mark.dot }} />}
                {recorded && <div style={{ width: 4, height: 4, borderRadius: "50%", background: tk.primary }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── day check-in ──────────────────────────────────────────
function CheckIn({ email, onSave }: { email: string; onSave: () => void }) {
  const today = isoDate(new Date());
  const existing = getRecord(email, today);
  const [humor, setHumor] = useState<string | undefined>(existing?.humor);
  const [sintomas, setSintomas] = useState<string[]>((existing?.sintomas as string[]) ?? []);
  const [notas, setNotas] = useState(existing?.notas ?? "");
  const [saved, setSaved] = useState(false);
  const toggle = (s: string) => setSintomas((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const handleSave = () => {
    saveRecord(email, { date: today, humor: humor as HumorType, sintomas: sintomas as SintomaType[], notas });
    setSaved(true);
    setTimeout(() => { setSaved(false); onSave(); }, 1200);
  };
  return (
    <div style={{ background: tk.card, borderRadius: 20, padding: 28, border: `1px solid ${tk.border}` }}>
      <p style={{ fontSize: 14, color: tk.muted, marginTop: 0, marginBottom: 24 }}>
        Como você está se sentindo hoje? Pode deixar em branco.
      </p>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Humor</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {humorOptions.map((h) => {
            const on = humor === h.value;
            return (
              <button key={h.value} onClick={() => setHumor(on ? undefined : h.value as HumorType)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, border: `1.5px solid ${on ? tk.primary : tk.border}`, background: on ? tk.primaryLight : "transparent", color: on ? tk.primary : tk.muted, fontSize: 13, fontWeight: on ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}
                onMouseOver={(e) => { if (!on) e.currentTarget.style.borderColor = tk.primary; }}
                onMouseOut={(e) => { if (!on) e.currentTarget.style.borderColor = tk.border; }}
              ><span style={{ fontSize: 16 }}>{h.emoji}</span> {h.label}</button>
            );
          })}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Sintomas</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {sintomaOptions.map((s) => {
            const on = sintomas.includes(s.value);
            return (
              <button key={s.value} onClick={() => toggle(s.value)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, border: `1.5px solid ${on ? tk.rose : tk.border}`, background: on ? tk.roseLight : "transparent", color: on ? tk.rose : tk.muted, fontSize: 13, fontWeight: on ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}
                onMouseOver={(e) => { if (!on) e.currentTarget.style.borderColor = tk.rose; }}
                onMouseOut={(e) => { if (!on) e.currentTarget.style.borderColor = tk.border; }}
              ><span style={{ fontSize: 16 }}>{s.emoji}</span> {s.label}</button>
            );
          })}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Notas do dia</p>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Escreva algo... (opcional)" rows={3}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.bg, fontSize: 13, color: tk.text, fontFamily: "Outfit, sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = tk.primary; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = tk.border; }}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleSave} style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: saved ? "#26de81" : tk.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.3s" }}>
          {saved ? "✓ Salvo!" : "Salvar registro"}
        </button>
        <button onClick={() => { setHumor(undefined); setSintomas([]); setNotas(""); }} style={{ padding: "11px 16px", borderRadius: 12, border: `1.5px solid ${tk.border}`, background: "transparent", color: tk.muted, fontSize: 13, cursor: "pointer" }}>
          Limpar
        </button>
      </div>
    </div>
  );
}

// ── check-in modal ────────────────────────────────────────
function CheckInModal({ email, onSave, onClose }: { email: string; onSave: () => void; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: tk.card, borderRadius: 24, width: "100%", maxWidth: 540,
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
      }}>
        {/* header */}
        <div style={{ padding: "22px 28px 18px", borderBottom: `1px solid ${tk.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: tk.text, margin: 0 }}>Como você está hoje?</h2>
            <p style={{ fontSize: 13, color: tk.muted, margin: "4px 0 0" }}>Registre seu humor, sintomas e anotações do dia.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: tk.muted, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>
        {/* scrollable body */}
        <div style={{ overflowY: "auto", padding: "24px 28px", flex: 1 }}>
          <CheckIn email={email} onSave={() => { onSave(); onClose(); }} />
        </div>
      </div>
    </div>
  );
}

// ── day detail mini-page ──────────────────────────────────
function DayDetailPage({ date, email, cycle, onBack }: {
  date: string; email: string; cycle: CycleData; onBack: () => void;
}) {
  const record = getRecord(email, date);
  const d = parseDate(date);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const isFuture = d > today;
  const label = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // compute phase for that date
  const start = parseDate(cycle.dataInicio);
  let cs = new Date(start);
  while (addDays(cs, cycle.duracaoCiclo) <= d) cs = addDays(cs, cycle.duracaoCiclo);
  const dayNum = Math.max(1, Math.floor((d.getTime() - cs.getTime()) / 86400000) + 1);
  let ph = "Lútea"; let phColor = "#fd9644";
  if (dayNum <= cycle.duracaoPeriodo) { ph = "Menstrual"; phColor = "#ff4757"; }
  else if (dayNum <= 13) { ph = "Folicular"; phColor = "#26de81"; }
  else if (dayNum === 14) { ph = "Ovulação"; phColor = "#5352ed"; }

  const humorObj = record?.humor ? humorOptions.find((h) => h.value === record.humor) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.card, cursor: "pointer", fontSize: 18, color: tk.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: tk.text, margin: 0, textTransform: "capitalize" }}>{label}</h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: phColor, padding: "2px 10px", borderRadius: 99 }}>Dia {dayNum} — {ph}</span>
        </div>
      </div>

      {isFuture ? (
        <div style={{ background: tk.card, borderRadius: 20, padding: 28, border: `1px solid ${tk.border}`, color: tk.muted, fontSize: 14, textAlign: "center" }}>
          📅 Este dia ainda não aconteceu. Volte quando chegar!
        </div>
      ) : !record || (!record.humor && !record.sintomas?.length && !record.notas) ? (
        <div style={{ background: tk.card, borderRadius: 20, padding: 28, border: `1px solid ${tk.border}`, color: tk.muted, fontSize: 14, textAlign: "center" }}>
          Nenhum registro para este dia. Clique em "Como você está se sentindo hoje?" para registrar.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {humorObj && (
            <div style={{ background: tk.card, borderRadius: 18, padding: "20px 24px", border: `1px solid ${tk.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 10px" }}>Humor</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 32 }}>{humorObj.emoji}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: tk.text }}>{humorObj.label}</span>
              </div>
            </div>
          )}
          {record.sintomas?.length > 0 && (
            <div style={{ background: tk.card, borderRadius: 18, padding: "20px 24px", border: `1px solid ${tk.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px" }}>Sintomas</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {record.sintomas.map((s) => {
                  const opt = sintomaOptions.find((o) => o.value === s);
                  if (!opt) return null;
                  return (
                    <span key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 99, background: tk.roseLight, border: `1.5px solid ${tk.rose}30`, color: tk.rose, fontSize: 13, fontWeight: 600 }}>
                      {opt.emoji} {opt.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {record.notas && (
            <div style={{ background: tk.card, borderRadius: 18, padding: "20px 24px", border: `1px solid ${tk.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 10px" }}>Notas</p>
              <p style={{ fontSize: 14, color: tk.text, lineHeight: 1.6, margin: 0 }}>{record.notas}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── history mini-page ─────────────────────────────────────
function HistoryPage({ cycle, records, onBack, onDayClick }: {
  cycle: CycleData; records: DayRecord[]; onBack: () => void; onDayClick: (d: string) => void;
}) {
  const recordedDays = useMemo(() =>
    [...records]
      .filter((r) => r.humor || r.sintomas?.length || r.notas)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30),
    [records]
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.card, cursor: "pointer", fontSize: 18, color: tk.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: tk.text, margin: 0 }}>Histórico</h2>
          <p style={{ fontSize: 13, color: tk.muted, margin: "4px 0 0" }}>Seus registros de humor e sintomas salvos.</p>
        </div>
      </div>

      {/* ciclo stats */}
      <div style={{ background: tk.card, borderRadius: 18, padding: "20px 24px", border: `1px solid ${tk.border}`, marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px" }}>Informações do ciclo</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: tk.text }}>🔄 Duração: <strong>{cycle.duracaoCiclo} dias</strong></span>
          <span style={{ fontSize: 13, color: tk.text }}>🩸 Período: <strong>{cycle.duracaoPeriodo} dias</strong></span>
          <span style={{ fontSize: 13, color: tk.text }}>📅 Desde: <strong>{parseDate(cycle.dataInicio).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong></span>
        </div>
      </div>

      {recordedDays.length === 0 ? (
        <div style={{ background: tk.card, borderRadius: 18, padding: 28, border: `1px solid ${tk.border}`, color: tk.muted, fontSize: 14, textAlign: "center" }}>
          Nenhum registro ainda. Comece pelo "Sintomas" no menu!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recordedDays.map((r) => {
            const humorObj = r.humor ? humorOptions.find((h) => h.value === r.humor) : null;
            const d = parseDate(r.date);
            const dateLabel = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
            return (
              <button key={r.date} onClick={() => onDayClick(r.date)}
                style={{ background: tk.card, borderRadius: 16, padding: "16px 20px", border: `1px solid ${tk.border}`, cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = tk.primary; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = tk.border; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: tk.text, textTransform: "capitalize", marginBottom: 6 }}>{dateLabel}</div>
                    {humorObj && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                        <span style={{ fontSize: 16 }}>{humorObj.emoji}</span>
                        <span style={{ fontSize: 12, color: tk.muted }}>{humorObj.label}</span>
                      </div>
                    )}
                    {r.sintomas?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {r.sintomas.slice(0, 4).map((s) => {
                          const opt = sintomaOptions.find((o) => o.value === s);
                          return opt ? (
                            <span key={s} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: tk.roseLight, color: tk.rose, fontWeight: 600 }}>{opt.emoji} {opt.label}</span>
                          ) : null;
                        })}
                        {r.sintomas.length > 4 && <span style={{ fontSize: 11, color: tk.muted }}>+{r.sintomas.length - 4}</span>}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 16, color: tk.label, flexShrink: 0 }}>›</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── sidebar items ─────────────────────────────────────────
const sideItems = [
  { icon: "🏠", label: "Início",        id: "inicio" },
  { icon: "📅", label: "Calendário",    id: "calendario" },
  { icon: "🩺", label: "Sintomas",      id: "checkin" },
  { icon: "📊", label: "Histórico",     id: "historico" },
  { icon: "🔗", label: "Compartilhar",  id: "compartilhar" },
  { icon: "⚙️", label: "Atualizar ciclo", id: "update-cycle" },
];

// ── main dashboard ────────────────────────────────────────
interface Props {
  user: StoredUser; initialCycle: CycleData; onLogout: () => void;
  darkMode?: boolean; onToggleDark?: () => void;
  mobileMode?: boolean; onToggleMobile?: () => void;
}

export function Dashboard({ user, initialCycle, onLogout, darkMode = false, onToggleDark, mobileMode = false, onToggleMobile }: Props) {
  tk = darkMode ? darkTk : lightTk;

  const [cycle, setCycleState] = useState<CycleData>(initialCycle);
  const [records, setRecords] = useState<DayRecord[]>(() => getProfile(user.email)?.records ?? []);
  const [selectedDay, setSelectedDay] = useState(isoDate(new Date()));
  const [activeNav, setActiveNav] = useState("inicio");
  const [activeView, setActiveView] = useState<"main" | "update-cycle" | "historico" | "day-detail" | "compartilhar">("main");
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const { dayOfCycle, phase, phaseColor, nextPeriod, fertileStart, fertileEnd } = useMemo(() => computeCycle(cycle), [cycle]);
  const refreshRecords = () => setRecords(getProfile(user.email)?.records ?? []);
  const daysToNext = Math.max(0, Math.round((nextPeriod.getTime() - Date.now()) / 86400000));

  const handleNavClick = (id: string) => {
    if (id === "update-cycle") {
      setActiveView("update-cycle"); setActiveNav(id);
    } else if (id === "historico") {
      setActiveView("historico"); setActiveNav(id);
    } else if (id === "compartilhar") {
      setActiveView("compartilhar"); setActiveNav(id);
    } else if (id === "checkin") {
      setShowCheckInModal(true); setActiveNav(id);
    } else {
      setActiveView("main"); setActiveNav(id);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  const openDayDetail = (date: string) => {
    setSelectedDay(date);
    setActiveView("day-detail");
    setActiveNav("calendario");
  };

  const sidebarContent = (
    <>
      {/* logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${tk.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🌸</span>
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: tk.primary }}>Cycle Flow</span>
        </div>
      </div>
      {/* nav */}
      <nav style={{ flex: 1, padding: "14px 10px" }}>
        {sideItems.map((item) => {
          const on = activeNav === item.id;
          return (
            <button key={item.id} onClick={() => handleNavClick(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: on ? tk.primaryLight : "transparent", color: on ? tk.primary : tk.muted, fontSize: 14, fontWeight: on ? 700 : 400, marginBottom: 3, textAlign: "left", transition: "all 0.15s" }}
              onMouseOver={(e) => { if (!on) e.currentTarget.style.background = tk.primaryLight + "88"; }}
              onMouseOut={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 17 }}>{item.icon}</span> {item.label}
            </button>
          );
        })}
      </nav>
      {/* bottom controls */}
      <div style={{ padding: "14px 16px", borderTop: `1px solid ${tk.border}` }}>
        {/* toggles */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={onToggleDark} title={darkMode ? "Modo claro" : "Modo escuro"}
            style={{ flex: 1, padding: "8px", borderRadius: 10, border: `1.5px solid ${tk.border}`, background: tk.bg, cursor: "pointer", fontSize: 16, color: tk.muted, transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = tk.primary; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = tk.border; }}
          >{darkMode ? "☀️ Claro" : "🌙 Escuro"}</button>
          <button onClick={onToggleMobile} title={mobileMode ? "Modo desktop" : "Modo mobile"}
            style={{ flex: 1, padding: "8px", borderRadius: 10, border: `1.5px solid ${tk.border}`, background: mobileMode ? tk.primaryLight : tk.bg, cursor: "pointer", fontSize: 14, fontWeight: mobileMode ? 700 : 400, color: mobileMode ? tk.primary : tk.muted, transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = tk.primary; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = tk.border; }}
          >{mobileMode ? "🖥️ Desktop" : "📱 Mobile"}</button>
        </div>
        {/* user info */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: tk.rose, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14, flexShrink: 0 }}>
            {user.nome[0].toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: tk.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.nome.split(" ")[0]}</div>
            <div style={{ fontSize: 11, color: tk.label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
        </div>
        <button onClick={onLogout}
          style={{ width: "100%", padding: "8px", borderRadius: 10, border: `1.5px solid ${tk.border}`, background: "transparent", color: tk.muted, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}
          onMouseOver={(e) => { e.currentTarget.style.color = tk.rose; e.currentTarget.style.borderColor = tk.rose; }}
          onMouseOut={(e) => { e.currentTarget.style.color = tk.muted; e.currentTarget.style.borderColor = tk.border; }}
        >Sair da conta</button>
      </div>
    </>
  );

  // ── mobile top header ──────────────────────────────────
  const mobileHeader = (
    <div style={{ background: tk.sidebar, borderBottom: `1px solid ${tk.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>🌸</span>
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: tk.primary }}>Cycle Flow</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onToggleDark} title={darkMode ? "Modo claro" : "Modo escuro"}
          style={{ padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${tk.border}`, background: tk.bg, cursor: "pointer", fontSize: 13, color: tk.muted }}>
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button onClick={onToggleMobile} title="Voltar ao desktop"
          style={{ padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${tk.primary}`, background: tk.primaryLight, cursor: "pointer", fontSize: 11, fontWeight: 700, color: tk.primary, whiteSpace: "nowrap" }}>
          🖥️ Desktop
        </button>
      </div>
    </div>
  );

  // ── mobile bottom nav ──────────────────────────────────
  const bottomNav = (
    <div style={{ background: tk.sidebar, borderTop: `1px solid ${tk.border}`, display: "flex", flexShrink: 0 }}>
      {sideItems.map((item) => {
        const on = activeNav === item.id;
        return (
          <button key={item.id} onClick={() => handleNavClick(item.id)}
            style={{ flex: 1, padding: "8px 2px 10px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 8.5, fontWeight: on ? 700 : 400, color: on ? tk.primary : tk.label, lineHeight: 1.2, textAlign: "center" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const mainContent = (
    <main style={{
      flex: 1,
      overflowY: mobileMode ? "auto" : "visible",
      marginLeft: mobileMode ? 0 : 220,
      padding: mobileMode ? "20px 14px 24px" : "40px 40px 80px",
      maxWidth: mobileMode ? "100%" : 1100,
      minHeight: mobileMode ? 0 : "100vh",
      transition: "margin-left 0.3s",
      boxSizing: "border-box",
    }}>
      {activeView === "compartilhar" ? (
        <ShareSettings
          user={user} cycle={cycle} records={records} tk={tk}
          onBack={() => { setActiveView("main"); setActiveNav("inicio"); }}
          onPartnerSuccess={(s) => { if (typeof window !== "undefined") window.location.reload(); void s; }}
        />
      ) : activeView === "update-cycle" ? (
        <UpdateCyclePage
          current={cycle} email={user.email}
          onSaved={(c) => { setCycleState(c); saveUser({ ...user, firstAccessDone: true }); }}
          onBack={() => { setActiveView("main"); setActiveNav("inicio"); }}
        />
      ) : activeView === "historico" ? (
        <HistoryPage
          cycle={cycle} records={records}
          onBack={() => { setActiveView("main"); setActiveNav("inicio"); }}
          onDayClick={openDayDetail}
        />
      ) : activeView === "day-detail" ? (
        <DayDetailPage
          date={selectedDay} email={user.email} cycle={cycle}
          onBack={() => { setActiveView("main"); setActiveNav("calendario"); setTimeout(() => document.getElementById("calendario")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
        />
      ) : (
        <>
          {/* ciclo atual */}
          <div id="inicio" style={{ marginBottom: 40 }}>
            <div style={{ background: tk.card, borderRadius: 24, padding: mobileMode ? 16 : 36, border: `1px solid ${tk.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: mobileMode ? "1fr" : "auto 1fr", gap: mobileMode ? 20 : 48, alignItems: "center" }}>
                <CycleRing day={dayOfCycle} total={cycle.duracaoCiclo} phase={phase} phaseColor={phaseColor} onInfo={() => setShowPhaseModal(true)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Fase atual", value: phase, sub: "", color: phaseColor, bg: phaseColor + "18" },
                    { label: "Próxima mens.", value: fmtDate(nextPeriod), sub: `em ${daysToNext} dias`, color: tk.menstrual, bg: tk.menstrual + "18" },
                    { label: "Período fértil", value: `${fmtDate(fertileStart, { day: "numeric", month: "short" })} – ${fmtDate(fertileEnd, { day: "numeric", month: "short" })}`, sub: "Estimativa", color: tk.folicular, bg: tk.folicular + "18" },
                    { label: "Duração", value: `${cycle.duracaoCiclo} dias`, sub: `Mens.: ${cycle.duracaoPeriodo} dias`, color: tk.primary, bg: tk.primaryLight },
                  ].map((s) => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: mobileMode ? "12px 14px" : "16px 18px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 14 : 18, fontWeight: 700, color: tk.text, lineHeight: 1.2 }}>{s.value}</div>
                      {s.sub && <div style={{ fontSize: 10, color: tk.muted, marginTop: 3 }}>{s.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* calendário */}
          <div id="calendario" style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 17 : 20, fontWeight: 700, color: tk.text, margin: "0 0 14px" }}>Calendário do ciclo</h2>
            <Calendar cycle={cycle} records={records} selectedDay={selectedDay} onSelectDay={(d) => { setSelectedDay(d); openDayDetail(d); }} />
          </div>

          {/* check-in button — compact */}
          <div id="checkin" style={{ marginBottom: 40 }}>
            {(() => {
              const todayRec = records.find((r) => r.date === isoDate(new Date()) && (r.humor || r.sintomas?.length));
              const todayHumor = todayRec?.humor ? humorOptions.find((h) => h.value === todayRec.humor) : null;
              return (
                <button onClick={() => setShowCheckInModal(true)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 16, padding: mobileMode ? "16px 18px" : "18px 24px",
                  background: tk.card, border: `1.5px solid ${tk.border}`,
                  borderRadius: 18, cursor: "pointer", textAlign: "left", transition: "border-color 0.15s",
                }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = tk.primary; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = tk.border; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, background: tk.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {todayHumor ? todayHumor.emoji : "💜"}
                    </div>
                    <div>
                      <div style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 15 : 16, fontWeight: 700, color: tk.text }}>Como você está se sentindo hoje?</div>
                      <div style={{ fontSize: 12, color: tk.muted, marginTop: 2 }}>
                        {todayHumor ? `Hoje: ${todayHumor.label}${todayRec?.sintomas?.length ? ` · ${todayRec.sintomas.length} sintoma(s)` : ""}` : "Toque para registrar humor, sintomas e anotações"}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: tk.primary, fontSize: 18, flexShrink: 0 }}>→</div>
                </button>
              );
            })()}
          </div>
        </>
      )}
    </main>
  );

  const mainBg = darkMode
    ? tk.bg
    : "radial-gradient(ellipse 80% 55% at 0% 0%, #ffc8db99 0%, transparent 52%), radial-gradient(ellipse 70% 60% at 100% 2%, #ffb8d099 0%, transparent 48%), radial-gradient(ellipse 75% 55% at 100% 100%, #ffc8db99 0%, transparent 52%), radial-gradient(ellipse 70% 60% at 2% 98%, #ffb8d099 0%, transparent 48%), #fef6f9";

  if (mobileMode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: mainBg, fontFamily: "Outfit, sans-serif", transition: "background 0.3s" }}>
        {showPhaseModal && <PhaseModal phase={phase} phaseColor={phaseColor} day={dayOfCycle} total={cycle.duracaoCiclo} onClose={() => setShowPhaseModal(false)} />}
        {showCheckInModal && <CheckInModal email={user.email} onSave={refreshRecords} onClose={() => setShowCheckInModal(false)} />}
        {mobileHeader}
        {mainContent}
        {bottomNav}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: mainBg, fontFamily: "Outfit, sans-serif", transition: "background 0.3s, color 0.3s" }}>
      {showPhaseModal && <PhaseModal phase={phase} phaseColor={phaseColor} day={dayOfCycle} total={cycle.duracaoCiclo} onClose={() => setShowPhaseModal(false)} />}
      {showCheckInModal && <CheckInModal email={user.email} onSave={refreshRecords} onClose={() => setShowCheckInModal(false)} />}
      <aside style={{ width: 220, flexShrink: 0, background: tk.sidebar, borderRight: `1px solid ${tk.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 40, overflowY: "auto", transition: "background 0.3s" }}>
        {sidebarContent}
      </aside>
      {mainContent}
    </div>
  );
}
