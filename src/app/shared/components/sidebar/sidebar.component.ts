import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '@core/auth/auth.service';
import { TenantService } from '@core/services/tenant.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles?: ('MASTER' | 'ADMIN' | 'CORRETOR' | 'OPERADOR')[];
  exact?: boolean;
  dividerBefore?: boolean;
  subLabel?: string;
  parentId?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside  class="group fixed inset-y-0 left-0 z-40 flex flex-col w-16
         bg-slate-900 dark:bg-slate-950 border-r border-slate-700/50">

      <div class="flex items-center justify-center px-3 py-5 border-b border-slate-700/50">
        <div class="relative group/sidebar-header">

          <!-- Logo -->
          <div
            class="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 cursor-default"
          >
            <span class="material-icons-round text-white text-lg">
              chat
            </span>
          </div>

          <!-- Tooltip -->
          <div
            class="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                  z-50 w-64 rounded-lg
                  bg-slate-800 text-white
                  px-3 py-2.5 shadow-lg
                  border border-slate-700
                  opacity-0 invisible
                  group-hover/sidebar-header:opacity-100
                  group-hover/sidebar-header:visible
                  transition-all duration-150"
          >
            <!-- Nome -->
            <p class="font-semibold text-sm">
              CRM
            </p>

            <!-- Master Admin -->
            @if (auth.isMasterAdminMode()) {
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                      text-xs font-semibold
                      bg-amber-500/20 text-amber-300 mt-1"
              >
                <span class="material-icons-round text-xs">
                  admin_panel_settings
                </span>
                ADMIN
              </span>

            <!-- Master Tenant -->
            } @else if (auth.isMasterTenantMode()) {
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                      text-xs font-semibold
                      bg-primary-500/20 text-primary-300 mt-1"
              >
                <span class="material-icons-round text-xs">
                  admin_panel_settings
                </span>
                ADMIN
              </span>

            <!-- Master -->
            } @else if (auth.isMaster()) {
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded
                      text-xs font-semibold
                      bg-purple-500/20 text-purple-300 mt-1"
              >
                <span class="material-icons-round text-xs">
                  shield
                </span>
                MASTER
              </span>

            <!-- Usuário normal -->
            } @else {
              <p class="text-slate-400 text-xs mt-1">
                {{ auth.tenantName() ?? auth.user()?.databaseName ?? 'Tenant' }}
              </p>
            }

            <!-- Ambiente do Master -->
            @if (auth.isMaster()) {
              <p class="text-slate-400 text-xs mt-1">
                {{ auth.isMasterAdminMode()
                    ? 'Ambiente administrativo'
                    : (auth.tenantName() ?? auth.databaseName()) }}
              </p>
            }
          </div>

        </div>
      </div>

      <nav class="flex-1 px-2 py-4 space-y-1">
        @if (auth.isMasterTenantMode()) {
          <button
              (click)="returnToAdmin()"
              title="Voltar para Administração"
              class="relative group/nav-item w-full flex items-center justify-center
                    px-2 py-2.5 rounded-lg
                    text-amber-300
                    bg-amber-500/10
                    hover:bg-amber-500/20
                    transition-all duration-150
                    border border-amber-500/20"
            >
              <span class="material-icons-round text-xl">
                undo
              </span>

              <span
                class="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                      z-50 whitespace-nowrap rounded-lg
                      bg-slate-800 text-white text-xs font-medium
                      px-3 py-2 shadow-lg border border-slate-700
                      opacity-0 invisible
                      group-hover/nav-item:opacity-100
                      group-hover/nav-item:visible
                      transition-all duration-150"
              >
                Voltar para Administração
              </span>
            </button>
        }

        @for (item of navItems; track item.id) {
          @if (isRoot(item) && isVisible(item)) {
            @if (item.dividerBefore) {
              <div class="my-2 border-t border-slate-700/50"></div>
            }
            @if (childrenOf(item.id).length > 0) {
              <button
                  type="button"
                  (click)="toggleMenu(item.id)"
                  [title]="item.label"
                  class="relative group/nav-item w-full flex items-center justify-center
                        px-2 py-2.5 rounded-lg
                        text-slate-400
                        hover:bg-slate-800 hover:text-white
                        transition-all duration-150"
                >
                  <span class="material-icons-round text-xl">
                    {{ item.icon }}
                  </span>

                  <!-- Tooltip -->
                  <span
                    class="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                          z-50 whitespace-nowrap rounded-lg
                          bg-slate-800 text-white text-xs font-medium
                          px-3 py-2 shadow-lg border border-slate-700
                          opacity-0 invisible
                          group-hover/nav-item:opacity-100
                          group-hover/nav-item:visible
                          transition-all duration-150"
                  >
                    {{ item.label }}
                  </span>
                </button>
            } @else {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-primary-600/20 text-primary-400 border-primary-500/50"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                [title]="item.label"
                class="relative group/nav-item
                      flex items-center justify-center
                      px-2 py-2.5 rounded-lg
                      text-slate-400
                      hover:bg-slate-800 hover:text-white
                      transition-all duration-150
                      border border-transparent">
                <span class="material-icons-round text-xl">
                  {{ item.icon }}
                </span>

                <!-- Tooltip -->
                <span
                  class="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                        z-50 whitespace-nowrap rounded-lg
                        bg-slate-800 text-white text-xs font-medium
                        px-3 py-2 shadow-lg border border-slate-700
                        opacity-0 invisible
                        group-hover/nav-item:opacity-100
                        group-hover/nav-item:visible
                        transition-all duration-150"
                >
                  {{ item.label }}
                </span>
              </a>
            }

            @if (childrenOf(item.id).length > 0 && isExpanded(item.id)) {
              @for (child of childrenOf(item.id); track child.id) {
                @if (isVisible(child)) {
                  <a
                    [routerLink]="child.route"
                    routerLinkActive="bg-primary-600/20 text-primary-400"
                    [routerLinkActiveOptions]="{ exact: child.exact ?? false }"
                    class="flex items-center gap-3
                          pl-11 pr-3 py-2
                          rounded-lg
                          text-slate-500
                          hover:bg-slate-800 hover:text-white"
                  >
                    <span class="material-icons-round text-base">
                      {{ child.icon }}
                    </span>
                    <span class="text-sm">
                      {{ child.label }}
                    </span>
                  </a>
                }
              }
            }
          }
        }
      </nav>

      <!-- <div class="border-t border-slate-700/50 p-3">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            [ngClass]="auth.isMasterAdminMode() ? 'bg-amber-600' : 'bg-primary-600'">
            <span class="text-white text-sm font-semibold">
              {{ auth.user()?.email?.charAt(0)?.toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-slate-200 text-xs font-medium truncate">{{ auth.user()?.email }}</p>
            <p class="text-slate-500 text-xs">{{ roleLabel(auth.user()?.role) }}</p>
          </div>
        </div>
      </div> -->
    </aside>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);

  navItems: NavItem[] = [
    // { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['ADMIN', 'CORRETOR', 'OPERADOR'] },
    { id: 'attendance', label: 'Atendimento', icon: 'forum', route: '/attendance', roles: ['ADMIN', 'OPERADOR'], subLabel: 'Central de conversas' },
    { id: 'attendance-groups', label: 'Grupos de Atendimento', icon: 'groups', route: '/attendance-groups', roles: ['ADMIN'], subLabel: 'Áreas e acesso' },
    // { id: 'attendance-queues', label: 'Filas de Atendimento', icon: 'queue', route: '/attendance-queues', roles: ['ADMIN'], subLabel: 'Distribuição e operadores' },
    { id: 'attendance-menus', label: 'Menus de Atendimento', icon: 'menu_open', route: '/attendance-menus', roles: ['ADMIN'], subLabel: 'Menus interativos' },
    // { id: 'leads', label: 'Leads', icon: 'people', route: '/leads', roles: ['ADMIN', 'CORRETOR', 'OPERADOR'] },
    // { id: 'appointments', label: 'Agenda', icon: 'event', route: '/appointments', roles: ['ADMIN'], subLabel: 'Agendamentos e disponibilidade' },
    // { id: 'campaigns', label: 'Campanhas', icon: 'campaign', route: '', roles: ['ADMIN', 'CORRETOR', 'OPERADOR'], dividerBefore: true },
    { id: 'lead-disparo', label: 'Novo Disparo', icon: 'send', route: '/lead-disparo', exact: true, parentId: 'campaigns', roles: ['ADMIN', 'CORRETOR', 'OPERADOR'] },
    { id: 'historico', label: 'Histórico', icon: 'history', route: '/lead-disparo/historico', exact: true, parentId: 'campaigns', roles: ['ADMIN', 'CORRETOR', 'OPERADOR'] },
    { id: 'workflows', label: 'Workflows', icon: 'account_tree', route: '/workflows', roles: ['ADMIN'], dividerBefore: true },
    { id: 'channel-accounts', label: 'Contas de Canais', icon: 'perm_phone_msg', route: '/channel-accounts', roles: ['MASTER', 'ADMIN'] },
    { id: 'whatsapp-templates', label: 'Templates WhatsApp', icon: 'text_snippet', route: '/whatsapp-templates', roles: ['MASTER'] },
    { id: 'users', label: 'Usuarios', icon: 'manage_accounts', route: '/users', roles: ['ADMIN'] },
    { id: 'tenants', label: 'Tenants', icon: 'domain', route: '/tenants', roles: ['MASTER'], dividerBefore: true, subLabel: 'Gestao global' },
    { id: 'global-users', label: 'Usuarios Globais', icon: 'supervisor_account', route: '/users', roles: ['MASTER'] },
    { id: 'settings', label: 'Configurações', icon: 'settings', route: '/settings' }
  ];

  expandedMenus = new Set<string>();

  isVisible(item: NavItem): boolean {
    if (!item.roles?.length) {
      return true;
    }

    return item.roles.includes(this.auth.menuRole());
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
    if (this.auth.isMasterTenantMode()) {
      return 'Administrador';
    }

    const map: Record<string, string> = {
      MASTER: 'Master Admin',
      ADMIN: 'Administrador',
      CORRETOR: 'Corretor',
      OPERADOR: 'Operador',
    };
    return role ? (map[role] ?? role) : '';
  }

  childrenOf(parentId: string): NavItem[] {
    return this.navItems.filter(item => item.parentId === parentId);
  }

  isRoot(item: NavItem): boolean {
    return !item.parentId;
  }

  toggleMenu(id: string): void {
    if (this.expandedMenus.has(id)) {
      this.expandedMenus.delete(id);
    } else {
      this.expandedMenus.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedMenus.has(id);
  }
}
