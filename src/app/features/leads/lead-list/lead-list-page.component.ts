import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { LeadService } from '@core/services/lead.service';
import { ToastService } from '@core/services/toast.service';
import { LeadSession, LeadStatus } from '@shared/models';
import { StatusBadgeComponent } from '@shared/components/badge/status-badge.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

@Component({
  selector: 'app-lead-list-page',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, DatePipe,
    MatTableModule, MatPaginatorModule, MatMenuModule, MatDialogModule,
    StatusBadgeComponent, SkeletonComponent,
  ],
  template: `
    <div class="space-y-5">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Leads</h1>
          <p>{{ filteredLeads().length }} lead(s) encontrado(s)</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card p-4">
        <form [formGroup]="filterForm" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          <input formControlName="search" placeholder="Nome ou telefone..." class="input-field" />

          <select formControlName="status" class="input-field">
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="COMPLETED">Concluído</option>
            <option value="HUMAN_HANDOFF">Especialista</option>
            <option value="PAUSED">Pausado</option>
            <option value="LEAVE">Saiu</option>
          </select>

          <input formControlName="workflow" placeholder="Workflow..." class="input-field" />

          <input formControlName="step" placeholder="Etapa atual..." class="input-field" />

          <button type="button" (click)="filterForm.reset()" class="btn-secondary justify-center">
            <span class="material-icons-round text-base">clear</span>
            Limpar
          </button>
        </form>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        @if (loading()) {
          <div class="p-6"><app-skeleton [rows]="8" /></div>
        } @else {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="pagedLeads()" class="w-full">

              <!-- Profile -->
              <ng-container matColumnDef="profile">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lead
                </th>
                <td mat-cell *matCellDef="let lead" class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                      <span class="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                        {{ (lead.profileName || lead.phoneNumber).charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ lead.profileName || '—' }}</p>
                      <p class="text-xs text-gray-400">{{ lead.phoneNumber }}</p>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Status -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <td mat-cell *matCellDef="let lead" class="px-4 py-3">
                  <app-status-badge [status]="lead.status" />
                </td>
              </ng-container>

              <!-- Workflow -->
              <ng-container matColumnDef="workflow">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow</th>
                <td mat-cell *matCellDef="let lead" class="px-4 py-3">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ lead.workflow || '—' }}</span>
                </td>
              </ng-container>

              <!-- Step -->
              <ng-container matColumnDef="step">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Etapa</th>
                <td mat-cell *matCellDef="let lead" class="px-4 py-3">
                  <span class="text-sm text-gray-600 dark:text-gray-400">{{ lead.currentStep || '—' }}</span>
                </td>
              </ng-container>

              <!-- Last Interaction -->
              <ng-container matColumnDef="lastInteraction">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Interação</th>
                <td mat-cell *matCellDef="let lead" class="px-4 py-3">
                  <span class="text-sm text-gray-500">{{ lead.lastInteraction | date:'dd/MM/yy HH:mm' }}</span>
                </td>
              </ng-container>

              <!-- Created -->
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
                <td mat-cell *matCellDef="let lead" class="px-4 py-3">
                  <span class="text-sm text-gray-500">{{ lead.createdAt | date:'dd/MM/yy' }}</span>
                </td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="px-4 py-3"></th>
                <td mat-cell *matCellDef="let lead" class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <a [routerLink]="['/leads', lead.id]"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
                      title="Ver detalhes">
                      <span class="material-icons-round text-base">visibility</span>
                    </a>

                    <button [matMenuTriggerFor]="menu"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                             hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                      <span class="material-icons-round text-base">more_vert</span>
                    </button>

                    <mat-menu #menu="matMenu">
                      @if (lead.status === 'ACTIVE') {
                        <button mat-menu-item (click)="pause(lead)">
                          <span class="material-icons-round text-amber-500 text-base mr-2">pause</span>
                          Pausar
                        </button>
                      }
                      @if (lead.status === 'PAUSED') {
                        <button mat-menu-item (click)="resume(lead)">
                          <span class="material-icons-round text-emerald-500 text-base mr-2">play_arrow</span>
                          Retomar
                        </button>
                      }
                      <button mat-menu-item (click)="handoff(lead)">
                        <span class="material-icons-round text-blue-500 text-base mr-2">support_agent</span>
                        Transferir para Especialista
                      </button>
                      <button mat-menu-item (click)="generatePdf(lead)">
                        <span class="material-icons-round text-red-500 text-base mr-2">picture_as_pdf</span>
                        Gerar PDF
                      </button>
                    </mat-menu>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"
                class="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"></tr>

              <tr *matNoDataRow>
                <td [colSpan]="columns.length" class="py-16 text-center text-gray-400">
                  <span class="material-icons-round text-5xl block mb-2 opacity-30">people_outline</span>
                  Nenhum lead encontrado
                </td>
              </tr>
            </table>
          </div>

          <mat-paginator
            [length]="filteredLeads().length"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPage($event)"
            showFirstLastButtons
          />
        }
      </div>
    </div>
  `,
  styles: [`
    .input-field {
      @apply w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg
             bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200
             focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors;
    }
  `]
})
export class LeadListPageComponent implements OnInit {
  private leadService = inject(LeadService);
  private toast       = inject(ToastService);
  private fb          = inject(FormBuilder);

  loading    = signal(true);
  leads      = signal<LeadSession[]>([]);
  pageIndex  = signal(0);
  pageSize   = 10;

  columns = ['profile', 'status', 'workflow', 'step', 'lastInteraction', 'createdAt', 'actions'];

  filterForm = this.fb.group({
    search:   [''],
    status:   [''],
    workflow: [''],
    step:     [''],
  });

  filterValues = toSignal(
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.getRawValue())
    ),
    {
      initialValue: this.filterForm.getRawValue()
    }
  );

  filteredLeads = computed(() => {  
    const { search, status, workflow, step } = this.filterValues();
    return this.leads().filter(l => {  
      const text = (search || '').toLowerCase();
      const matchSearch = !text ||
        (l.profileName?.toLowerCase().includes(text) ?? false) ||
        l.phoneNumber.includes(text);
      const matchStatus   = !status   || l.status === status;
      const matchWorkflow = !workflow || (l.workflow?.toLowerCase().includes((workflow || '').toLowerCase()) ?? false);
      const matchStep     = !step     || (l.currentStep?.toLowerCase().includes((step || '').toLowerCase()) ?? false);
      
      return matchSearch && matchStatus && matchWorkflow && matchStep;
    });
  });

  pagedLeads = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.filteredLeads().slice(start, start + this.pageSize);
  });

  ngOnInit() {
    this.loadLeads();
    this.filterForm.valueChanges.subscribe(() => this.pageIndex.set(0));
  }

  loadLeads() {
    this.loading.set(true);
    this.leadService.getAll().subscribe({
      next:  l => { 
        console.log('LEADS API', l);
        this.leads.set(l); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent) {
    this.pageSize = e.pageSize;
    this.pageIndex.set(e.pageIndex);
  }

  pause(lead: LeadSession) {
    this.leadService.pause(lead.id).subscribe({
      next:  () => { this.toast.success('Atendimento pausado!'); this.loadLeads(); },
      error: () => this.toast.error('Erro ao pausar atendimento.'),
    });
  }

  resume(lead: LeadSession) {
    this.leadService.resume(lead.id).subscribe({
      next:  () => { this.toast.success('Atendimento retomado!'); this.loadLeads(); },
      error: () => this.toast.error('Erro ao retomar atendimento.'),
    });
  }

  handoff(lead: LeadSession) {
    this.leadService.handoff(lead.id).subscribe({
      next:  () => { this.toast.success('Transferido para especialista!'); this.loadLeads(); },
      error: () => this.toast.error('Erro ao transferir.'),
    });
  }

  generatePdf(lead: LeadSession) {
    this.leadService.generatePdf(lead.id).subscribe({
      next:  () => this.toast.success('PDF sendo gerado...'),
      error: () => this.toast.error('Erro ao gerar PDF.'),
    });
  }
}
