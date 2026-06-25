import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, masterGuard, tenantContextGuard } from '@core/guards/auth.guard';

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

      {
        path: 'dashboard',
        canActivate: [tenantContextGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent),
        title: 'Dashboard — CRM WhatsApp',
      },

      {
        path: 'leads',
        canActivate: [tenantContextGuard],
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
            title: 'Detalhes do Lead - CRM WhatsApp',
          },
        ],
      },

      {
        path: 'lead-disparo',
        canActivate: [tenantContextGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/lead-disparo/lead-disparo-page.component').then(m => m.LeadDisparoPageComponent),
            title: 'Disparar Leads - CRM WhatsApp',
          },
          {
            path: 'historico',
            loadComponent: () =>
              import('./features/lead-disparo/lead-disparo-historico-page.component').then(m => m.LeadDisparoHistoricoPageComponent),
            title: 'HistÃ³rico de Disparos â€” CRM WhatsApp',
          },
        ],
      },

      {
        path: 'workflows',
        canActivate: [adminGuard, tenantContextGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/workflows/workflow-list/workflow-list-page.component').then(m => m.WorkflowListPageComponent),
            title: 'Workflows - CRM WhatsApp',
          },
          {
            path: ':workflowId/steps',
            loadComponent: () =>
              import('./features/workflows/workflow-steps/workflow-steps-page.component').then(m => m.WorkflowStepsPageComponent),
            title: 'Etapas - CRM WhatsApp',
          },
          {
            path: ':workflowId/documents',
            loadComponent: () =>
              import('./features/workflows/workflow-documents/workflow-documents-page.component').then(m => m.WorkflowDocumentsPageComponent),
            title: 'Documentos - CRM WhatsApp',
          },
        ],
      },

      {
        path: 'meta-phones',
        canActivate: [adminGuard, tenantContextGuard],
        loadComponent: () =>
          import('./features/meta-phones/meta-phones-page.component').then(m => m.MetaPhonesPageComponent),
        title: 'Canais WhatsApp - CRM WhatsApp',
      },

      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users-page.component').then(m => m.UsersPageComponent),
        title: 'Usuários - CRM WhatsApp',
      },

      {
        path: 'tenants',
        canActivate: [masterGuard],
        loadComponent: () =>
          import('./features/tenants/tenants-page.component').then(m => m.TenantsPageComponent),
        title: 'Tenants - CRM WhatsApp',
      },

      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page.component').then(m => m.SettingsPageComponent),
        title: 'Configurações - CRM WhatsApp',
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
