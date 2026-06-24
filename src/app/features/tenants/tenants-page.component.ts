import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { TenantService } from '@core/services/tenant.service';
import { ToastService } from '@core/services/toast.service';
import { Tenant, CreateTenantRequest } from '@shared/models';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  imports: [NgClass, DatePipe, ReactiveFormsModule, MatTableModule, MatMenuModule, SkeletonComponent],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md
                         bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <span class="material-icons-round text-sm">shield</span>
              MASTER
            </span>
          </div>
          <h1>Tenants</h1>
          <p>{{ tenants().length }} tenant(s) registrado(s) no sistema</p>
        </div>
        <button (click)="openForm()" class="btn-primary">
          <span class="material-icons-round text-base">add_business</span>
          Novo Tenant
        </button>
      </div>

      <!-- Cards de estatísticas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card p-5 flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <span class="material-icons-round text-blue-600 text-2xl">domain</span>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ tenants().length }}</p>
          </div>
        </div>
        <div class="card p-5 flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <span class="material-icons-round text-emerald-600 text-2xl">check_circle</span>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Ativos</p>
            <p class="text-2xl font-bold text-emerald-600">{{ activeTenants() }}</p>
          </div>
        </div>
        <div class="card p-5 flex items-center gap-4">
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <span class="material-icons-round text-red-600 text-2xl">block</span>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Inativos</p>
            <p class="text-2xl font-bold text-red-600">{{ tenants().length - activeTenants() }}</p>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        @if (loading()) {
          <div class="p-6"><app-skeleton [rows]="4" /></div>
        } @else {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="tenants()" class="w-full">

              <!-- Tenant -->
              <ng-container matColumnDef="tenant">
                <th mat-header-cell *matHeaderCellDef
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <td mat-cell *matCellDef="let t" class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30
                                flex items-center justify-center flex-shrink-0">
                      <span class="material-icons-round text-primary-600 dark:text-primary-400">
                        domain
                      </span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ t.name }}</p>
                      <p class="text-xs font-mono text-gray-400">{{ t.databaseName }}</p>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Schema version -->
              <ng-container matColumnDef="version">
                <th mat-header-cell *matHeaderCellDef
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Versão Schema
                </th>
                <td mat-cell *matCellDef="let t" class="px-4 py-3">
                  <span class="font-mono text-xs bg-gray-100 dark:bg-slate-700
                               text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                    v{{ t.schemaVersion }}
                  </span>
                </td>
              </ng-container>

              <!-- Status -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <td mat-cell *matCellDef="let t" class="px-4 py-3">
                  @if (t.active) {
                    <span class="badge badge-active">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                    </span>
                  } @else {
                    <span class="badge badge-leave">
                      <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inativo
                    </span>
                  }
                </td>
              </ng-container>

              <!-- Created -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <td mat-cell *matCellDef="let t" class="px-4 py-3">
                  <span class="text-sm text-gray-500">{{ t.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 w-16"></th>
                <td mat-cell *matCellDef="let t" class="px-4 py-3">
                  <button [matMenuTriggerFor]="menu"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                           hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <span class="material-icons-round text-base">more_vert</span>
                  </button>
                  <mat-menu #menu="matMenu">
                    @if (t.active) {
                      <button mat-menu-item (click)="deactivate(t)">
                        <span class="material-icons-round text-amber-500 text-base mr-2">block</span>
                        Desativar tenant
                      </button>
                    } @else {
                      <button mat-menu-item (click)="activate(t)">
                        <span class="material-icons-round text-emerald-500 text-base mr-2">check_circle</span>
                        Ativar tenant
                      </button>
                    }
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"></tr>

              <tr *matNoDataRow>
                <td [colSpan]="columns.length" class="py-16 text-center text-gray-400">
                  <span class="material-icons-round text-5xl block mb-2 opacity-30">domain</span>
                  Nenhum tenant registrado
                </td>
              </tr>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- ── Form Dialog ─────────────────────────────────────────────────────── -->
    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-in">

          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30
                          flex items-center justify-center">
                <span class="material-icons-round text-purple-600 text-xl">add_business</span>
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">Novo Tenant</h2>
                <p class="text-xs text-gray-400">Cria banco PostgreSQL + executa Flyway automaticamente</p>
              </div>
            </div>
            <button (click)="closeForm()"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                     hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">

            <div>
              <label class="form-label">Nome do Tenant *</label>
              <div class="relative">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-base">domain</span>
                <input formControlName="name" placeholder="Ex: Imobiliária ABC"
                  class="form-input pl-9" />
              </div>
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="text-red-500 text-xs mt-1">Nome é obrigatório</p>
              }
            </div>

            <div>
              <label class="form-label">Nome do Database *</label>
              <div class="relative">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-base">storage</span>
                <input formControlName="databaseName"
                  placeholder="Ex: tenant_imobiliaria_abc"
                  class="form-input pl-9 font-mono text-sm" />
              </div>
              <p class="text-xs text-gray-400 mt-1">
                Apenas letras minúsculas, números e underscore (3-63 chars).
                Ex: <span class="font-mono">tenant_imobiliaria_abc</span>
              </p>
              @if (form.get('databaseName')?.invalid && form.get('databaseName')?.touched) {
                <p class="text-red-500 text-xs mt-1">
                  Use letras minúsculas, números e underscore (3-63 chars)
                </p>
              }
            </div>

            <!-- Aviso importante -->
            <div class="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10
                        border border-amber-200 dark:border-amber-800 rounded-xl">
              <span class="material-icons-round text-amber-500 text-base flex-shrink-0 mt-0.5">
                warning
              </span>
              <div class="text-xs text-amber-700 dark:text-amber-400">
                <p class="font-semibold mb-0.5">Operação irreversível</p>
                <p>Será criado um novo database PostgreSQL e as migrations serão executadas.
                   Isso pode levar alguns segundos.</p>
              </div>
            </div>

            <div class="flex gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
              <button type="button" (click)="closeForm()" class="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button type="submit" [disabled]="form.invalid || saving()"
                class="btn-primary flex-1 justify-center">
                @if (saving()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Provisionando...
                } @else {
                  <span class="material-icons-round text-base">rocket_launch</span>
                  Criar Tenant
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5; }
    .form-input  {
      @apply w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl
             bg-white dark:bg-slate-700 text-gray-900 dark:text-white
             focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors;
    }
  `]
})
export class TenantsPageComponent implements OnInit {
  private tenantService = inject(TenantService);
  private toast         = inject(ToastService);
  private fb            = inject(FormBuilder);

  loading  = signal(true);
  saving   = signal(false);
  tenants  = signal<Tenant[]>([]);
  showForm = signal(false);

  columns = ['tenant', 'version', 'status', 'createdAt', 'actions'];

  activeTenants = computed(() => this.tenants().filter(t => t.active).length);

  form = this.fb.group({
    name: ['', Validators.required],
    databaseName: ['', [
      Validators.required,
      Validators.pattern(/^[a-z][a-z0-9_]{2,62}$/)
    ]],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.tenantService.getAll().subscribe({
      next:  t => { this.tenants.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm()  { this.form.reset(); this.showForm.set(true);  }
  closeForm() { this.showForm.set(false); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const req: CreateTenantRequest = {
      name:         this.form.value.name!,
      databaseName: this.form.value.databaseName!,
    };
    this.tenantService.create(req).subscribe({
      next: () => {
        this.toast.success('Tenant criado e banco provisionado com sucesso!');
        this.closeForm();
        this.saving.set(false);
        this.load();
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message ?? 'Erro ao criar tenant.');
        this.saving.set(false);
      },
    });
  }

  activate(t: Tenant) {
    this.tenantService.activate(t.id).subscribe({
      next:  () => { this.toast.success(`Tenant "${t.name}" ativado!`); this.load(); },
      error: () => this.toast.error('Erro ao ativar tenant.'),
    });
  }

  deactivate(t: Tenant) {
    this.tenantService.deactivate(t.id).subscribe({
      next:  () => { this.toast.success(`Tenant "${t.name}" desativado.`); this.load(); },
      error: () => this.toast.error('Erro ao desativar tenant.'),
    });
  }
}
