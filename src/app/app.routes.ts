import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, masterGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login-page.component').then(m => m.LoginPageComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layouts/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // ── Dashboard ───────────────────────────────────────────────────────
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent),
        title: 'Dashboard — CRM WhatsApp',
      },

      // ── Leads ───────────────────────────────────────────────────────────
      {
        path: 'leads',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/leads/lead-list/lead-list-page.component').then(m => m.LeadListPageComponent),
            title: 'Leads — CRM WhatsApp',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/leads/lead-details/lead-details-page.component').then(m => m.LeadDetailsPageComponent),
            title: 'Detalhes do Lead — CRM WhatsApp',
          },
        ],
      },

      // ── Lead Disparo ─────────────────────────────────────────────────────
      {
        path: 'lead-disparo',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/lead-disparo/lead-disparo-page.component').then(m => m.LeadDisparoPageComponent),
            title: 'Disparar Leads — CRM WhatsApp',
          },
          {
            path: 'historico',
            loadComponent: () =>
              import('./features/lead-disparo/lead-disparo-historico-page.component').then(m => m.LeadDisparoHistoricoPageComponent),
            title: 'Histórico de Disparos — CRM WhatsApp',
          },
        ],
      },

      // ── Workflows (ADMIN + MASTER) ────────────────────────────────────────
      {
        path: 'workflows',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/workflows/workflow-list/workflow-list-page.component').then(m => m.WorkflowListPageComponent),
            title: 'Workflows — CRM WhatsApp',
          },
          {
            path: ':workflowId/steps',
            loadComponent: () =>
              import('./features/workflows/workflow-steps/workflow-steps-page.component').then(m => m.WorkflowStepsPageComponent),
            title: 'Etapas — CRM WhatsApp',
          },
          {
            path: ':workflowId/documents',
            loadComponent: () =>
              import('./features/workflows/workflow-documents/workflow-documents-page.component').then(m => m.WorkflowDocumentsPageComponent),
            title: 'Documentos — CRM WhatsApp',
          },
        ],
      },

      // ── Canais WhatsApp (ADMIN + MASTER) ────────────────────────────────
      {
        path: 'meta-phones',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/meta-phones/meta-phones-page.component').then(m => m.MetaPhonesPageComponent),
        title: 'Canais WhatsApp — CRM WhatsApp',
      },

      // ── Usuários (ADMIN + MASTER) ────────────────────────────────────────
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users-page.component').then(m => m.UsersPageComponent),
        title: 'Usuários — CRM WhatsApp',
      },

      // ── Tenants (MASTER only) — Fase 5 ──────────────────────────────────
      {
        path: 'tenants',
        canActivate: [masterGuard],
        loadComponent: () =>
          import('./features/tenants/tenants-page.component').then(m => m.TenantsPageComponent),
        title: 'Tenants — CRM WhatsApp',
      },

      // ── Configurações ────────────────────────────────────────────────────
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page.component').then(m => m.SettingsPageComponent),
        title: 'Configurações — CRM WhatsApp',
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
