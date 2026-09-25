import { useState } from "react";
import type { StoredUser, CycleData, PartnerSession } from "../auth/types";
import { saveCycle, saveUser, savePartnerSession } from "../auth/storage";
import { sharingApi } from "../utils/sharingApi";

interface Props {
  user: StoredUser;
  onDone: (cycle: CycleData) => void;
  onPartnerSuccess: (session: PartnerSession) => void;
}

export function Onboarding({ user, onDone, onPartnerSuccess }: Props) {
  const [goal, setGoal] = useState<"own" | "partner" | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [duracaoCiclo, setDuracaoCiclo] = useState("28");
  const [duracaoPeriodo, setDuracaoPeriodo] = useState("5");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0); // 0 = goal, 1 = date, 2 = duration, 3 = partner code

  // partner code state
  const [shareCode, setShareCode] = useState("");
  const [shareErro, setShareErro] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!dataInicio) e.dataInicio = "Informe a data de início";
    const ci = parseInt(duracaoCiclo);
    const pi = parseInt(duracaoPeriodo);
    if (isNaN(ci) || ci < 21 || ci > 35) e.duracaoCiclo = "Entre 21 e 35 dias";
    if (isNaN(pi) || pi < 2 || pi > 7) e.duracaoPeriodo = "Entre 2 e 7 dias";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const cycle: CycleData = {
      dataInicio,
      duracaoCiclo: parseInt(duracaoCiclo),
      duracaoPeriodo: parseInt(duracaoPeriodo),
    };
    saveCycle(user.email, cycle);
    saveUser({ ...user, firstAccessDone: true });
    onDone(cycle);
  };

  const handleCodeEntry = async () => {
    if (!shareCode.trim()) { setShareErro("Digite o código de acompanhamento."); return; }
    setShareLoading(true); setShareErro("");
    try {
      const result = await sharingApi.validate(shareCode.trim().toUpperCase(), user.email);
      const session: PartnerSession = {
        type: "partner",
        code: shareCode.trim().toUpperCase(),
        ownerEmail: result.ownerEmail,
        viewerEmail: user.email,
        permissions: result.permissions,
      };
      savePartnerSession(session);
      onPartnerSuccess(session);
    } catch (e: unknown) {
      setShareErro(e instanceof Error ? e.message : "Código inválido ou expirado.");
    } finally {
      setShareLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // total steps for progress bar: goal=0, date=1, duration=2 (or partner=3)
  const totalSteps = goal === "partner" ? 2 : 3;
  const currentStep = step === 0 ? 1 : step === 3 ? 2 : step + 1;

  const btnBase: React.CSSProperties = {
    width: "100%", padding: "13px", borderRadius: 12,
    border: "none", background: "#e8649a", color: "#fff", fontSize: 15,
    fontWeight: 700, cursor: "pointer", fontFamily: "Outfit, sans-serif",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#fdf8f5", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 700, color: "#1a1020", margin: "0 0 8px" }}>
            Olá, {user.nome.split(" ")[0]}!
          </h1>
          <p style={{ fontSize: 16, color: "#7a6a82", margin: 0, lineHeight: 1.6 }}>
            {step === 0
              ? "Vamos começar. Como você pretende usar o Cycle Flow?"
              : "Só mais alguns detalhes para configurar tudo certinho."}
          </p>
        </div>

        {/* progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 99,
              background: i < currentStep ? "#e8649a" : "#f0d8e8",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        <div style={{
          background: "#fff", borderRadius: 24, padding: "36px 32px",
          border: "1px solid #f0d8e8", boxShadow: "0 8px 40px #e8649a0d",
        }}>

          {/* step 0 — goal selection */}
          {step === 0 && (
            <>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: "#1a1020", marginBottom: 8 }}>
                Qual é o seu objetivo?
              </h2>
              <p style={{ fontSize: 14, color: "#7a6a82", marginBottom: 28, lineHeight: 1.6 }}>
                Escolha como você quer usar o aplicativo agora. Você pode mudar depois nas configurações.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <button
                  onClick={() => { setGoal("own"); setStep(1); }}
                  style={{
                    padding: "20px 24px", borderRadius: 16, border: "2px solid #f0d8e8",
                    background: "#fdf8f5", cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = "#e8649a"; e.currentTarget.style.background = "#fef5f9"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = "#f0d8e8"; e.currentTarget.style.background = "#fdf8f5"; }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🌸</div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700, color: "#1a1020", marginBottom: 4 }}>
                    Acompanhar meu próprio ciclo
                  </div>
                  <div style={{ fontSize: 13, color: "#7a6a82", lineHeight: 1.5 }}>
                    Registrar meu ciclo, sintomas, humor e receber previsões personalizadas.
                  </div>
                </button>

                <button
                  onClick={() => { setGoal("partner"); setStep(3); }}
                  style={{
                    padding: "20px 24px", borderRadius: 16, border: "2px solid #f0d8e8",
                    background: "#fdf8f5", cursor: "pointer", textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = "#7c3f8e"; e.currentTarget.style.background = "#f9f5ff"; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = "#f0d8e8"; e.currentTarget.style.background = "#fdf8f5"; }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🤝</div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700, color: "#1a1020", marginBottom: 4 }}>
                    Acompanhar o ciclo de alguém
                  </div>
                  <div style={{ fontSize: 13, color: "#7a6a82", lineHeight: 1.5 }}>
                    Recebi um código de acompanhamento e quero ver as informações compartilhadas comigo.
                  </div>
                </button>
              </div>
            </>
          )}

          {/* step 1 — start date */}
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: "#1a1020", marginBottom: 8 }}>
                Início do último ciclo
              </h2>
              <p style={{ fontSize: 14, color: "#7a6a82", marginBottom: 28, lineHeight: 1.6 }}>
                Quando foi o primeiro dia da sua última menstruação?
              </p>

              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5a4a62", marginBottom: 6 }}>
                Data de início
              </label>
              <input
                type="date"
                max={today}
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setErros({}); }}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 15,
                  border: `1.5px solid ${erros.dataInicio ? "#e8649a" : "#f0d8e8"}`,
                  background: "#fdf8f5", color: "#1a1020", outline: "none",
                  fontFamily: "Outfit, sans-serif", boxSizing: "border-box",
                }}
              />
              {erros.dataInicio && (
                <p style={{ fontSize: 12, color: "#e8649a", marginTop: 4 }}>{erros.dataInicio}</p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 600, border: "1.5px solid #f0d8e8", background: "transparent", color: "#7a6a82", cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
                  ← Voltar
                </button>
                <button
                  onClick={() => { if (!dataInicio) { setErros({ dataInicio: "Informe a data de início" }); return; } setStep(2); }}
                  style={{ ...btnBase, flex: 2 }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#c73f7a"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "#e8649a"; }}
                >
                  Continuar →
                </button>
              </div>
            </>
          )}

          {/* step 2 — cycle duration */}
          {step === 2 && (
            <>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: "#1a1020", marginBottom: 8 }}>
                Duração do seu ciclo
              </h2>
              <p style={{ fontSize: 14, color: "#7a6a82", marginBottom: 28, lineHeight: 1.6 }}>
                Quanto tempo costuma durar seu ciclo e seu período menstrual? Se não souber ao certo, os valores padrão são uma boa estimativa.
              </p>

              {[
                { label: "Duração do ciclo (dias)", value: duracaoCiclo, set: setDuracaoCiclo, min: 21, max: 35, error: erros.duracaoCiclo, hint: "Normalmente entre 21 e 35 dias" },
                { label: "Duração da menstruação (dias)", value: duracaoPeriodo, set: setDuracaoPeriodo, min: 2, max: 7, error: erros.duracaoPeriodo, hint: "Normalmente entre 2 e 7 dias" },
              ].map((f) => (
                <div key={f.label} style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5a4a62", marginBottom: 6 }}>
                    {f.label}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => f.set(String(Math.max(f.min, parseInt(f.value) - 1)))}
                      style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #f0d8e8", background: "#fdf8f5", fontSize: 20, cursor: "pointer", color: "#e8649a" }}>−</button>
                    <input
                      type="number" min={f.min} max={f.max}
                      value={f.value}
                      onChange={(e) => { f.set(e.target.value); setErros({}); }}
                      style={{ flex: 1, padding: "11px 14px", borderRadius: 12, textAlign: "center", border: `1.5px solid ${f.error ? "#e8649a" : "#f0d8e8"}`, background: "#fdf8f5", fontSize: 18, fontWeight: 700, fontFamily: "Fraunces, serif", color: "#1a1020", outline: "none", boxSizing: "border-box" }}
                    />
                    <button onClick={() => f.set(String(Math.min(f.max, parseInt(f.value) + 1)))}
                      style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #f0d8e8", background: "#fdf8f5", fontSize: 20, cursor: "pointer", color: "#e8649a" }}>+</button>
                  </div>
                  {f.error
                    ? <p style={{ fontSize: 12, color: "#e8649a", marginTop: 4 }}>{f.error}</p>
                    : <p style={{ fontSize: 12, color: "#9a8aaa", marginTop: 4 }}>{f.hint}</p>
                  }
                </div>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 600, border: "1.5px solid #f0d8e8", background: "transparent", color: "#7a6a82", cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
                  ← Voltar
                </button>
                <button onClick={handleSubmit} style={{ ...btnBase, flex: 2 }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#c73f7a"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "#e8649a"; }}
                >
                  Ver meu calendário 🌸
                </button>
              </div>
            </>
          )}

          {/* step 3 — partner code entry */}
          {step === 3 && (
            <>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: "#1a1020", marginBottom: 8 }}>
                Código de acompanhamento
              </h2>
              <p style={{ fontSize: 14, color: "#7a6a82", marginBottom: 28, lineHeight: 1.6 }}>
                Insira o código que a pessoa compartilhou com você para acessar as informações do ciclo dela.
              </p>

              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5a4a62", marginBottom: 6 }}>
                Código de acompanhamento
              </label>
              <input
                type="text"
                value={shareCode}
                onChange={(e) => { setShareCode(e.target.value.toUpperCase()); setShareErro(""); }}
                placeholder="CF-XXXX-XXXX"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, fontSize: 16,
                  border: `1.5px solid ${shareErro ? "#e8649a" : "#f0d8e8"}`,
                  background: "#fdf8f5", color: "#1a1020", outline: "none",
                  fontFamily: "Fraunces, serif", fontWeight: 700, letterSpacing: 2,
                  boxSizing: "border-box",
                }}
              />
              {shareErro && (
                <div style={{ background: "#fdf2f7", border: "1px solid #f0d8e8", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#e8649a", marginTop: 10 }}>
                  ⚠️ {shareErro}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 600, border: "1.5px solid #f0d8e8", background: "transparent", color: "#7a6a82", cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
                  ← Voltar
                </button>
                <button onClick={handleCodeEntry} disabled={shareLoading}
                  style={{ ...btnBase, flex: 2, background: shareLoading ? "#b0a0b8" : "#7c3f8e", opacity: shareLoading ? 0.8 : 1 }}
                >
                  {shareLoading ? "Verificando..." : "Entrar no acompanhamento →"}
                </button>
              </div>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f0d8e8", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#9a8aaa", margin: "0 0 10px" }}>Prefere criar seu próprio registro?</p>
                <button onClick={() => { setGoal("own"); setStep(1); }}
                  style={{ fontSize: 13, fontWeight: 600, color: "#e8649a", background: "none", border: "none", cursor: "pointer" }}>
                  Acompanhar meu próprio ciclo →
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
