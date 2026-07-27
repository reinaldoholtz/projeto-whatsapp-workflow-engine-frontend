import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/services/toast.service';
import { WhatsAppTemplateService } from '@core/services/whatsapp-template.service';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { WhatsAppTemplate, WhatsAppTemplateQuality, WhatsAppTemplateStatus } from '@shared/models';

@Component({
  selector: 'app-whatsapp-templates-page',
  standalone: true,
  imports: [NgClass, DatePipe, MatTableModule, SkeletonComponent],
  template: `
    <div class="space-y-5">
      <div class="page-header">
        <div>
          <h1>Templates WhatsApp</h1>
          <p>Catálogo global de templates sincronizados no admin_db</p>
        </div>
        @if (auth.isMasterAdminMode()) {
          <button type="button" disabled class="btn-secondary opacity-70 cursor-not-allowed">
            <span class="material-icons-round text-base">sync</span>
            Sincronizar Templates
          </button>
        }
      </div>

      <div class="card p-4 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <span class="material-icons-round text-blue-500 flex-shrink-0 mt-0.5">info</span>
        <div class="text-sm text-blue-700 dark:text-blue-300">
          <p class="font-semibold">Estrutura preparada para sincronização futura</p>
          <p class="text-xs mt-0.5">
            Nesta etapa a tela é somente leitura. A sincronização com a Meta Cloud API será adicionada depois.
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
                  {{ t.language || '—' }}
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
                  {{ t.tenantName || '—' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="lastSyncAt">
                <th mat-header-cell *matHeaderCellDef class="table-head">Última sincronização</th>
                <td mat-cell *matCellDef="let t" class="table-cell text-sm text-gray-600 dark:text-gray-300">
                  {{ t.lastSyncAt ? (t.lastSyncAt | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="table-head w-20"></th>
                <td mat-cell *matCellDef="let t" class="table-cell">
                  <button (click)="selectedTemplate.set(t)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                           hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
                    title="Visualizar detalhes">
                    <span class="material-icons-round text-base">visibility</span>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns()"></tr>
              <tr mat-row *matRowDef="let row; columns: columns();"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"></tr>

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
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in overflow-y-auto">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl my-4 animate-slide-in">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span class="material-icons-round text-emerald-600 text-xl">text_snippet</span>
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">{{ selectedTemplate()!.name }}</h2>
                <p class="text-xs text-gray-400">Template WhatsApp em modo leitura</p>
              </div>
            </div>
            <button (click)="selectedTemplate.set(null)"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <div class="p-6 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="detail-box">
                <p class="detail-label">Categoria</p>
                <p class="detail-value">{{ categoryLabel(selectedTemplate()!.category) }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Idioma</p>
                <p class="detail-value">{{ selectedTemplate()!.language || '—' }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Status</p>
                <p class="detail-value">{{ statusLabel(selectedTemplate()!.status) }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Qualidade</p>
                <p class="detail-value">{{ qualityLabel(selectedTemplate()!.quality) }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Tenant</p>
                <p class="detail-value">{{ selectedTemplate()!.tenantName || '—' }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-label">Canal WhatsApp</p>
                <p class="detail-value">{{ selectedTemplate()!.metaPhoneName || '—' }}</p>
              </div>
            </div>

            <div class="detail-box">
              <p class="detail-label">Conteúdo</p>
              <p class="detail-value whitespace-pre-wrap">{{ selectedTemplate()!.content || 'Sem conteúdo disponível.' }}</p>
            </div>

            <div class="detail-box">
              <p class="detail-label">Variáveis</p>
              @if (selectedTemplate()!.variables?.length) {
                <div class="flex flex-wrap gap-2">
                  @for (variable of selectedTemplate()!.variables!; track variable.name) {
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200">
                      {{ variable.name }}
                      <span class="text-gray-400">{{ variable.type }}</span>
                    </span>
                  }
                </div>
              } @else {
                <p class="detail-value">Nenhuma variável mapeada.</p>
              }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="detail-box">
                <p class="detail-label">Última sincronização</p>
                <p class="detail-value">{{ selectedTemplate()!.lastSyncAt ? (selectedTemplate()!.lastSyncAt | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}</p>
              </div>
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
    .detail-label { @apply text-xs uppercase tracking-wider text-gray-400 mb-1; }
    .detail-value { @apply text-sm text-gray-700 dark:text-gray-200; }
  `]
})
export class WhatsAppTemplatesPageComponent implements OnInit {
  auth = inject(AuthService);
  private toast = inject(ToastService);
  private templateService = inject(WhatsAppTemplateService);

  loading = signal(true);
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

  categoryLabel(category: string): string {
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
