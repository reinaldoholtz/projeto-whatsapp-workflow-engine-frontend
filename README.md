# CRM WhatsApp — Frontend

Frontend Angular 19 enterprise para o sistema de automação WhatsApp / captação de leads MCMV.

---

## Stack

| Tecnologia | Versão |
|---|---|
| Angular | 19 |
| TypeScript | 5.5 |
| Tailwind CSS | 3.4 |
| Angular Material | 19 |
| RxJS | 7.8 |

---

## Início Rápido

### Pré-requisitos

- Node.js 20+
- npm 10+
- Backend rodando em `http://localhost:8080`

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm start
```

Abre em `http://localhost:4200`

O proxy redireciona `/api/**` para `http://localhost:8080`.

### Build produção

```bash
npm run build
```

---

## Credenciais padrão (do backend seed)

| Usuário | Senha |
|---|---|
| admin@corretor.com.br | Admin@123 |
| leo@corretor.com.br | Corretor@123 |

---

## Estrutura

```
src/app/
├── core/
│   ├── auth/          # AuthService (signals)
│   ├── guards/        # authGuard, adminGuard, guestGuard
│   ├── interceptors/  # JWT authInterceptor (refresh automático)
│   ├── layouts/       # MainLayoutComponent
│   └── services/      # LeadService, WorkflowService, ThemeService, ToastService
│
├── shared/
│   ├── components/
│   │   ├── badge/     # StatusBadgeComponent
│   │   ├── skeleton/  # SkeletonComponent
│   │   ├── sidebar/   # SidebarComponent
│   │   ├── topbar/    # TopbarComponent
│   │   └── toast/     # ToastComponent
│   └── models/        # Todos os types e interfaces TypeScript
│
└── features/
    ├── auth/login/         # LoginPageComponent
    ├── dashboard/          # DashboardPageComponent
    ├── leads/
    │   ├── lead-list/      # LeadListPageComponent
    │   └── lead-details/   # LeadDetailsPageComponent (timeline + chat + docs)
    ├── workflows/
    │   ├── workflow-list/      # WorkflowListPageComponent
    │   ├── workflow-steps/     # WorkflowStepsPageComponent
    │   └── workflow-documents/ # WorkflowDocumentsPageComponent
    └── settings/           # SettingsPageComponent
```

---

## Funcionalidades

### Login
- JWT com refresh automático via interceptor
- Sessão persistida no localStorage
- Redirect automático por guard

### Dashboard
- Cards: Total Leads, Ativos, Concluídos, Handoff, Pausados, Workflows, Taxa de Conversão
- Gráfico de barras por status
- Lista dos últimos leads

### Leads
- Tabela com filtros: nome, telefone, status, workflow, etapa
- Paginação client-side
- Ações: pausar, retomar, handoff, gerar PDF
- Detalhes: timeline de respostas, histórico em formato chat WhatsApp, documentos

### Workflows (ADMIN)
- CRUD de workflows
- Editor de etapas com timeline visual
- Gestão de documentos obrigatórios por workflow

### Dark Mode
- Toggle no topbar
- Persistido no localStorage
- Detecta preferência do sistema automaticamente

---

## Rotas

| Rota | Componente | Guard |
|---|---|---|
| `/auth/login` | LoginPage | guestGuard |
| `/dashboard` | DashboardPage | authGuard |
| `/leads` | LeadListPage | authGuard |
| `/leads/:id` | LeadDetailsPage | authGuard |
| `/workflows` | WorkflowListPage | adminGuard |
| `/workflows/:id/steps` | WorkflowStepsPage | adminGuard |
| `/workflows/:id/documents` | WorkflowDocumentsPage | adminGuard |
| `/settings` | SettingsPage | authGuard |
