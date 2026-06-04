import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { WorkflowService } from '@core/services/workflow.service';
import { ToastService } from '@core/services/toast.service';
import { Workflow } from '@shared/models';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-workflow-list-page',
  standalone: true,
  imports: [RouterLink, NgClass, ReactiveFormsModule, MatDialogModule],
  template: `
    <div class="space-y-5">
      <!-- Header -->
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) { <div class="card p-5 skeleton h-36"></div> }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (wf of workflows(); track wf.id) {
            <div class="card p-5 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span class="material-icons-round text-primary-600 dark:text-primary-400">account_tree</span>
                </div>
                <span class="badge" [ngClass]="wf.active ? 'badge-active' : 'badge-leave'">
                  {{ wf.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ wf.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{{ wf.description || 'Sem descrição' }}</p>

              <div class="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <a [routerLink]="['/workflows', wf.id, 'steps']" class="btn-secondary flex-1 justify-center text-xs py-1.5">
                  <span class="material-icons-round text-sm">list</span> Etapas
                </a>
                <a [routerLink]="['/workflows', wf.id, 'documents']" class="btn-secondary flex-1 justify-center text-xs py-1.5">
                  <span class="material-icons-round text-sm">folder</span> Docs
                </a>
                <button (click)="openForm(wf)" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <span class="material-icons-round text-base">edit</span>
                </button>
                <button (click)="toggleActive(wf)" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20">
                  <span class="material-icons-round text-base">{{ wf.active ? 'toggle_on' : 'toggle_off' }}</span>
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-3 text-center py-16">
              <span class="material-icons-round text-5xl text-gray-200 dark:text-slate-700 block mb-3">account_tree</span>
              <p class="text-gray-400 mb-4">Nenhum workflow criado</p>
              <button (click)="openForm()" class="btn-primary mx-auto">Criar primeiro workflow</button>
            </div>
          }
        </div>
      }

      <!-- Form Dialog -->
      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-in">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ editing() ? 'Editar Workflow' : 'Novo Workflow' }}
            </h2>
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                <input formControlName="name" placeholder="Ex: Minha Casa Minha Vida"
                  class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <textarea formControlName="description" rows="3" placeholder="Descrição do workflow..."
                  class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg
                         bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none"></textarea>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="closeForm()" class="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary flex-1 justify-center">
                  @if (saving()) { <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
                  {{ editing() ? 'Salvar' : 'Criar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class WorkflowListPageComponent implements OnInit {
  private wfService = inject(WorkflowService);
  private toast     = inject(ToastService);
  private fb        = inject(FormBuilder);

  loading    = signal(true);
  saving     = signal(false);
  workflows  = signal<Workflow[]>([]);
  showForm   = signal(false);
  editing    = signal<Workflow | null>(null);

  form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.wfService.getAll().subscribe({
      next: wf => { this.workflows.set(wf); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(wf?: Workflow) {
    this.editing.set(wf ?? null);
    this.form.reset({ name: wf?.name ?? '', description: wf?.description ?? '' });
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); this.editing.set(null); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const req = { name: this.form.value.name!, description: this.form.value.description ?? '' };
    const op  = this.editing()
      ? this.wfService.update(this.editing()!.id, req)
      : this.wfService.create(req);
    op.subscribe({
      next: () => { this.toast.success(this.editing() ? 'Workflow atualizado!' : 'Workflow criado!'); this.closeForm(); this.saving.set(false); this.load(); },
      error: () => { this.toast.error('Erro ao salvar.'); this.saving.set(false); },
    });
  }

  toggleActive(wf: Workflow) {
    const req = { name: wf.name, description: wf.description ?? '' };
    this.wfService.update(wf.id, req).subscribe({
      next: () => { this.toast.success('Status atualizado!'); this.load(); },
      error: () => this.toast.error('Erro ao atualizar.'),
    });
  }
}
