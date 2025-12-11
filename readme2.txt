====================================================
GUIA DE CONFIGURAÇÃO - RODAR O PROJETO NO VSCODE
====================================================

REQUISITOS DO SISTEMA
---------------------
1. Node.js (versão 18 ou superior)
   - Download: https://nodejs.org/
   - Verifique a instalação: node --version

2. npm (vem junto com o Node.js)
   - Verifique a instalação: npm --version

3. Git
   - Download: https://git-scm.com/
   - Verifique a instalação: git --version

4. Visual Studio Code
   - Download: https://code.visualstudio.com/

EXTENSÕES RECOMENDADAS PARA VSCODE
----------------------------------
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar) - para melhor suporte TypeScript
- Auto Rename Tag
- ES7+ React/Redux/React-Native snippets

PASSO A PASSO
-------------

1. CLONAR O REPOSITÓRIO
   - Abra o terminal
   - Execute: git clone <URL_DO_REPOSITORIO>
   - Entre na pasta: cd <NOME_DA_PASTA>

2. ABRIR NO VSCODE
   - Execute: code .
   - Ou abra o VSCode e vá em File > Open Folder

3. INSTALAR DEPENDÊNCIAS
   - Abra o terminal integrado do VSCode (Ctrl + `)
   - Execute: npm install
   - Aguarde a instalação de todas as dependências

4. CONFIGURAR VARIÁVEIS DE AMBIENTE
   - O arquivo .env já está configurado automaticamente
   - Caso precise alterar, as variáveis disponíveis são:
     * VITE_SUPABASE_URL
     * VITE_SUPABASE_PUBLISHABLE_KEY
     * VITE_SUPABASE_PROJECT_ID

5. RODAR O PROJETO EM MODO DESENVOLVIMENTO
   - Execute: npm run dev
   - O servidor iniciará em: http://localhost:8080
   - Abra o navegador e acesse a URL

6. OUTROS COMANDOS ÚTEIS
   - npm run build    -> Gera a versão de produção
   - npm run preview  -> Visualiza a versão de produção
   - npm run lint     -> Verifica erros de código

ESTRUTURA DO PROJETO
--------------------
src/
├── components/     -> Componentes React reutilizáveis
│   ├── ui/        -> Componentes de interface (shadcn/ui)
│   ├── layout/    -> Componentes de layout
│   ├── dashboard/ -> Componentes do dashboard
│   ├── goals/     -> Componentes de metas
│   ├── transactions/ -> Componentes de transações
│   └── bank/      -> Componentes bancários
├── hooks/         -> Custom hooks React
├── pages/         -> Páginas da aplicação
├── lib/           -> Utilitários e funções auxiliares
├── integrations/  -> Integrações (Supabase)
└── types/         -> Tipos TypeScript

TECNOLOGIAS UTILIZADAS
----------------------
- React 18
- TypeScript
- Vite (bundler)
- Tailwind CSS (estilização)
- shadcn/ui (componentes)
- Supabase (backend/banco de dados)
- React Query (gerenciamento de estado servidor)
- React Router (roteamento)
- Recharts (gráficos)
- React Hook Form + Zod (formulários e validação)

SOLUÇÃO DE PROBLEMAS
--------------------

Erro: "node_modules não encontrado"
-> Execute: npm install

Erro: "porta 8080 em uso"
-> Feche outros processos ou altere a porta em vite.config.ts

Erro de tipos TypeScript:
-> Execute: npm install (para garantir tipos atualizados)

Erro de conexão com banco de dados:
-> Verifique as variáveis de ambiente no arquivo .env

====================================================

Heitor e Jorge