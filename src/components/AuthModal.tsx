import { useState } from "react";
import type { StoredUser, PartnerSession } from "../auth/types";
import { saveUser, findUser, saveSession, savePartnerSession } from "../auth/storage";
import { sharingApi } from "../utils/sharingApi";

// ── shared primitives ─────────────────────────────────────
function Backdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(26,16,32,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        overflowY: "auto",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, margin: "auto" }}>
        {children}
      </div>
    </div>
  );
}

function Field({
  label, type = "text", value, onChange, placeholder, error, hint,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; error?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#5a4a62", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 12,
          border: `1.5px solid ${error ? "#e8649a" : focused ? "#e8649a" : "#f0d8e8"}`,
          background: "#fdf8f5", fontSize: 14, color: "#1a1020",
          outline: "none", fontFamily: "Outfit, sans-serif",
          transition: "border-color 0.2s", boxSizing: "border-box",
        }}
      />
      {error && <p style={{ fontSize: 12, color: "#e8649a", marginTop: 4, marginBottom: 0 }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, color: "#9a8aaa", marginTop: 4, marginBottom: 0 }}>{hint}</p>}
    </div>
  );
}

function Btn({
  children, onClick, variant = "primary", disabled,
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "secondary" | "google"; disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "#e8649a", color: "#fff", border: "none", boxShadow: "0 2px 12px #e8649a33" },
    secondary: { background: "transparent", color: "#7c3f8e", border: "1.5px solid #7c3f8e" },
    google: { background: "#fff", color: "#3a2a42", border: "1.5px solid #f0d8e8" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "13px", borderRadius: 12,
        fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontFamily: "Outfit, sans-serif", transition: "opacity 0.2s, filter 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        ...styles[variant],
      }}
      onMouseOver={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.92)"; }}
      onMouseOut={(e) => { e.currentTarget.style.filter = "none"; }}
    >
      {children}
    </button>
  );
}

// ── modal header ──────────────────────────────────────────
function ModalHeader({ icon, title, subtitle, gradient }: {
  icon: string; title: string; subtitle: string; gradient: string;
}) {
  return (
    <div style={{ background: gradient, padding: "28px 32px" }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: "#ffffff99", marginTop: 4, marginBottom: 0 }}>{subtitle}</p>
    </div>
  );
}

// ── types ─────────────────────────────────────────────────
type ModalType = "login" | "cadastro";

interface Props {
  initial: ModalType;
  onClose: () => void;
  onSuccess: (user: StoredUser) => void;
  onPartnerSuccess: (session: PartnerSession) => void;
}

// ── main component ────────────────────────────────────────
export function AuthModal({ initial, onClose, onSuccess, onPartnerSuccess }: Props) {
  const [mode, setMode] = useState<ModalType>(initial);
  const [showCodeEntry, setShowCodeEntry] = useState(false);

  // cadastro
  const [cNome, setCNome] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cSenha, setCSenha] = useState("");
  const [cConfirma, setCConfirma] = useState("");
  const [cErros, setCErros] = useState<Record<string, string>>({});

  // login
  const [lEmail, setLEmail] = useState("");
  const [lSenha, setLSenha] = useState("");
  const [lErro, setLErro] = useState("");

  // código de acompanhamento
  const [shareCode, setShareCode] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareErro, setShareErro] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const switchMode = (m: ModalType) => {
    setMode(m); setShowCodeEntry(false);
    setCNome(""); setCEmail(""); setCSenha(""); setCConfirma(""); setCErros({});
    setLEmail(""); setLSenha(""); setLErro("");
    setShareCode(""); setShareEmail(""); setShareErro("");
  };

  const handleCodeEntry = async () => {
    if (!shareCode.trim()) { setShareErro("Digite o código."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shareEmail)) { setShareErro("E-mail inválido."); return; }
    setShareLoading(true); setShareErro("");
    try {
      const result = await sharingApi.validate(shareCode.trim(), shareEmail.trim());
      const session: PartnerSession = {
        type: "partner",
        code: shareCode.trim().toUpperCase(),
        ownerEmail: result.ownerEmail,
        viewerEmail: shareEmail.trim(),
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

  const handleCadastro = () => {
    const erros: Record<string, string> = {};
    if (!cNome.trim()) erros.nome = "Nome é obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail)) erros.email = "E-mail inválido";
    if (cSenha.length < 6) erros.senha = "Mínimo 6 caracteres";
    if (cSenha !== cConfirma) erros.confirma = "As senhas não coincidem";
    if (!erros.email && findUser(cEmail)) erros.email = "E-mail já cadastrado";
    if (Object.keys(erros).length > 0) { setCErros(erros); return; }
    const newUser: StoredUser = { nome: cNome.trim(), email: cEmail.trim(), senha: cSenha, verified: true, firstAccessDone: false, createdAt: new Date().toISOString() };
    saveUser(newUser);
    saveSession(newUser);
    onSuccess(newUser);
  };

  const handleLogin = () => {
    const found = findUser(lEmail);
    if (!found || found.senha !== lSenha) { setLErro("E-mail ou senha incorretos"); return; }
    const verified: StoredUser = { ...found, verified: true };
    saveUser(verified);
    saveSession(verified);
    onSuccess(verified);
  };


  const handleGoogleAuth = () => {
    // Stub — requer configuração real de OAuth (Supabase, Firebase, etc.)
    alert("Autenticação com Google requer integração com backend (Supabase / Firebase). Configure as credenciais OAuth para ativar esta função.");
  };

  const card = (
    <div style={{ background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px #1a102044" }}>

      {/* ── CADASTRO FORM ── */}
      {mode === "cadastro" && (
        <>
          <ModalHeader
            icon="🌸"
            title="Criar conta"
            subtitle="Acompanhe seu ciclo com o Cycle Flow"
            gradient="linear-gradient(135deg,#e8649a,#7c3f8e)"
          />
          <div style={{ padding: "28px 32px" }}>
            <Btn variant="google" onClick={handleGoogleAuth}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuar com o Google
            </Btn>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#f0d8e8" }} />
              <span style={{ fontSize: 12, color: "#b0a0b8" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "#f0d8e8" }} />
            </div>
            <Field label="Nome completo" value={cNome} onChange={setCNome} placeholder="Seu nome" error={cErros.nome} />
            <Field label="E-mail" type="email" value={cEmail} onChange={setCEmail} placeholder="seu@email.com" error={cErros.email} />
            <Field label="Senha" type="password" value={cSenha} onChange={setCSenha} placeholder="Mínimo 6 caracteres" error={cErros.senha} />
            <Field label="Confirmar senha" type="password" value={cConfirma} onChange={setCConfirma} placeholder="Repita a senha" error={cErros.confirma} />
            <Btn onClick={handleCadastro}>Criar minha conta</Btn>
            <p style={{ textAlign: "center", fontSize: 13, color: "#9a8aaa", marginTop: 16, marginBottom: 0 }}>
              Já tem conta?{" "}
              <button onClick={() => switchMode("login")}
                style={{ background: "none", border: "none", color: "#e8649a", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Entrar
              </button>
            </p>
          </div>
        </>
      )}

      {/* ── LOGIN FORM ── */}
      {mode === "login" && (
        <>
          <ModalHeader
            icon="🔑"
            title="Entrar"
            subtitle="Bem-vinda de volta ao Cycle Flow"
            gradient="linear-gradient(135deg,#7c3f8e,#e8649a)"
          />
          <div style={{ padding: "28px 32px" }}>
            <Btn variant="google" onClick={handleGoogleAuth}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuar com o Google
            </Btn>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#f0d8e8" }} />
              <span style={{ fontSize: 12, color: "#b0a0b8" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "#f0d8e8" }} />
            </div>
            <Field label="E-mail" type="email" value={lEmail} onChange={(v) => { setLEmail(v); setLErro(""); }} placeholder="seu@email.com" />
            <Field label="Senha" type="password" value={lSenha} onChange={(v) => { setLSenha(v); setLErro(""); }} placeholder="Sua senha" />
            {lErro && (
              <div style={{
                background: "#fdf2f7", border: "1px solid #f0d8e8", borderRadius: 10,
                padding: "10px 14px", fontSize: 13, color: "#e8649a", marginBottom: 16,
                display: "flex", gap: 8,
              }}>
                ⚠️ {lErro}
              </div>
            )}
            <Btn onClick={handleLogin}>Entrar na minha conta</Btn>

            {/* ── código de acompanhamento ── */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: "#f0d8e8" }} />
                <button onClick={() => setShowCodeEntry(!showCodeEntry)}
                  style={{ background: "none", border: "none", color: "#7c3f8e", fontWeight: 600, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
                  🔗 Tenho um código de acompanhamento
                </button>
                <div style={{ flex: 1, height: 1, background: "#f0d8e8" }} />
              </div>

              {showCodeEntry && (
                <div style={{ background: "#f5f3ff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #ebe7ff" }}>
                  <p style={{ fontSize: 12, color: "#6b6890", margin: "0 0 14px", lineHeight: 1.5 }}>
                    Insira o código que você recebeu e seu e-mail para acessar o acompanhamento compartilhado.
                  </p>
                  <Field
                    label="Código de acompanhamento"
                    value={shareCode}
                    onChange={(v) => { setShareCode(v.toUpperCase()); setShareErro(""); }}
                    placeholder="CF-XXXX-XXXX"
                  />
                  <Field
                    label="Seu e-mail"
                    type="email"
                    value={shareEmail}
                    onChange={(v) => { setShareEmail(v); setShareErro(""); }}
                    placeholder="seu@email.com"
                  />
                  {shareErro && (
                    <div style={{ background: "#fdf2f7", border: "1px solid #f0d8e8", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#e8649a", marginBottom: 12 }}>
                      ⚠️ {shareErro}
                    </div>
                  )}
                  <Btn onClick={handleCodeEntry} disabled={shareLoading}>
                    {shareLoading ? "Verificando..." : "Entrar no acompanhamento"}
                  </Btn>
                </div>
              )}
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "#9a8aaa", marginTop: 16, marginBottom: 0 }}>
              Não tem conta?{" "}
              <button onClick={() => switchMode("cadastro")}
                style={{ background: "none", border: "none", color: "#e8649a", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Cadastrar
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );

  return <Backdrop onClose={onClose}>{card}</Backdrop>;
}
