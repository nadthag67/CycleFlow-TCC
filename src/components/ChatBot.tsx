import { useState, useRef, useEffect } from "react";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const BACKEND_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4d766955/chat`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Olá! Sou a Assistente Virtual do CycleFlow 🌸 Estou aqui para tirar suas dúvidas sobre ciclo menstrual, saúde feminina ou o uso do app. Como posso te ajudar hoje?",
};

// ── fallback local (usado quando o backend não está disponível) ──
function getLocalReply(userText: string): string {
  const t = userText.toLowerCase();

  if (/menstrua|período|mens|sangr|fluxo/.test(t))
    return "🩸 **Menstruação** é a fase inicial do ciclo, quando o revestimento do útero se desprende. Os níveis de estrogênio e progesterona estão baixos. É normal sentir cólicas, fadiga e sensibilidade. Dicas: mantenha-se hidratada, aplique calor local nas cólicas e descanse quando possível. Se os sintomas forem muito intensos, consulte um ginecologista.";

  if (/ovula|fértil|óvulo|gravidez|engravidar/.test(t))
    return "⭐ **Ovulação** ocorre geralmente no dia 14 do ciclo (em ciclos de 28 dias). É o pico de fertilidade — um óvulo maduro é liberado pelo ovário. O período fértil começa cerca de 5 dias antes e vai até 1–2 dias após a ovulação. No CycleFlow você pode ver o período fértil estimado direto no calendário!";

  if (/folicular|estrogênio|antes da ovula/.test(t))
    return "🌱 **Fase Folicular** vai do início da menstruação até a ovulação. O estrogênio começa a subir e os folículos ovarianos amadurecem. Você provavelmente vai sentir energia crescente, clareza mental e disposição. Ótimo momento para novos projetos e atividades físicas mais intensas!";

  if (/lútea|progesterona|tpm|pré.?menstrual|humor|irritad|ansiosa|choro/.test(t))
    return "🌙 **Fase Lútea** vai da ovulação até o início da próxima menstruação. A progesterona sobe e depois cai, o que pode causar variações de humor, inchaço e menor disposição — a famosa TPM. Dicas: reduza cafeína e açúcar, prefira exercícios leves como yoga, e lembre-se: seus sentimentos são válidos!";

  if (/ciclo|duração|quantos dias|28 dias/.test(t))
    return "📅 O **ciclo menstrual** começa no primeiro dia da menstruação e termina no dia antes da próxima. A duração média é de 28 dias, mas ciclos entre 21 e 35 dias são completamente normais. No CycleFlow, você cadastra a duração do seu ciclo e o app calcula automaticamente as fases e previsões!";

  if (/sintoma|cólica|dor|inchaço|náusea|fadiga|acne|insônia/.test(t))
    return "💊 É muito comum ter **sintomas** ao longo do ciclo. Cólicas, dor de cabeça, inchaço, acne e fadiga são respostas normais às variações hormonais. Você pode registrar seus sintomas diários no CycleFlow clicando em '🩺 Sintomas' no menu — isso ajuda a identificar padrões ao longo dos meses!";

  if (/usar|como|app|aplicativo|cycleflow|ciclo flow|função|feature|recurso/.test(t))
    return "📱 O **CycleFlow** tem os seguintes recursos:\n• **Calendário** — visualize as fases do seu ciclo\n• **Sintomas** — registre humor, sintomas e anotações diárias\n• **Histórico** — veja seus registros dos últimos meses\n• **Compartilhar** — gere um código para compartilhar com alguém de confiança\n• **Atualizar ciclo** — atualize as datas quando necessário\n\nQual função você quer saber mais?";

  if (/compartilh|código|parceiro|namorad|familiar/.test(t))
    return "🔗 O recurso de **Compartilhamento** permite que você gere um código e compartilhe informações do seu ciclo com namorado(a), familiar ou pessoa de confiança. Você controla exatamente o que a pessoa pode ver — ciclo, calendário, anotações ou check-ins. Acesse pelo menu lateral em 'Compartilhar'!";

  if (/médic|ginecolog|consulta|diagnós|doença|endometriose|síndrome|pcos/.test(t))
    return "👩‍⚕️ Para questões médicas específicas, **recomendo sempre consultar um ginecologista**. O CycleFlow é uma ferramenta de acompanhamento — não substitui avaliação profissional. Se você tiver sintomas persistentes, irregularidades no ciclo ou dores intensas, procure um médico.";

  if (/obrigad|valeu|ótimo|perfeito|ajudou/.test(t))
    return "🌸 Fico feliz em ajudar! Se tiver mais dúvidas sobre o ciclo ou o CycleFlow, é só perguntar. Cuide-se! 💜";

  if (/olá|oi|bom dia|boa tarde|boa noite|tudo bem/.test(t))
    return "Olá! 🌸 Tudo bem sim, obrigada! Estou aqui para ajudar com dúvidas sobre ciclo menstrual, saúde feminina ou o uso do CycleFlow. O que você gostaria de saber?";

  return "Obrigada pela sua pergunta! 🌸 Posso te ajudar com dúvidas sobre **ciclo menstrual** (fases, sintomas, ovulação, TPM), **saúde feminina** em geral, ou como **usar o CycleFlow**. Para questões médicas específicas, recomendo consultar um ginecologista. O que você gostaria de saber?";
}


function typeText(
  full: string,
  onChunk: (partial: string) => void,
  onDone: () => void,
) {
  let i = 0;
  const step = () => {
    i += Math.floor(Math.random() * 4) + 2;
    if (i >= full.length) { onChunk(full); onDone(); return; }
    onChunk(full.slice(0, i));
    setTimeout(step, 18 + Math.random() * 20);
  };
  setTimeout(step, 30);
}

export function ChatBot({ darkMode }: { darkMode?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const tk = darkMode
    ? {
        bg: "#1e1b30",
        header: "#161428",
        border: "#2e2a48",
        text: "#e8e4ff",
        muted: "#9490c0",
        bubble: "#231e42",
        bubbleUser: "#5c3ef4",
        input: "#161428",
        shadow: "0 8px 40px rgba(0,0,0,0.6)",
        btn: "#5c3ef4",
        btnHover: "#7c6aff",
        scrollThumb: "#5c3ef440",
      }
    : {
        bg: "#ffffff",
        header: "#f5f3ff",
        border: "#ebe7ff",
        text: "#1a1640",
        muted: "#6b6890",
        bubble: "#f5f3ff",
        bubbleUser: "#5c3ef4",
        input: "#f5f3ff",
        shadow: "0 8px 40px rgba(92,62,244,0.15)",
        btn: "#5c3ef4",
        btnHover: "#7c6aff",
        scrollThumb: "#5c3ef420",
      };

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ messages: newMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!res.ok) throw new Error("backend_error");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLoading(false);
      const reply: string = data.reply ?? "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      typeText(
        reply,
        (partial) => setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: partial };
          return updated;
        }),
        () => {},
      );
    } catch (err) {
      void err;
      setLoading(false);
      const reply = getLocalReply(text);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      typeText(
        reply,
        (partial) => setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: partial };
          return updated;
        }),
        () => {},
      );
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir assistente virtual"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #5c3ef4 0%, #e8649a 100%)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(92,62,244,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
          transform: open ? "rotate(45deg) scale(0.95)" : "scale(1)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = open ? "rotate(45deg) scale(1)" : "scale(1.08)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = open ? "rotate(45deg) scale(0.95)" : "scale(1)"; }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 96,
            right: 28,
            zIndex: 9998,
            width: "min(380px, calc(100vw - 32px))",
            height: "min(560px, calc(100vh - 120px))",
            borderRadius: 20,
            background: tk.bg,
            border: `1.5px solid ${tk.border}`,
            boxShadow: tk.shadow,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Outfit', sans-serif",
            animation: "chatIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* header */}
          <div style={{
            background: tk.header,
            borderBottom: `1px solid ${tk.border}`,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #5c3ef4 0%, #e8649a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}>🌸</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: tk.text, lineHeight: 1.2 }}>Assistente Virtual</div>
              <div style={{ fontSize: 11, color: "#26de81", fontWeight: 500 }}>● Online</div>
            </div>
          </div>

          {/* messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "9px 13px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? tk.bubbleUser : tk.bubble,
                  color: msg.role === "user" ? "#ffffff" : tk.text,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* loading dots */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "16px 16px 16px 4px",
                  background: tk.bubble,
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}>
                  {[0, 1, 2].map((d) => (
                    <div key={d} style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#5c3ef4",
                      opacity: 0.7,
                      animation: `bounce 1.2s ${d * 0.2}s infinite ease-in-out`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* error */}
            {error && (
              <div style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "#fff0f1",
                border: "1px solid #ffcdd2",
                color: "#c62828",
                fontSize: 12.5,
                textAlign: "center",
              }}>
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* input area */}
          <div style={{
            borderTop: `1px solid ${tk.border}`,
            padding: "10px 12px",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            flexShrink: 0,
            background: tk.bg,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Digite sua mensagem..."
              rows={1}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 12,
                border: `1.5px solid ${tk.border}`,
                background: tk.input,
                color: tk.text,
                fontSize: 13.5,
                fontFamily: "'Outfit', sans-serif",
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
                maxHeight: 80,
                overflowY: "auto",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#5c3ef4"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = tk.border; }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: loading || !input.trim() ? "#ccc" : "linear-gradient(135deg, #5c3ef4 0%, #e8649a 100%)",
                border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s, transform 0.1s",
              }}
              onMouseEnter={(e) => { if (!loading && input.trim()) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); transform-origin: bottom right; }
          to   { opacity: 1; transform: scale(1)    translateY(0);    transform-origin: bottom right; }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
