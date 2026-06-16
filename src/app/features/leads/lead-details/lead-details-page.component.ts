import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { LeadService } from '@core/services/lead.service';
import { ToastService } from '@core/services/toast.service';
import { LeadDetail, LeadAnswer, LeadDocument } from '@shared/models';
import { StatusBadgeComponent } from '@shared/components/badge/status-badge.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

type TabKey = 'timeline' | 'chat' | 'documents';

@Component({
  selector: 'app-lead-details-page',
  standalone: true,
  imports: [RouterLink, DatePipe, NgClass, StatusBadgeComponent, SkeletonComponent],
  template: `
    <div class="space-y-5">
      <!-- Back -->
      <a routerLink="/leads" class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
        <span class="material-icons-round text-base">arrow_back</span>
        Voltar para Leads
      </a>

      @if (loading()) {
        <app-skeleton [rows]="10" />
      } @else if (detail()) {
        <!-- Header Card -->
        <div class="card p-6">
          <div class="flex flex-col sm:flex-row sm:items-start gap-4">
            <div class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-primary-600 dark:text-primary-400 text-2xl font-bold">
                {{ (detail()!.session.profileName || detail()!.session.phoneNumber).charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="flex-1">
              <div class="flex flex-wrap items-start gap-3">
                <div>
                  <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ detail()!.session.profileName || 'Sem nome' }}
                  </h1>
                  <p class="text-gray-500 dark:text-gray-400 text-sm mt-0.5 flex items-center gap-1">
                    <span class="material-icons-round text-base">phone</span>
                    {{ detail()!.session.phoneNumber }}
                  </p>
                </div>
                <app-status-badge [status]="detail()!.session.status" />
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <p class="text-xs text-gray-400 uppercase tracking-wider">Workflow</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{{ detail()!.session.workflow || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-400 uppercase tracking-wider">Etapa Atual</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{{ detail()!.session.currentStep || '—' }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-400 uppercase tracking-wider">Última Interação</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                    {{ detail()!.session.lastInteraction | date:'dd/MM/yy HH:mm' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-400 uppercase tracking-wider">Criado em</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                    {{ detail()!.session.createdAt | date:'dd/MM/yy' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-2">
              @if (detail()!.session.status === 'ACTIVE') {
                <button (click)="pause()" class="btn-secondary text-amber-600 border-amber-200">
                  <span class="material-icons-round text-base">pause</span> Pausar
                </button>
              }
              @if (detail()!.session.status === 'PAUSED') {
                <button (click)="resume()" class="btn-secondary text-emerald-600 border-emerald-200">
                  <span class="material-icons-round text-base">play_arrow</span> Retomar
                </button>
              }
              <button (click)="handoff()" class="btn-secondary">
                <span class="material-icons-round text-base">support_agent</span> Especialista
              </button>
              <button (click)="generatePdf()" class="btn-primary">
                <span class="material-icons-round text-base">picture_as_pdf</span> PDF
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="card overflow-hidden">

          <!-- Tab Bar -->
          <div class="flex items-center border-b border-gray-100 dark:border-slate-700">

            <!-- Tabs -->
            <div class="flex flex-1">
              @for (tab of tabs; track tab.key) {
                <button
                  (click)="activeTab.set(tab.key)"
                  class="flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors"
                  [ngClass]="activeTab() === tab.key
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                >
                  <span class="material-icons-round text-base">{{ tab.icon }}</span>
                  {{ tab.label }}
                  <span class="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
                    {{ tab.count() }}
                  </span>
                </button>
              }
            </div>

            <!-- Botão Atualizar -->
            <button
              (click)="refreshAnswers()"
              [disabled]="refreshing()"
              class="flex items-center gap-1.5 mr-4 px-3 py-1.5 text-xs font-medium rounded-lg
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-slate-700
                     hover:text-primary-600 dark:hover:text-primary-400
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Buscar últimos registros"
            >
              <span class="material-icons-round text-base"
                    [class.animate-spin]="refreshing()">refresh</span>
              Atualizar
            </button>
          </div>

          <div class="p-6">

            <!-- Timeline Tab -->
            @if (activeTab() === 'timeline') {
              <div class="space-y-1">
                @for (answer of detail()!.answers; track answer.id; let last = $last) {
                  <div class="flex gap-4">
                    <div class="flex flex-col items-center">
                      <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <span class="material-icons-round text-white text-sm">check</span>
                      </div>
                      @if (!last) {
                        <div class="w-0.5 h-8 bg-gray-200 dark:bg-slate-700 my-1"></div>
                      }
                    </div>
                    <div class="pb-4 flex-1">
                      <p class="text-xs text-gray-400 mb-0.5">{{ answer.workflowStep?.name || 'Etapa' }}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400 italic">{{ answer.question }}</p>
                      <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ answer.answer }}</p>
                      <p class="text-xs text-gray-400 mt-1">{{ answer.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                    </div>
                  </div>
                } @empty {
                  <p class="text-center text-gray-400 py-8">Nenhuma resposta registrada</p>
                }
              </div>
            }

            <!-- Chat Tab -->
            @if (activeTab() === 'chat') {
              <div class="max-h-[500px] overflow-y-auto space-y-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4">
                @for (answer of detail()!.answers; track answer.id) {
                  <!-- Bot message (question) -->
                  <div class="flex gap-2 items-end">
                    <div class="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <span class="material-icons-round text-white text-sm">smart_toy</span>
                    </div>
                    <div>
                      <div class="chat-bubble-in">
                        <p class="text-sm">{{ answer.question }}</p>
                      </div>
                      <p class="text-xs text-gray-400 mt-1 ml-2">Bot</p>
                    </div>
                  </div>
                  <!-- User reply -->
                  <div class="flex gap-2 items-end justify-end">
                    <div>
                      <div class="chat-bubble-out">
                        <p class="text-sm">{{ answer.answer }}</p>
                      </div>
                      <p class="text-xs text-gray-400 mt-1 mr-2 text-right">
                        {{ answer.createdAt | date:'HH:mm' }}
                      </p>
                    </div>
                    <div class="w-7 h-7 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                      <span class="material-icons-round text-gray-500 text-sm">person</span>
                    </div>
                  </div>
                } @empty {
                  <p class="text-center text-gray-400 py-8">Nenhuma conversa registrada</p>
                }
              </div>
            }

            <!-- Documents Tab -->
            @if (activeTab() === 'documents') {
              <div class="space-y-3">
                @for (doc of detail()!.documents; track doc.id) {
                  <div class="flex items-center gap-4 p-4 border border-gray-100 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      [ngClass]="doc.mimeType?.includes('pdf') ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'">
                      <span class="material-icons-round text-xl"
                        [ngClass]="doc.mimeType?.includes('pdf') ? 'text-red-600' : 'text-blue-600'">
                        {{ doc.mimeType?.includes('pdf') ? 'picture_as_pdf' : 'image' }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ doc.documentName || doc.documentKey }}</p>
                      <p class="text-xs text-gray-400">{{ doc.mimeType }} · {{ doc.uploadedAt | date:'dd/MM/yyyy HH:mm' }}</p>
                    </div>
                    <div class="flex gap-1">
                      @if (doc.storageUrl) {
                        <a [href]="doc.storageUrl" target="_blank"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary-600 transition-colors"
                          title="Visualizar">
                          <span class="material-icons-round text-base">open_in_new</span>
                        </a>
                      }
                      @if (doc.sharepointFolderWebUrl) {
                        <a [href]="doc.sharepointFolderWebUrl" target="_blank"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors"
                          title="Abrir no SharePoint">
                          <span class="material-icons-round text-base">cloud</span>
                        </a>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="text-center py-12">
                    <span class="material-icons-round text-5xl text-gray-200 dark:text-slate-700 block mb-3">folder_open</span>
                    <p class="text-gray-400">Nenhum documento enviado</p>
                  </div>
                }
              </div>
            }

          </div>
        </div>
      }
    </div>
  `
})
export class LeadDetailsPageComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private leadService = inject(LeadService);
  private toast       = inject(ToastService);

  loading    = signal(true);
  refreshing = signal(false);
  detail     = signal<LeadDetail | null>(null);
  activeTab  = signal<TabKey>('timeline');

  tabs = [
    { key: 'timeline'  as TabKey, label: 'Timeline',   icon: 'timeline',    count: () => this.detail()?.answers.length ?? 0   },
    { key: 'chat'      as TabKey, label: 'Conversa',   icon: 'chat_bubble', count: () => this.detail()?.answers.length ?? 0   },
    { key: 'documents' as TabKey, label: 'Documentos', icon: 'folder',      count: () => this.detail()?.documents.length ?? 0 },
  ];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.leadService.getById(id).subscribe({
      next:  d => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  /** Recarrega respostas e documentos do lead sem recarregar a página inteira */
  refreshAnswers(): void {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    this.leadService.getById(this.id).subscribe({
      next: d => {
        this.detail.set(d);
        this.refreshing.set(false);
        this.toast.success('Atualizado com sucesso!');
      },
      error: () => {
        this.refreshing.set(false);
        this.toast.error('Erro ao atualizar.');
      },
    });
  }

  private get id() { return this.detail()!.session.id; }

  pause()       { this.leadService.pause(this.id).subscribe({ next: () => { this.toast.success('Pausado!'); this.reload(); }, error: () => this.toast.error('Erro.') }); }
  resume()      { this.leadService.resume(this.id).subscribe({ next: () => { this.toast.success('Retomado!'); this.reload(); }, error: () => this.toast.error('Erro.') }); }
  handoff()     { this.leadService.handoff(this.id).subscribe({ next: () => { this.toast.success('Transferido!'); this.reload(); }, error: () => this.toast.error('Erro.') }); }
  generatePdf() { this.leadService.generatePdf(this.id).subscribe({ next: () => this.toast.success('PDF sendo gerado...'), error: () => this.toast.error('Erro ao gerar PDF.') }); }

  private reload() {
    this.leadService.getById(this.id).subscribe(d => this.detail.set(d));
  }
}
