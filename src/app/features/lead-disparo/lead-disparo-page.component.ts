import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { LeadDisparoService } from '@core/services/lead-disparo.service';
import { WorkflowService } from '@core/services/workflow.service';
import { ToastService } from '@core/services/toast.service';
import {
  Workflow, DisparoPreviewResponse, DisparoResultResponse, DisparoStatus
} from '@shared/models';

type PageStep = 'setup' | 'preview' | 'running' | 'result';

const STATUS_CONFIG: Record<string, { label: string; css: string; icon: string }> = {
  PENDENTE:           { label: 'Pendente',       css: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',               icon: 'schedule'       },
  ENVIADO:            { label: 'Enviado',         css: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'check_circle'   },
  ENTREGUE:           { label: 'Entregue',        css: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',            icon: 'done_all'       },
  LIDO:               { label: 'Lido',            css: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',    icon: 'mark_chat_read' },
  NUMERO_INVALIDO:    { label: 'Nº Inválido',     css: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               icon: 'cancel'         },
  NAO_POSSUI_WHATSAPP:{ label: 'Sem WhatsApp',    css: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',        icon: 'do_not_disturb' },
  DUPLICADO:          { label: 'Duplicado',       css: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',            icon: 'content_copy'   },
  ERRO:               { label: 'Erro',            css: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               icon: 'error'          },
};

@Component({
  selector: 'app-lead-disparo-page',
  standalone: true,
  imports: [NgClass, DatePipe, ReactiveFormsModule, MatTableModule, RouterLink],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Disparar Leads</h1>
          <p>Importe uma lista e dispare o primeiro contato automaticamente</p>
        </div>
        <a routerLink="/lead-disparo/historico" class="btn-secondary">
          <span class="material-icons-round text-base">history</span>
          Histórico de Disparos
        </a>
      </div>

      <!-- ── STEP 1: Setup ─────────────────────────────────────────────── -->
      @if (step() === 'setup') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 card p-6 space-y-5">

            <!-- Workflow -->
            <div>
              <label class="form-label">1. Selecione o Workflow *</label>
              <div class="relative">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">account_tree</span>
                <select [value]="selectedWorkflowId()"
                  (change)="selectedWorkflowId.set(+$any($event.target).value)"
                  class="form-input pl-9">
                  <option value="0">— Selecione um workflow —</option>
                  @for (wf of workflows(); track wf.id) {
                    <option [value]="wf.id">{{ wf.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- File Upload -->
            <div>
              <label class="form-label">2. Importe o arquivo CSV ou TXT *</label>
              <div class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
                [ngClass]="isDragging() ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-slate-600 hover:border-primary-400'"
                (dragover)="onDragOver($event)" (dragleave)="isDragging.set(false)"
                (drop)="onDrop($event)" (click)="fileInput.click()">
                <input #fileInput type="file" accept=".csv,.txt" class="hidden" (change)="onFileChange($event)" />
                @if (selectedFile()) {
                  <div class="flex items-center justify-center gap-3">
                    <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <span class="material-icons-round text-emerald-600">description</span>
                    </div>
                    <div class="text-left">
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedFile()!.name }}</p>
                      <p class="text-xs text-gray-400">{{ (selectedFile()!.size / 1024).toFixed(1) }} KB</p>
                    </div>
                    <button (click)="clearFile($event)" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 ml-2">
                      <span class="material-icons-round text-base">close</span>
                    </button>
                  </div>
                } @else {
                  <span class="material-icons-round text-4xl text-gray-300 dark:text-slate-600 block mb-2">upload_file</span>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Clique ou arraste o arquivo aqui</p>
                  <p class="text-xs text-gray-400 mt-1">.csv ou .txt — máx 5MB</p>
                }
              </div>
            </div>

            <!-- Rate Limit / Agendamento -->
            <div class="border border-gray-100 dark:border-slate-700 rounded-xl p-4 space-y-4">
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span class="material-icons-round text-base text-primary-600">tune</span>
                3. Configurar lote e agendamento
              </p>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Leads por lote</label>
                  <input [formControl]="batchSizeCtrl" type="number" min="1" max="500" class="form-input" placeholder="20" />
                  <p class="text-xs text-gray-400 mt-1">Ex: 20 leads por vez</p>
                </div>
                <div>
                  <label class="form-label">Intervalo entre lotes (minutos)</label>
                  <input [formControl]="intervalCtrl" type="number" min="1" class="form-input" placeholder="60" />
                  <p class="text-xs text-gray-400 mt-1">Ex: 60 = 1 hora entre cada lote</p>
                </div>
              </div>
              <div>
                <label class="form-label">Agendar início (opcional)</label>
                <input [formControl]="scheduledAtCtrl" type="datetime-local" class="form-input" />
                <p class="text-xs text-gray-400 mt-1">Deixe em branco para disparar imediatamente</p>
              </div>
            </div>

            <button (click)="doPreview()" [disabled]="!canPreview() || loadingPreview()"
              class="btn-primary w-full justify-center py-3">
              @if (loadingPreview()) {
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Validando arquivo...
              } @else {
                <span class="material-icons-round">search</span>
                Validar e Pré-visualizar
              }
            </button>
          </div>

          <!-- Guide Card -->
          <div class="card p-6 h-fit space-y-4">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span class="material-icons-round text-primary-600 text-base">info</span>
              Formato esperado
            </h3>
            <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 font-mono text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p class="text-primary-600 font-semibold">nome;telefone</p>
              <p>João Silva;5511999999999</p>
              <p>Maria Souza;5511888888888</p>
            </div>
            <div class="border-t border-gray-100 dark:border-slate-700 pt-4">
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Exemplo de execução (200 leads):</p>
              <div class="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <p class="font-mono">20 lotes/hora ×</p>
                <p class="font-mono">10:00 → 20 leads</p>
                <p class="font-mono">11:00 → 20 leads</p>
                <p class="font-mono">...</p>
                <p class="font-mono">19:00 → últimos 20</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ── STEP 2: Preview ────────────────────────────────────────────── -->
      @if (step() === 'preview' && preview()) {
        <div class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="card p-5 flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <span class="material-icons-round text-blue-600 text-2xl">people</span>
              </div>
              <div><p class="text-xs text-gray-500">Total</p><p class="text-2xl font-bold text-gray-900 dark:text-white">{{ preview()!.totalRecords }}</p></div>
            </div>
            <div class="card p-5 flex items-center gap-4">
              <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <span class="material-icons-round text-emerald-600 text-2xl">check_circle</span>
              </div>
              <div><p class="text-xs text-gray-500">Válidos</p><p class="text-2xl font-bold text-emerald-600">{{ preview()!.validRecords }}</p></div>
            </div>
            <div class="card p-5 flex items-center gap-4">
              <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <span class="material-icons-round text-red-600 text-2xl">cancel</span>
              </div>
              <div><p class="text-xs text-gray-500">Inválidos</p><p class="text-2xl font-bold text-red-600">{{ preview()!.invalidRecords }}</p></div>
            </div>
          </div>

          <!-- Configuração resumida -->
          <div class="card p-4 bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800">
            <p class="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-2 flex items-center gap-2">
              <span class="material-icons-round text-base">tune</span>
              Configuração do disparo
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600 dark:text-gray-300">
              <div><span class="font-medium">Lotes de:</span> {{ batchSizeCtrl.value }} leads</div>
              <div><span class="font-medium">Intervalo:</span> {{ intervalCtrl.value }} min</div>
              <div><span class="font-medium">Total de lotes:</span> {{ totalLotes() }}</div>
              <div><span class="font-medium">Início:</span> {{ scheduledAtCtrl.value || 'Imediato' }}</div>
            </div>
          </div>

          @if (preview()!.errors.length) {
            <div class="card p-4 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
              @for (err of preview()!.errors; track err) {
                <p class="text-xs text-red-600">• {{ err }}</p>
              }
            </div>
          }

          @if (invalidLeads().length) {
            <div class="card overflow-hidden">
              <div class="px-5 py-3 border-b border-gray-100 dark:border-slate-700">
                <h3 class="text-sm font-semibold text-red-600">Linhas com erro ({{ invalidLeads().length }})</h3>
              </div>
              <div class="divide-y divide-gray-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                @for (lead of invalidLeads(); track lead.line) {
                  <div class="flex items-center gap-3 px-5 py-2.5">
                    <span class="text-xs text-gray-400 w-12">Linha {{ lead.line }}</span>
                    <span class="text-xs font-mono text-gray-600 dark:text-gray-300 flex-1">{{ lead.name || '—' }} | {{ lead.phone || '—' }}</span>
                    <span class="text-xs text-red-500">{{ lead.error }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <div class="flex gap-3">
            <button (click)="step.set('setup')" class="btn-secondary">
              <span class="material-icons-round text-base">arrow_back</span> Voltar
            </button>
            @if (preview()!.validRecords > 0) {
              <button (click)="showConfirm.set(true)" class="btn-primary">
                <span class="material-icons-round text-base">{{ scheduledAtCtrl.value ? 'schedule_send' : 'send' }}</span>
                {{ scheduledAtCtrl.value ? 'Agendar disparo' : 'Disparar' }} {{ preview()!.validRecords }} lead(s)
              </button>
            }
          </div>
        </div>
      }

      <!-- ── STEP 3: Running / Agendado ────────────────────────────────── -->
      @if (step() === 'running') {
        <div class="card p-12 text-center">
          <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            [ngClass]="isScheduled() ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-100 dark:bg-primary-900/30'">
            <span class="material-icons-round text-4xl"
              [ngClass]="isScheduled() ? 'text-amber-600' : 'text-primary-600 animate-pulse-slow'">
              {{ isScheduled() ? 'schedule_send' : 'send' }}
            </span>
          </div>
          @if (isScheduled()) {
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Disparo Agendado!</h2>
            <p class="text-gray-500 text-sm mb-6">O disparo será iniciado em {{ scheduledAtCtrl.value | date:'dd/MM/yyyy HH:mm' }}.</p>
          } @else {
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Disparo em andamento...</h2>
            <p class="text-gray-500 text-sm mb-4">Enviando em lotes de {{ batchSizeCtrl.value }} leads a cada {{ intervalCtrl.value }} minutos.</p>
            <div class="w-48 h-2 bg-gray-100 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
              <div class="h-full bg-primary-600 rounded-full animate-pulse w-3/4"></div>
            </div>
          }
          <div class="flex gap-3 justify-center mt-6">
            <a routerLink="/lead-disparo/historico" class="btn-secondary">
              <span class="material-icons-round text-base">history</span>
              Ver Histórico
            </a>
            <button (click)="newDisparo()" class="btn-primary">
              <span class="material-icons-round text-base">add</span>
              Novo Disparo
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Confirm Dialog -->
    @if (showConfirm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-in text-center">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            [ngClass]="scheduledAtCtrl.value ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary-100 dark:bg-primary-900/30'">
            <span class="material-icons-round text-3xl"
              [ngClass]="scheduledAtCtrl.value ? 'text-amber-600' : 'text-primary-600'">
              {{ scheduledAtCtrl.value ? 'schedule_send' : 'send' }}
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ scheduledAtCtrl.value ? 'Confirmar Agendamento' : 'Confirmar Disparo' }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
            <strong>{{ preview()!.validRecords }} leads</strong> no workflow
            <strong>{{ selectedWorkflowName() }}</strong>
          </p>
          <p class="text-xs text-gray-400 mb-4">
            Lotes de {{ batchSizeCtrl.value }} leads · Intervalo de {{ intervalCtrl.value }} min
            @if (scheduledAtCtrl.value) { · Início: {{ scheduledAtCtrl.value }} }
          </p>
          <div class="flex gap-3">
            <button (click)="showConfirm.set(false)" class="btn-secondary flex-1 justify-center">Cancelar</button>
            <button (click)="doStart()" [disabled]="starting()" class="btn-primary flex-1 justify-center">
              @if (starting()) { <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
              @else { <span class="material-icons-round text-base">{{ scheduledAtCtrl.value ? 'schedule_send' : 'send' }}</span> }
              Confirmar
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
export class LeadDisparoPageComponent implements OnInit {
  private disparoService  = inject(LeadDisparoService);
  private workflowService = inject(WorkflowService);
  private toast           = inject(ToastService);
  private fb              = inject(FormBuilder);

  step               = signal<PageStep>('setup');
  workflows          = signal<Workflow[]>([]);
  selectedWorkflowId = signal<number>(0);
  selectedFile       = signal<File | null>(null);
  isDragging         = signal(false);
  loadingPreview     = signal(false);
  starting           = signal(false);
  showConfirm        = signal(false);
  preview            = signal<DisparoPreviewResponse | null>(null);
  currentRunId       = signal<string | null>(null);
  isScheduled        = signal(false);

  batchSizeCtrl   = this.fb.control(20, [Validators.required, Validators.min(1)]);
  intervalCtrl    = this.fb.control(60, [Validators.required, Validators.min(1)]);
  scheduledAtCtrl = this.fb.control<string | null>(null);

  resultColumns = ['name', 'status', 'error', 'date'];

  canPreview = computed(() => this.selectedWorkflowId() > 0 && this.selectedFile() !== null);

  selectedWorkflowName = computed(() =>
    this.workflows().find(w => w.id === this.selectedWorkflowId())?.name ?? ''
  );

  invalidLeads = computed(() => this.preview()?.leads.filter(l => !l.valid) ?? []);

  totalLotes = computed(() => {
    const valid = this.preview()?.validRecords ?? 0;
    const size  = this.batchSizeCtrl.value ?? 20;
    return Math.ceil(valid / size);
  });

  ngOnInit() {
    this.workflowService.getAll().subscribe({
      next: wf => this.workflows.set(wf.filter(w => w.active)),
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setFile(input.files[0]);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragging.set(true); }

  onDrop(event: DragEvent) {
    event.preventDefault(); this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  clearFile(event: MouseEvent) { event.stopPropagation(); this.selectedFile.set(null); }

  private setFile(file: File) {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      this.toast.error('Envie um arquivo .csv ou .txt'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('Arquivo muito grande. Máximo 5MB.'); return;
    }
    this.selectedFile.set(file);
  }

  doPreview() {
    if (!this.canPreview()) return;
    this.loadingPreview.set(true);
    this.disparoService.preview(this.selectedFile()!, this.selectedWorkflowId()).subscribe({
      next: p => { this.preview.set(p); this.currentRunId.set(p.runId); this.step.set('preview'); this.loadingPreview.set(false); },
      error: e => { this.toast.error(e?.error?.message ?? 'Erro ao validar arquivo.'); this.loadingPreview.set(false); },
    });
  }

  doStart() {
    this.starting.set(true);
    this.showConfirm.set(false);
    const scheduled = this.scheduledAtCtrl.value || null;
    this.isScheduled.set(!!scheduled);

    this.disparoService.start({
      runId:           this.currentRunId()!,
      workflowId:      this.selectedWorkflowId(),
      fileName:        this.selectedFile()!.name,
      batchSize:       this.batchSizeCtrl.value ?? 20,
      intervalMinutes: this.intervalCtrl.value ?? 60,
      scheduledAt:     scheduled,
    }).subscribe({
      next: () => { this.step.set('running'); this.starting.set(false); this.toast.success(scheduled ? 'Disparo agendado!' : 'Disparo iniciado!'); },
      error: e => { this.toast.error(e?.error?.message ?? 'Erro ao iniciar disparo.'); this.starting.set(false); },
    });
  }

  newDisparo() {
    this.step.set('setup');
    this.preview.set(null);
    this.selectedFile.set(null);
    this.selectedWorkflowId.set(0);
    this.currentRunId.set(null);
    this.isScheduled.set(false);
    this.batchSizeCtrl.setValue(20);
    this.intervalCtrl.setValue(60);
    this.scheduledAtCtrl.setValue(null);
  }

  statusLabel(s: string) { return STATUS_CONFIG[s]?.label ?? s; }
  statusClass(s: string) { return STATUS_CONFIG[s]?.css ?? ''; }
  statusIcon(s: string)  { return STATUS_CONFIG[s]?.icon ?? 'help'; }
}
