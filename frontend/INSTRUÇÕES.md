# 🚀 Como Rodar o CycleFlow

## Passo 1: Instalar Dependências

Execute o arquivo **`install.bat`** (duplo clique) na pasta do frontend:
```
c:\Users\nad\Downloads\TCC\frontend\install.bat
```

Ou manualmente:
```bash
cd c:\Users\nad\Downloads\TCC\frontend
npm install
```

Esse comando instala todas as bibliotecas necessárias (React, Bootstrap, Vite, etc).

---

## Passo 2: Rodar o Servidor

Depois de instalar, execute o arquivo **`start.bat`** (duplo clique):
```
c:\Users\nad\Downloads\TCC\frontend\start.bat
```

Ou manualmente:
```bash
cd c:\Users\nad\Downloads\TCC\frontend
npm run dev
```

Você verá algo como:
```
  VITE v5.5.1  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## Passo 3: Abrir no Navegador

Copie e cole a URL `http://localhost:5173/` no navegador.

---

## O que Acontece Agora?

✅ A página inicial do CycleFlow deve aparecer  
✅ Você consegue clicar nos botões "Entrar" e "Criar Conta"  
✅ Consegue navegar entre as páginas  

---

## Para Parar o Servidor

Pressione `CTRL + C` no terminal onde está rodando o servidor.

---

## Estrutura dos Arquivos

```
frontend/
  ├── index.html          # arquivo principal HTML
  ├── package.json        # dependências do projeto
  ├── vite.config.js      # configuração do Vite
  ├── src/
  │   ├── main.jsx        # ponto de entrada do React
  │   ├── App.jsx         # componente principal
  │   ├── styles/         # estilos CSS
  │   ├── pages/          # páginas do app
  │   ├── components/     # componentes reutilizáveis
  │   └── routes/         # definição de rotas
```

Todos os arquivos já estão comentados linha a linha para você entender! 📝
