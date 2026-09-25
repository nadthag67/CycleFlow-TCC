import { useState, useEffect } from "react";
import type { StoredUser, CycleData, DayRecord, SharingPermissions, PartnerSession } from "../auth/types";
import { sharingApi } from "../utils/sharingApi";
import { savePartnerSession } from "../auth/storage";

// ── theme tokens (injetados pelo Dashboard) ───────────────
interface Tk {
  bg: string; card: string; border: string; primary: string; primaryLight: string;
  text: string; muted: string; label: string; rose: string; roseLight: string;
}

interface Props {
  user: StoredUser;
  cycle: CycleData;
  records: DayRecord[];
  tk: Tk;
  onBack: () => void;
  onPartnerSuccess?: (session: PartnerSession) => void;
}

function Toggle({ value, onChange, color }: { value: boolean; onChange: (v: boolean) => void; color?: string }) {
  const activeColor = color ?? "#5c3ef4";
  return (
    <button
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      style={{
        width: 48, height: 26, borderRadius: 99, border: "none", cursor: "pointer",
        background: value ? activeColor : "#d0cce8",
        position: "relative", flexShrink: 0, transition: "background 0.22s",
        boxShadow: value ? `0 2px 8px ${activeColor}44` : "none",
      }}
    >
      <div style={{
        position: "absolute", top: 4, left: value ? 26 : 4,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.22s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
      }} />
    </button>
  );
}

const permDefs: { key: keyof SharingPermissions; emoji: string; label: string; desc: string; color: string }[] = [
  {
    key: "can_view_cycle",
    emoji: "🌸",
    label: "Ver meu ciclo",
    desc: "Permite visualizar informações gerais sobre meu ciclo, como fase atual e previsão da próxima menstruação.",
    color: "#e8649a",
  },
  {
    key: "can_view_calendar",
    emoji: "📅",
    label: "Ver meu calendário",
    desc: "Permite visualizar meu calendário e os registros relacionados ao ciclo.",
    color: "#5352ed",
  },
  {
    key: "can_view_notes",
    emoji: "📝",
    label: "Ver minhas anotações",
    desc: "Permite visualizar as anotações que compartilhei no Cycle Flow.",
    color: "#fd9644",
  },
  {
    key: "can_view_checkins",
    emoji: "💗",
    label: "Ver como estou me sentindo",
    desc: "Permite visualizar meu humor e os sintomas registrados no meu check-in.",
    color: "#ff4757",
  },
];

export function ShareSettings({ user, cycle, records, tk, onBack, onPartnerSuccess }: Props) {
  const [step, setStep] = useState<"main" | "permissions" | "enter-code">("main");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [sharingActive, setSharingActive] = useState(false);
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [perms, setPerms] = useState<SharingPermissions>({
    can_view_cycle: true, can_view_calendar: true,
    can_view_notes: false, can_view_checkins: true,
  });
  const [savingPerms, setSavingPerms] = useState(false);
  const [permsSaved, setPermsSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncOk, setSyncOk] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [partnerErro, setPartnerErro] = useState("");
  const [partnerLoading, setPartnerLoading] = useState(false);

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const status = await sharingApi.status(user.email);
      setSharingActive(status.active);
      if (status.active && status.code) {
        setCode(status.code);
        if (status.permissions) setPerms(status.permissions);
        if (status.viewerEmail) setViewerEmail(status.viewerEmail);
      }
    } catch {
      setError("Não foi possível verificar o status de compartilhamento.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true); setError("");
    try {
      const res = await sharingApi.generate(user.email);
      setCode(res.code);
      setSharingActive(true);
      await syncData();
      // go straight to permissions so user configures before sharing the code
      setStep("permissions");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao gerar código.");
    } finally {
      setLoading(false);
    }
  }

  async function syncData() {
    setSyncing(true);
    try {
      await sharingApi.pushData(user.email, cycle, records);
      setSyncOk(true);
      setTimeout(() => setSyncOk(false), 2500);
    } catch { /* silently fail */ }
    setSyncing(false);
  }

  async function handleSavePerms() {
    setSavingPerms(true);
    try {
      await sharingApi.updatePermissions(user.email, perms);
      setPermsSaved(true);
      setTimeout(() => {
        setPermsSaved(false);
        setStep("main");
      }, 1200);
    } catch {
      setError("Erro ao salvar permissões.");
    } finally {
      setSavingPerms(false);
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      await sharingApi.stop(user.email);
      setSharingActive(false); setCode(null); setViewerEmail(null); setShowConfirm(false);
    } catch {
      setError("Erro ao parar compartilhamento.");
    } finally {
      setStopping(false);
    }
  }

  async function handlePartnerCode() {
    if (!partnerCode.trim()) { setPartnerErro("Digite o código de acompanhamento."); return; }
    setPartnerLoading(true); setPartnerErro("");
    try {
      const result = await sharingApi.validate(partnerCode.trim().toUpperCase(), user.email);
      const session: PartnerSession = {
        type: "partner",
        code: partnerCode.trim().toUpperCase(),
        ownerEmail: result.ownerEmail,
        viewerEmail: user.email,
        permissions: result.permissions,
      };
      savePartnerSession(session);
      onPartnerSuccess?.(session);
    } catch (e: unknown) {
      setPartnerErro(e instanceof Error ? e.message : "Código inválido ou expirado.");
    } finally {
      setPartnerLoading(false);
    }
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  const cardStyle: React.CSSProperties = {
    background: tk.card, borderRadius: 20, padding: "22px 24px",
    border: `1px solid ${tk.border}`, marginBottom: 16,
  };

  const backBtn = (onClick: () => void) => (
    <button onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 12, border: `1.5px solid ${tk.border}`,
      background: tk.card, cursor: "pointer", fontSize: 18, color: tk.muted,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>←</button>
  );

  // ── enter-code step ────────────────────────────────────────
  if (step === "enter-code") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          {backBtn(() => setStep("main"))}
          <div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: tk.text, margin: 0 }}>Entrar em um acompanhamento</h2>
            <p style={{ fontSize: 13, color: tk.muted, margin: "4px 0 0" }}>Use um código recebido para visualizar o ciclo de outra pessoa.</p>
          </div>
        </div>

        <div style={cardStyle}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: tk.label, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Código de acompanhamento</label>
          <input
            type="text"
            value={partnerCode}
            onChange={(e) => { setPartnerCode(e.target.value.toUpperCase()); setPartnerErro(""); }}
            placeholder="CF-XXXX-XXXX"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16,
              border: `1.5px solid ${partnerErro ? tk.rose : tk.border}`,
              background: tk.bg, color: tk.text, outline: "none",
              fontFamily: "Fraunces, serif", fontWeight: 700, letterSpacing: 2,
              boxSizing: "border-box",
            }}
          />
          {partnerErro && (
            <div style={{ background: tk.roseLight, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: tk.rose, marginTop: 12 }}>
              ⚠️ {partnerErro}
            </div>
          )}
        </div>

        <button onClick={handlePartnerCode} disabled={partnerLoading}
          style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: partnerLoading ? tk.label : tk.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}>
          {partnerLoading ? "Verificando..." : "Entrar no acompanhamento →"}
        </button>
      </div>
    );
  }

  // ── permissions step ───────────────────────────────────────
  if (step === "permissions") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          {backBtn(() => setStep("main"))}
          <div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 700, color: tk.text, margin: 0 }}>O que essa pessoa pode ver?</h2>
            <p style={{ fontSize: 13, color: tk.muted, margin: "4px 0 0" }}>Você escolhe quais informações deseja compartilhar.</p>
          </div>
        </div>

        {/* privacy notice */}
        <div style={{
          ...cardStyle,
          background: tk.primaryLight, borderColor: tk.primary + "30",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>🔒</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tk.primary, marginBottom: 4 }}>Você controla o que é compartilhado</div>
            <div style={{ fontSize: 12, color: tk.muted, lineHeight: 1.6 }}>
              A pessoa só poderá visualizar as informações que você permitir. Essas permissões podem ser alteradas a qualquer momento.
            </div>
          </div>
        </div>

        {/* permission toggles */}
        <div style={{ background: tk.card, borderRadius: 20, border: `1px solid ${tk.border}`, overflow: "hidden", marginBottom: 16 }}>
          {permDefs.map(({ key, emoji, label, desc, color }, i) => (
            <div key={key} style={{
              display: "flex", alignItems: "flex-start", gap: 16,
              padding: "20px 24px",
              borderBottom: i < permDefs.length - 1 ? `1px solid ${tk.border}` : "none",
              transition: "background 0.15s",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13,
                background: perms[key] ? color + "18" : tk.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0, transition: "background 0.2s",
              }}>{emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: tk.text, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: tk.muted, lineHeight: 1.6 }}>{desc}</div>
              </div>
              <div style={{ paddingTop: 2 }}>
                <Toggle value={perms[key]} onChange={(v) => setPerms({ ...perms, [key]: v })} color={color} />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 12, background: tk.roseLight, color: tk.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>
        )}

        <button onClick={handleSavePerms} disabled={savingPerms || permsSaved}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: permsSaved ? "#26de81" : tk.primary,
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            transition: "background 0.3s",
          }}>
          {permsSaved ? "✓ Permissões salvas!" : savingPerms ? "Salvando..." : "Salvar permissões"}
        </button>
      </div>
    );
  }

  // ── main step ──────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        {backBtn(onBack)}
        <div>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: tk.text, margin: 0 }}>Compartilhar meu ciclo</h2>
          <p style={{ fontSize: 13, color: tk.muted, margin: "4px 0 0" }}>Compartilhe informações com alguém de confiança.</p>
        </div>
      </div>

      {loading ? (
        <div style={cardStyle}>
          <div style={{ textAlign: "center", color: tk.muted, fontSize: 14, padding: "16px 0" }}>Carregando...</div>
        </div>
      ) : !sharingActive ? (
        <>
          <div style={cardStyle}>
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🔗</div>
              <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: tk.text, margin: "0 0 10px" }}>Compartilhamento inativo</h3>
              <p style={{ fontSize: 13, color: tk.muted, lineHeight: 1.6, margin: 0 }}>
                Gere um código e compartilhe com namorado(a), familiar ou pessoa de confiança. Você controla exatamente o que eles podem ver.
              </p>
            </div>
          </div>
          {error && <div style={{ padding: "10px 14px", borderRadius: 12, background: tk.roseLight, color: tk.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button onClick={handleGenerate} disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: tk.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            🔑 Gerar código de compartilhamento
          </button>
        </>
      ) : (
        <>
          {/* código ativo */}
          <div style={{ ...cardStyle, background: tk.primaryLight, borderColor: tk.primary + "40" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tk.primary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Seu código de acompanhamento</div>
            <div style={{
              fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 700, color: tk.text,
              letterSpacing: 4, marginBottom: 18, textAlign: "center",
              background: tk.card, borderRadius: 14, padding: "14px 0",
              border: `1.5px solid ${tk.primary}30`,
            }}>{code}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={copyCode} style={{
                flex: 1, padding: "11px", borderRadius: 12,
                border: `1.5px solid ${tk.primary}`, background: copied ? tk.primary : "transparent",
                color: copied ? "#fff" : tk.primary, fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s",
              }}>
                {copied ? "✓ Copiado!" : "📋 Copiar código"}
              </button>
              <button onClick={() => setStep("permissions")} style={{
                flex: 1, padding: "11px", borderRadius: 12,
                border: `1.5px solid ${tk.border}`, background: tk.card,
                color: tk.muted, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                ⚙️ Gerenciar permissões
              </button>
            </div>
          </div>

          {/* viewer vinculado */}
          {viewerEmail && (
            <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#26de8120", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tk.text }}>Código em uso</div>
                <div style={{ fontSize: 12, color: tk.muted }}>{viewerEmail} tem acesso</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#26de81" }} />
                <span style={{ fontSize: 11, color: "#26de81", fontWeight: 700 }}>Ativo</span>
              </div>
            </div>
          )}

          {/* permissões resumo */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: tk.text }}>Permissões ativas</div>
              <button onClick={() => setStep("permissions")} style={{ fontSize: 12, color: tk.primary, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Editar →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {permDefs.map(({ key, emoji, label, color }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, opacity: perms[key] ? 1 : 0.35 }}>{emoji}</span>
                  <span style={{ fontSize: 13, color: perms[key] ? tk.text : tk.label, flex: 1 }}>{label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                    background: perms[key] ? color + "18" : tk.bg,
                    color: perms[key] ? color : tk.label,
                    border: `1px solid ${perms[key] ? color + "30" : tk.border}`,
                  }}>{perms[key] ? "ON" : "OFF"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* sincronizar */}
          <button onClick={syncData} disabled={syncing} style={{
            width: "100%", padding: "11px", borderRadius: 14,
            border: `1.5px solid ${tk.border}`, background: "transparent",
            color: syncOk ? "#26de81" : tk.muted, fontSize: 13, fontWeight: 600, cursor: "pointer",
            marginBottom: 16,
          }}>
            {syncOk ? "✓ Dados sincronizados!" : syncing ? "Sincronizando..." : "🔄 Sincronizar dados agora"}
          </button>

          {error && <div style={{ padding: "10px 14px", borderRadius: 12, background: tk.roseLight, color: tk.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>}

          {/* parar compartilhamento */}
          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)} style={{
              width: "100%", padding: "12px", borderRadius: 14,
              border: `1.5px solid ${tk.rose}`, background: "transparent",
              color: tk.rose, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              Parar de compartilhar
            </button>
          ) : (
            <div style={{ ...cardStyle, background: tk.roseLight, borderColor: tk.rose + "40" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: tk.text, marginBottom: 6 }}>Parar de compartilhar?</div>
              <p style={{ fontSize: 13, color: tk.muted, margin: "0 0 16px", lineHeight: 1.6 }}>
                A pessoa perderá o acesso às informações que você compartilhou. Seus dados continuarão salvos na sua conta.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "10px", borderRadius: 12, border: `1.5px solid ${tk.border}`, background: "transparent", color: tk.muted, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleStop} disabled={stopping} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: tk.rose, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {stopping ? "Parando..." : "Parar de compartilhar"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 18px" }}>
        <div style={{ flex: 1, height: 1, background: tk.border }} />
        <span style={{ fontSize: 11, color: tk.label, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>ou</span>
        <div style={{ flex: 1, height: 1, background: tk.border }} />
      </div>

      <button onClick={() => setStep("enter-code")} style={{
        width: "100%", padding: "13px", borderRadius: 14,
        border: `1.5px solid ${tk.border}`, background: "transparent",
        color: tk.muted, fontSize: 14, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        🤝 Entrar em um acompanhamento compartilhado
      </button>
    </div>
  );
}
