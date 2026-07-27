import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';
import { WhatsAppTemplateService } from '@core/services/whatsapp-template.service';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import {
  WhatsAppTemplate,
  WhatsAppTemplateButton,
  WhatsAppTemplateCategory,
  WhatsAppTemplateQuality,
  WhatsAppTemplateStatus,
} from '@shared/models';

@Component({
  selector: 'app-whatsapp-templates-page',
  standalone: true,
  imports: [NgClass, DatePipe, MatTableModule, SkeletonComponent],
  template: `
    <div class="space-y-5">
      <div class="page-header">
        <div>
          <h1>Templates WhatsApp</h1>
          <p>Catalogo global de templates sincronizados no admin_db</p>
        </div>
        @if (auth.isMasterAdminMode()) {
          <button type="button" (click)="syncTemplates()" [disabled]="syncing()" class="btn-secondary">
            @if (syncing()) {
              <span class="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
            } @else {
              <span class="material-icons-round text-base">sync</span>
            }
            Sincronizar Templates
          </button>
        }
      </div>

      <div class="card p-4 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <span class="material-icons-round text-blue-500 flex-shrink-0 mt-0.5">info</span>
        <div class="text-sm text-blue-700 dark:text-blue-300">
          <p class="font-semibold">Sincronizacao com a Meta Cloud API</p>
          <p class="text-xs mt-0.5">
            O botao sincroniza os templates dos canais Meta ativos e atualiza o admin_db sem duplicar registros.
          </p>
        </div>
      </div>

      <div class="card overflow-hidden">
        @if (loading()) {
          <div class="p-6"><app-skeleton [rows]="5" /></div>
        } @else {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="templates()" class="w-full">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="table-head">Nome</th>
                <td mat-cell *matCellDef="let t" class="table-cell">
                  <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ t.name }}</p>
                    <p class="text-xs text-gray-400">{{ t.providerTemplateId }}</p>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef class="table-head">Categoria</th>
                <td mat-cell *matCellDef="let t" class="table-cell">
                  <span class="badge" [ngClass]="categoryClass(t.category)">{{ categoryLabel(t.category) }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="language">
                <th mat-header-cell *matHeaderCellDef class="table-head">Idioma</th>
                <td mat-cell *matCellDef="let t" class="table-cell text-sm text-gray-600 dark:text-gray-300">
                  {{ t.language || '-' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="table-head">Status</th>
                <td mat-cell *matCellDef="let t" class="table-cell">
                  <span class="badge" [ngClass]="statusClass(t.status)">{{ statusLabel(t.status) }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="quality">
                <th mat-header-cell *matHeaderCellDef class="table-head">Qualidade</th>
                <td mat-cell *matCellDef="let t" class="table-cell">
                  <span class="badge" [ngClass]="qualityClass(t.quality)">{{ qualityLabel(t.quality) }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="tenant">
                <th mat-header-cell *matHeaderCellDef class="table-head">Tenant</th>
                <td mat-cell *matCellDef="let t" class="table-cell text-sm text-gray-600 dark:text-gray-300">
                  {{ t.tenantName || '-' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="lastSyncAt">
                <th mat-header-cell *matHeaderCellDef class="table-head">Ultima sincronizacao</th>
                <td mat-cell *matCellDef="let t" class="table-cell text-sm text-gray-600 dark:text-gray-300">
                  {{ t.lastSyncAt ? (t.lastSyncAt | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="table-head w-20"></th>
                <td mat-cell *matCellDef="let t" class="table-cell">
                  <button
                    (click)="openDetails(t)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
                    title="Visualizar detalhes">
                    <span class="material-icons-round text-base">visibility</span>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns()"></tr>
              <tr mat-row *matRowDef="let row; columns: columns();" class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"></tr>

              <tr *matNoDataRow>
                <td [colSpan]="columns().length" class="py-16 text-center text-gray-400">
                  <span class="material-icons-round text-5xl block mb-2 opacity-30">text_snippet</span>
                  Nenhum template sincronizado
                </td>
              </tr>
            </table>
          </div>
        }
      </div>
    </div>

    @if (selectedTemplate()) {
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span class="material-icons-round text-emerald-600 text-xl">text_snippet</span>
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">{{ selectedTemplate()!.name }}</h2>
                <p class="text-xs text-gray-400">Detalhes completos do template Meta</p>
              </div>
            </div>
            <button
              (click)="selectedTemplate.set(null)"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div class="detail-box">
                <p class="detail-label">Nome</p>
                <p class="detail-value">{{ selectedTemplate()!.name }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Provider Template ID</p>
                <p class="detail-value font-mono text-xs">{{ selectedTemplate()!.providerTemplateId }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Categoria</p>
                <div><span class="badge" [ngClass]="categoryClass(selectedTemplate()!.category)">{{ categoryLabel(selectedTemplate()!.category) }}</span></div>
              </div>
              <div class="detail-box">
                <p class="detail-label">Status</p>
                <div><span class="badge" [ngClass]="statusClass(selectedTemplate()!.status)">{{ statusLabel(selectedTemplate()!.status) }}</span></div>
              </div>
              <div class="detail-box">
                <p class="detail-label">Idioma</p>
                <p class="detail-value">{{ selectedTemplate()!.language || '-' }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Parameter Format</p>
                <p class="detail-value">{{ selectedTemplate()!.parameterFormat || '-' }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Qualidade</p>
                <div><span class="badge" [ngClass]="qualityClass(selectedTemplate()!.quality)">{{ qualityLabel(selectedTemplate()!.quality) }}</span></div>
              </div>
              <div class="detail-box">
                <p class="detail-label">Tenant</p>
                <p class="detail-value">{{ selectedTemplate()!.tenantName || '-' }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Canal WhatsApp</p>
                <p class="detail-value">{{ selectedTemplate()!.metaPhoneName || '-' }}</p>
              </div>
              <div class="detail-box xl:col-span-2">
                <p class="detail-label">Ultima sincronizacao</p>
                <p class="detail-value">{{ selectedTemplate()!.lastSyncAt ? (selectedTemplate()!.lastSyncAt | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}</p>
              </div>
            </div>

            @if (selectedTemplate()!.header) {
              <div class="detail-box">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p class="detail-label">Cabecalho</p>
                    <p class="detail-value">Componente HEADER retornado pela Meta</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    @if (selectedTemplate()!.header?.type) {
                      <span class="chip-neutral">{{ selectedTemplate()!.header!.type }}</span>
                    }
                    @if (selectedTemplate()!.header?.format) {
                      <span class="chip-neutral">{{ selectedTemplate()!.header!.format }}</span>
                    }
                  </div>
                </div>
                <p class="detail-value whitespace-pre-wrap">{{ selectedTemplate()!.header!.text || '-' }}</p>
              </div>
            }

            <div class="detail-box">
              <p class="detail-label">Corpo da mensagem</p>
              <p class="detail-value whitespace-pre-wrap">{{ selectedTemplate()!.body || selectedTemplate()!.content || 'Sem conteudo disponivel.' }}</p>
            </div>

            @if (selectedTemplate()!.footer) {
              <div class="detail-box">
                <p class="detail-label">Rodape</p>
                <p class="detail-value whitespace-pre-wrap">{{ selectedTemplate()!.footer }}</p>
              </div>
            }

            @if (selectedTemplate()!.buttons?.length) {
              <div class="detail-box">
                <p class="detail-label">Botoes</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  @for (button of selectedTemplate()!.buttons!; track trackButton(button, $index)) {
                    <span class="button-chip">
                      {{ button.text || '-' }}
                      @if (button.type) {
                        <span class="button-chip-type">{{ button.type }}</span>
                      }
                    </span>
                  }
                </div>
              </div>
            }

            <div class="detail-box">
              <p class="detail-label">Variaveis</p>
              @if (selectedTemplate()!.variables?.length) {
                <div class="overflow-x-auto mt-3">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-gray-200 dark:border-slate-700">
                        <th class="py-2 pr-4 text-left text-xs uppercase tracking-wider text-gray-400">Variavel</th>
                        <th class="py-2 pr-4 text-left text-xs uppercase tracking-wider text-gray-400">Tipo</th>
                        <th class="py-2 pr-4 text-left text-xs uppercase tracking-wider text-gray-400">Exemplo</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (variable of selectedTemplate()!.variables!; track variable.name + '-' + ($index + 1)) {
                        <tr class="border-b border-gray-100 dark:border-slate-800/70">
                          <td class="py-3 pr-4 font-medium text-gray-800 dark:text-gray-100">
                            {{ variable.position ? ('Posicao ' + variable.position) : variable.name }}
                          </td>
                          <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ variable.type }}</td>
                          <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">{{ variable.example || '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="detail-value mt-2">Nenhuma variavel mapeada.</p>
              }
            </div>

            <div class="detail-box">
              <button type="button" (click)="toggleTechnicalDetails()" class="w-full flex items-center justify-between gap-3 text-left">
                <div>
                  <p class="detail-label">Detalhes Tecnicos</p>
                  <p class="detail-value">Campos auxiliares e JSON bruto retornado pela Meta</p>
                </div>
                <span class="material-icons-round text-gray-400">{{ technicalExpanded() ? 'expand_less' : 'expand_more' }}</span>
              </button>

              @if (technicalExpanded()) {
                <div class="mt-4 space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="mini-box">
                      <p class="detail-label">Parameter Format</p>
                      <p class="detail-value">{{ selectedTemplate()!.parameterFormat || '-' }}</p>
                    </div>
                    <div class="mini-box">
                      <p class="detail-label">Disable iOS Autofill</p>
                      <p class="detail-value">{{ booleanLabel(selectedTemplate()!.disableIosAutofill) }}</p>
                    </div>
                    <div class="mini-box">
                      <p class="detail-label">Primary Device Delivery Only</p>
                      <p class="detail-value">{{ booleanLabel(selectedTemplate()!.primaryDeviceDeliveryOnly) }}</p>
                    </div>
                  </div>

                  <div class="mini-box">
                    <p class="detail-label">JSON bruto da Meta</p>
                    <pre class="json-box">{{ selectedTemplate()!.metaJson || '{}' }}</pre>
                  </div>
                </div>
              }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="detail-box">
                <p class="detail-label">Criado em</p>
                <p class="detail-value">{{ selectedTemplate()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Atualizado em</p>
                <p class="detail-value">{{ selectedTemplate()!.updatedAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .table-head { @apply px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider; }
    .table-cell { @apply px-4 py-3; }
    .detail-box { @apply rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4; }
    .mini-box { @apply rounded-xl border border-gray-100 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-4; }
    .detail-label { @apply text-xs uppercase tracking-wider text-gray-400 mb-1; }
    .detail-value { @apply text-sm text-gray-700 dark:text-gray-200; }
    .chip-neutral { @apply inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200; }
    .button-chip { @apply inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300; }
    .button-chip-type { @apply rounded-full bg-white/70 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-200; }
    .json-box { @apply mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200 whitespace-pre-wrap; }
  `]
})
export class WhatsAppTemplatesPageComponent implements OnInit {
  auth = inject(AuthService);
  private toast = inject(ToastService);
  private templateService = inject(WhatsAppTemplateService);

  loading = signal(true);
  syncing = signal(false);
  detailsLoading = signal(false);
  technicalExpanded = signal(false);
  templates = signal<WhatsAppTemplate[]>([]);
  selectedTemplate = signal<WhatsAppTemplate | null>(null);
  columns = computed(() => ['name', 'category', 'language', 'status', 'quality', 'tenant', 'lastSyncAt', 'actions']);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.templateService.getAll().subscribe({
      next: templates => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message ?? 'Erro ao carregar templates WhatsApp.');
        this.loading.set(false);
      },
    });
  }

  syncTemplates(): void {
    if (this.syncing()) return;

    this.syncing.set(true);
    this.templateService.sync().subscribe({
      next: () => {
        this.toast.success('Templates sincronizados com sucesso.');
        this.syncing.set(false);
        this.load();
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message ?? 'Erro ao sincronizar templates WhatsApp.');
        this.syncing.set(false);
      },
    });
  }

  openDetails(template: WhatsAppTemplate): void {
    this.detailsLoading.set(true);
    this.technicalExpanded.set(false);
    this.templateService.getById(template.id).subscribe({
      next: detail => {
        this.selectedTemplate.set(detail);
        this.detailsLoading.set(false);
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message ?? 'Erro ao carregar o detalhe do template.');
        this.detailsLoading.set(false);
      },
    });
  }

  trackButton(button: WhatsAppTemplateButton, index: number): string {
    return `${button.type || 'button'}-${button.text || ''}-${index}`;
  }

  booleanLabel(value: boolean | null | undefined): string {
    if (value === true) return 'Sim';
    if (value === false) return 'Nao';
    return '-';
  }

  toggleTechnicalDetails(): void {
    this.technicalExpanded.set(!this.technicalExpanded());
  }

  categoryLabel(category: WhatsAppTemplateCategory | string): string {
    const map: Record<string, string> = {
      MARKETING: 'Marketing',
      UTILITY: 'Utility',
      AUTHENTICATION: 'Authentication',
    };
    return map[category] ?? category;
  }

  categoryClass(category: string): string {
    const map: Record<string, string> = {
      MARKETING: 'badge-active',
      UTILITY: 'badge-paused',
      AUTHENTICATION: 'badge-leave',
    };
    return map[category] ?? 'badge';
  }

  statusLabel(status: WhatsAppTemplateStatus): string {
    const map: Record<WhatsAppTemplateStatus, string> = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
      PAUSED: 'Pausado',
      DISABLED: 'Desabilitado',
    };
    return map[status] ?? status;
  }

  statusClass(status: WhatsAppTemplateStatus): string {
    const map: Record<WhatsAppTemplateStatus, string> = {
      PENDING: 'badge-paused',
      APPROVED: 'badge-active',
      REJECTED: 'badge-leave',
      PAUSED: 'badge-paused',
      DISABLED: 'badge-leave',
    };
    return map[status] ?? 'badge';
  }

  qualityLabel(quality: WhatsAppTemplateQuality): string {
    const map: Record<WhatsAppTemplateQuality, string> = {
      GREEN: 'Verde',
      YELLOW: 'Amarelo',
      RED: 'Vermelho',
      UNKNOWN: 'Desconhecida',
    };
    return map[quality] ?? quality;
  }

  qualityClass(quality: WhatsAppTemplateQuality): string {
    const map: Record<WhatsAppTemplateQuality, string> = {
      GREEN: 'badge-active',
      YELLOW: 'badge-paused',
      RED: 'badge-leave',
      UNKNOWN: 'badge',
    };
    return map[quality] ?? 'badge';
  }
}
