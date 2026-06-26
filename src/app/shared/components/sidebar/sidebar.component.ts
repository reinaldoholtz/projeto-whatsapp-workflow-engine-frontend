import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '@core/auth/auth.service';
import { TenantService } from '@core/services/tenant.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  masterOnly?: boolean;
  masterAdminOnly?: boolean;
  tenantAreaOnly?: boolean;
  dividerBefore?: boolean;
  subLabel?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <aside class="fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-slate-900 dark:bg-slate-950
                  border-r border-slate-700/50">

      <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span class="material-icons-round text-white text-lg">chat</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-semibold text-sm">CRM WhatsApp</p>
          @if (auth.isMasterAdminMode()) {
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold
                         bg-amber-500/20 text-amber-300 mt-0.5">
              <span class="material-icons-round text-xs">admin_panel_settings</span> ADMIN
            </span>
          } @else if (auth.isMasterTenantMode()) {
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold
                         bg-emerald-500/20 text-emerald-300 mt-0.5">
              <span class="material-icons-round text-xs">storefront</span> TENANT
            </span>
          } @else if (auth.isMaster()) {
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold
                         bg-purple-500/20 text-purple-300 mt-0.5">
              <span class="material-icons-round text-xs">shield</span> MASTER
            </span>
          } @else {
            <p class="text-slate-400 text-xs">{{ auth.tenantName() ?? auth.user()?.databaseName ?? 'Tenant' }}</p>
          }
          @if (auth.isMaster()) {
            <p class="text-slate-400 text-xs mt-1 truncate">
              {{ auth.isMasterAdminMode() ? 'Ambiente administrativo' : (auth.tenantName() ?? auth.databaseName()) }}
            </p>
          }
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        @if (auth.isMasterTenantMode()) {
          <button
            (click)="returnToAdmin()"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-300
                   bg-amber-500/10 hover:bg-amber-500/20 transition-all duration-150 border border-amber-500/20"
          >
            <span class="material-icons-round text-xl flex-shrink-0">undo</span>
            <div class="flex-1 min-w-0 text-left">
              <span class="text-sm font-medium block truncate">Voltar para Administracao</span>
              <span class="text-xs text-amber-200/80 block leading-tight">Retorna ao admin_db</span>
            </div>
          </button>
        }

        @for (item of navItems; track item.route) {
          @if (isVisible(item)) {
            @if (item.dividerBefore) {
              <div class="my-2 border-t border-slate-700/50"></div>
            }
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-primary-600/20 text-primary-400 border-primary-500/50"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400
                     hover:bg-slate-800 hover:text-white transition-all duration-150
                     border border-transparent"
            >
              <span class="material-icons-round text-xl flex-shrink-0">{{ item.icon }}</span>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium block truncate">{{ item.label }}</span>
                @if (item.subLabel) {
                  <span class="text-xs text-slate-500 block leading-tight">{{ item.subLabel }}</span>
                }
              </div>
            </a>
          }
        }
      </nav>

      <div class="border-t border-slate-700/50 p-3">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            [ngClass]="auth.isMasterAdminMode() ? 'bg-amber-600' : (auth.isMaster() ? 'bg-purple-600' : 'bg-primary-600')">
            <span class="text-white text-sm font-semibold">
              {{ auth.user()?.email?.charAt(0)?.toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-slate-200 text-xs font-medium truncate">{{ auth.user()?.email }}</p>
            <p class="text-slate-500 text-xs">{{ roleLabel(auth.user()?.role) }}</p>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);

  navItems: NavItem[] = [
    { label: 'Dashboard',          icon: 'dashboard',          route: '/dashboard',              tenantAreaOnly: true },
    { label: 'Leads',              icon: 'people',             route: '/leads',                  tenantAreaOnly: true },
    { label: 'Disparar Leads',     icon: 'send',               route: '/lead-disparo',           tenantAreaOnly: true, dividerBefore: true },
    { label: 'Historico Disparos', icon: 'history',            route: '/lead-disparo/historico', tenantAreaOnly: true, subLabel: 'Arquivos e resultados' },
    { label: 'Workflows',          icon: 'account_tree',       route: '/workflows',              adminOnly: true, tenantAreaOnly: true, dividerBefore: true },
    { label: 'Canais WhatsApp',    icon: 'perm_phone_msg',     route: '/meta-phones',            adminOnly: true, tenantAreaOnly: true },
    { label: 'Usuarios',           icon: 'manage_accounts',    route: '/users',                  adminOnly: true, tenantAreaOnly: true },
    { label: 'Tenants',            icon: 'domain',             route: '/tenants',                masterAdminOnly: true, dividerBefore: true, subLabel: 'Gestao global' },
    { label: 'Usuarios Globais',   icon: 'supervisor_account', route: '/users',                  masterAdminOnly: true },
    { label: 'Configuracoes',      icon: 'settings',           route: '/settings',               dividerBefore: true },
  ];

  isVisible(item: NavItem): boolean {
    if (item.masterAdminOnly) return this.auth.isMasterAdminMode();
    if (item.masterOnly) return this.auth.isMaster();
    if (item.tenantAreaOnly && this.auth.isMasterAdminMode()) return false;
    if (item.adminOnly) return this.auth.isAdmin();
    return true;
  }

  returnToAdmin(): void {
    this.tenantService.backToAdmin().subscribe({
      next: res => {
        this.auth.applyAuthResponse(res);
        this.router.navigate(['/tenants']);
      },
    });
  }

  roleLabel(role?: string): string {
    const map: Record<string, string> = {
      MASTER:   'Master Admin',
      ADMIN:    'Administrador',
      CORRETOR: 'Corretor',
      OPERADOR: 'Operador',
    };
    return role ? (map[role] ?? role) : '';
  }
}
