import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WorkflowService } from '@core/services/workflow.service';
import { ToastService } from '@core/services/toast.service';
import { WorkflowStep, ResponseType } from '@shared/models';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

const RESPONSE_TYPE_LABELS: Record<ResponseType, { label: string; color: string }> = {
  TEXT:           { label: 'Texto',         color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  NUMBER:         { label: 'Número',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  OPTION:         { label: 'Opção',         color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  DOCUMENT:       { label: 'Documento',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  MULTI_DOCUMENT: { label: 'Multi-Doc',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  EMAIL:          { label: 'E-mail',        color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  PHONE:          { label: 'Telefone',      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  DATE:           { label: 'Data',          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  CPF:            { label: 'CPF',           color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  CNPJ:           { label: 'CNPJ',          color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

@Component({
  selector: 'app-workflow-steps-page',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule, SkeletonComponent],
  template: `
    <div class="space-y-5">
      <!-- Header -->
      <div class="page-header">
        <div>
          <a routerLink="/workflows" class="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-600 mb-1 transition-colors">
            <span class="material-icons-round text-base">arrow_back</span> Workflows
          </a>
          <h1>Etapas do Workflow</h1>
          <p>ID: {{ workflowId() }} — {{ steps().length }} etapa(s)</p>
        </div>
        <button (click)="openForm()" class="btn-primary">
          <span class="material-icons-round text-base">add</span>
          Nova Etapa
        </button>
      </div>

      @if (loading()) {
        <app-skeleton [rows]="6" />
      } @else {
        <!-- Steps Timeline -->
        <div class="space-y-3">
          @for (step of steps(); track step.id; let last = $last) {
            <div class="flex gap-4">
              <!-- Connector -->
              <div class="flex flex-col items-center">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  [ngClass]="step.active ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'">
                  {{ step.stepOrder }}
                </div>
                @if (!last) {
                  <div class="w-0.5 flex-1 min-h-4 mt-1 bg-gray-200 dark:bg-slate-700"></div>
                }
              </div>

              <!-- Step Card -->
              <div class="card flex-1 p-5 mb-3" [ngClass]="!step.active ? 'opacity-60' : ''">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ step.name }}</h3>
                      <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                        [ngClass]="RESPONSE_TYPE_LABELS[step.responseType].color">
                        {{ RESPONSE_TYPE_LABELS[step.responseType].label }}
                      </span>
                      @if (!step.active) {
                        <span class="badge badge-leave">Inativo</span>
                      }
                    </div>

                    <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{{ step.question }}</p>

                    <div class="flex flex-wrap gap-3 mt-3">
                      @if (step.confirmationMessage) {
                        <div class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <span class="material-icons-round text-sm">check_circle</span>
                          Confirmação configurada
                        </div>
                      }
                      @if (step.errorMessage) {
                        <div class="flex items-center gap-1 text-xs text-red-500">
                          <span class="material-icons-round text-sm">error</span>
                          Erro configurado
                        </div>
                      }
                      @if (step.validOptions?.length) {
                        <div class="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                          <span class="material-icons-round text-sm">list</span>
                          {{ step.validOptions!.length }} opção(ões)
                        </div>
                      }
                      @if (step.validationRegex) {
                        <div class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <span class="material-icons-round text-sm">code</span>
                          Regex configurado
                        </div>
                      }
                      <div class="flex items-center gap-1 text-xs"
                        [ngClass]="step.allowsSpecialist ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'">
                        <span class="material-icons-round text-sm">support_agent</span>
                        {{ step.allowsSpecialist ? 'Permite especialista' : 'Sem especialista' }}
                      </div>
                      <div class="flex items-center gap-1 text-xs"
                        [ngClass]="step.allowsReset ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'">
                        <span class="material-icons-round text-sm">refresh</span>
                        {{ step.allowsReset ? 'Permite reset' : 'Sem reset' }}
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-1 flex-shrink-0">
                    <button (click)="openForm(step)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors">
                      <span class="material-icons-round text-base">edit</span>
                    </button>
                    <button (click)="deleteStep(step)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                      <span class="material-icons-round text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="card p-16 text-center">
              <span class="material-icons-round text-5xl text-gray-200 dark:text-slate-700 block mb-3">list</span>
              <p class="text-gray-400 mb-4">Nenhuma etapa criada ainda</p>
              <button (click)="openForm()" class="btn-primary mx-auto">Criar primeira etapa</button>
            </div>
          }
        </div>
      }

      <!-- Step Form Dialog -->
      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in overflow-y-auto">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-4 animate-slide-in">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ editingStep() ? 'Editar Etapa' : 'Nova Etapa' }}
              </h2>
              <button (click)="closeForm()" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="stepForm" (ngSubmit)="saveStep()" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Nome da Etapa *</label>
                  <input formControlName="name" placeholder="Ex: Tipo de Imóvel" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Ordem *</label>
                  <input formControlName="stepOrder" type="number" min="1" class="form-input" />
                </div>
              </div>

              <div>
                <label class="form-label">Pergunta / Mensagem *</label>
                <textarea formControlName="question" rows="3" placeholder="Texto que será enviado ao lead..."
                  class="form-input resize-none"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Mensagem de Confirmação</label>
                  <input formControlName="confirmationMessage" placeholder="Ótimo! Perfeito! 👍" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Mensagem de Erro</label>
                  <input formControlName="errorMessage" placeholder="⚠️ Resposta inválida." class="form-input" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Tipo de Resposta *</label>
                  <select formControlName="responseType" class="form-input">
                    @for (rt of responseTypes; track rt.value) {
                      <option [value]="rt.value">{{ rt.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="form-label">Regex de Validação</label>
                  <input formControlName="validationRegex" placeholder="Ex: \\d+" class="form-input font-mono text-xs" />
                </div>
              </div>

              <div>
                <label class="form-label">Opções Válidas (uma por linha)</label>
                <textarea formControlName="validOptionsRaw" rows="3"
                  placeholder="sim&#10;claro&#10;pode ser&#10;com certeza"
                  class="form-input resize-none font-mono text-xs"></textarea>
                <p class="text-xs text-gray-400 mt-1">Usado somente quando Tipo = OPTION</p>
              </div>

              <div class="flex gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="allowsSpecialist" class="w-4 h-4 rounded accent-primary-600" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Permite digitar "especialista"</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="allowsReset" class="w-4 h-4 rounded accent-primary-600" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Permite "reiniciar"</span>
                </label>
              </div>

              <div class="flex gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" (click)="closeForm()" class="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" [disabled]="stepForm.invalid || saving()" class="btn-primary flex-1 justify-center">
                  @if (saving()) { <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
                  {{ editingStep() ? 'Salvar Alterações' : 'Criar Etapa' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
    .form-input  {
      @apply w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg
             bg-white dark:bg-slate-700 text-gray-900 dark:text-white
             focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors;
    }
  `]
})
export class WorkflowStepsPageComponent implements OnInit {
  private route     = inject(ActivatedRoute);
  private wfService = inject(WorkflowService);
  private toast     = inject(ToastService);
  private fb        = inject(FormBuilder);

  RESPONSE_TYPE_LABELS = RESPONSE_TYPE_LABELS;

  workflowId  = signal(0);
  loading     = signal(true);
  saving      = signal(false);
  steps       = signal<WorkflowStep[]>([]);
  showForm    = signal(false);
  editingStep = signal<WorkflowStep | null>(null);

  responseTypes = Object.entries(RESPONSE_TYPE_LABELS).map(([value, cfg]) => ({ value, label: cfg.label }));

  stepForm = this.fb.group({
    name:                ['', Validators.required],
    stepOrder:           [1, [Validators.required, Validators.min(1)]],
    question:            ['', Validators.required],
    confirmationMessage: [''],
    errorMessage:        [''],
    responseType:        ['TEXT' as ResponseType, Validators.required],
    validationRegex:     [''],
    validOptionsRaw:     [''],
    allowsSpecialist:    [true],
    allowsReset:         [true],
  });

  ngOnInit() {
    this.workflowId.set(Number(this.route.snapshot.paramMap.get('workflowId')));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.wfService.getSteps(this.workflowId()).subscribe({
      next:  s => { this.steps.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(step?: WorkflowStep) {
    this.editingStep.set(step ?? null);
    const opts = step?.validOptions?.join('\n') ?? '';
    this.stepForm.reset({
      name: step?.name ?? '',
      stepOrder: step?.stepOrder ?? (this.steps().length + 1),
      question: step?.question ?? '',
      confirmationMessage: step?.confirmationMessage ?? '',
      errorMessage: step?.errorMessage ?? '',
      responseType: step?.responseType ?? 'TEXT',
      validationRegex: step?.validationRegex ?? '',
      validOptionsRaw: opts,
      allowsSpecialist: step?.allowsSpecialist ?? true,
      allowsReset: step?.allowsReset ?? true,
    });
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); this.editingStep.set(null); }

  saveStep() {
    if (this.stepForm.invalid) return;
    this.saving.set(true);
    const v = this.stepForm.value;
    const validOptions = v.validOptionsRaw
      ? v.validOptionsRaw.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const req = {
      name:                v.name!,
      stepOrder:           Number(v.stepOrder),
      question:            v.question!,
      confirmationMessage: v.confirmationMessage ?? '',
      errorMessage:        v.errorMessage ?? '',
      responseType:        v.responseType as ResponseType,
      validationRegex:     v.validationRegex ?? '',
      validOptions,
      allowsSpecialist:    v.allowsSpecialist ?? true,
      allowsReset:         v.allowsReset ?? true,
    };

    const op = this.editingStep()
      ? this.wfService.updateStep(this.workflowId(), this.editingStep()!.id, req)
      : this.wfService.createStep(this.workflowId(), req);

    op.subscribe({
      next: () => {
        this.toast.success(this.editingStep() ? 'Etapa atualizada!' : 'Etapa criada!');
        this.closeForm(); this.saving.set(false); this.load();
      },
      error: () => { this.toast.error('Erro ao salvar etapa.'); this.saving.set(false); },
    });
  }

  deleteStep(step: WorkflowStep) {
    if (!confirm(`Desativar a etapa "${step.name}"?`)) return;
    this.wfService.deleteStep(this.workflowId(), step.id).subscribe({
      next:  () => { this.toast.success('Etapa removida!'); this.load(); },
      error: () => this.toast.error('Erro ao remover etapa.'),
    });
  }
}
