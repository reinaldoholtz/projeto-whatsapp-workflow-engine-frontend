import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { LeadService } from '@core/services/lead.service';
import { WorkflowService } from '@core/services/workflow.service';
import { LeadSession, DashboardStats } from '@shared/models';
import { StatusBadgeComponent } from '@shared/components/badge/status-badge.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NgClass, StatusBadgeComponent, SkeletonComponent, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do CRM WhatsApp</p>
        </div>
        <button (click)="load()" class="btn-secondary">
          <span class="material-icons-round text-base">refresh</span>
          Atualizar
        </button>
      </div>

      <!-- Stats Cards -->
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="card p-5 skeleton h-28"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (card of statCards(); track card.label) {
            <div class="card p-5 hover:shadow-md transition-shadow cursor-default">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ card.label }}</p>
                  <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">{{ card.value }}</p>
                </div>
                <div class="w-11 h-11 rounded-xl flex items-center justify-center" [ngClass]="card.bg">
                  <span class="material-icons-round text-xl" [ngClass]="card.color">{{ card.icon }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Leads por Status -->
        <div class="card p-6">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Leads por Status</h2>
          @if (loading()) {
            <app-skeleton [rows]="4" />
          } @else {
            <div class="space-y-3">
              @for (item of leadsByStatus(); track item.status) {
                <div>
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="text-gray-600 dark:text-gray-300">{{ item.label }}</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ item.count }}</span>
                  </div>
                  <div class="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-700"
                      [ngClass]="item.barColor"
                      [style.width]="item.pct + '%'"
                    ></div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Últimos Leads -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Últimos Leads</h2>
            <a routerLink="/leads" class="text-primary-600 dark:text-primary-400 text-sm hover:underline">
              Ver todos →
            </a>
          </div>
          @if (loading()) {
            <app-skeleton [rows]="5" />
          } @else {
            <div class="space-y-3">
              @for (lead of recentLeads(); track lead.id) {
                <a
                  [routerLink]="['/leads', lead.id]"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span class="text-primary-600 dark:text-primary-400 text-sm font-semibold">
                      {{ (lead.profileName || lead.phoneNumber).charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {{ lead.profileName || lead.phoneNumber }}
                    </p>
                    <p class="text-xs text-gray-400 truncate">{{ lead.phoneNumber }}</p>
                  </div>
                  <app-status-badge [status]="lead.status" />
                </a>
              } @empty {
                <p class="text-center text-gray-400 text-sm py-4">Nenhum lead encontrado</p>
              }
            </div>
          }
        </div>
      </div>

      <!-- Taxa de Conversão Banner -->
      @if (!loading()) {
        <div class="card p-6 bg-gradient-to-r from-primary-600 to-primary-700 border-0">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-primary-100 text-sm font-medium">Taxa de Conversão</p>
              <p class="text-white text-4xl font-bold mt-1">{{ stats()?.conversionRate ?? 0 }}%</p>
              <p class="text-primary-200 text-sm mt-1">Leads concluídos / total</p>
            </div>
            <div class="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
              <span class="material-icons-round text-white text-4xl">trending_up</span>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardPageComponent implements OnInit {
  private leadService     = inject(LeadService);
  private workflowService = inject(WorkflowService);

  loading   = signal(true);
  leads     = signal<LeadSession[]>([]);
  workflows = signal<any[]>([]);

  stats = computed<DashboardStats | null>(() => {
    const l = this.leads();
    if (!l.length && !this.workflows().length) return null;
    const total      = l.length;
    const active     = l.filter(x => x.status === 'ACTIVE').length;
    const completed  = l.filter(x => x.status === 'COMPLETED').length;
    const handoff    = l.filter(x => x.status === 'HUMAN_HANDOFF').length;
    const paused     = l.filter(x => x.status === 'PAUSED').length;
    const activeWf   = this.workflows().filter(w => w.active).length;
    const totalDocs  = 0; // would need a separate endpoint
    const rate       = total ? Math.round((completed / total) * 100) : 0;
    return { totalLeads: total, activeLeads: active, completedLeads: completed,
             handoffLeads: handoff, pausedLeads: paused, activeWorkflows: activeWf,
             totalDocuments: totalDocs, conversionRate: rate };
  });

  statCards = computed<StatCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Total de Leads',     value: s.totalLeads,      icon: 'people',        color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/30'    },
      { label: 'Leads Ativos',       value: s.activeLeads,     icon: 'play_circle',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30'},
      { label: 'Concluídos',         value: s.completedLeads,  icon: 'check_circle',  color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
      { label: 'Em Especialista',    value: s.handoffLeads,    icon: 'support_agent', color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/30'   },
      { label: 'Pausados',           value: s.pausedLeads,     icon: 'pause_circle',  color: 'text-gray-500',    bg: 'bg-gray-100 dark:bg-gray-800'       },
      { label: 'Workflows Ativos',   value: s.activeWorkflows, icon: 'account_tree',  color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/30' },
      { label: 'Taxa de Conversão',  value: s.conversionRate,  icon: 'trending_up',   color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/30'},
      // { label: 'Docs Recebidos',     value: s.totalDocuments,  icon: 'folder',        color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/30' },
    ];
  });

  recentLeads = computed(() => this.leads().slice(0, 6));

  leadsByStatus = computed(() => {
    const l = this.leads();
    const total = l.length || 1;
    const items = [
      { status: 'ACTIVE',        label: 'Ativos',       barColor: 'bg-emerald-500' },
      { status: 'COMPLETED',     label: 'Concluídos',   barColor: 'bg-blue-500'    },
      { status: 'HUMAN_HANDOFF', label: 'Especialista', barColor: 'bg-amber-500'   },
      { status: 'PAUSED',        label: 'Pausados',     barColor: 'bg-gray-400'    },
      { status: 'LEAVE',         label: 'Saíram',       barColor: 'bg-red-400'     },
    ];
    return items.map(item => {
      const count = l.filter(x => x.status === item.status).length;
      return { ...item, count, pct: Math.round((count / total) * 100) };
    });
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    forkJoin({
      leads:     this.leadService.getAll(),
      workflows: this.workflowService.getAll(),
    }).subscribe({
      next: ({ leads, workflows }) => {
        this.leads.set(leads);
        this.workflows.set(workflows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
