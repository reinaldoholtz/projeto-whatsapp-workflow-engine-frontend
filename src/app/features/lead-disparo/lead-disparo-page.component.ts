import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { LeadDisparoService } from '@core/services/lead-disparo.service';
import { WorkflowService } from '@core/services/workflow.service';
import { ToastService } from '@core/services/toast.service';

import {
  Workflow, DisparoPreviewResponse, DisparoResultResponse,
  DisparoItemResponse, DisparoStatus
} from '@shared/models';

type PageStep = 'setup' | 'preview' | 'running' | 'result';

const STATUS_CONFIG: Record<DisparoStatus, { label: string; css: string; icon: string }> = {
  PENDENTE:           { label: 'Pendente',           css: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',              icon: 'schedule'       },
  ENVIADO:            { label: 'Enviado',             css: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'check_circle'   },
  NUMERO_INVALIDO:    { label: 'Número Inválido',     css: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               icon: 'cancel'         },
  NAO_POSSUI_WHATSAPP:{ label: 'Sem WhatsApp',        css: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',        icon: 'do_not_disturb' },
  DUPLICADO:          { label: 'Duplicado',           css: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',            icon: 'content_copy'   },
  ERRO:               { label: 'Erro',                css: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               icon: 'error'          },
};

@Component({
  selector: 'app-lead-disparo-page',
  standalone: true,
  imports: [NgClass, DatePipe, ReactiveFormsModule, MatTableModule],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Disparar Leads</h1>
          <p>Importe uma lista e dispare o primeiro contato do workflow automaticamente</p>
        </div>
      </div>

      <!-- ── STEP 1: Setup ─────────────────────────────────────────────── -->
      @if (step() === 'setup') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Form Card -->
          <div class="lg:col-span-2 card p-6 space-y-6">

            <!-- Workflow Selector -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                1. Selecione o Workflow *
              </label>
              <div class="relative">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">account_tree</span>
                <select
                  [value]="selectedWorkflowId()"
                  (change)="selectedWorkflowId.set(+$any($event.target).value)"
                  class="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors"
                >
                  <option value="0">— Selecione um workflow —</option>
                  @for (wf of workflows(); track wf.id) {
                    <option [value]="wf.id">{{ wf.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- File Upload -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                2. Importe o arquivo CSV ou TXT *
              </label>

              <!-- Drop Zone -->
              <div
                class="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
                [ngClass]="isDragging()
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500'"
                (dragover)="onDragOver($event)"
                (dragleave)="isDragging.set(false)"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
              >
                <input #fileInput type="file" accept=".csv,.txt" class="hidden" (change)="onFileChange($event)" />

                @if (selectedFile()) {
                  <div class="flex items-center justify-center gap-3">
                    <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <span class="material-icons-round text-emerald-600 text-2xl">description</span>
                    </div>
                    <div class="text-left">
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedFile()!.name }}</p>
                      <p class="text-xs text-gray-400">{{ (selectedFile()!.size / 1024).toFixed(1) }} KB</p>
                    </div>
                    <button (click)="clearFile($event)"
                      class="ml-2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400
                             hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                      <span class="material-icons-round text-base">close</span>
                    </button>
                  </div>
                } @else {
                  <div>
                    <span class="material-icons-round text-4xl text-gray-300 dark:text-slate-600 block mb-3">upload_file</span>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Clique ou arraste o arquivo aqui
                    </p>
                    <p class="text-xs text-gray-400 mt-1">Formatos: .csv ou .txt — max 5MB</p>
                  </div>
                }
              </div>
            </div>

            <!-- Import button -->
            <button
              (click)="doPreview()"
              [disabled]="!canPreview() || loadingPreview()"
              class="btn-primary w-full justify-center py-3 text-base"
            >
              @if (loadingPreview()) {
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Validando arquivo...
              } @else {
                <span class="material-icons-round">search</span>
                Validar e Pré-visualizar
              }
            </button>
          </div>

          <!-- Format Guide Card -->
          <div class="card p-6 h-fit">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <span class="material-icons-round text-primary-600 text-base">info</span>
              Formato esperado
            </h3>
            <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 font-mono text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p class="text-primary-600 dark:text-primary-400 font-semibold">nome;telefone</p>
              <p>João Silva;5511999999999</p>
              <p>Maria Souza;5511888888888</p>
              <p>Carlos Lima;5541977777777</p>
            </div>
            <ul class="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li class="flex items-start gap-2">
                <span class="material-icons-round text-sm text-emerald-500 flex-shrink-0 mt-0.5">check</span>
                Separador: ponto e vírgula (;)
              </li>
              <li class="flex items-start gap-2">
                <span class="material-icons-round text-sm text-emerald-500 flex-shrink-0 mt-0.5">check</span>
                Cabeçalho obrigatório na 1ª linha
              </li>
              <li class="flex items-start gap-2">
                <span class="material-icons-round text-sm text-emerald-500 flex-shrink-0 mt-0.5">check</span>
                Telefone com código do país (55...)
              </li>
              <li class="flex items-start gap-2">
                <span class="material-icons-round text-sm text-amber-500 flex-shrink-0 mt-0.5">warning</span>
                Linhas duplicadas são ignoradas
              </li>
            </ul>
          </div>
        </div>
      }

      <!-- ── STEP 2: Preview ────────────────────────────────────────────── -->
      @if (step() === 'preview' && preview()) {
        <div class="space-y-5">

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="card p-5 flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <span class="material-icons-round text-blue-600 text-2xl">people</span>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ preview()!.totalRecords }}</p>
              </div>
            </div>
            <div class="card p-5 flex items-center gap-4">
              <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <span class="material-icons-round text-emerald-600 text-2xl">check_circle</span>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Válidos</p>
                <p class="text-2xl font-bold text-emerald-600">{{ preview()!.validRecords }}</p>
              </div>
            </div>
            <div class="card p-5 flex items-center gap-4">
              <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <span class="material-icons-round text-red-600 text-2xl">cancel</span>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Inválidos</p>
                <p class="text-2xl font-bold text-red-600">{{ preview()!.invalidRecords }}</p>
              </div>
            </div>
          </div>

          <!-- Errors from parser -->
          @if (preview()!.errors.length) {
            <div class="card p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <p class="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                <span class="material-icons-round text-base">error</span>
                Erros encontrados no arquivo:
              </p>
              @for (err of preview()!.errors; track err) {
                <p class="text-xs text-red-600 dark:text-red-400">• {{ err }}</p>
              }
            </div>
          }

          <!-- Invalid rows detail -->
          @if (invalidLeads().length) {
            <div class="card overflow-hidden">
              <div class="px-5 py-3 border-b border-gray-100 dark:border-slate-700">
                <h3 class="text-sm font-semibold text-red-600 flex items-center gap-2">
                  <span class="material-icons-round text-base">warning</span>
                  Linhas com erro ({{ invalidLeads().length }})
                </h3>
              </div>
              <div class="divide-y divide-gray-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
                @for (lead of invalidLeads(); track lead.line) {
                  <div class="flex items-center gap-3 px-5 py-2.5">
                    <span class="text-xs text-gray-400 w-12">Linha {{ lead.line }}</span>
                    <span class="text-xs font-mono text-gray-600 dark:text-gray-300 flex-1">
                      {{ lead.name || '—' }} | {{ lead.phone || '—' }}
                    </span>
                    <span class="text-xs text-red-500">{{ lead.error }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="flex gap-3">
            <button (click)="step.set('setup')" class="btn-secondary">
              <span class="material-icons-round text-base">arrow_back</span>
              Voltar
            </button>

            @if (preview()!.validRecords > 0) {
              <button (click)="showConfirm.set(true)" class="btn-primary">
                <span class="material-icons-round text-base">send</span>
                Disparar {{ preview()!.validRecords }} lead(s)
              </button>
            }
          </div>
        </div>
      }

      <!-- ── STEP 3: Running ────────────────────────────────────────────── -->
      @if (step() === 'running') {
        <div class="card p-12 text-center">
          <div class="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <span class="material-icons-round text-primary-600 text-4xl animate-pulse-slow">send</span>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Disparo em andamento...</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Enviando mensagens para {{ preview()!.validRecords }} leads. Aguarde.
          </p>
          <div class="w-48 h-2 bg-gray-100 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
            <div class="h-full bg-primary-600 rounded-full animate-pulse w-3/4"></div>
          </div>
          <button (click)="loadResult()" class="btn-secondary mx-auto mt-6">
            <span class="material-icons-round text-base">refresh</span>
            Verificar resultado
          </button>
        </div>
      }

      <!-- ── STEP 4: Result ─────────────────────────────────────────────── -->
      @if (step() === 'result' && result()) {
        <div class="space-y-5">

          <!-- Result Stats -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-emerald-600">{{ result()!.enviados }}</p>
              <p class="text-xs text-gray-500 mt-1">Enviados</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-blue-600">{{ result()!.duplicados }}</p>
              <p class="text-xs text-gray-500 mt-1">Duplicados</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-amber-600">{{ result()!.naoTemWhatsapp }}</p>
              <p class="text-xs text-gray-500 mt-1">Sem WhatsApp</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-red-600">{{ result()!.erros }}</p>
              <p class="text-xs text-gray-500 mt-1">Erros</p>
            </div>
          </div>

          <!-- Result Table -->
          <div class="card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-700">
              <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Resultado do disparo — Run ID: <span class="font-mono text-primary-600">{{ result()!.runId }}</span>
              </h3>
              <button (click)="newDisparo()" class="btn-secondary text-xs py-1.5">
                <span class="material-icons-round text-sm">add</span>
                Novo disparo
              </button>
            </div>

            <div class="overflow-x-auto">
              <table mat-table [dataSource]="result()!.items" class="w-full">

                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <td mat-cell *matCellDef="let item" class="px-4 py-3">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.leadName || '—' }}</p>
                    <p class="text-xs text-gray-400 font-mono">{{ item.phoneNumber }}</p>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <td mat-cell *matCellDef="let item" class="px-4 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      [ngClass]="statusClass(item.status)">
                      <span class="material-icons-round text-sm">{{ statusIcon(item.status) }}</span>
                      {{ statusLabel(item.status) }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="error">
                  <th mat-header-cell *matHeaderCellDef
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Detalhe
                  </th>
                  <td mat-cell *matCellDef="let item" class="px-4 py-3">
                    <span class="text-xs text-gray-400">{{ item.errorDetail || '—' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef
                    class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <td mat-cell *matCellDef="let item" class="px-4 py-3">
                    <span class="text-xs text-gray-500">{{ item.processedAt | date:'dd/MM/yy HH:mm:ss' }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="resultColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: resultColumns;"
                  class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"></tr>
              </table>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- ── Confirm Dialog ──────────────────────────────────────────────────── -->
    @if (showConfirm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-in text-center">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="material-icons-round text-primary-600 text-3xl">send</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirmar Disparo</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Você está prestes a disparar mensagens para
            <strong class="text-gray-800 dark:text-gray-200">{{ preview()!.validRecords }} lead(s)</strong>
            no workflow <strong class="text-gray-800 dark:text-gray-200">{{ selectedWorkflowName() }}</strong>.
            Deseja continuar?
          </p>
          <div class="flex gap-3">
            <button (click)="showConfirm.set(false)" class="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button (click)="doStart()" [disabled]="starting()" class="btn-primary flex-1 justify-center">
              @if (starting()) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              } @else {
                <span class="material-icons-round text-base">send</span>
              }
              Disparar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class LeadDisparoPageComponent implements OnInit {
  private disparoService  = inject(LeadDisparoService);
  private workflowService = inject(WorkflowService);
  private toast           = inject(ToastService);

  // ── State ──────────────────────────────────────────────────────────────
  step                = signal<PageStep>('setup');
  workflows           = signal<Workflow[]>([]);
  selectedWorkflowId  = signal<number>(0);
  selectedFile        = signal<File | null>(null);
  isDragging          = signal(false);
  loadingPreview      = signal(false);
  starting            = signal(false);
  showConfirm         = signal(false);
  preview             = signal<DisparoPreviewResponse | null>(null);
  result              = signal<DisparoResultResponse | null>(null);
  currentRunId        = signal<string | null>(null);
  pollingRef: any     = null;

  resultColumns = ['name', 'status', 'error', 'date'];

  canPreview = computed(() => this.selectedWorkflowId() > 0 && this.selectedFile() !== null);

  selectedWorkflowName = computed(() =>
    this.workflows().find(w => w.id === this.selectedWorkflowId())?.name ?? ''
  );

  invalidLeads = computed(() =>
    this.preview()?.leads.filter(l => !l.valid) ?? []
  );

  ngOnInit() {
    this.workflowService.getAll().subscribe({
      next: wf => this.workflows.set(wf.filter(w => w.active)),
    });
  }

  // ── File handling ───────────────────────────────────────────────────────

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setFile(input.files[0]);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  clearFile(event: MouseEvent) {
    event.stopPropagation();
    this.selectedFile.set(null);
  }

  private setFile(file: File) {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      this.toast.error('Formato inválido. Envie um arquivo .csv ou .txt');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }
    this.selectedFile.set(file);
  }

  // ── Preview ─────────────────────────────────────────────────────────────

  doPreview() {
    if (!this.canPreview()) return;
    this.loadingPreview.set(true);
    this.disparoService.preview(this.selectedFile()!, this.selectedWorkflowId()).subscribe({
      next: (p) => {
        this.preview.set(p);
        this.currentRunId.set(p.runId);
        this.step.set('preview');
        this.loadingPreview.set(false);
      },
      error: (e) => {
        this.toast.error(e?.error?.message ?? 'Erro ao validar arquivo.');
        this.loadingPreview.set(false);
      },
    });
  }

  // ── Start ───────────────────────────────────────────────────────────────

  doStart() {
    this.starting.set(true);
    this.showConfirm.set(false);
    this.disparoService.start({
      runId:      this.currentRunId()!,
      workflowId: this.selectedWorkflowId(),
    }).subscribe({
      next: () => {
        this.step.set('running');
        this.starting.set(false);
        this.toast.success('Disparo iniciado com sucesso!');
        // Poll for result every 3 seconds
        this.pollingRef = setInterval(() => this.loadResult(), 3000);
      },
      error: (e) => {
        this.toast.error(e?.error?.message ?? 'Erro ao iniciar disparo.');
        this.starting.set(false);
      },
    });
  }

  // ── Result polling ──────────────────────────────────────────────────────

  loadResult() {
    if (!this.currentRunId()) return;
    this.disparoService.getResult(this.currentRunId()!).subscribe({
      next: (r) => {
        this.result.set(r);
        if (r.total > 0) {
          this.step.set('result');
          if (this.pollingRef) { clearInterval(this.pollingRef); this.pollingRef = null; }
        }
      },
      error: () => {
        if (this.pollingRef) { clearInterval(this.pollingRef); this.pollingRef = null; }
        this.step.set('result');
      },
    });
  }

  newDisparo() {
    this.step.set('setup');
    this.preview.set(null);
    this.result.set(null);
    this.selectedFile.set(null);
    this.selectedWorkflowId.set(0);
    this.currentRunId.set(null);
  }

  // ── Status helpers ──────────────────────────────────────────────────────

  statusLabel(status: string): string {
    return STATUS_CONFIG[status as DisparoStatus]?.label ?? status;
  }

  statusClass(status: string): string {
    return STATUS_CONFIG[status as DisparoStatus]?.css ?? '';
  }

  statusIcon(status: string): string {
    return STATUS_CONFIG[status as DisparoStatus]?.icon ?? 'help';
  }
}
