Preciso que você implemente uma integração REAL e funcional de inteligência artificial no chatbot Assistente Virtual do meu projeto CycleFlow, seguindo rigorosamente todas as instruções abaixo.

1. ANÁLISE OBRIGATÓRIA ANTES DE ALTERAR

Antes de modificar qualquer arquivo, leia e analise a estrutura atual do projeto. Identifique o componente do chatbot, a configuração do Supabase, as Edge Functions existentes e as dependências relevantes.

O projeto já possui, entre outros arquivos:
- src/components/ChatBot.tsx
- supabase/functions/server/index.tsx
- utils/supabase/info.tsx

Verifique os nomes e caminhos reais antes de editar. Não presuma que esses arquivos sejam os únicos relevantes.

2. OBJETIVO

Quero que o chatbot envie perguntas para a API oficial da OpenAI através do backend Supabase e mostre as respostas reais no chat.

Fluxo obrigatório:
Usuário → ChatBot.tsx → Supabase Edge Function → OpenAI API → Supabase Edge Function → ChatBot.tsx → Usuário.

Não quero respostas simuladas, respostas escolhidas por palavras-chave ou respostas fixas geradas pelo frontend.

3. APROVEITAR O BACKEND EXISTENTE

Verifique se a Edge Function server já possui uma rota de chat. Caso exista, aproveite e corrija essa implementação em vez de criar uma segunda função desnecessária.

Preserve todas as outras rotas e funcionalidades existentes, especialmente as relacionadas ao compartilhamento e acompanhamento do CycleFlow.

Se for necessário criar ou ajustar uma função, faça isso sem quebrar o que já funciona.

4. MODIFICAR O ChatBot.tsx

No arquivo real do chatbot:

- Remova completamente MOCK_REPLIES.
- Remova completamente getMockReply().
- Remova qualquer lógica de respostas baseadas em palavras-chave.
- Remova o fallback que apresenta respostas simuladas quando a API falha.
- Garanta que toda resposta de conversa venha do backend e, consequentemente, da OpenAI.

Mantenha absolutamente intacto o design atual:

- Botão flutuante.
- Janela do Assistente Virtual.
- Cabeçalho.
- Mensagem inicial.
- Balões de conversa.
- Cores roxo e rosa.
- Modo claro e escuro.
- Tipografia.
- Tamanhos.
- Espaçamentos.
- Layout.
- Animações.
- Campo de texto.
- Botão de enviar.
- Indicador de carregamento.
- Responsividade.
- Rolagem automática.

Não redesenhe o chatbot. Não altere o visual sem necessidade.

5. COMPORTAMENTO DO ENVIO

Ao enviar uma pergunta:

1. Mostrar imediatamente a mensagem do usuário.
2. Limpar o campo de texto.
3. Mostrar o indicador de carregamento já existente.
4. Desabilitar o botão de envio enquanto a requisição estiver em andamento.
5. Enviar a mensagem para a Edge Function.
6. Receber a resposta real da OpenAI.
7. Mostrar a resposta no balão da assistente.
8. Encerrar o carregamento.
9. Permitir novo envio.

Não permitir múltiplos envios simultâneos.

Preserve o efeito de digitação visual caso ele apenas apresente gradualmente uma resposta real recebida da API.

6. BACKEND E OPENAI

No backend, utilize a API oficial da OpenAI.

A chave deve ser acessada exclusivamente no servidor através de:

Deno.env.get("OPENAI_API_KEY")

Nunca coloque a chave no ChatBot.tsx, em componentes React, em arquivos públicos ou em variáveis expostas ao navegador.

Verifique se o backend utiliza um endpoint oficial válido da OpenAI e se o formato da requisição e da resposta está correto.

Se a implementação atual usar uma rota de chat existente, mantenha compatibilidade com o frontend ou atualize ambos os lados corretamente.

7. PERSONALIDADE DA ASSISTENTE

Configure a IA para responder em português brasileiro, de maneira:

- Clara.
- Educada.
- Acolhedora.
- Objetiva.
- Fácil de entender.

Ela pode responder dúvidas gerais sobre:

- Ciclo menstrual.
- Menstruação.
- Ovulação.
- TPM.
- Fases do ciclo.
- Funcionamento do CycleFlow.
- Recursos do aplicativo que estejam documentados no contexto fornecido.

A IA não deve inventar funcionalidades do CycleFlow. Se não possuir informações suficientes, deve admitir isso.

8. SEGURANÇA E SAÚDE

Como o CycleFlow aborda saúde menstrual, a IA deve:

- Não diagnosticar doenças.
- Não afirmar que uma pessoa possui determinada doença.
- Não substituir médicos ou profissionais de saúde.
- Não inventar informações médicas.
- Recomendar avaliação profissional quando a situação exigir.
- Orientar busca de atendimento adequado em situações potencialmente urgentes.

9. TRATAMENTO DE ERROS

Se houver erro de rede, falha no backend, ausência de chave ou indisponibilidade da OpenAI, mostrar ao usuário apenas:

"Desculpe, não consegui responder agora. Tente novamente em alguns instantes."

Não mostrar erros técnicos, tokens, chaves, stack traces ou detalhes internos.

Manter logs úteis com console.error no desenvolvimento e registrar erros relevantes no backend sem expor informações sensíveis.

Não substituir a falha por uma resposta simulada.

10. SECRET DO SUPABASE

O nome obrigatório do Secret é:

OPENAI_API_KEY

Utilize esse Secret exclusivamente no backend.

Não invente uma chave e não tente inserir uma chave diretamente no código.

Se o Secret não estiver configurado, informe claramente que preciso criá-lo manualmente no painel do Supabase.

11. PREPARAÇÃO PARA BASE DE CONHECIMENTO

Organize o system prompt de forma que seja possível adicionar futuramente informações específicas sobre o CycleFlow, sem inventar recursos atuais.

12. VALIDAÇÃO FINAL OBRIGATÓRIA

Depois de implementar, verifique:

- MOCK_REPLIES removido.
- getMockReply() removido.
- Nenhum fallback de resposta simulada.
- Frontend conectado à Edge Function correta.
- Backend conectado à API oficial da OpenAI.
- OPENAI_API_KEY acessada somente no backend.
- Nenhuma chave exposta ao navegador.
- Design original preservado.
- Estados de carregamento e erro funcionando.
- Nenhuma funcionalidade não relacionada ao chatbot quebrada.
- Código sem erros de TypeScript ou imports quebrados.

Não apenas descreva o que deveria ser feito. Faça as alterações diretamente nos arquivos existentes.

Ao finalizar, apresente um relatório claro contendo:

1. Arquivos modificados.
2. Arquivos criados, se houver.
3. Código removido.
4. Como o fluxo da IA funciona.
5. Se preciso configurar manualmente o Secret OPENAI_API_KEY.
6. Como testar a integração real.
7. Qualquer erro ou limitação que ainda exista.

IMPORTANTE: não considere a tarefa concluída apenas porque o código compila. Verifique se a comunicação real com o backend está preparada e se o chatbot não usa mais respostas simuladas.