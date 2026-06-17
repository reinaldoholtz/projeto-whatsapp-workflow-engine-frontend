import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WorkflowService } from '@core/services/workflow.service';
import { MetaPhoneService } from '@core/services/meta-phone.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { Workflow, MetaPhone, User } from '@shared/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-workflow-list-page',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Workflows</h1>
          <p>Gerencie os funis de atendimento</p>
        </div>
        <button (click)="openForm()" class="btn-primary">
          <span class="material-icons-round text-base">add</span>
          Novo Workflow
        </button>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) { <div class="card p-5 skeleton h-44"></div> }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (wf of workflows(); track wf.id) {
            <div class="card p-5 hover:shadow-md transition-shadow">

              <!-- Header do card -->
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span class="material-icons-round text-primary-600 dark:text-primary-400">account_tree</span>
                </div>
                <span class="badge" [ngClass]="wf.active ? 'badge-active' : 'badge-leave'">
                  {{ wf.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>

              <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ wf.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {{ wf.description || 'Sem descrição' }}
              </p>

              <!-- Corretor + Número -->
              <div class="mt-3 space-y-1">
                @if (wf.userName) {
                  <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span class="material-icons-round text-sm">badge</span>
                    {{ wf.userName }}
                  </div>
                }
                @if (wf.metaPhoneName) {
                  <div class="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <span class="material-icons-round text-sm">perm_phone_msg</span>
                    WhatsApp API Meta: {{ wf.metaPhoneName }}
                    @if (wf.metaPhoneDisplay) {
                      <span class="text-gray-400">— {{ wf.metaPhoneDisplay }}</span>
                    }
                  </div>
                } @else {
                  <div class="flex items-center gap-1.5 text-xs text-amber-500">
                    <span class="material-icons-round text-sm">warning</span>
                    Sem número associado
                  </div>
                }
              </div>

              <!-- Ações -->
              <div class="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <a [routerLink]="['/workflows', wf.id, 'steps']"
                  class="btn-secondary flex-1 justify-center text-xs py-1.5">
                  <span class="material-icons-round text-sm">list</span> Etapas
                </a>
                <a [routerLink]="['/workflows', wf.id, 'documents']"
                  class="btn-secondary flex-1 justify-center text-xs py-1.5">
                  <span class="material-icons-round text-sm">folder</span> Docs
                </a>
                <button (click)="openForm(wf)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                         hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
                  title="Editar">
                  <span class="material-icons-round text-base">edit</span>
                </button>
                <button (click)="toggleActive(wf)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                         hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 transition-colors"
                  [title]="wf.active ? 'Desativar' : 'Ativar'">
                  <span class="material-icons-round text-base">
                    {{ wf.active ? 'toggle_on' : 'toggle_off' }}
                  </span>
                </button>
                <button (click)="confirmDelete(wf)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                         hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                  title="Excluir">
                  <span class="material-icons-round text-base">delete</span>
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-3 card p-16 text-center">
              <span class="material-icons-round text-5xl text-gray-200 dark:text-slate-700 block mb-3">
                account_tree
              </span>
              <p class="text-gray-400 mb-4">Nenhum workflow criado</p>
              <button (click)="openForm()" class="btn-primary mx-auto">Criar primeiro workflow</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- ── Form Dialog ──────────────────────────────────────────────────────── -->
    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in overflow-y-auto">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg my-4 animate-slide-in">

          <!-- Dialog Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span class="material-icons-round text-primary-600">account_tree</span>
              </div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ editing() ? 'Editar Workflow' : 'Novo Workflow' }}
              </h2>
            </div>
            <button (click)="closeForm()"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                     hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <!-- Dialog Form -->
          <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">

            <!-- Nome -->
            <div>
              <label class="form-label">Nome *</label>
              <input formControlName="name" placeholder="Ex: Minha Casa Minha Vida" class="form-input" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="text-red-500 text-xs mt-1">Nome é obrigatório</p>
              }
            </div>

            <!-- Descrição -->
            <div>
              <label class="form-label">Descrição</label>
              <textarea formControlName="description" rows="2"
                placeholder="Descrição do workflow..."
                class="form-input resize-none"></textarea>
            </div>

            <!-- Corretor responsável -->
            <div>
              <label class="form-label">Responsável</label>
              <div class="relative">
                <select formControlName="userId" class="form-input pl-9">
                  <option [ngValue]="null">— Selecione um usuário —</option>
                  @for (u of users(); track u.id) {
                    <option [ngValue]="u.id">{{ u.name }} ({{ u.role }})</option>
                  }
                </select>
              </div>
            </div>

            <!-- Número WhatsApp -->
            <div>
              <label class="form-label">Número WhatsApp (Meta) *</label>
              <div class="relative">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base">whatsapp</span>
                <select formControlName="metaPhoneId" class="form-input pl-9">
                  <option [ngValue]="null">— Selecione um número —</option>
                  @for (p of selectablePhones(); track p.id) {
                    <option [ngValue]="p.id" [disabled]="isPhoneTakenByOther(p.id)">
                      {{ p.name }} — {{ p.displayPhoneNumber }}
                      @if (isPhoneTakenByOther(p.id)) { (já em uso) }
                    </option>
                  }
                </select>
              </div>
              <p class="text-xs text-gray-400 mt-1">
                Cada número WhatsApp só pode estar associado a um único workflow.
              </p>
              @if (activePhones().length === 0) {
                <p class="text-xs text-amber-500 mt-1 flex items-center gap-1">
                  <span class="material-icons-round text-sm">warning</span>
                  Nenhum número ativo. Cadastre em <strong>Telefones WhatsApp</strong> primeiro.
                </p>
              }
            </div>

            <!-- Buttons -->
            <div class="flex gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
              <button type="button" (click)="closeForm()" class="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
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

    <!-- ── Confirm Delete Dialog ────────────────────────────────────────────── -->
    @if (workflowToDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-in text-center">
          <div class="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-icons-round text-red-600 text-2xl">delete_forever</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Excluir workflow?</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Você está prestes a excluir
            <strong class="text-gray-800 dark:text-gray-200">{{ workflowToDelete()!.name }}</strong>.
          </p>
          <p class="text-xs text-gray-400 mb-6">
            Se houver leads atendidos por este workflow, a exclusão será bloqueada
            e você poderá apenas desativá-lo.
          </p>
          <div class="flex gap-3">
            <button (click)="workflowToDelete.set(null)" class="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button (click)="deleteWorkflow()" [disabled]="deleting()" class="btn-danger flex-1 justify-center">
              @if (deleting()) {
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
    .form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5; }
    .form-input  {
      @apply w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl
             bg-white dark:bg-slate-700 text-gray-900 dark:text-white
             focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors;
    }
  `]
})
export class WorkflowListPageComponent implements OnInit {
  private wfService         = inject(WorkflowService);
  private metaPhoneService  = inject(MetaPhoneService);
  private userService       = inject(UserService);
  private toast             = inject(ToastService);
  private fb                = inject(FormBuilder);

  loading          = signal(true);
  saving           = signal(false);
  deleting         = signal(false);
  workflows        = signal<Workflow[]>([]);
  activePhones     = signal<MetaPhone[]>([]);
  users            = signal<User[]>([]);
  showForm         = signal(false);
  editing          = signal<Workflow | null>(null);
  workflowToDelete = signal<Workflow | null>(null);

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    userId:      [null as number | null],
    metaPhoneId: [null as number | null],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    forkJoin({
      workflows: this.wfService.getAll(),
      phones:    this.metaPhoneService.getAllActive(),
      users:     this.userService.getAll(),
    }).subscribe({
      next: ({ workflows, phones, users }) => {
        this.workflows.set(workflows);
        this.activePhones.set(phones);
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /**
   * Números a exibir no select: ativos + o número já associado ao workflow
   * em edição (mesmo que não esteja na lista de ativos), para não "desaparecer"
   * a seleção atual ao abrir o formulário de edição.
   */
  selectablePhones() {
    const phones = this.activePhones();
    const current = this.editing()?.metaPhoneId;
    if (current && !phones.some(p => p.id === current)) {
      const fromWorkflow = this.editing();
      if (fromWorkflow?.metaPhoneId && fromWorkflow?.metaPhoneName) {
        return [...phones, {
          id: fromWorkflow.metaPhoneId,
          name: fromWorkflow.metaPhoneName,
          displayPhoneNumber: fromWorkflow.metaPhoneDisplay ?? '',
        } as MetaPhone];
      }
    }
    return phones;
  }

  /** Indica se o número já pertence a outro workflow (não o que está sendo editado) */
  isPhoneTakenByOther(phoneId: number): boolean {
    const editingId = this.editing()?.id;
    return this.workflows().some(w =>
      w.metaPhoneId === phoneId && w.id !== editingId
    );
  }

  openForm(wf?: Workflow) {
    this.editing.set(wf ?? null);
    this.form.reset({
      name:        wf?.name        ?? '',
      description: wf?.description ?? '',
      userId:      wf?.userId      ?? null,
      metaPhoneId: wf?.metaPhoneId ?? null,
    });
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); this.editing.set(null); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const req = {
      name:        v.name!,
      description: v.description ?? '',
      userId:      v.userId      ?? undefined,
      metaPhoneId: v.metaPhoneId ?? undefined,
    };
    const op = this.editing()
      ? this.wfService.update(this.editing()!.id, req)
      : this.wfService.create(req);
    op.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Workflow atualizado!' : 'Workflow criado!');
        this.closeForm(); this.saving.set(false); this.load();
      },
      error: (e: any) => {
        // 409: número WhatsApp já em uso por outro workflow
        this.toast.error(e?.error?.message ?? 'Erro ao salvar.');
        this.saving.set(false);
      },
    });
  }

  toggleActive(wf: Workflow) {
    this.wfService.toggleActive(wf.id).subscribe({
      next: () => { this.toast.success('Status atualizado!'); this.load(); },
      error: () => this.toast.error('Erro ao atualizar.'),
    });
  }

  confirmDelete(wf: Workflow) {
    this.workflowToDelete.set(wf);
  }

  deleteWorkflow() {
    const wf = this.workflowToDelete();
    if (!wf) return;
    this.deleting.set(true);
    this.wfService.delete(wf.id).subscribe({
      next: () => {
        this.toast.success('Workflow excluído com sucesso!');
        this.workflowToDelete.set(null);
        this.deleting.set(false);
        this.load();
      },
      error: (e: any) => {
        // 409: existem LeadSessions vinculadas — exclusão bloqueada pelo backend
        this.toast.error(e?.error?.message ?? 'Erro ao excluir workflow.');
        this.workflowToDelete.set(null);
        this.deleting.set(false);
      },
    });
  }
}
