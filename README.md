# EBAPS Vila Velha - Fase 1 React + Supabase

Fundação do sistema real baseada no HTML original. Esta fase entrega arquitetura, rotas, layout, autenticação por tabela `usuarios`, permissões por perfil e administração de usuários para Diretoria.

## Tecnologias

- React 18
- Vite
- React Router DOM
- Supabase
- TailwindCSS
- Zustand
- Lucide React
- bcryptjs

## Instalação

```bash
npm install
```

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o arquivo `database/schema.sql`.
4. Copie `.env.example` para `.env`.
5. Preencha:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## Rodar localmente

```bash
npm run dev
```

Depois acesse a URL indicada pelo Vite.

Usuário inicial:

- Usuário: `admin`
- Senha: `admin123`
- Perfil: `diretoria`

## Publicar na Vercel

1. Envie o projeto para um repositório Git.
2. Crie um novo projeto na Vercel.
3. Framework preset: `Vite`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Configure as variáveis:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

7. Faça o deploy.

## Como Criar Usuários

Entre com `admin/admin123`, abra o menu `Usuários` e use `Novo usuário`.

Campos de criação:

- Nome
- Usuário
- Senha inicial
- Perfil
- Setor
- Ativo

O sistema gera `senha_hash` com `bcryptjs` antes de salvar no Supabase.

## Permissões

As permissões ficam em `src/config/permissions.js`.

- `diretoria`: acesso total, inclusive `Usuários`
- `gerencia`: acesso operacional total, sem administração de usuários
- demais perfis: acesso restrito às rotas definidas na matriz

A Sidebar usa `src/config/menu.js` e exibe apenas itens permitidos ao perfil autenticado.

## Escopo Não Implementado Nesta Fase

- Ordens de Serviço funcionais
- Relatórios operacionais completos
- Almoxarifado completo
- SST completo
- Upload de fotos
- PDF
- Workflow real de aprovação
- Integrações externas
