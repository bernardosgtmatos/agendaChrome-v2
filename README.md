# AgendaChrome

[![Node.js](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Deploy](https://img.shields.io/badge/deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

Sistema web **full-stack** de agendamento de chromebooks para escolas, desenvolvido como
Trabalho de Conclusão de Curso (TCC). Permite que professores solicitem chromebooks por
turma, local e período, com controle de estoque, locais exclusivos, status automáticos e
um painel administrativo para coordenadores.

> Repositório: [`bernardosgtmatos/agendaChrome-v2`](https://github.com/bernardosgtmatos/agendaChrome-v2)

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução local](#instalação-e-execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Banco de dados](#banco-de-dados)
- [Deploy (Render)](#deploy-render)
- [Scripts disponíveis](#scripts-disponíveis)
- [Testes](#testes)
- [Telas e rotas](#telas-e-rotas)
- [Contribuição](#contribuição)
- [Licença](#licença)
- [Autor](#autor)

---

## Sobre o projeto

**AgendaChrome** é a recriação do zero de um sistema de agendamento de chromebooks para
o ambiente escolar. O backend expõe uma API REST com autenticação via cookie JWT (httpOnly),
controle de estoque e regras de negócio (locais exclusivos, bloqueio de cancelamento de
agendamentos finalizados, sincronização automática de status). O frontend é uma SPA em
React + TypeScript servida por Vite, com rotas protegidas por perfil (Professor /
Coordenador).

## Funcionalidades

- **Autenticação**: login/logout, sessão via cookie JWT, recuperação de senha por código
  de 6 dígitos enviado por e-mail, alteração de senha.
- **Agendamento**: criação com validação de data/hora, turma, local e quantidade; controle
  de estoque (pool único) e bloqueio de local exclusivo por intervalo; cancelamento que
  libera estoque.
- **Meu Painel (`/meu-painel`)**: resumo (total, pendentes, em progresso, finalizados,
  cancelados, próximos), calendário com marcadores, lembretes, filtros (busca, turma,
  local, status), paginação com salto de página e cancelamento.
- **Listagem de agendamentos (`/agendamentos`)**: filtros por solicitante, turma, local,
  status e busca por protocolo/nome; paginação.
- **Disponibilidade**: tabela por aula (estoque) e matriz por local
  (`/disponibilidade-matriz`).
- **Gerenciamento (Coordenador)**: usuários, turmas, locais (com categoria) e capacidade
  de chromebooks.
- **Status automático**: agendamentos passados viram "Finalizado" (no boot, a cada 5 min,
  via cron externo e antes de listagens).
- **Rate limit**: 100 req/min por IP, com `Retry-After`.
- **Controle de acesso**: rotas protegidas por autenticação e perfil (Coordenador).

## Stack

### Backend (`backend/`)

| Tecnologia | Uso |
|---|---|
| Node.js (>=22) + Express 5 | Servidor HTTP e rotas |
| Sequelize 6 | ORM |
| sqlite3 (dev) / pg (prod, Neon Postgres) | Banco de dados |
| bcryptjs | Hash de senhas |
| jsonwebtoken | JWT em cookie httpOnly |
| cookie-parser, cors, dotenv | Middlewares e configuração |
| express-rate-limit | 100 req/min por IP |
| nodemailer | Envio de código de recuperação de senha |

### Frontend (`frontend/`)

| Tecnologia | Uso |
|---|---|
| React 19 + React Router 7 | UI e roteamento |
| Vite 8 + TypeScript 6 | Build e tipagem |
| ESLint | Lint |

## Estrutura do projeto

```text
agendaChrome-v2/
├── backend/
│   ├── server.js                      # entrada: Express, sync, rotas, status sync
│   ├── src/config/Database.js         # SQLite (dev) ou Postgres/Neon (prod)
│   ├── src/model/                     # modelos Sequelize
│   ├── src/controllers/               # lógica de negócio
│   ├── src/routes/                    # AdminRoute, UserRoute, EventsRoute
│   ├── src/middleware/                # Authorization, AdminAuthorization, RateLimit
│   ├── src/services/                  # TokenService, EstoqueService, EmailService, AgendamentoStatusService
│   └── scripts/                       # migrate-sqlite-to-postgres, sync-status-cron
├── frontend/
│   └── src/
│       ├── App.tsx                    # rotas e guards
│       ├── components/                # NavBar, UserBar, UserMenu
│       ├── lib/                       # api.ts, auth.tsx, useAuth
│       └── pages/                     # login, recuperar-senha, agendar, agendamentos, meu-painel, gerenciamento
├── render.yaml                        # deploy Render (backend + frontend + cron)
└── documentação/                      # documentação técnica do TCC
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 22
- npm (vem com o Node)
- Git
- (Opcional, produção) conta no [Neon](https://neon.tech/) (Postgres) e no [Render](https://render.com/)

## Instalação e execução local

### Backend

```bash
cd backend
cp .env.example .env   # ajuste JWT_SECRET; deixe DATABASE_URL vazio para SQLite
npm install
npm start              # ou npm run dev (nodemon)
```

Servidor em `http://localhost:5000`. Banco SQLite em `backend/Database.sqlite`.

### Frontend

```bash
cd frontend
cp .env.example .env.local  # VITE_API_URL=http://localhost:5000 (opcional)
npm install
npm run dev            # http://localhost:5173
npm run build          # gera dist/
```

### Migração SQLite → Postgres

```bash
cd backend
DATABASE_URL=postgresql://... npm run migrate:sqlite-to-postgres
```

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão 5000) |
| `NODE_ENV` | `development` ou `production` |
| `FRONTEND_URL` | Origem(s) do frontend (separadas por vírgula) |
| `DEV_URL` | Origem de desenvolvimento (opcional) |
| `DATABASE_URL` | Postgres/Neon; vazio usa SQLite local |
| `JWT_SECRET` | Segredo para assinar o JWT |
| `CRON_SECRET` | Segredo do endpoint de sincronização de status |
| `EMAIL_DEV_MODE` | `true` exibe o código no terminal |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Configuração SMTP |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Credenciais e remetente do e-mail |

### Frontend (`frontend/.env.local`)

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL do backend (em dev: `http://localhost:5000`; em prod: URL do backend no Render) |

## Endpoints da API

Base: `http://localhost:5000` (ou URL do backend em produção).

### Sistema

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Status do serviço |
| `GET` | `/internal/sincronizar-status` | Sync de status (header `x-cron-secret`) |

### Autenticação / Usuário (`/usuario`)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/usuario/login` | Login → cookie token |
| `POST` | `/usuario/logout` | Logout |
| `GET` | `/usuario/me` | Sessão (auth) |
| `PATCH` | `/usuario/senha` | Alterar senha (auth) |
| `POST` | `/usuario/recuperar-senha` | Solicitar código |
| `POST` | `/usuario/verificar-codigo` | Verificar código → reset_token |
| `POST` | `/usuario/redefinir-senha` | Redefinir senha |
| `POST` | `/usuario/NovoAgendamento` | Criar agendamento (auth) |
| `POST` | `/usuario/cancelarAgendamento` | Cancelar (auth) |
| `GET` | `/usuario/ListAgendamentos` | Listar todos |
| `GET` | `/usuario/meusAgendamentos` | Meus (auth, filtros/paginação) |
| `GET` | `/usuario/resumoAgendamentos` | Resumo (auth) |

### Eventos (`/events`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/events/listHorario_ret` | Horários de retirada |
| `GET` | `/events/listHorario_devol` | Horários de devolução |
| `GET` | `/events/listTurmas` | Turmas |
| `GET` | `/events/listLocal` | Locais |
| `GET` | `/events/listUsers` | Usuários |
| `GET` | `/events/listAgend` | Listagem com filtros/paginação |
| `GET` | `/events/disponibilidade` | Disponibilidade por data/intervalo/local |
| `POST` | `/events/disponibilidade-matriz` | Matriz por slots/locais |

### Admin (`/admin`, auth + Coordenador)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/admin/usuarios` (ou `/newuser`) | Criar usuário |
| `PATCH` | `/admin/usuarios/:id` | Editar usuário |
| `DELETE` | `/admin/usuarios/:id` | Excluir usuário |
| `POST` | `/admin/turmas` (ou `/NovaTurma`) | Criar turma |
| `PATCH` | `/admin/turmas/:id` | Editar turma |
| `DELETE` | `/admin/turmas/:id` | Excluir turma |
| `POST` | `/admin/locais` | Criar local (com `categoria`) |
| `PATCH` | `/admin/locais/:id` | Editar local |
| `DELETE` | `/admin/locais/:id` | Excluir local |
| `GET` | `/admin/capacidade` | Consultar capacidade |
| `PATCH` | `/admin/capacidade` | Alterar capacidade |

## Banco de dados

Diagrama Entidade-Relacionamento (DER) das principais tabelas:

![Diagrama ER](./documentação/img/der.png)

**Relacionamentos:**
- `Agendamento.usuario_id` → `Usuario.id`
- `Agendamento.turma` → `Turmas.id`
- `Agendamento.local_id` → `local.id`
- `Agendamento.data_retirada` → `horario_retirada.id`
- `Agendamento.data_devolucao` → `horarios_devolução.id`
- `RecuperacaoSenha.usuario_id` → `Usuario.id`

**Observações:**
- O estoque é calculado a partir de `Agendamento`. `Capacidade` armazena o total
  (padrão 36).
- `local.categoria` = "Sala de aula" (genérico, não exclusivo) ou "Local exclusivo".
- Status do agendamento: `Pendente`, `Em progresso`, `Finalizado`, `Cancelado`.

## Deploy (Render)

O `render.yaml` define 3 serviços: backend (web), frontend (static) e cron (sync de status
a cada 5 min).

1. Conecte o repositório ao Render.
2. Configure as variáveis de ambiente no painel:
   - Backend: `FRONTEND_URL`, `DATABASE_URL`, `JWT_SECRET`, `CRON_SECRET`, `SMTP_*`,
     `EMAIL_DEV_MODE=false`.
   - Frontend: `VITE_API_URL` apontando para o backend.
3. Backend: health check em `/health`; start command `npm start`.
4. Frontend: build `npm install && npm run build`; publish `dist`.
5. (Opcional) migre o banco local para o Postgres/Neon antes do deploy.

## Scripts disponíveis

### Backend (`backend/package.json`)

| Script | Descrição |
|---|---|
| `npm start` | Inicia o servidor (`node server.js`) |
| `npm run dev` | Desenvolvimento com nodemon |
| `npm run migrate:token-version` | Migração de token_version |
| `npm run migrate:sqlite-to-postgres` | Migra dados do SQLite para Postgres |

### Frontend (`frontend/package.json`)

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento Vite |
| `npm run build` | Typecheck + build + gera `dist/404.html` |
| `npm run lint` | ESLint |
| `npm run preview` | Preview do build |

## Testes

Testes manuais realizados nas principais funcionalidades:

| Funcionalidade | Resultado esperado | Resultado |
|---|---|---|
| Login válido | Acessar sistema | Sucesso |
| Login inválido | Credenciais inválidas | Mensagem exibida |
| Recuperação de senha | Senha redefinida | Sucesso |
| Novo agendamento | Criado com protocolo | Sucesso |
| Estoque insuficiente | Bloqueio | HTTP 409 |
| Local exclusivo | Segundo bloqueado | HTTP 409 |
| Cancelamento | Status Cancelado, estoque liberado | Sucesso |
| Cancelar finalizado | Bloqueio | HTTP 409 |
| Status automático | Status Finalizado | Finalizado |
| Filtros (Meu Painel) | Lista filtrada | Funcionando |
| Paginação com salto | Navegação | Funcionando |
| CRUD locais com categoria | Categoria salva | Funcionando |
| Rate limit | HTTP 429 com `Retry-After` | Funcionando |
| Controle de acesso | Professor em `/gerenciamento` redirecionado | OK |
| Health check | `{ status: "ok" }` | OK |
| Deploy Render | Serviços no ar | OK |

## Telas e rotas

Rotas do frontend (SPA):

| Rota | Descrição | Acesso |
|---|---|---|
| `/login` | Tela de login | Público |
| `/recuperar-senha` | Recuperação de senha | Público |
| `/` | Redireciona conforme sessão | — |
| `/agendar` | Novo agendamento | Autenticado |
| `/agendamentos` | Listagem de agendamentos | Autenticado |
| `/meu-painel` | Painel do usuário | Autenticado |
| `/gerenciamento` | Gerenciamento da plataforma | Coordenador |

## Contribuição

1. Faça um fork do projeto.
2. Crie uma branch para sua feature: `git checkout -b feat/minha-feature`.
3. Commit suas mudanças: `git commit -m "feat: descrição"`.
4. Push para a branch: `git push origin feat/minha-feature`.
5. Abra um Pull Request.

## Licença

Distribuído sob a licença **ISC**. Veja `backend/package.json` para detalhes.

## Autor

Desenvolvido por [@bernardosgtmatos](https://github.com/bernardosgtmatos) como Trabalho de
Conclusão de Curso (TCC).

---

> Documentação técnica detalhada disponível em `documentação/Documentação Técnica - AgendaChrome v2.md`.
