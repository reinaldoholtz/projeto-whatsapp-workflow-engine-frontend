import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MetaPhoneService } from '@core/services/meta-phone.service';
import { ToastService } from '@core/services/toast.service';
import { MetaPhone, CreateMetaPhoneRequest, UpdateMetaPhoneRequest } from '@shared/models';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-meta-phones-page',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, MatTableModule, MatMenuModule, SkeletonComponent],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Telefones WhatsApp</h1>
          <p>Gerencie os números Meta Cloud API conectados ao sistema</p>
        </div>
        <button (click)="openForm()" class="btn-primary">
          <span class="material-icons-round text-base">add</span>
          Novo Número
        </button>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        @if (loading()) {
          <div class="p-6"><app-skeleton [rows]="4" /></div>
        } @else {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="phones()" class="w-full">

              <!-- Name -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <td mat-cell *matCellDef="let p" class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <span class="material-icons-round text-emerald-600 text-xl">perm_phone_msg</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ p.name }}</p>
                      <p class="text-xs text-gray-400">{{ p.displayPhoneNumber }}</p>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Phone Number ID -->
              <ng-container matColumnDef="phoneNumberId">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Phone Number ID
                </th>
                <td mat-cell *matCellDef="let p" class="px-4 py-3">
                  <span class="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                    {{ p.phoneNumberId }}
                  </span>
                </td>
              </ng-container>

              <!-- Token -->
              <ng-container matColumnDef="token">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <td mat-cell *matCellDef="let p" class="px-4 py-3">
                  @if (p.accessToken) {
                    <span class="badge badge-active">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Configurado
                    </span>
                  } @else {
                    <span class="badge badge-paused">Token global</span>
                  }
                </td>
              </ng-container>

              <!-- Status -->
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <td mat-cell *matCellDef="let p" class="px-4 py-3">
                  @if (p.active) {
                    <span class="badge badge-active"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo</span>
                  } @else {
                    <span class="badge badge-leave"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inativo</span>
                  }
                </td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 w-20"></th>
                <td mat-cell *matCellDef="let p" class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <button (click)="openForm(p)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
                      title="Editar">
                      <span class="material-icons-round text-base">edit</span>
                    </button>
                    <button [matMenuTriggerFor]="menu"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                      <span class="material-icons-round text-base">more_vert</span>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="toggleActive(p)">
                        <span class="material-icons-round text-base mr-2"
                          [ngClass]="p.active ? 'text-amber-500' : 'text-emerald-500'">
                          {{ p.active ? 'block' : 'check_circle' }}
                        </span>
                        {{ p.active ? 'Desativar' : 'Ativar' }}
                      </button>
                      <button mat-menu-item (click)="confirmDelete(p)">
                        <span class="material-icons-round text-red-500 text-base mr-2">delete</span>
                        Excluir
                      </button>
                    </mat-menu>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"></tr>

              <tr *matNoDataRow>
                <td [colSpan]="columns.length" class="py-16 text-center text-gray-400">
                  <span class="material-icons-round text-5xl block mb-2 opacity-30">phone_iphone</span>
                  Nenhum número configurado
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

          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span class="material-icons-round text-emerald-600 text-xl">whatsapp</span>
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ editing() ? 'Editar Número' : 'Novo Número WhatsApp' }}
                </h2>
                <p class="text-xs text-gray-400">Meta Cloud API</p>
              </div>
            </div>
            <button (click)="closeForm()"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">

            <div>
              <label class="form-label">Nome amigável *</label>
              <input formControlName="name" placeholder="Ex: Vendas, Aluguel, Financiamento" class="form-input" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="text-red-500 text-xs mt-1">Nome é obrigatório</p>
              }
            </div>

            <div>
              <label class="form-label">Número de exibição *</label>
              <input formControlName="displayPhoneNumber" placeholder="Ex: +55 41 99999-0000" class="form-input" />
              @if (form.get('displayPhoneNumber')?.invalid && form.get('displayPhoneNumber')?.touched) {
                <p class="text-red-500 text-xs mt-1">Número de exibição é obrigatório</p>
              }
            </div>

            <div>
              <label class="form-label">Phone Number ID (Meta) *</label>
              <input formControlName="phoneNumberId" placeholder="Ex: 123456789012345" class="form-input font-mono text-sm" />
              <p class="text-xs text-gray-400 mt-1">Disponível no painel Meta for Developers → WhatsApp → API Setup</p>
              @if (form.get('phoneNumberId')?.invalid && form.get('phoneNumberId')?.touched) {
                <p class="text-red-500 text-xs mt-1">Phone Number ID é obrigatório</p>
              }
            </div>

            <div>
              <label class="form-label">Business Account ID (WABA)</label>
              <input formControlName="businessAccountId" placeholder="Opcional" class="form-input font-mono text-sm" />
            </div>

            <div>
              <label class="form-label">Access Token específico</label>
              <textarea formControlName="accessToken" rows="2"
                placeholder="Deixe em branco para usar o token global do servidor"
                class="form-input resize-none text-xs font-mono"></textarea>
              <p class="text-xs text-gray-400 mt-1">
                Se preenchido, este token será usado exclusivamente para este número.
              </p>
            </div>

            <div class="flex gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
              <button type="button" (click)="closeForm()" class="btn-secondary flex-1 justify-center">Cancelar</button>
              <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary flex-1 justify-center">
                @if (saving()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                } @else {
                  <span class="material-icons-round text-base">save</span>
                }
                {{ editing() ? 'Salvar' : 'Criar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ── Confirm Delete ───────────────────────────────────────────────────── -->
    @if (phoneToDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-in text-center">
          <div class="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-icons-round text-red-600 text-2xl">delete_forever</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Excluir número?</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Excluir <strong class="text-gray-800 dark:text-gray-200">{{ phoneToDelete()!.name }}</strong>
            ({{ phoneToDelete()!.displayPhoneNumber }})?
            Workflows associados ficarão sem número.
          </p>
          <div class="flex gap-3">
            <button (click)="phoneToDelete.set(null)" class="btn-secondary flex-1 justify-center">Cancelar</button>
            <button (click)="deletePhone()" [disabled]="saving()" class="btn-danger flex-1 justify-center">
              @if (saving()) { <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
              Excluir
            </button>
          </div>
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
export class MetaPhonesPageComponent implements OnInit {
  private metaPhoneService = inject(MetaPhoneService);
  private toast            = inject(ToastService);
  private fb               = inject(FormBuilder);

  loading       = signal(true);
  saving        = signal(false);
  phones        = signal<MetaPhone[]>([]);
  showForm      = signal(false);
  editing       = signal<MetaPhone | null>(null);
  phoneToDelete = signal<MetaPhone | null>(null);

  columns = ['name', 'phoneNumberId', 'token', 'active', 'actions'];

  form = this.fb.group({
    name:               ['', Validators.required],
    displayPhoneNumber: ['', Validators.required],
    phoneNumberId:      ['', Validators.required],
    businessAccountId:  [''],
    accessToken:        [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.metaPhoneService.getAll().subscribe({
      next:  p => { this.phones.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(phone?: MetaPhone) {
    this.editing.set(phone ?? null);
    this.form.reset({
      name:               phone?.name ?? '',
      displayPhoneNumber: phone?.displayPhoneNumber ?? '',
      phoneNumberId:      phone?.phoneNumberId ?? '',
      businessAccountId:  phone?.businessAccountId ?? '',
      accessToken:        '',  // never pre-fill token for security
    });
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); this.editing.set(null); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;

    if (this.editing()) {
      const req: UpdateMetaPhoneRequest = {
        name:               v.name               || undefined,
        displayPhoneNumber: v.displayPhoneNumber  || undefined,
        phoneNumberId:      v.phoneNumberId       || undefined,
        businessAccountId:  v.businessAccountId   || undefined,
        accessToken:        v.accessToken         || undefined,
      };
      this.metaPhoneService.update(this.editing()!.id, req).subscribe({
        next: () => { this.toast.success('Número atualizado!'); this.closeForm(); this.saving.set(false); this.load(); },
        error: (e: any) => { this.toast.error(e?.error?.message ?? 'Erro ao atualizar.'); this.saving.set(false); },
      });
    } else {
      const req: CreateMetaPhoneRequest = {
        name:               v.name!,
        displayPhoneNumber: v.displayPhoneNumber!,
        phoneNumberId:      v.phoneNumberId!,
        businessAccountId:  v.businessAccountId   || undefined,
        accessToken:        v.accessToken          || undefined,
      };
      this.metaPhoneService.create(req).subscribe({
        next: () => { this.toast.success('Número criado com sucesso!'); this.closeForm(); this.saving.set(false); this.load(); },
        error: (e: any) => { this.toast.error(e?.error?.message ?? 'Erro ao criar.'); this.saving.set(false); },
      });
    }
  }

  toggleActive(phone: MetaPhone) {
    this.metaPhoneService.toggleActive(phone.id).subscribe({
      next: p => { this.toast.success(`Número ${p.active ? 'ativado' : 'desativado'}!`); this.load(); },
      error: () => this.toast.error('Erro ao alterar status.'),
    });
  }

  confirmDelete(phone: MetaPhone) { this.phoneToDelete.set(phone); }

  deletePhone() {
    if (!this.phoneToDelete()) return;
    this.saving.set(true);
    this.metaPhoneService.delete(this.phoneToDelete()!.id).subscribe({
      next: () => { this.toast.success('Número excluído!'); this.phoneToDelete.set(null); this.saving.set(false); this.load(); },
      error: () => { this.toast.error('Erro ao excluir.'); this.saving.set(false); },
    });
  }
}
