import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WorkflowService } from '@core/services/workflow.service';
import { ToastService } from '@core/services/toast.service';
import { WorkflowRequiredDocument } from '@shared/models';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-workflow-documents-page',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule, SkeletonComponent],
  template: `
    <div class="space-y-5">
      <!-- Header -->
      <div class="page-header">
        <div>
          <a routerLink="/workflows" class="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-600 mb-1">
            <span class="material-icons-round text-base">arrow_back</span> Workflows
          </a>
          <h1>Documentos Obrigatórios</h1>
          <p>Workflow ID: {{ workflowId() }} — {{ docs().length }} documento(s)</p>
        </div>
        <button (click)="openForm()" class="btn-primary">
          <span class="material-icons-round text-base">add</span>
          Novo Documento
        </button>
      </div>

      @if (loading()) {
        <app-skeleton [rows]="4" />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (doc of docs(); track doc.id) {
            <div class="card p-5 hover:shadow-md transition-shadow" [ngClass]="!doc.active ? 'opacity-60' : ''">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  [ngClass]="doc.required ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-slate-700'">
                  <span class="material-icons-round text-2xl"
                    [ngClass]="doc.required ? 'text-red-500' : 'text-gray-400'">
                    {{ doc.required ? 'assignment' : 'assignment_turned_in' }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ doc.documentName }}</h3>
                    @if (doc.required) {
                      <span class="badge badge-leave">Obrigatório</span>
                    } @else {
                      <span class="badge badge-active">Opcional</span>
                    }
                  </div>
                  <p class="text-xs text-gray-400 font-mono bg-gray-50 dark:bg-slate-700 inline-block px-2 py-0.5 rounded mb-2">
                    {{ doc.documentKey }}
                  </p>
                  <div class="flex flex-wrap gap-2 mt-1">
                    @for (mime of doc.allowedMimeTypes; track mime) {
                      <span class="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                        {{ mime.split('/')[1] }}
                      </span>
                    }
                  </div>
                  <p class="text-xs text-gray-400 mt-2">
                    Máximo: {{ doc.maxSizeMb }}MB · Ordem: {{ doc.docOrder }}
                  </p>
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-span-2 card p-16 text-center">
              <span class="material-icons-round text-5xl text-gray-200 dark:text-slate-700 block mb-3">folder_open</span>
              <p class="text-gray-400 mb-4">Nenhum documento configurado</p>
              <button (click)="openForm()" class="btn-primary mx-auto">Adicionar documento</button>
            </div>
          }
        </div>
      }

      <!-- Form Dialog -->
      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-in">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Novo Documento Obrigatório</h2>
              <button (click)="closeForm()" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="docForm" (ngSubmit)="save()" class="space-y-4">
              <div>
                <label class="form-label">Nome do Documento *</label>
                <input formControlName="documentName" placeholder="Ex: RG ou CNH atualizado(a)" class="form-input" />
              </div>
              <div>
                <label class="form-label">Chave do Documento *</label>
                <input formControlName="documentKey" placeholder="Ex: rg_cnh" class="form-input font-mono text-sm" />
                <p class="text-xs text-gray-400 mt-1">Identificador único, sem espaços (use underscore)</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Ordem</label>
                  <input formControlName="docOrder" type="number" min="1" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Tamanho Máximo (MB)</label>
                  <input formControlName="maxSizeMb" type="number" min="1" max="50" class="form-input" />
                </div>
              </div>
              <div>
                <label class="form-label">Tipos MIME permitidos</label>
                <div class="space-y-2">
                  @for (mime of mimeTypes; track mime.value) {
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [value]="mime.value" (change)="toggleMime(mime.value, $event)"
                        [checked]="selectedMimes.includes(mime.value)"
                        class="w-4 h-4 rounded accent-primary-600" />
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ mime.label }}</span>
                    </label>
                  }
                </div>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" formControlName="required" class="w-4 h-4 rounded accent-primary-600" />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Documento obrigatório</span>
              </label>

              <div class="flex gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                <button type="button" (click)="closeForm()" class="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" [disabled]="docForm.invalid || saving()" class="btn-primary flex-1 justify-center">
                  @if (saving()) { <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
                  Adicionar
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
export class WorkflowDocumentsPageComponent implements OnInit {
  private route     = inject(ActivatedRoute);
  private wfService = inject(WorkflowService);
  private toast     = inject(ToastService);
  private fb        = inject(FormBuilder);

  workflowId = signal(0);
  loading    = signal(true);
  saving     = signal(false);
  docs       = signal<WorkflowRequiredDocument[]>([]);
  showForm   = signal(false);

  selectedMimes = ['application/pdf', 'image/jpeg', 'image/png'];

  mimeTypes = [
    { value: 'application/pdf', label: 'PDF (application/pdf)' },
    { value: 'image/jpeg',      label: 'JPEG (image/jpeg)'     },
    { value: 'image/png',       label: 'PNG (image/png)'       },
    { value: 'image/jpg',       label: 'JPG (image/jpg)'       },
  ];

  docForm = this.fb.group({
    documentName: ['', Validators.required],
    documentKey:  ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
    docOrder:     [1],
    maxSizeMb:    [4],
    required:     [true],
  });

  ngOnInit() {
    this.workflowId.set(Number(this.route.snapshot.paramMap.get('workflowId')));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.wfService.getDocuments(this.workflowId()).subscribe({
      next:  d => { this.docs.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm()  { this.docForm.reset({ docOrder: this.docs().length + 1, maxSizeMb: 4, required: true }); this.selectedMimes = ['application/pdf', 'image/jpeg', 'image/png']; this.showForm.set(true); }
  closeForm() { this.showForm.set(false); }

  toggleMime(mime: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedMimes = checked
      ? [...this.selectedMimes, mime]
      : this.selectedMimes.filter(m => m !== mime);
  }

  save() {
    if (this.docForm.invalid) return;
    this.saving.set(true);
    const v = this.docForm.value;
    const req = {
      documentName: v.documentName!,
      documentKey:  v.documentKey!,
      docOrder:     Number(v.docOrder),
      maxSizeMb:    Number(v.maxSizeMb),
      required:     v.required ?? true,
      allowedMimeTypes: this.selectedMimes,
    };
    this.wfService.createDocument(this.workflowId(), req).subscribe({
      next:  () => { this.toast.success('Documento adicionado!'); this.closeForm(); this.saving.set(false); this.load(); },
      error: () => { this.toast.error('Erro ao salvar.'); this.saving.set(false); },
    });
  }
}
