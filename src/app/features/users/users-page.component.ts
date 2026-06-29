import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '@core/auth/auth.service';
import { TenantService } from '@core/services/tenant.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { User, UserRole, CreateUserRequest, UpdateUserRequest, Tenant } from '@shared/models';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

const ROLE_CONFIG: Record<UserRole, { label: string; css: string }> = {
  MASTER:   { label: 'Master', css: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  ADMIN:    { label: 'Administrador', css: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  CORRETOR: { label: 'Corretor',      css: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'         },
  OPERADOR: { label: 'Operador',      css: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'         },
};

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [NgClass, DatePipe, ReactiveFormsModule, MatTableModule, MatMenuModule, SkeletonComponent],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Usuários</h1>
          <p>{{ users().length }} usuário(s) cadastrado(s)</p>
        </div>
        <button (click)="openForm()" class="btn-primary">
          <span class="material-icons-round text-base">person_add</span>
          Novo Usuário
        </button>
      </div>

      <!-- Search -->
      <div class="card p-4">
        <div class="relative max-w-sm">
          <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
          <input
            [value]="search()"
            (input)="search.set($any($event.target).value)"
            placeholder="Buscar por nome ou e-mail..."
            class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg
                   bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                   focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        @if (loading()) {
          <div class="p-6"><app-skeleton [rows]="5" /></div>
        } @else {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="filteredUsers()" class="w-full">

              <!-- Avatar + Name -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuário
                </th>
                <td mat-cell *matCellDef="let user" class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                      [ngClass]="avatarColor(user.role)">
                      {{ user.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user.name }}</p>
                      <p class="text-xs text-gray-400">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Tenant -->
              <ng-container matColumnDef="tenantName">
                <th mat-header-cell *matHeaderCellDef
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>

                <td mat-cell *matCellDef="let user" class="px-4 py-3">
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ user.tenantName }}
                  </span>
                </td>
              </ng-container>

              <!-- Role -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Perfil (Role)
                </th>
                <td mat-cell *matCellDef="let user" class="px-4 py-3">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="roleClass(user.role)">
                    <span class="material-icons-round text-sm">{{ roleIcon(user.role) }}</span>
                    {{ roleLabel(user.role) }}
                  </span>
                </td>
              </ng-container>

              <!-- Status -->
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef
                  class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <td mat-cell *matCellDef="let user" class="px-4 py-3">
                  @if (user.active) {
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
                <td mat-cell *matCellDef="let user" class="px-4 py-3">
                  <span class="text-sm text-gray-500">{{ user.createdAt | date:'dd/MM/yyyy' }}</span>
                </td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 w-20"></th>
                <td mat-cell *matCellDef="let user" class="px-4 py-3">
                  <div class="flex items-center gap-1">

                    <!-- Edit -->
                    <button (click)="openForm(user)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
                      title="Editar">
                      <span class="material-icons-round text-base">edit</span>
                    </button>

                    <!-- More -->
                    <button [matMenuTriggerFor]="menu"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                      <span class="material-icons-round text-base">more_vert</span>
                    </button>

                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="toggleActive(user)">
                        <span class="material-icons-round text-base mr-2"
                          [ngClass]="user.active ? 'text-amber-500' : 'text-emerald-500'">
                          {{ user.active ? 'block' : 'check_circle' }}
                        </span>
                        {{ user.active ? 'Desativar' : 'Ativar' }}
                      </button>
                      <button mat-menu-item (click)="confirmDelete(user)">
                        <span class="material-icons-round text-red-500 text-base mr-2">delete</span>
                        Excluir
                      </button>
                    </mat-menu>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns()"></tr>
              <tr mat-row
                  *matRowDef="let row; columns: columns();"
                  class="transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/40">
              </tr>

              <tr *matNoDataRow>
                <td [colSpan]="columns().length"
                    class="py-16 text-center text-gray-400">
                  <span class="material-icons-round text-5xl block mb-2 opacity-30">
                    manage_accounts
                  </span>
                  Nenhum usuário encontrado
                </td>
              </tr>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- ── Form Dialog ──────────────────────────────────────────────────────── -->
    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in overflow-y-auto">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg my-4 animate-slide-in">

          <!-- Dialog Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span class="material-icons-round text-primary-600 dark:text-primary-400">
                  {{ editing() ? 'edit' : 'person_add' }}
                </span>
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ editing() ? 'Editar Usuário' : 'Novo Usuário' }}
                </h2>
                <p class="text-xs text-gray-400">
                  {{ editing() ? editing()!.email : 'Preencha os dados abaixo' }}
                </p>
              </div>
            </div>
            <button (click)="closeForm()"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                     hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <!-- Dialog Body -->
          <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">

            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nome completo *
              </label>
              <input formControlName="name"   placeholder="Ex: João da Silva" class="form-input"/>
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="text-red-500 text-xs mt-1">Nome é obrigatório</p>
              }
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                E-mail *
              </label>
              <input formControlName="email" type="email" placeholder="joao@empresa.com.br" class="form-input"/>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="text-red-500 text-xs mt-1">E-mail válido é obrigatório</p>
              }
            </div>

            @if (canChooseTenant()) {
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tenant *
                </label>
                <select formControlName="tenantId" class="form-input">
                  <option [ngValue]="null">Selecione um tenant</option>
                  @for (tenant of activeTenants(); track tenant.id) {
                    <option [ngValue]="tenant.id">{{ tenant.name }}</option>
                  }
                </select>
                @if (form.get('tenantId')?.invalid && form.get('tenantId')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Selecione o tenant do usuario</p>
                }
              </div>
            }

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Telefone
              </label>

              <input
                formControlName="phoneNumber"
                placeholder="5511999999999"
                class="form-input"
              />

              @if (form.get('phoneNumber')?.invalid && form.get('phoneNumber')?.touched) {
                <p class="text-red-500 text-xs mt-1">
                  Telefone é obrigatório
                </p>
              }
            </div>

            <!-- WhatsApp Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                WhatsApp *
              </label>

              <input
                formControlName="whatsappPhone"
                placeholder="5511999999999"
                class="form-input"
              />

              @if (form.get('whatsappPhone')?.invalid && form.get('whatsappPhone')?.touched) {
                <p class="text-red-500 text-xs mt-1">
                  WhatsApp é obrigatório
                </p>
              }
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Senha {{ editing() ? '(deixe em branco para manter)' : '*' }}
              </label>
              <div class="relative">
                <input formControlName="password" [type]="showPass() ? 'text' : 'password'" class="form-input pr-10"/>
                <button
                  type="button"
                  (click)="toggleShowPass()"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <span class="material-icons-round text-base">
                    {{ showPass() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-red-500 text-xs mt-1">Senha deve ter no mínimo 6 caracteres</p>
              }
            </div>

            <!-- Role -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Perfil (Role) *
              </label>
              <div class="grid grid-cols-3 gap-2">
                @for (role of roles; track role.value) {
                  <button type="button"
                    (click)="setRole(role.value)"
                    class="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium"
                    [ngClass]="isRoleSelected(role.value)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500'"
                  >
                    <span class="material-icons-round text-2xl">{{ role.icon }}</span>
                    {{ role.label }}
                  </button>
                }
              </div>
              @if (form.get('role')?.invalid && form.get('role')?.touched) {
                <p class="text-red-500 text-xs mt-1">Selecione um perfil</p>
              }
            </div>

            <!-- Active toggle (edit only) -->
            @if (editing()) {
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <div>
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Status do usuário</p>
                  <p class="text-xs text-gray-400">Usuários inativos não conseguem acessar o sistema</p>
                </div>
                <button type="button" (click)="toggleActiveForm()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                  [ngClass]="isActiveForm() ? 'bg-primary-600' : 'bg-gray-300 dark:bg-slate-600'">
                  <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                    [ngClass]="isActiveForm() ? 'translate-x-6' : 'translate-x-1'"></span>
                </button>
              </div>
            }        

            <!-- Buttons -->
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeForm()" class="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary flex-1 justify-center">
                @if (saving()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Salvando...
                } @else {
                  <span class="material-icons-round text-base">save</span>
                  {{ editing() ? 'Salvar Alterações' : 'Criar Usuário' }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ── Confirm Delete Dialog ─────────────────────────────────────────────── -->
    @if (userToDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-in text-center">
          <div class="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-icons-round text-red-600 text-2xl">delete_forever</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Excluir usuário?</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Você está prestes a excluir
            <strong class="text-gray-800 dark:text-gray-200">{{ userToDelete()!.name }}</strong>.
            Esta ação não pode ser desfeita.
          </p>
          <div class="flex gap-3">
            <button (click)="cancelDelete()" class="btn-secondary flex-1 justify-center">Cancelar</button>
            <button (click)="deleteUser()" [disabled]="saving()" class="btn-danger flex-1 justify-center">
              @if (saving()) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              }
              Excluir
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .form-input {
      @apply w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl
             bg-white dark:bg-slate-700 text-gray-900 dark:text-white
             focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors;
    }
  `]
})
export class UsersPageComponent implements OnInit {
  auth              = inject(AuthService);
  private tenantService = inject(TenantService);
  private userService = inject(UserService);
  private toast       = inject(ToastService);
  private fb          = inject(FormBuilder);

  loading      = signal(true);
  loadingTenants = signal(false);
  saving       = signal(false);
  users        = signal<User[]>([]);
  tenants      = signal<Tenant[]>([]);
  showForm     = signal(false);
  editing      = signal<User | null>(null);
  userToDelete = signal<User | null>(null);
  search       = signal('');
  showPass     = signal(false);

  roles: { value: UserRole; label: string; icon: string }[] = [
    { value: 'ADMIN',    label: 'Administrador', icon: 'admin_panel_settings' },
    { value: 'CORRETOR', label: 'Corretor',      icon: 'badge'                },
    { value: 'OPERADOR', label: 'Operador',      icon: 'support_agent'        },
  ];

  columns = computed(() =>
    this.auth.isMasterAdminMode()
      ? ['name', 'tenantName', 'role', 'active', 'createdAt', 'actions']
      : ['name', 'role', 'active', 'createdAt', 'actions']
  );

  form = this.fb.group({
    name:     ['', Validators.required],
    tenantId: [null as number | null],
    phoneNumber: [''],
    whatsappPhone: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: [''],
    role:     [null as UserRole | null, Validators.required],
    active:   [true],
  });

  filteredUsers = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  activeTenants = computed(() => this.tenants().filter(t => t.active));

  ngOnInit() {
    this.load();
    this.loadTenants();
  }

  load() {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next:  u => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadTenants(): void {
    if (!this.canChooseTenant()) return;
    this.loadingTenants.set(true);
    this.tenantService.getAll().subscribe({
      next: tenants => {
        this.tenants.set(tenants);
        this.loadingTenants.set(false);
      },
      error: () => this.loadingTenants.set(false),
    });
  }

  // ── Template helpers (evita arrow functions no template) ─────────────────

  toggleShowPass(): void {
    this.showPass.set(!this.showPass());
  }

  setRole(value: UserRole): void {
    this.form.get('role')!.setValue(value);
  }

  isRoleSelected(value: UserRole): boolean {
    return this.form.get('role')!.value === value;
  }

  toggleActiveForm(): void {
    const ctrl = this.form.get('active')!;
    ctrl.setValue(!ctrl.value);
  }

  isActiveForm(): boolean {
    return !!this.form.get('active')!.value;
  }

  canChooseTenant(): boolean {
    return this.auth.isMasterAdminMode();
  }

  cancelDelete(): void {
    this.userToDelete.set(null);
  }

  // ── Role display helpers (evita indexação com 'any' no template) ─────────

  roleLabel(role: string): string {
    return ROLE_CONFIG[role as UserRole]?.label ?? role;
  }

  roleClass(role: string): string {
    return ROLE_CONFIG[role as UserRole]?.css ?? '';
  }

  roleIcon(role: string): string {
    const map: Record<string, string> = {
      ADMIN:    'admin_panel_settings',
      CORRETOR: 'badge',
      OPERADOR: 'support_agent',
    };
    return map[role] ?? 'person';
  }

  avatarColor(role: string): string {
    const map: Record<string, string> = {
      ADMIN:    'bg-purple-600',
      CORRETOR: 'bg-blue-600',
      OPERADOR: 'bg-teal-600',
    };
    return map[role] ?? 'bg-gray-600';
  }

  // ── Form actions ─────────────────────────────────────────────────────────

  openForm(user?: User): void {  
    this.editing.set(user ?? null);
    this.showPass.set(false);
    this.form.reset({
      name:     user?.name ?? '',
      tenantId: user?.tenantId ?? null,
      email:    user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      whatsappPhone: user?.whatsappPhone ?? '',
      password: '',
      role:     user?.role ?? null,
      active:   user?.active ?? true,
    });
    const pwCtrl = this.form.get('password')!;
    if (!user) {
      pwCtrl.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      pwCtrl.setValidators([Validators.minLength(6)]);
    }
    pwCtrl.updateValueAndValidity();

    const tenantCtrl = this.form.get('tenantId')!;
    if (this.canChooseTenant()) {
      tenantCtrl.setValidators([Validators.required]);
    } else {
      tenantCtrl.clearValidators();
    }
    tenantCtrl.updateValueAndValidity();

    this.showForm.set(true);    
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;

    if (this.editing()) {
      const req: UpdateUserRequest = {
        name:   v.name   || undefined,
        tenantId: this.canChooseTenant() ? v.tenantId ?? undefined : undefined,
        email:  v.email  || undefined,
        phoneNumber: v.phoneNumber || undefined,
        whatsappPhone: v.whatsappPhone || undefined,
        role:   (v.role as UserRole) || undefined,
        active: v.active ?? undefined,
      };
      if (v.password) req.password = v.password;

      this.userService.update(this.editing()!.id, req).subscribe({
        next: () => {
          this.toast.success('Usuário atualizado com sucesso!');
          this.closeForm();
          this.saving.set(false);
          this.load();
        },
        error: (e: any) => {
          this.toast.error(e?.error?.message ?? 'Erro ao atualizar usuário.');
          this.saving.set(false);
        },
      });
    } else {
      const req: CreateUserRequest = {
        name:     v.name!,
        tenantId: this.canChooseTenant() ? v.tenantId : undefined,
        email:    v.email!,
        phoneNumber: v.phoneNumber!,
        whatsappPhone: v.whatsappPhone!,
        password: v.password!,
        role:     v.role as UserRole,
      };
      this.userService.create(req).subscribe({
        next: () => {
          this.toast.success('Usuário criado com sucesso!');
          this.closeForm();
          this.saving.set(false);
          this.load();
        },
        error: (e: any) => {
          this.toast.error(e?.error?.message ?? 'Erro ao criar usuário.');
          this.saving.set(false);
        },
      });
    }
  }

  toggleActive(user: User): void {
    this.userService.toggleActive(user.id).subscribe({
      next: (u) => {
        this.toast.success(`Usuário ${u.active ? 'ativado' : 'desativado'} com sucesso!`);
        this.load();
      },
      error: () => this.toast.error('Erro ao alterar status.'),
    });
  }

  confirmDelete(user: User): void {
    this.userToDelete.set(user);
  }

  deleteUser(): void {
    if (!this.userToDelete()) return;
    this.saving.set(true);
    this.userService.delete(this.userToDelete()!.id).subscribe({
      next: () => {
        this.toast.success('Usuário excluído com sucesso!');
        this.userToDelete.set(null);
        this.saving.set(false);
        this.load();
      },
      error: () => {
        this.toast.error('Erro ao excluir usuário.');
        this.saving.set(false);
      },
    });
  }
}

