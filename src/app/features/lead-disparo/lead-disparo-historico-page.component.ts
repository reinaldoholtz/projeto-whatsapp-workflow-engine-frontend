import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { LeadDisparoService } from '@core/services/lead-disparo.service';
import { ToastService } from '@core/services/toast.service';
import { LeadBatchSummary, LeadBatchDetail, BatchStatus } from '@shared/models';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

const BATCH_STATUS_CONFIG: Record<string, { label: string; css: string; icon: string }> = {
  PENDENTE:     { label: 'Pendente',     css: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',               icon: 'schedule'       },
  AGENDADO:     { label: 'Agendado',     css: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         icon: 'schedule_send'  },
  PROCESSANDO:  { label: 'Processando',  css: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',             icon: 'sync'           },
  FINALIZADO:   { label: 'Finalizado',   css: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'check_circle'   },
  ERRO:         { label: 'Erro',         css: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 icon: 'error'          },
  CANCELADO:    { label: 'Cancelado',    css: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',                icon: 'cancel'         },
};

const ITEM_STATUS_CONFIG: Record<string, { label: string; css: string; icon: string }> = {
  PENDENTE:           { label: 'Pendente',     css: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',               icon: 'schedule'       },
  ENVIADO:            { label: 'Enviado',       css: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'check_circle'   },
  ENTREGUE:           { label: 'Entregue',      css: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',             icon: 'done_all'       },
  LIDO:               { label: 'Lido',          css: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',     icon: 'mark_chat_read' },
  NUMERO_INVALIDO:    { label: 'Nº Inválido',   css: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 icon: 'cancel'         },
  NAO_POSSUI_WHATSAPP:{ label: 'Sem WhatsApp',  css: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         icon: 'do_not_disturb' },
  DUPLICADO:          { label: 'Duplicado',     css: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',             icon: 'content_copy'   },
  ERRO:               { label: 'Erro',          css: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 icon: 'error'          },
};

@Component({
  selector: 'app-lead-disparo-historico-page',
  standalone: true,
  imports: [NgClass, DatePipe, RouterLink, MatTableModule, SkeletonComponent, ReactiveFormsModule],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="page-header">
        <div>
          <a routerLink="/lead-disparo"
            class="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-600 mb-1 transition-colors">
            <span class="material-icons-round text-base">arrow_back</span> Disparar Leads
          </a>
          <h1>Histórico de Disparos</h1>
          <p>{{ batches().length }} lote(s) registrado(s)</p>
        </div>
        <button (click)="load()" [disabled]="loading()" class="btn-secondary">
          <span class="material-icons-round text-base" [class.animate-spin]="loading()">refresh</span>
          Atualizar
        </button>
      </div>

      <!-- List or Detail -->
      @if (!selectedBatch()) {

        <!-- Search -->
        <div class="card p-4">
          <div class="relative max-w-sm">
            <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
            <input [formControl]="searchCtrl" placeholder="Buscar por arquivo ou workflow..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg
                     bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors" />
          </div>
        </div>

        <!-- Batch List -->
        <div class="card overflow-hidden">
          @if (loading()) {
            <div class="p-6"><app-skeleton [rows]="5" /></div>
          } @else {
            <div class="overflow-x-auto">
              <table mat-table [dataSource]="filteredBatches()" class="w-full">

                <!-- Arquivo -->
                <ng-container matColumnDef="file">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Arquivo</th>
                  <td mat-cell *matCellDef="let b" class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <span class="material-icons-round text-primary-600 text-base">description</span>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ b.fileName }}</p>
                        <p class="text-xs text-gray-400 font-mono">{{ b.runId }}</p>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Workflow -->
                <ng-container matColumnDef="workflow">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow</th>
                  <td mat-cell *matCellDef="let b" class="px-4 py-3">
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ b.workflowName || '—' }}</span>
                  </td>
                </ng-container>

                <!-- Status -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <td mat-cell *matCellDef="let b" class="px-4 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      [ngClass]="batchStatusClass(b.status)">
                      <span class="material-icons-round text-sm"
                        [class.animate-spin]="b.status === 'PROCESSANDO'">{{ batchStatusIcon(b.status) }}</span>
                      {{ batchStatusLabel(b.status) }}
                    </span>
                  </td>
                </ng-container>

                <!-- Progress -->
                <ng-container matColumnDef="progress">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progresso</th>
                  <td mat-cell *matCellDef="let b" class="px-4 py-3">
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs text-gray-500">
                        <span>{{ b.processedRecords }}/{{ b.totalRecords }}</span>
                        <span>{{ b.progressPct }}%</span>
                      </div>
                      <div class="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden w-32">
                        <div class="h-full bg-primary-600 rounded-full transition-all"
                          [style.width]="b.progressPct + '%'"></div>
                      </div>
                      <div class="flex gap-2 text-xs">
                        <span class="text-emerald-600">✓ {{ b.successRecords }}</span>
                        <span class="text-red-500">✗ {{ b.errorRecords }}</span>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Config -->
                <ng-container matColumnDef="config">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Configuração</th>
                  <td mat-cell *matCellDef="let b" class="px-4 py-3">
                    <div class="text-xs text-gray-500 space-y-0.5">
                      <p>{{ b.batchSize }} leads/lote</p>
                      <p>{{ b.intervalMinutes }} min intervalo</p>
                      @if (b.scheduledAt) {
                        <p class="text-amber-600">⏰ {{ b.scheduledAt | date:'dd/MM HH:mm' }}</p>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Data -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data/Hora</th>
                  <td mat-cell *matCellDef="let b" class="px-4 py-3">
                    <div class="text-xs text-gray-500 space-y-0.5">
                      <p>{{ b.createdAt | date:'dd/MM/yy HH:mm' }}</p>
                      @if (b.finishedAt) {
                        <p class="text-gray-400">Fim: {{ b.finishedAt | date:'HH:mm' }}</p>
                      }
                    </div>
                  </td>
                </ng-container>

                <!-- Actions -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 w-16"></th>
                  <td mat-cell *matCellDef="let b" class="px-4 py-3">
                    <button (click)="openDetail(b)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
                      title="Ver detalhes">
                      <span class="material-icons-round text-base">visibility</span>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="batchColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: batchColumns;"
                  class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                  (click)="openDetail(row)"></tr>

                <tr *matNoDataRow>
                  <td [colSpan]="batchColumns.length" class="py-16 text-center text-gray-400">
                    <span class="material-icons-round text-5xl block mb-2 opacity-30">history</span>
                    Nenhum disparo realizado ainda
                  </td>
                </tr>
              </table>
            </div>
          }
        </div>

      } @else {
        <!-- ── DETAIL VIEW ────────────────────────────────────────────────── -->
        <div class="space-y-5">

          <!-- Back -->
          <button (click)="selectedBatch.set(null)" class="btn-secondary">
            <span class="material-icons-round text-base">arrow_back</span> Voltar ao Histórico
          </button>

          <!-- Batch Header -->
          <div class="card p-6">
            <div class="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <span class="material-icons-round text-primary-600 text-2xl">description</span>
                  <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ selectedBatch()!.batch.fileName }}</h2>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    [ngClass]="batchStatusClass(selectedBatch()!.batch.status)">
                    <span class="material-icons-round text-sm">{{ batchStatusIcon(selectedBatch()!.batch.status) }}</span>
                    {{ batchStatusLabel(selectedBatch()!.batch.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500">Workflow: <strong class="text-gray-700 dark:text-gray-300">{{ selectedBatch()!.batch.workflowName }}</strong></p>
                <p class="text-xs text-gray-400 font-mono mt-0.5">Run ID: {{ selectedBatch()!.batch.runId }}</p>
              </div>
              <div class="text-right text-xs text-gray-500">
                <p>Criado: {{ selectedBatch()!.batch.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                @if (selectedBatch()!.batch.startedAt) { <p>Início: {{ selectedBatch()!.batch.startedAt | date:'HH:mm:ss' }}</p> }
                @if (selectedBatch()!.batch.finishedAt) { <p>Fim: {{ selectedBatch()!.batch.finishedAt | date:'HH:mm:ss' }}</p> }
              </div>
            </div>
          </div>

          <!-- Dashboard Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ selectedBatch()!.batch.totalRecords }}</p>
              <p class="text-xs text-gray-500 mt-1">Total de Leads</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-blue-600">{{ selectedBatch()!.batch.processedRecords }}</p>
              <p class="text-xs text-gray-500 mt-1">Processados</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-emerald-600">{{ selectedBatch()!.batch.successRecords }}</p>
              <p class="text-xs text-gray-500 mt-1">Sucesso</p>
            </div>
            <div class="card p-4 text-center">
              <p class="text-2xl font-bold text-red-600">{{ selectedBatch()!.batch.errorRecords }}</p>
              <p class="text-xs text-gray-500 mt-1">Erro</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2 text-sm">
              <span class="font-medium text-gray-700 dark:text-gray-300">Progresso</span>
              <span class="font-bold text-primary-600">{{ selectedBatch()!.batch.progressPct }}%</span>
            </div>
            <div class="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-primary-600 rounded-full transition-all duration-500"
                [style.width]="selectedBatch()!.batch.progressPct + '%'"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-400 mt-2">
              <span>Pendentes: {{ selectedBatch()!.batch.totalRecords - selectedBatch()!.batch.processedRecords }}</span>
              <span>{{ selectedBatch()!.batch.batchSize }} leads/lote · {{ selectedBatch()!.batch.intervalMinutes }} min intervalo</span>
            </div>
          </div>

          <!-- Items Filter -->
          <div class="card p-4">
            <div class="flex flex-wrap gap-3">
              <div class="relative flex-1 min-w-48">
                <span class="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                <input [formControl]="itemSearchCtrl" placeholder="Buscar por nome ou telefone..."
                  class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg
                         bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                         focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors" />
              </div>
              <select [formControl]="itemStatusCtrl"
                class="py-2 px-3 text-sm border border-gray-200 dark:border-slate-600 rounded-lg
                       bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
                       focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors">
                <option value="">Todos os status</option>
                @for (s of itemStatuses; track s.value) {
                  <option [value]="s.value">{{ s.label }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Items Table -->
          <div class="card overflow-hidden">
            <div class="px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Leads processados — {{ filteredItems().length }} registro(s)
              </h3>
            </div>
            <div class="overflow-x-auto">
              <table mat-table [dataSource]="filteredItems()" class="w-full">

                <ng-container matColumnDef="lead">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome no Disparo</th>
                  <td mat-cell *matCellDef="let i" class="px-4 py-3">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ i.leadName || '—' }}</p>
                    <p class="text-xs text-gray-400 font-mono">{{ i.phoneNumber }}</p>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <td mat-cell *matCellDef="let i" class="px-4 py-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      [ngClass]="itemStatusClass(i.status)">
                      <span class="material-icons-round text-sm">{{ itemStatusIcon(i.status) }}</span>
                      {{ itemStatusLabel(i.status) }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="processedAt">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Processado em</th>
                  <td mat-cell *matCellDef="let i" class="px-4 py-3">
                    <span class="text-xs text-gray-500">{{ i.processedAt | date:'dd/MM/yy HH:mm:ss' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="deliveredAt">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entregue em</th>
                  <td mat-cell *matCellDef="let i" class="px-4 py-3">
                    <span class="text-xs text-gray-500">{{ i.deliveredAt ? (i.deliveredAt | date:'HH:mm:ss') : '—' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="readAt">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lido em</th>
                  <td mat-cell *matCellDef="let i" class="px-4 py-3">
                    <span class="text-xs text-gray-500">{{ i.readAt ? (i.readAt | date:'HH:mm:ss') : '—' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="msgId">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp Msg ID</th>
                  <td mat-cell *matCellDef="let i" class="px-4 py-3">
                    <span class="text-xs text-gray-400 font-mono truncate max-w-32 block" [title]="i.whatsappMessageId">
                      {{ i.whatsappMessageId || '—' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="error">
                  <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Erro</th>
                  <td mat-cell *matCellDef="let i" class="px-4 py-3">
                    <span class="text-xs text-red-500">{{ i.errorDetail || '—' }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="itemColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: itemColumns;"
                  class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"></tr>

                <tr *matNoDataRow>
                  <td [colSpan]="itemColumns.length" class="py-12 text-center text-gray-400">
                    Nenhum registro encontrado
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class LeadDisparoHistoricoPageComponent implements OnInit {
  private disparoService = inject(LeadDisparoService);
  private toast          = inject(ToastService);
  private fb             = inject(FormBuilder);

  loading       = signal(true);
  batches       = signal<LeadBatchSummary[]>([]);
  selectedBatch = signal<LeadBatchDetail | null>(null);
  loadingDetail = signal(false);

  batchColumns = ['file', 'workflow', 'status', 'progress', 'config', 'date', 'actions'];
  itemColumns  = ['lead', 'status', 'processedAt', 'deliveredAt', 'readAt', 'msgId', 'error'];

  searchCtrl     = this.fb.control('');
  itemSearchCtrl = this.fb.control('');
  itemStatusCtrl = this.fb.control('');

  searchValue     = toSignal(this.searchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  itemSearchValue = toSignal(this.itemSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  itemStatusValue = toSignal(this.itemStatusCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  itemStatuses = Object.entries(ITEM_STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

  filteredBatches = computed(() => {
    const q = (this.searchValue() || '').toLowerCase();
    if (!q) return this.batches();
    return this.batches().filter(b =>
      b.fileName.toLowerCase().includes(q) ||
      (b.workflowName?.toLowerCase().includes(q) ?? false)
    );
  });

  filteredItems = computed(() => {
    const items = this.selectedBatch()?.items ?? [];
    const q   = (this.itemSearchValue() || '').toLowerCase();
    const st  = this.itemStatusValue() || '';
    return items.filter(i => {
      const matchSearch = !q ||
        (i.leadName?.toLowerCase().includes(q) ?? false) ||
        i.phoneNumber.includes(q);
      const matchStatus = !st || i.status === st;
      return matchSearch && matchStatus;
    });
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.disparoService.listBatches().subscribe({
      next:  b => { this.batches.set(b); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDetail(batch: LeadBatchSummary) {
    this.loadingDetail.set(true);
    this.disparoService.getBatch(batch.id).subscribe({
      next:  d => { this.selectedBatch.set(d); this.loadingDetail.set(false); this.itemSearchCtrl.reset(); this.itemStatusCtrl.reset(); },
      error: () => { this.toast.error('Erro ao carregar detalhes.'); this.loadingDetail.set(false); },
    });
  }

  batchStatusLabel(s: string) { return BATCH_STATUS_CONFIG[s]?.label ?? s; }
  batchStatusClass(s: string) { return BATCH_STATUS_CONFIG[s]?.css ?? ''; }
  batchStatusIcon(s: string)  { return BATCH_STATUS_CONFIG[s]?.icon ?? 'help'; }

  itemStatusLabel(s: string) { return ITEM_STATUS_CONFIG[s]?.label ?? s; }
  itemStatusClass(s: string) { return ITEM_STATUS_CONFIG[s]?.css ?? ''; }
  itemStatusIcon(s: string)  { return ITEM_STATUS_CONFIG[s]?.icon ?? 'help'; }
}
