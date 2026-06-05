import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from '@core/guards/auth.guard';

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
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent),
        title: 'Dashboard — CRM WhatsApp',
      },
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
