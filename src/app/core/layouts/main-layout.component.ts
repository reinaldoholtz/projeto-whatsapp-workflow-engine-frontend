import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '@shared/components/topbar/topbar.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-slate-900">
      <app-sidebar />
      <app-topbar />
      <main class="ml-64 pt-16 min-h-screen">
        <div class="p-6 animate-fade-in">
          <router-outlet />
        </div>
      </main>
      <app-toast />
    </div>
  `
})
export class MainLayoutComponent {}
