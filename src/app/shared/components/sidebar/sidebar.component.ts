import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  dividerBefore?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-slate-900 dark:bg-slate-950
             border-r border-slate-700/50 transition-transform duration-300"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span class="material-icons-round text-white text-lg">chat</span>
        </div>
        <div>
          <p class="text-white font-semibold text-sm">CRM WhatsApp</p>
          <p class="text-slate-400 text-xs">Corretor Imóveis</p>
        </div>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        @for (item of navItems; track item.route) {
          @if (!item.adminOnly || auth.isAdmin()) {

            <!-- Optional divider -->
            @if (item.dividerBefore) {
              <div class="my-2 border-t border-slate-700/50"></div>
            }

            <a
              [routerLink]="item.route"
              routerLinkActive="bg-primary-600/20 text-primary-400 border-primary-500/50"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400
                     hover:bg-slate-800 hover:text-white transition-all duration-150
                     border border-transparent group"
            >
              <span class="material-icons-round text-xl flex-shrink-0">{{ item.icon }}</span>
              <span class="text-sm font-medium">{{ item.label }}</span>
            </a>
          }
        }
      </nav>

      <!-- User info -->
      <div class="border-t border-slate-700/50 p-3">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-white text-sm font-semibold">
              {{ auth.user()?.email?.charAt(0)?.toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-slate-200 text-xs font-medium truncate">{{ auth.user()?.email }}</p>
            <p class="text-slate-500 text-xs">{{ auth.user()?.role }}</p>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);

  navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',        route: '/dashboard'     },
    { label: 'Leads',         icon: 'people',           route: '/leads'         },
    { label: 'Disparar Leads',icon: 'send',             route: '/lead-disparo', dividerBefore: true },
    { label: 'Workflows',     icon: 'account_tree',     route: '/workflows',    adminOnly: true, dividerBefore: true },
    { label: 'Usuários',      icon: 'manage_accounts',  route: '/users',        adminOnly: true },
    { label: 'Configurações', icon: 'settings',         route: '/settings',     dividerBefore: true },
  ];
}
