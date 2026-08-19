import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { WorkflowService } from '@core/services/workflow.service';
import { MetaPhoneService } from '@core/services/meta-phone.service';
import { WhatsAppTemplateService } from '@core/services/whatsapp-template.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';
import { ChannelAccount, User, WhatsAppTemplate, Workflow } from '@shared/models';

@Component({
  selector: 'app-workflow-list-page',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule],
  template: `
    <div class="space-y-5">
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
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="card h-44 p-5 skeleton"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (wf of workflows(); track wf.id) {
            <div class="card p-5 hover:shadow-md transition-shadow">
              <div class="mb-3 flex items-start justify-between">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                  <span class="material-icons-round text-primary-600 dark:text-primary-400">account_tree</span>
                </div>
                <span class="badge" [ngClass]="wf.active ? 'badge-active' : 'badge-leave'">
                  {{ wf.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>

              <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ wf.name }}</h3>
              <p class="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                {{ wf.description || 'Sem descrição' }}
              </p>

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
                      <span class="text-gray-400">- {{ wf.metaPhoneDisplay }}</span>
                    }
                  </div>
                } @else {
                  <div class="flex items-center gap-1.5 text-xs text-amber-500">
                    <span class="material-icons-round text-sm">warning</span>
                    Sem número associado
                  </div>
                }
                @if (wf.whatsappTemplateName) {
                  <div class="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400">
                    <span class="material-icons-round text-sm">text_snippet</span>
                    Template inicial: {{ wf.whatsappTemplateName }}
                  </div>
                }
              </div>

              <div class="mt-4 flex gap-2 border-t border-gray-100 pt-4 dark:border-slate-700">
                <a [routerLink]="['/workflows', wf.id, 'steps']" class="btn-secondary flex-1 justify-center py-1.5 text-xs">
                  <span class="material-icons-round text-sm">list</span>
                  Etapas
                </a>
                <a [routerLink]="['/workflows', wf.id, 'documents']" class="btn-secondary flex-1 justify-center py-1.5 text-xs">
                  <span class="material-icons-round text-sm">folder</span>
                  Docs
                </a>
                <button
                  (click)="openForm(wf)"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
                  title="Editar">
                  <span class="material-icons-round text-base">edit</span>
                </button>
                <button
                  (click)="toggleActive(wf)"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20"
                  [title]="wf.active ? 'Desativar' : 'Ativar'">
                  <span class="material-icons-round text-base">
                    {{ wf.active ? 'toggle_on' : 'toggle_off' }}
                  </span>
                </button>
                <button
                  (click)="confirmDelete(wf)"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  title="Excluir">
                  <span class="material-icons-round text-base">delete</span>
                </button>
              </div>
            </div>
          } @empty {
            <div class="card col-span-3 p-16 text-center">
              <span class="material-icons-round mb-3 block text-5xl text-gray-200 dark:text-slate-700">account_tree</span>
              <p class="mb-4 text-gray-400">Nenhum workflow criado</p>
              <button (click)="openForm()" class="btn-primary mx-auto">Criar primeiro workflow</button>
            </div>
          }
        </div>
      }
    </div>

    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 animate-fade-in">
        <div class="my-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-slide-in dark:bg-slate-800">
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <span class="material-icons-round text-primary-600">account_tree</span>
              </div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ editing() ? 'Editar Workflow' : 'Novo Workflow' }}
              </h2>
            </div>
            <button
              (click)="closeForm()"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4 p-6">
            <div>
              <label class="form-label">Nome *</label>
              <input formControlName="name" placeholder="Ex: Minha Casa Minha Vida" class="form-input" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="mt-1 text-xs text-red-500">Nome é obrigatório</p>
              }
            </div>

            <div>
              <label class="form-label">Descrição</label>
              <textarea formControlName="description" rows="2" placeholder="Descrição do workflow..." class="form-input resize-none"></textarea>
            </div>

            <div>
              <label class="form-label">Responsável</label>
              <select formControlName="userId" class="form-input">
                <option [ngValue]="null">- Selecione um usuário -</option>
                @for (u of users(); track u.id) {
                  <option [ngValue]="u.id">{{ u.name }} ({{ u.role }})</option>
                }
              </select>
            </div>

            <div>
              <label class="form-label">Número WhatsApp (Meta)</label>
              <div class="relative">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-base text-emerald-500">whatsapp</span>
                <select formControlName="metaPhoneId" class="form-input pl-9">
                  <option [ngValue]="null">- Selecione um número -</option>
                  @for (p of selectablePhones(); track p.id) {
                    <option [ngValue]="p.id" [disabled]="isPhoneTakenByOther(p.id)">
                      {{ p.accountName }} - {{ p.displayPhoneNumber }} @if (isPhoneTakenByOther(p.id)) { (já em uso) }
                    </option>
                  }
                </select>
              </div>
              <p class="mt-1 text-xs text-gray-400">Cada número WhatsApp só pode estar associado a um único workflow.</p>
              @if (activePhones().length === 0) {
                <p class="mt-1 flex items-center gap-1 text-xs text-amber-500">
                  <span class="material-icons-round text-sm">warning</span>
                  Nenhum número ativo. Cadastre em <strong>Canais WhatsApp</strong> primeiro.
                </p>
              }
            </div>

            <div>
              <label class="form-label">Template Inicial (WhatsApp)</label>
              <div class="relative">
                <select formControlName="whatsappTemplateId" class="form-input">
                  <option [ngValue]="null">- Sem template inicial -</option>
                  @for (template of selectableTemplates(); track template.id) {
                    <option [ngValue]="template.id">
                      {{ template.name }} - {{ templateCategoryLabel(template.category) }}
                    </option>
                  }
                </select>
              </div>
              <p class="mt-1 text-xs text-gray-400">
                Usado para iniciar a conversa quando a janela de 24 horas estiver encerrada.
              </p>
              @if (activeTemplates().length === 0) {
                <p class="mt-1 flex items-center gap-1 text-xs text-amber-500">
                  <span class="material-icons-round text-sm">warning</span>
                  Nenhum template ativo disponível para este tenant.
                </p>
              }
            </div>

            <div class="flex gap-3 border-t border-gray-100 pt-2 dark:border-slate-700">
              <button type="button" (click)="closeForm()" class="btn-secondary flex-1 justify-center">Cancelar</button>
              <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary flex-1 justify-center">
                @if (saving()) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
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

    @if (workflowToDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl animate-slide-in dark:bg-slate-800">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <span class="material-icons-round text-2xl text-red-600">delete_forever</span>
          </div>
          <h3 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Excluir workflow?</h3>
          <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Você está prestes a excluir <strong class="text-gray-800 dark:text-gray-200">{{ workflowToDelete()!.name }}</strong>.
          </p>
          <p class="mb-6 text-xs text-gray-400">
            Se houver leads atendidos por este workflow, a exclusão será bloqueada e você poderá apenas desativá-lo.
          </p>
          <div class="flex gap-3">
            <button (click)="workflowToDelete.set(null)" class="btn-secondary flex-1 justify-center">Cancelar</button>
            <button (click)="deleteWorkflow()" [disabled]="deleting()" class="btn-danger flex-1 justify-center">
              @if (deleting()) {
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              }
              Excluir
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .form-label { @apply mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300; }
    .form-input  {
      @apply w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors
             focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-slate-600 dark:bg-slate-700 dark:text-white;
    }
  `]
})
export class WorkflowListPageComponent implements OnInit {
  private wfService = inject(WorkflowService);
  private metaPhoneService = inject(MetaPhoneService);
  private templateService = inject(WhatsAppTemplateService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  saving = signal(false);
  deleting = signal(false);
  workflows = signal<Workflow[]>([]);
  activePhones = signal<ChannelAccount[]>([]);
  activeTemplates = signal<WhatsAppTemplate[]>([]);
  users = signal<User[]>([]);
  showForm = signal(false);
  editing = signal<Workflow | null>(null);
  workflowToDelete = signal<Workflow | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    userId: [null as number | null],
    metaPhoneId: [null as number | null],
    whatsappTemplateId: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      workflows: this.wfService.getAll(),
      phones: this.metaPhoneService.getAllActive(),
      templates: this.templateService.getAllActive(),
      users: this.userService.getAll(),
    }).subscribe({
      next: ({ workflows, phones, templates, users }) => {
        this.workflows.set(workflows);
        this.activePhones.set(phones);
        this.activeTemplates.set(templates);
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectablePhones(): ChannelAccount[] {
    const phones = this.activePhones();
    const current = this.editing()?.metaPhoneId;
    if (current && !phones.some(p => p.id === current)) {
      const fromWorkflow = this.editing();
      if (fromWorkflow?.metaPhoneId && fromWorkflow?.metaPhoneName) {
        return [
          ...phones,
          {
            id: fromWorkflow.metaPhoneId,
            tenantId: 0,
            tenantName: '',
            channel: 'WHATSAPP',
            provider: 'meta',
            accountName: fromWorkflow.metaPhoneName,
            externalAccountId: fromWorkflow.metaPhoneDisplay ?? '',
            displayPhoneNumber: fromWorkflow.metaPhoneDisplay ?? '',
            businessAccountId: null,
            active: false,
            createdAt: '',
            updatedAt: '',
          },
        ];
      }
    }
    return phones;
  }

  selectableTemplates(): WhatsAppTemplate[] {
    const templates = this.activeTemplates();
    const current = this.editing()?.whatsappTemplateId;
    if (current && !templates.some(t => t.id === current)) {
      const fromWorkflow = this.editing();
      if (fromWorkflow?.whatsappTemplateId && fromWorkflow.whatsappTemplateName) {
        return [
          ...templates,
          {
            id: fromWorkflow.whatsappTemplateId,
            tenantId: 0,
            tenantName: null,
            channelAccountId: 0,
            channelAccountName: null,
            metaPhoneId: 0,
            metaPhoneName: null,
            providerTemplateId: '',
            name: fromWorkflow.whatsappTemplateName,
            category: 'UTILITY',
            language: '',
            status: 'APPROVED',
            quality: 'UNKNOWN',
            content: null,
            variables: null,
            active: false,
            lastSyncAt: null,
            createdAt: '',
            updatedAt: '',
          },
        ];
      }
    }
    return templates;
  }

  templateCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      MARKETING: 'Marketing',
      UTILITY: 'Utility',
      AUTHENTICATION: 'Authentication',
    };
    return map[category] ?? category;
  }

  isPhoneTakenByOther(phoneId: number): boolean {
    const editingId = this.editing()?.id;
    return this.workflows().some(w => w.active && w.metaPhoneId === phoneId && w.id !== editingId);
  }

  openForm(wf?: Workflow): void {
    this.editing.set(wf ?? null);
    this.form.reset({
      name: wf?.name ?? '',
      description: wf?.description ?? '',
      userId: wf?.userId ?? null,
      metaPhoneId: wf?.metaPhoneId ?? null,
      whatsappTemplateId: wf?.whatsappTemplateId ?? null,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const v = this.form.value;
    const req = {
      name: v.name!,
      description: v.description ?? '',
      userId: v.userId ?? undefined,
      metaPhoneId: v.metaPhoneId ?? undefined,
      whatsappTemplateId: v.whatsappTemplateId ?? undefined,
    };
    const op = this.editing() ? this.wfService.update(this.editing()!.id, req) : this.wfService.create(req);
    op.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Workflow atualizado!' : 'Workflow criado!');
        this.closeForm();
        this.saving.set(false);
        this.load();
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message ?? 'Erro ao salvar.');
        this.saving.set(false);
      },
    });
  }

  toggleActive(wf: Workflow): void {
    this.wfService.toggleActive(wf.id).subscribe({
      next: () => {
        this.toast.success('Status atualizado!');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(err.error?.message ?? 'Erro ao atualizar o workflow.');
      },
    });
  }

  confirmDelete(wf: Workflow): void {
    this.workflowToDelete.set(wf);
  }

  deleteWorkflow(): void {
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
        this.toast.error(e?.error?.message ?? 'Erro ao excluir workflow.');
        this.workflowToDelete.set(null);
        this.deleting.set(false);
      },
    });
  }
}
