import { useState } from "react";

// ── cherry blossom SVG helper (light mode decoration) ─────
function Blossom({ size = 60, opacity = 0.28, rotate = 0, color = "#f4a8c0" }: { size?: number; opacity?: number; rotate?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ transform: `rotate(${rotate}deg)`, display: "block" }} aria-hidden>
      {[0, 72, 144, 216, 288].map((r, i) => (
        <ellipse key={i} cx="30" cy="19" rx="8.5" ry="14" fill={color} opacity={opacity} transform={`rotate(${r} 30 30)`} />
      ))}
      {[0, 72, 144, 216, 288].map((r, i) => (
        <ellipse key={`v${i}`} cx="30" cy="21" rx="3" ry="9" fill="#e8849a" opacity={opacity * 0.5} transform={`rotate(${r} 30 30)`} />
      ))}
      <circle cx="30" cy="30" r="5" fill="#e8849a" opacity={opacity * 1.3} />
      <circle cx="30" cy="30" r="2.5" fill="#fff" opacity={opacity * 0.8} />
    </svg>
  );
}
import { AuthModal } from "./components/AuthModal";
import { Onboarding } from "./components/Onboarding";
import { Dashboard } from "./components/Dashboard";
import { ChatBot } from "./components/ChatBot";
import { SharedView } from "./components/SharedView";
import type { StoredUser, CycleData, PartnerSession } from "./auth/types";
import { getSession, saveSession, getProfile, getPartnerSession, savePartnerSession } from "./auth/storage";

const backendSteps = [
  { num: "01", title: "Criar projeto Spring Boot", detail: "Gerar no Spring Initializr com as dependências Spring Web e Spring DevTools.", pizzaria: "Projeto Pizzaria", cycleflow: "Projeto CycleFlow", tag: "Setup" },
  { num: "02", title: "Estrutura MVC", detail: "Organizar os pacotes: entity, controller, repository, service.", pizzaria: "br.com.pizzaria", cycleflow: "br.com.cycleflow", tag: "Arquitetura" },
  { num: "03", title: "Entities do DER", detail: "Criar classes Java com @Entity, @Id, @GeneratedValue baseadas no DER do TCC.", pizzaria: "Produto, Categoria, Pedido", cycleflow: "Usuaria, Ciclo, Sintoma, Fase", tag: "Entidades" },
  { num: "04", title: "Getters e Setters", detail: "Encapsular os atributos de cada Entity com os métodos get/set.", pizzaria: "getProduto(), setNome()", cycleflow: "getUsuaria(), setDataInicio()", tag: "Java" },
  { num: "05", title: "Controllers", detail: "Criar @RestController para cada entidade com os endpoints REST.", pizzaria: "ProdutoController", cycleflow: "UsuariaController, CicloController, SintomaController", tag: "REST" },
  { num: "06", title: "Endpoints da API", detail: "GET (listar/buscar), POST (cadastrar), PUT (atualizar), DELETE (excluir).", pizzaria: "/produtos, /categorias", cycleflow: "/usuarias, /ciclos, /sintomas, /fases", tag: "API" },
  { num: "07", title: "Spring Data JPA + SQL Server", detail: "Configurar application.properties com JDBC do SQL Server e JPA/Hibernate.", pizzaria: "db_pizzaria", cycleflow: "db_cycleflow", tag: "Banco" },
  { num: "08", title: "Repositories", detail: "Criar interfaces que estendem JpaRepository para cada entidade.", pizzaria: "ProdutoRepository", cycleflow: "UsuariaRepository, CicloRepository, SintomaRepository", tag: "JPA" },
  { num: "09", title: "Services", detail: "Implementar regras de negócio e operações do sistema nas classes @Service.", pizzaria: "ProdutoService", cycleflow: "CicloService (cálculo de previsão), SintomaService", tag: "Lógica" },
  { num: "10", title: "CRUD Completo", detail: "Implementar as operações de Create, Read, Update e Delete em cada Service.", pizzaria: "CRUD Produto", cycleflow: "CRUD Usuaria, Ciclo, Sintoma, Fase", tag: "CRUD" },
  { num: "11", title: "Testes com Insomnia / Postman", detail: "Testar todos os endpoints da API antes de integrar ao Front-End.", pizzaria: "POST /produtos", cycleflow: "POST /ciclos, GET /usuarias/{id}/ciclos", tag: "Testes" },
  { num: "12", title: "CORS + GitHub", detail: "Configurar CORS para comunicação com o Front-End e commitar no GitHub.", pizzaria: "allowedOrigins pizzaria-frontend", cycleflow: "allowedOrigins cycleflow-frontend", tag: "Deploy" },
];

const team = [
  { rm: "99764", name: "Pedro Henrique Rodrigues da Silva", role: "Gerente" },
  { rm: "99735", name: "João Pedro Silva Campos", role: "Operador" },
  { rm: "100488", name: "João Pedro Teixeira Santos", role: "Gerente de TI" },
  { rm: "99756", name: "Mario Rafael de Araujo Pires", role: "Gerente Financeiro" },
  { rm: "99870", name: "Carlos Daniel Lazaro Modolo Araujo", role: "CEO" },
  { rm: "99560", name: "Ricardo Ramalho da Silva", role: "Desenvolvedor" },
];

const features = [
  { icon: "🩸", title: "Registro do Ciclo", desc: "Cadastro da data de início, duração do ciclo e do período menstrual com armazenamento histórico completo." },
  { icon: "📅", title: "Previsão Inteligente", desc: "Previsão automática da próxima menstruação e estimativa do período fértil com base nos ciclos anteriores." },
  { icon: "💊", title: "Sintomas Diários", desc: "Registro diário de cólicas, dores, alterações de humor, inchaço e outros sintomas ao longo do ciclo." },
  { icon: "📊", title: "Dashboard", desc: "Painel visual com resumo do ciclo atual, fase do ciclo, data da última e próxima menstruação." },
  { icon: "🔒", title: "Privacidade Total", desc: "Dados protegidos com autenticação, sem compartilhamento com terceiros, armazenamento seguro." },
  { icon: "📱", title: "Multi-plataforma", desc: "Funciona em computadores, tablets e smartphones, com sincronização entre web e mobile em tempo real." },
];

const phases = [
  { name: "Menstrual", days: "Dias 1–5", color: "#e8649a", desc: "Início do ciclo. Registro da menstruação e sintomas." },
  { name: "Folicular", days: "Dias 1–13", color: "#b57bc8", desc: "Fase de preparação do organismo antes da ovulação." },
  { name: "Ovulação", days: "Dia 14", color: "#7c3f8e", desc: "Período fértil. Sistema calcula e notifica a usuária." },
  { name: "Lútea", days: "Dias 15–28", color: "#c73f7a", desc: "Fase pré-menstrual com monitoramento de humor e sintomas." },
];

const navItems = ["Sobre", "Equipe"];

// ── mobile wrapper ────────────────────────────────────────
function MobileWrapper({ mobileMode, children }: { mobileMode: boolean; children: React.ReactNode }) {
  if (!mobileMode) return <>{children}</>;
  return (
    <div style={{ background: "#111", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 0" }}>
      <div style={{
        width: 390, flexShrink: 0, minHeight: "100vh",
        borderRadius: 36, overflow: "hidden",
        boxShadow: "0 0 0 10px #222, 0 0 0 12px #333, 0 32px 80px rgba(0,0,0,0.8)",
        position: "relative",
      }}>
        {/* phone notch */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 28, background: "#222", borderRadius: "0 0 18px 18px", zIndex: 9999 }} />
        <div style={{ transform: "scale(1)", transformOrigin: "top center", width: 390 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── app principal ─────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState("Sobre");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<"login" | "cadastro" | null>(null);
  const [user, setUser] = useState<StoredUser | null>(getSession);
  const [cycle, setCycle] = useState<CycleData | null>(() => {
    const s = getSession();
    return s ? (getProfile(s.email)?.cycle ?? null) : null;
  });
  const [partnerSession, setPartnerSession] = useState<PartnerSession | null>(getPartnerSession);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [mobileMode, setMobileMode] = useState(() => localStorage.getItem("mobile") === "true");

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  const toggleMobile = () => {
    const next = !mobileMode;
    setMobileMode(next);
    localStorage.setItem("mobile", next ? "true" : "false");
  };

  // theme tokens
  const c = darkMode ? {
    bg:       "#0d0812",
    bgAlt:    "#100818",
    card:     "#1a1020",
    nav:      "rgba(13,8,18,0.96)",
    text:     "#f0e8f8",
    text2:    "#c0a8d8",
    muted:    "#9a8aaa",
    muted2:   "#6a5a7a",
    border:   "#2a1a30",
    border2:  "#1e1028",
    hoverCard:"#1e1028",
    hoverPink:"#250a1c",
    pinkTag:  "#200a18",
    footer:   "#060310",
    ftText:   "#4a3a5a",
    ftLink:   "#5a4a6a",
    quote:    "#1e0a18",
    infoCard: "#1a1020",
    teamBg:   "#100818",
    heroBlob1:"radial-gradient(circle, #3a0a2855 0%, transparent 70%)",
    heroBlob2:"radial-gradient(circle, #1a0a3066 0%, transparent 70%)",
  } : {
    bg:       "radial-gradient(ellipse 80% 55% at 0% 0%, #ffc8db99 0%, transparent 52%), radial-gradient(ellipse 70% 60% at 100% 2%, #ffb8d099 0%, transparent 48%), radial-gradient(ellipse 75% 55% at 100% 100%, #ffc8db99 0%, transparent 52%), radial-gradient(ellipse 70% 60% at 2% 98%, #ffb8d099 0%, transparent 48%), #fef6f9",
    bgAlt:    "#fff",
    card:     "#fff",
    nav:      "rgba(254,246,249,0.93)",
    text:     "#1a1020",
    text2:    "#3a2a42",
    muted:    "#7a6a82",
    muted2:   "#9a8aaa",
    border:   "#f0d8e8",
    border2:  "#f5e8f0",
    hoverCard:"#fef6f9",
    hoverPink:"#fdf2f7",
    pinkTag:  "#fdf2f7",
    footer:   "#1a1020",
    ftText:   "#5a4a62",
    ftLink:   "#5a4a62",
    quote:    "#fdf2f7",
    infoCard: "#fff",
    teamBg:   "#fff",
    heroBlob1:"radial-gradient(circle, #f9b8d066 0%, transparent 65%)",
    heroBlob2:"radial-gradient(circle, #f4c4e077 0%, transparent 65%)",
  };

  const scrollTo = (section: string) => {
    document.getElementById(section.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    setActiveNav(section);
    setMenuOpen(false);
  };

  const handleAuthSuccess = (u: StoredUser) => {
    setModal(null);
    setUser(u);
    const profile = getProfile(u.email);
    setCycle(profile?.cycle ?? null);
  };

  const handleLogout = () => {
    saveSession(null);
    setUser(null);
    setCycle(null);
  };

  const handleOnboardingDone = (cd: CycleData) => {
    setCycle(cd);
    const fresh = getSession();
    if (fresh) setUser({ ...fresh, firstAccessDone: true });
  };

  if (partnerSession) {
    return (
      <>
        <SharedView
          session={partnerSession}
          darkMode={darkMode}
          onExit={() => {
            savePartnerSession(null);
            setPartnerSession(null);
          }}
        />
        <ChatBot darkMode={darkMode} />
      </>
    );
  }

  if (user) {
    // Se já tem dados de ciclo salvos, vai direto para o Dashboard
    if (cycle) {
      return (
        <>
          <MobileWrapper mobileMode={mobileMode}>
            <Dashboard user={user} initialCycle={cycle} onLogout={handleLogout}
              darkMode={darkMode} onToggleDark={toggleDark}
              mobileMode={mobileMode} onToggleMobile={toggleMobile} />
          </MobileWrapper>
          <ChatBot darkMode={darkMode} />
        </>
      );
    }
    return (
      <>
        <MobileWrapper mobileMode={mobileMode}>
          <Onboarding user={user} onDone={handleOnboardingDone}
            onPartnerSuccess={(s) => { setPartnerSession(s); }} />
        </MobileWrapper>
        <ChatBot darkMode={darkMode} />
      </>
    );
  }

  const authButtons = (
    <>
      <button
        onClick={() => setModal("login")}
        style={{ padding: "7px 18px", borderRadius: 99, border: "1.5px solid #e8649a", background: "transparent", color: "#e8649a", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
        onMouseOver={(e) => { e.currentTarget.style.background = c.hoverPink; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
      >Entrar</button>
      <button
        onClick={() => setModal("cadastro")}
        style={{ padding: "7px 18px", borderRadius: 99, border: "none", background: "#e8649a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 12px #e8649a33" }}
        onMouseOver={(e) => { e.currentTarget.style.background = "#c73f7a"; }}
        onMouseOut={(e) => { e.currentTarget.style.background = "#e8649a"; }}
      >Cadastrar</button>
    </>
  );

  const darkToggle = (
    <button
      onClick={toggleDark}
      title={darkMode ? "Modo claro" : "Modo escuro"}
      style={{
        width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${c.border}`,
        background: c.card, cursor: "pointer", fontSize: 17,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", color: c.muted,
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = "#e8649a"; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = c.border; }}
    >
      {darkMode ? "☀️" : "🌙"}
    </button>
  );

  const mobileToggle = (
    <button onClick={toggleMobile} title={mobileMode ? "Modo desktop" : "Modo mobile"}
      style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${mobileMode ? "#e8649a" : c.border}`, background: mobileMode ? "#fdf2f7" : c.card, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: mobileMode ? "#e8649a" : c.muted, transition: "all 0.2s" }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = "#e8649a"; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = mobileMode ? "#e8649a" : c.border; }}
    >📱</button>
  );

  return (
    <>
    <MobileWrapper mobileMode={mobileMode}>
    <div style={{ fontFamily: "Outfit, sans-serif", background: c.bg, minHeight: "100vh", color: c.text, transition: "background 0.3s, color 0.3s" }}>

      {modal && <AuthModal initial={modal} onClose={() => setModal(null)} onSuccess={handleAuthSuccess}
        onPartnerSuccess={(s) => { setPartnerSession(s); setModal(null); }} />}

      {/* NAV */}
      <nav style={{
        position: mobileMode ? "sticky" : "fixed",
        top: 0, left: 0, right: 0, zIndex: 50,
        background: mobileMode ? c.nav.replace("0.92", "1").replace("0.96", "1") : c.nav,
        backdropFilter: mobileMode ? "none" : "blur(12px)",
        borderBottom: `1px solid ${c.border}`,
        transition: "background 0.3s",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobileMode ? "0 14px" : "0 24px", height: mobileMode ? 54 : 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: mobileMode ? 18 : 22 }}>🌸</span>
            <span style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 16 : 20, fontWeight: 600, color: "#c73f7a" }}>Cycle Flow</span>
          </div>

          {!mobileMode && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {navItems.map((item) => (
                <button key={item} onClick={() => scrollTo(item)}
                  style={{ padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, background: activeNav === item ? "#e8649a" : "transparent", color: activeNav === item ? "#fff" : c.muted, transition: "all 0.2s" }}
                >{item}</button>
              ))}
              <div style={{ width: 1, height: 20, background: c.border, margin: "0 8px" }} />
              {darkToggle}
              {mobileToggle}
              <div style={{ width: 1, height: 20, background: c.border, margin: "0 4px" }} />
              {authButtons}
            </div>
          )}

          {mobileMode && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {darkToggle}
              <button onClick={toggleMobile} title="Voltar ao desktop"
                style={{ padding: "6px 10px", borderRadius: 10, border: "1.5px solid #e8649a", background: "#fdf2f7", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#e8649a", whiteSpace: "nowrap" }}
              >🖥️ Desktop</button>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: c.text, padding: "4px 6px" }}>{menuOpen ? "✕" : "☰"}</button>
            </div>
          )}
        </div>

        {menuOpen && mobileMode && (
          <div style={{ background: c.bg, borderTop: `1px solid ${c.border}`, padding: "10px 14px 16px" }}>
            {navItems.map((item) => (
              <button key={item} onClick={() => scrollTo(item)}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 0", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: activeNav === item ? "#e8649a" : c.muted, fontWeight: activeNav === item ? 600 : 400, borderBottom: `1px solid ${c.border}` }}
              >{item}</button>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => { setMenuOpen(false); setModal("login"); }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 99, border: "1.5px solid #e8649a", background: "transparent", color: "#e8649a", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >Entrar</button>
              <button onClick={() => { setMenuOpen(false); setModal("cadastro"); }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 99, border: "none", background: "#e8649a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >Cadastrar</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ minHeight: mobileMode ? "auto" : "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: mobileMode ? 0 : 64 }}>
        {!mobileMode && <>
          <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: c.heroBlob1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "10%", left: "-8%", width: 400, height: 400, borderRadius: "50%", background: c.heroBlob2, pointerEvents: "none" }} />
        </>}

        {/* cherry blossoms — light mode only */}
        {!darkMode && !mobileMode && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "4%",  right: "3%"  }}><Blossom size={108} opacity={0.32} rotate={18}  color="#f4a0be" /></div>
            <div style={{ position: "absolute", top: "2%",  right: "16%" }}><Blossom size={68}  opacity={0.22} rotate={-12} color="#f8b8cc" /></div>
            <div style={{ position: "absolute", top: "20%", right: "8%"  }}><Blossom size={84}  opacity={0.20} rotate={35}  color="#f4a0be" /></div>
            <div style={{ position: "absolute", top: "38%", right: "2%"  }}><Blossom size={54}  opacity={0.18} rotate={-25} color="#f9bdd0" /></div>
            <div style={{ position: "absolute", top: "58%", right: "12%" }}><Blossom size={96}  opacity={0.22} rotate={10}  color="#f4a0be" /></div>
            <div style={{ position: "absolute", top: "72%", right: "4%"  }}><Blossom size={62}  opacity={0.18} rotate={-40} color="#f8b8cc" /></div>
            <div style={{ position: "absolute", top: "1%",  left: "1%"   }}><Blossom size={76}  opacity={0.20} rotate={-8}  color="#f8b8cc" /></div>
            <div style={{ position: "absolute", top: "30%", left: "0%"   }}><Blossom size={50}  opacity={0.16} rotate={22}  color="#f4a0be" /></div>
            <div style={{ position: "absolute", top: "60%", left: "2%"   }}><Blossom size={90}  opacity={0.18} rotate={-15} color="#f9bdd0" /></div>
            <div style={{ position: "absolute", top: "82%", left: "8%"   }}><Blossom size={58}  opacity={0.20} rotate={30}  color="#f4a0be" /></div>
            <div style={{ position: "absolute", top: "85%", right: "20%" }}><Blossom size={44}  opacity={0.15} rotate={-50} color="#f8b8cc" /></div>
            <div style={{ position: "absolute", top: "45%", left: "35%"  }}><Blossom size={38}  opacity={0.10} rotate={5}   color="#f4a0be" /></div>
          </div>
        )}
        {!darkMode && mobileMode && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "2%",  right: "2%"  }}><Blossom size={70} opacity={0.28} rotate={18}  color="#f4a0be" /></div>
            <div style={{ position: "absolute", top: "20%", right: "0%"  }}><Blossom size={48} opacity={0.18} rotate={-12} color="#f8b8cc" /></div>
            <div style={{ position: "absolute", top: "2%",  left: "0%"   }}><Blossom size={54} opacity={0.20} rotate={-8}  color="#f8b8cc" /></div>
            <div style={{ position: "absolute", top: "60%", left: "0%"   }}><Blossom size={60} opacity={0.16} rotate={22}  color="#f4a0be" /></div>
          </div>
        )}

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: mobileMode ? "28px 18px 32px" : "80px 24px", display: "grid", gridTemplateColumns: "1fr", gap: 32, alignItems: "center", width: "100%" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: darkMode ? "#250a18" : "#f7d6e8", borderRadius: 99, padding: mobileMode ? "5px 12px" : "6px 16px", marginBottom: mobileMode ? 16 : 24 }}>
              <span style={{ fontSize: 11 }}>🎓</span>
              <span style={{ fontSize: mobileMode ? 11 : 13, color: "#c73f7a", fontWeight: 600 }}>TCC — Técnico em Informática · FIEB</span>
            </div>

            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 38 : "clamp(42px, 6vw, 76px)", fontWeight: 700, lineHeight: 1.05, color: c.text, marginBottom: mobileMode ? 12 : 20 }}>
              Cycle <em style={{ color: "#e8649a", fontStyle: "italic" }}>Flow</em>
            </h1>

            <p style={{ fontSize: mobileMode ? 16 : 20, color: c.text2, lineHeight: 1.5, marginBottom: mobileMode ? 10 : 16, fontWeight: 300 }}>
              Seu Calendário Menstrual Inteligente
            </p>

            <p style={{ fontSize: mobileMode ? 13 : 16, color: c.muted, lineHeight: 1.65, marginBottom: mobileMode ? 24 : 36 }}>
              Uma plataforma web para acompanhamento do ciclo menstrual com registro de sintomas, previsão de menstruação e monitoramento de saúde reprodutiva.
              {!mobileMode && " Desenvolvido como TCC pela Turma INF2GM da FIEB — Unidade Brasílio Flores de Azevedo."}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => scrollTo("Funcionalidades")}
                style={{ padding: mobileMode ? "11px 20px" : "14px 28px", borderRadius: 99, border: "none", background: "#e8649a", color: "#fff", fontSize: mobileMode ? 13 : 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 20px #e8649a44" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#c73f7a")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#e8649a")}
              >Ver Funcionalidades →</button>
              <button
                onClick={() => scrollTo("Equipe")}
                style={{ padding: mobileMode ? "11px 20px" : "14px 28px", borderRadius: 99, border: "1.5px solid #e8649a", background: "transparent", color: "#e8649a", fontSize: mobileMode ? 13 : 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                onMouseOver={(e) => { e.currentTarget.style.background = c.hoverPink; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >Conhecer a Equipe</button>
            </div>

            <div style={{ marginTop: mobileMode ? 24 : 48, display: "flex", gap: mobileMode ? 20 : 32 }}>
              {[{ value: "6", label: "Desenvolvedores" }, { value: "12+", label: "Funcionalidades" }, { value: "2026", label: "Ano do TCC" }].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 24 : 32, fontWeight: 700, color: "#e8649a", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: mobileMode ? 11 : 13, color: c.muted, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE — inclui Sobre Nós + Funcionalidades + Ciclo */}
      <section id="sobre" style={{ padding: mobileMode ? "40px 18px 0" : "100px 24px 0", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {!darkMode && !mobileMode && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "8%",  right: "-2%" }}><Blossom size={80}  opacity={0.13} rotate={20}  color="#f4a0be" /></div>
            <div style={{ position: "absolute", top: "40%", left: "-2%" }}><Blossom size={66}  opacity={0.11} rotate={-18} color="#f8b8cc" /></div>
            <div style={{ position: "absolute", top: "75%", right: "1%"  }}><Blossom size={58}  opacity={0.12} rotate={35}  color="#f4a0be" /></div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: mobileMode ? "1fr" : "1fr 2fr", gap: mobileMode ? 16 : 60, alignItems: "start" }}>
          <div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 28 : 36, fontWeight: 600, color: c.text, marginTop: 0 }}>
              Sobre Nós
            </h2>
          </div>
          <div>
            <p style={{ fontSize: mobileMode ? 14 : 18, color: c.text2, lineHeight: 1.8, marginBottom: 16 }}>
              A <strong style={{ color: "#e8649a" }}>saúde menstrual</strong> é um aspecto essencial do bem-estar, mas ainda cercado por desinformação e falta de acompanhamento adequado.
            </p>
            {!mobileMode && <>
              <p style={{ fontSize: 16, color: c.muted, lineHeight: 1.8, marginBottom: 20 }}>
                O Cycle Flow surge como resposta a esse cenário: um site desenvolvido com o objetivo de auxiliar pessoas a monitorar seu ciclo menstrual de forma prática, acessível e personalizada — semelhante a aplicativos já conhecidos como Flo e Clue, mas funcionando diretamente no navegador, sem necessidade de instalação.
              </p>
              <p style={{ fontSize: 16, color: c.muted, lineHeight: 1.8, marginBottom: 32 }}>
                Muitas usuárias enfrentam limitações como falta de espaço no celular, restrições de compatibilidade ou preocupações com privacidade. O Cycle Flow oferece uma alternativa eficiente, intuitiva e segura, alinhada ao{" "}
                <strong style={{ color: "#7c3f8e" }}>ODS 3 da ONU — Saúde e Bem-Estar</strong>.
              </p>
            </>}

            <div style={{ background: c.quote, borderLeft: "4px solid #e8649a", borderRadius: "0 12px 12px 0", padding: mobileMode ? "14px 16px" : "20px 24px", marginBottom: mobileMode ? 20 : 0 }}>
              <p style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 14 : 18, fontStyle: "italic", color: "#c73f7a", margin: 0, lineHeight: 1.5 }}>
                "Um site funcional que ofereça recursos como registro de ciclos, previsão de menstruação, acompanhamento de sintomas e organização de dados relacionados à saúde menstrual."
              </p>
            </div>

            <div style={{ marginTop: mobileMode ? 16 : 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: mobileMode ? 10 : 16 }}>
              {[
                { label: "Instituição", value: "FIEB — Brasílio Flores de Azevedo" },
                { label: "Curso", value: "Técnico em Informática" },
                { label: "Turma", value: "INF2GM" },
                { label: "Período", value: "Abril / 2026" },
              ].map((item) => (
                <div key={item.label} style={{ background: c.infoCard, borderRadius: 12, padding: mobileMode ? "12px 14px" : "16px 20px", border: `1px solid ${c.border}` }}>
                  <div style={{ fontSize: 10, color: "#b090c0", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                  <div style={{ fontSize: mobileMode ? 12 : 14, color: c.text2, fontWeight: 500, marginTop: 4 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Funcionalidades ── */}
        <div id="funcionalidades" style={{ marginTop: mobileMode ? 40 : 80, paddingBottom: mobileMode ? 40 : 80, borderTop: `1px solid ${c.border}`, paddingTop: mobileMode ? 40 : 80 }}>
          <div style={{ textAlign: "center", marginBottom: mobileMode ? 32 : 64 }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 28 : 40, fontWeight: 600, color: c.text }}>Funcionalidades</h2>
            <p style={{ fontSize: mobileMode ? 13 : 16, color: c.muted, maxWidth: 560, margin: "12px auto 0" }}>O Cycle Flow oferece um conjunto completo de ferramentas para o acompanhamento da saúde menstrual.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobileMode ? "1fr" : "repeat(3, 1fr)", gap: mobileMode ? 12 : 24 }}>
            {features.map((f) => (
              <div key={f.title}
                style={{ background: c.hoverCard, borderRadius: mobileMode ? 16 : 20, padding: mobileMode ? "18px 16px" : "32px 28px", border: `1px solid ${c.border}`, display: mobileMode ? "flex" : "block", alignItems: mobileMode ? "flex-start" : undefined, gap: mobileMode ? 14 : 0 }}
              >
                <div style={{ width: mobileMode ? 40 : 52, height: mobileMode ? 40 : 52, borderRadius: 14, background: darkMode ? "#250a18" : "#fdf2f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: mobileMode ? 20 : 26, marginBottom: mobileMode ? 0 : 20, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 15 : 20, fontWeight: 600, color: c.text, marginBottom: 6, marginTop: mobileMode ? 0 : undefined }}>{f.title}</h3>
                  <p style={{ fontSize: mobileMode ? 12 : 14, color: c.muted, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ciclo / Fases ── */}
        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: mobileMode ? 40 : 80, paddingBottom: mobileMode ? 40 : 80 }} id="ciclo">
          <div style={{ display: "grid", gridTemplateColumns: mobileMode ? "1fr" : "1fr 1fr", gap: mobileMode ? 24 : 60, alignItems: "center" }}>
            <div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 26 : 40, fontWeight: 600, color: c.text, marginBottom: 12 }}>Fases do Ciclo</h2>
              <p style={{ fontSize: mobileMode ? 13 : 16, color: c.muted, lineHeight: 1.7, marginBottom: mobileMode ? 20 : 36 }}>O Cycle Flow identifica e acompanha as quatro fases do ciclo menstrual, fornecendo informações e previsões específicas para cada período.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: mobileMode ? 10 : 16 }}>
                {phases.map((p) => (
                  <div key={p.name} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: mobileMode ? "14px 16px" : "18px 20px", borderRadius: 16, background: c.card, border: `1px solid ${c.border}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + "22", border: `2px solid ${p.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, color: c.text, fontSize: mobileMode ? 13 : 15 }}>{p.name}</span>
                        <span style={{ fontSize: 11, background: p.color + "22", color: p.color, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{p.days}</span>
                      </div>
                      <p style={{ fontSize: mobileMode ? 12 : 13, color: c.muted, marginTop: 4, lineHeight: 1.5, marginBottom: 0 }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!mobileMode && (
              <div>
                <div style={{ background: c.card, borderRadius: 24, overflow: "hidden", border: `1px solid ${c.border}`, boxShadow: "0 8px 40px #e8649a10" }}>
                  <div style={{ background: darkMode ? "#250a18" : "#fdf2f7", padding: "28px 32px", borderBottom: `1px solid ${c.border}` }}>
                    <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: "#c73f7a", margin: 0 }}>Problema Identificado</h3>
                  </div>
                  <div style={{ padding: "24px 32px" }}>
                    {[
                      { label: "O problema", text: "Muitas mulheres não sabem ao certo quais são os sintomas do seu ciclo menstrual nem se estão dentro de um padrão saudável." },
                      { label: "Afeta", text: "Mulheres em idade reprodutiva e, indiretamente, seus companheiros e familiares." },
                      { label: "Cujo impacto é", text: "Dificuldade em identificar padrões do próprio ciclo, atrasando a percepção de irregularidades e prejudicando o autoconhecimento." },
                      { label: "Nossa solução", text: "Um site que organiza os sintomas e os ciclos da usuária, permitindo acompanhamento claro e seguro." },
                    ].map((item, i) => (
                      <div key={i} style={{ paddingBottom: i < 3 ? 20 : 0, marginBottom: i < 3 ? 20 : 0, borderBottom: i < 3 ? `1px solid ${c.border2}` : "none" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#e8649a", textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                        <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.6, marginTop: 6, marginBottom: 0 }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "16px 32px", background: "#7c3f8e", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>🌐</span>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>Ambiente: <strong>Web</strong> (compatível com Chrome, Edge, Firefox)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section id="equipe" style={{ background: c.teamBg, padding: mobileMode ? "40px 18px" : "100px 24px", transition: "background 0.3s" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: mobileMode ? 28 : 64 }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 28 : 40, fontWeight: 600, color: c.text }}>Equipe</h2>
            <p style={{ fontSize: mobileMode ? 13 : 16, color: c.muted, maxWidth: 500, margin: "12px auto 0" }}>Turma INF2GM — Curso Técnico em Informática — FIEB</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobileMode ? "1fr 1fr" : "repeat(3, 1fr)", gap: mobileMode ? 10 : 20 }}>
            {team.map((member, i) => {
              const colors = ["#e8649a", "#7c3f8e", "#b57bc8", "#c73f7a", "#e8649a", "#9b7abc"];
              const avatarBg = colors[i % colors.length];
              const initials = member.name.split(" ").slice(0, 2).map((n) => n[0]).join("");
              return (
                <div key={member.rm}
                  style={{ background: c.hoverCard, borderRadius: mobileMode ? 16 : 20, padding: mobileMode ? "18px 14px" : "28px 24px", border: `1px solid ${c.border}`, textAlign: "center" }}
                >
                  <div style={{ width: mobileMode ? 44 : 64, height: mobileMode ? 44 : 64, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontFamily: "Fraunces, serif", fontSize: mobileMode ? 16 : 24, fontWeight: 600, color: "#fff" }}>
                    {initials}
                  </div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 12 : 16, fontWeight: 600, color: c.text, lineHeight: 1.3, marginBottom: 6 }}>{member.name}</div>
                  <div style={{ fontSize: mobileMode ? 11 : 13, fontWeight: 600, color: "#fff", background: avatarBg, padding: mobileMode ? "3px 10px" : "4px 14px", borderRadius: 99, display: "inline-block" }}>{member.role}</div>
                  <div style={{ fontSize: 11, color: c.muted2, marginTop: 6 }}>RM: <strong>{member.rm}</strong></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: c.footer, padding: mobileMode ? "32px 18px" : "60px 24px", textAlign: "center", transition: "background 0.3s" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: "Fraunces, serif", fontSize: mobileMode ? 22 : 28, fontWeight: 600, color: "#e8649a" }}>🌸 Cycle Flow</span>
          </div>
          <p style={{ fontSize: mobileMode ? 12 : 14, color: c.ftText, maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.6 }}>
            Seu Calendário Menstrual Inteligente — TCC pela Turma INF2GM · FIEB
          </p>
          <div style={{ borderTop: `1px solid ${c.border2}`, paddingTop: 16 }}>
            <p style={{ fontSize: 11, color: c.ftText, margin: 0 }}>© 2026 Cycle Flow — Projeto Acadêmico · Barueri, SP</p>
          </div>
        </div>
      </footer>
    </div>
    </MobileWrapper>
    <ChatBot darkMode={darkMode} />
    </>
  );
}
