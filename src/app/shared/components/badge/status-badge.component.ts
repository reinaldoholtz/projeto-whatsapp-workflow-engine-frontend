import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { LeadStatus } from '@shared/models';

const STATUS_CONFIG: Record<LeadStatus, { label: string; css: string; dot: string }> = {
  ACTIVE:       { label: 'Ativo',       css: 'badge-active',    dot: 'bg-emerald-500' },
  COMPLETED:    { label: 'Concluído',   css: 'badge-completed', dot: 'bg-blue-500'    },
  HUMAN_HANDOFF:{ label: 'Especialista',css: 'badge-handoff',   dot: 'bg-amber-500'   },
  PAUSED:       { label: 'Pausado',     css: 'badge-paused',    dot: 'bg-gray-400'    },
  LEAVE:        { label: 'Saiu',        css: 'badge-leave',     dot: 'bg-red-500'     },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="config().css">
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="config().dot"></span>
      {{ config().label }}
    </span>
  `
})
export class StatusBadgeComponent {
  status = input.required<LeadStatus>();
  config = () => STATUS_CONFIG[this.status()] ?? { label: this.status(), css: '', dot: 'bg-gray-400' };
}
