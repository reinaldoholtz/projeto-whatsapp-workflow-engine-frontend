import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AttendanceService } from '@core/services/attendance.service';
import { ToastService } from '@core/services/toast.service';
import { WebSocketService } from '@core/services/websocket.service';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import {
  AttendanceConversation,
  AttendanceConversationDetail,
  AttendanceConversationMessage,
  AttendanceConversationNote,
  AttendanceGroup,
} from '@shared/models';
import { ConversationComposerComponent, ConversationMessage } from './components/conversation-composer.component';

@Component({
  selector: 'app-attendance-page',
  standalone: true,
  imports: [DatePipe, NgClass, ReactiveFormsModule, SkeletonComponent, ConversationComposerComponent],
  template: `
    <div class="space-y-5">
      <div class="page-header">
        <div>
          <h1>Atendimento</h1>
          <p>Central de conversas com operadores, grupos e notas internas.</p>
        </div>
        <button (click)="refresh()" [disabled]="loading()" class="btn-secondary">
          <span class="material-icons-round text-base" [class.animate-spin]="loading()">refresh</span>
          Atualizar
        </button>
      </div>

      <div class="attendance-shell">
        <aside class="attendance-sidebar">
          <div class="attendance-sidebar-top">
            <div class="relative">
              <span class="material-icons-round attendance-search-icon">search</span>
              <input
                [formControl]="filterForm.controls.search"
                class="attendance-search"
                placeholder="Pesquisar contato ou numero"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <select [formControl]="filterForm.controls.status" class="attendance-select">
                <option value="">Todos status</option>
                <option value="UNREAD">Nao lidas</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="WAITING_CUSTOMER">Aguardando cliente</option>
                <option value="CLOSED">Encerradas</option>
              </select>

              <select [formControl]="filterForm.controls.groupId" class="attendance-select">
                <option value="">Todos grupos</option>
                @for (group of groups(); track group.id) {
                  <option [value]="group.id">{{ group.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="attendance-stats">
            <div class="attendance-stat-card">
              <span class="text-xs text-gray-500 dark:text-gray-400">Conversas</span>
              <strong>{{ conversations().length }}</strong>
            </div>
            <div class="attendance-stat-card">
              <span class="text-xs text-gray-500 dark:text-gray-400">Nao lidas</span>
              <strong>{{ unreadCount() }}</strong>
            </div>
          </div>

          <div class="attendance-list">
            @if (loading()) {
              <div class="p-4"><app-skeleton [rows]="7" /></div>
            } @else {
              @for (conversation of filteredConversations(); track conversation.id) {
                <button
                  type="button"
                  (click)="selectConversation(conversation.id)"
                  class="attendance-conversation"
                  [ngClass]="selectedConversationId() === conversation.id ? 'attendance-conversation-active' : ''"
                >
                  <div class="attendance-avatar">
                    {{ initial(conversation.contactDisplayName || conversation.contactPhoneNumber) }}
                  </div>
                  <div class="min-w-0 flex-1 text-left">
                    <div class="flex items-center justify-between gap-2">
                      <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {{ conversation.contactDisplayName || conversation.contactPhoneNumber }}
                      </p>
                      <span class="text-[11px] text-gray-400">
                        {{ conversation.lastInteractionAt | date:'HH:mm' }}
                      </span>
                    </div>
                    <p class="truncate text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ conversation.lastMessagePreview || 'Sem mensagens ainda' }}
                    </p>
                    <div class="flex items-center justify-between gap-2 mt-2">
                      <span class="attendance-status" [ngClass]="statusClass(conversation.status)">
                        {{ statusLabel(conversation.status) }}
                      </span>
                      @if (conversation.unreadCount > 0) {
                        <span class="attendance-unread">{{ conversation.unreadCount }}</span>
                      }
                    </div>
                  </div>
                </button>
              } @empty {
                <div class="attendance-empty">
                  <span class="material-icons-round text-4xl opacity-30">forum</span>
                  <p>Nenhuma conversa encontrada</p>
                </div>
              }
            }
          </div>
        </aside>

        <section class="attendance-main">
          @if (loadingDetail()) {
            <div class="p-6"><app-skeleton [rows]="9" /></div>
          } @else if (selectedConversation()) {
            <div class="attendance-main-header">
              <div class="flex items-center gap-3 min-w-0">
                <div class="attendance-avatar attendance-avatar-lg">
                  {{ initial(selectedConversation()!.conversation.contactDisplayName || selectedConversation()!.conversation.contactPhoneNumber) }}
                </div>
                <div class="min-w-0">
                  <h2 class="truncate text-base font-semibold text-gray-900 dark:text-white">
                    {{ selectedConversation()!.conversation.contactDisplayName || selectedConversation()!.conversation.contactPhoneNumber }}
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ selectedConversation()!.conversation.contactPhoneNumber }} \u00b7 {{ statusLabel(selectedConversation()!.conversation.status) }}
                  </p>
                </div>
              </div>              
            </div>

            <div class="attendance-main-body">
              <div class="attendance-timeline-wrapper">
                <div class="attendance-timeline">
                  @for (message of timelineMessages(); track message.id) {
                    <div
                      class="flex"
                      [ngClass]="message.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'"
                    >
                      <div [ngClass]="message.direction === 'OUTBOUND' ? 'chat-bubble-out' : 'chat-bubble-in'">
                        <p class="whitespace-pre-wrap break-words text-sm">
                          {{ message.text || fallbackMessageLabel(message) }}
                        </p>
                        <div class="mt-2 flex items-center justify-end gap-2 text-[11px] opacity-70">
                          <span>{{ message.createdAt | date:'dd/MM HH:mm' }}</span>
                          @if (message.direction === 'OUTBOUND') {
                            <span class="material-icons-round text-[14px]" [ngClass]="deliveryIconClass(message.status)">
                              {{ deliveryIcon(message.status) }}
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <div class="attendance-empty h-full">
                      <span class="material-icons-round text-4xl opacity-30">chat_bubble_outline</span>
                      <p>Sem mensagens nesta conversa</p>
                    </div>
                  }
                </div>

                <app-conversation-composer
                  [conversationId]="selectedConversationId()"
                  (messageSent)="onMessageSent($event)"
                />
              </div>

              <aside class="attendance-sidepanel">
                <div class="card p-4">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Resumo</h3>
                  <dl class="mt-3 space-y-3">
                    <div>
                      <dt class="text-[11px] uppercase tracking-wider text-gray-400">Canal</dt>
                      <dd class="text-sm text-gray-700 dark:text-gray-300">{{ selectedConversation()!.conversation.channel }}</dd>
                    </div>
                    <div>
                      <dt class="text-[11px] uppercase tracking-wider text-gray-400">Provider</dt>
                      <dd class="text-sm text-gray-700 dark:text-gray-300">{{ selectedConversation()!.conversation.provider }}</dd>
                    </div>
                    <div>
                      <dt class="text-[11px] uppercase tracking-wider text-gray-400">Ultima interacao</dt>
                      <dd class="text-sm text-gray-700 dark:text-gray-300">{{ selectedConversation()!.conversation.lastInteractionAt | date:'dd/MM/yyyy HH:mm' }}</dd>
                    </div>
                  </dl>
                </div>

                <div class="card p-4">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notas internas</h3>
                    <span class="text-xs text-gray-400">{{ selectedConversation()!.notes.length }}</span>
                  </div>

                  <div class="attendance-notes">
                    @for (note of selectedConversation()!.notes; track note.id) {
                      <div class="attendance-note">
                        <p class="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{{ note.content }}</p>
                        <span class="text-[11px] text-gray-400">{{ note.createdAt | date:'dd/MM HH:mm' }}</span>
                      </div>
                    } @empty {
                      <p class="text-sm text-gray-400">Nenhuma nota interna ainda.</p>
                    }
                  </div>

                  <form [formGroup]="noteForm" (ngSubmit)="addNote()" class="mt-4 space-y-3">
                    <textarea
                      formControlName="content"
                      rows="4"
                      class="attendance-textarea"
                      placeholder="Registrar observacao interna"
                    ></textarea>
                    <button type="submit" [disabled]="savingNote()" class="btn-primary w-full justify-center">
                      @if (savingNote()) {
                        <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      }
                      Adicionar nota
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          } @else {
            <div class="attendance-empty h-full min-h-[540px]">
              <span class="material-icons-round text-5xl opacity-30">mark_chat_read</span>
              <p>Selecione uma conversa para ver o atendimento</p>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .attendance-shell {
      @apply grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5 min-h-[720px];
    }

    .attendance-sidebar {
      @apply overflow-hidden flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700;
      background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 34%),
        linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.96));
    }

    :host-context(.dark) .attendance-sidebar {
      background:
        radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 38%),
        linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.96));
    }

    .attendance-sidebar-top {
      @apply p-4 border-b border-gray-100 dark:border-slate-700 space-y-3;
    }

    .attendance-search {
      @apply w-full rounded-2xl border border-gray-200 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90
             pl-10 pr-4 py-3 text-sm text-gray-800 dark:text-gray-100
             focus:outline-none focus:ring-2 focus:ring-primary-500/30;
    }

    .attendance-search-icon {
      @apply absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px];
    }

    .attendance-select {
      @apply w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800
             px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30;
    }

    .attendance-stats {
      @apply grid grid-cols-2 gap-3 p-4 border-b border-gray-100 dark:border-slate-700;
    }

    .attendance-stat-card {
      @apply rounded-2xl border border-white/70 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3 flex flex-col;
    }

    .attendance-stat-card strong {
      @apply mt-1 text-xl font-semibold text-gray-900 dark:text-white;
    }

    .attendance-list {
      @apply flex-1 overflow-y-auto p-3 space-y-2;
    }

    .attendance-conversation {
      @apply w-full flex items-start gap-3 rounded-2xl p-3 border border-transparent
             hover:border-primary-200 dark:hover:border-primary-900/40
             hover:bg-white/80 dark:hover:bg-slate-800/90 transition-colors;
    }

    .attendance-conversation-active {
      @apply border-primary-200 dark:border-primary-800/50 bg-white dark:bg-slate-800 shadow-sm;
    }

    .attendance-avatar {
      @apply w-11 h-11 rounded-2xl bg-primary-600 text-white text-sm font-semibold flex items-center justify-center flex-shrink-0;
    }

    .attendance-avatar-lg {
      @apply w-12 h-12 text-base;
    }

    .attendance-unread {
      @apply inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full bg-primary-600 px-1.5
             text-[11px] font-semibold text-white;
    }

    .attendance-status {
      @apply inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium;
    }

    .attendance-status-unread {
      @apply bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300;
    }

    .attendance-status-progress {
      @apply bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300;
    }

    .attendance-status-waiting {
      @apply bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300;
    }

    .attendance-status-closed {
      @apply bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300;
    }

    .attendance-main {
      @apply overflow-hidden flex flex-col min-h-[720px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700;
    }

    .attendance-main-header {
      @apply flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 dark:border-slate-700;
    }

    .attendance-main-body {
      @apply grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] flex-1 min-h-0;
    }

    .attendance-timeline-wrapper {
      @apply flex flex-col min-h-0 flex-1;
    }

    .attendance-timeline {
      @apply p-5 space-y-4 overflow-y-auto flex-1 min-h-[400px];
      background-image:
        radial-gradient(rgba(148, 163, 184, 0.12) 0.8px, transparent 0.8px);
      background-size: 18px 18px;
    }

    :host-context(.dark) .attendance-timeline {
      background-image:
        radial-gradient(rgba(148, 163, 184, 0.08) 0.8px, transparent 0.8px);
    }

    .attendance-sidepanel {
      @apply border-t 2xl:border-t-0 2xl:border-l border-gray-100 dark:border-slate-700 p-4 space-y-4 bg-white/70 dark:bg-slate-900/30;
    }

    .attendance-notes {
      @apply mt-3 space-y-3 max-h-72 overflow-y-auto pr-1;
    }

    .attendance-note {
      @apply rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 p-3 space-y-2;
    }

    .attendance-textarea {
      @apply w-full rounded-2xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800
             px-4 py-3 text-sm text-gray-800 dark:text-gray-100 resize-none
             focus:outline-none focus:ring-2 focus:ring-primary-500/30;
    }

    .attendance-empty {
      @apply flex flex-col items-center justify-center gap-3 text-sm text-gray-400 p-8;
    }

    .chat-bubble-out {
      @apply rounded-2xl rounded-br-sm bg-primary-600 text-white px-4 py-3 max-w-[70%];
    }

    .chat-bubble-in {
      @apply rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 px-4 py-3 max-w-[70%];
    }
  `]
})
export class AttendancePageComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private toast = inject(ToastService);
  private ws = inject(WebSocketService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  loadingDetail = signal(false);
  savingNote = signal(false);

  groups = signal<AttendanceGroup[]>([]);
  conversations = signal<AttendanceConversation[]>([]);
  selectedConversationId = signal<number | null>(null);
  selectedConversation = signal<AttendanceConversationDetail | null>(null);

  filterForm = this.fb.group({
    search: [''],
    status: [''],
    groupId: [''],
  });

  noteForm = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(4000)]],
  });

  filteredConversations = computed(() => {
    const { search, status, groupId } = this.filterForm.getRawValue();
    const text = (search ?? '').trim().toLowerCase();

    return this.conversations().filter(conversation => {
      const matchesSearch = !text
        || (conversation.contactDisplayName?.toLowerCase().includes(text) ?? false)
        || conversation.contactPhoneNumber.toLowerCase().includes(text)
        || (conversation.lastMessagePreview?.toLowerCase().includes(text) ?? false);

      const matchesStatus = !status || conversation.status === status;
      const matchesGroup = !groupId || conversation.assignedGroupId === Number(groupId);

      return matchesSearch && matchesStatus && matchesGroup;
    });
  });

  unreadCount = computed(() =>
    this.conversations().reduce((acc, conversation) => acc + conversation.unreadCount, 0)
  );

  timelineMessages = computed(() => {
    const detail = this.selectedConversation();
    return detail?.messages ?? [];
  });

  ngOnInit(): void {
    this.loadData();
    // this.ws.connect();
  }

  refresh(): void {
    this.loadData(true);
  }

  selectConversation(id: number): void {
    if (this.selectedConversationId() === id && this.selectedConversation()) {
      return;
    }

    this.selectedConversationId.set(id);
    this.loadingDetail.set(true);
    this.attendanceService.getConversation(id).subscribe({
      next: detail => {
        this.selectedConversation.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => {
        this.loadingDetail.set(false);
        this.toast.error('Erro ao carregar detalhes da conversa.');
      },
    });
  }

  onMessageSent(message: ConversationMessage): void {
    this.selectedConversation.update(detail => {
      if (!detail) return detail;
      return {
        ...detail,
        messages: [...detail.messages, message as AttendanceConversationMessage]
      };
    });
  }

  closeConversation(): void {
    const id = this.selectedConversationId();
    if (!id) return;

    this.attendanceService.closeConversation(id).subscribe({
      next: () => {
        this.toast.success('Atendimento encerrado.');
        this.refresh();
      },
      error: () => this.toast.error('Erro ao encerrar atendimento.')
    });
  }

  addNote(): void {
    const conversationId = this.selectedConversationId();
    if (!conversationId || this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    this.savingNote.set(true);
    this.attendanceService.addNote(conversationId, {
      content: this.noteForm.getRawValue().content!.trim(),
    }).subscribe({
      next: note => {
        this.selectedConversation.update(detail =>
          detail ? { ...detail, notes: [note, ...detail.notes] } : detail
        );
        this.noteForm.reset({ content: '' });
        this.savingNote.set(false);
        this.toast.success('Nota interna adicionada!');
      },
      error: () => {
        this.savingNote.set(false);
        this.toast.error('Erro ao adicionar nota interna.');
      },
    });
  }

  initial(value: string): string {
    return (value?.trim().charAt(0) || '?').toUpperCase();
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      NEW: 'Nova',
      UNREAD: 'Nao lida',
      IN_PROGRESS: 'Em andamento',
      WAITING_CUSTOMER: 'Aguardando cliente',
      SCHEDULED: 'Agendada',
      CLOSED: 'Encerrada',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      NEW: 'attendance-status-unread',
      UNREAD: 'attendance-status-unread',
      IN_PROGRESS: 'attendance-status-progress',
      WAITING_CUSTOMER: 'attendance-status-waiting',
      SCHEDULED: 'attendance-status-waiting',
      CLOSED: 'attendance-status-closed',
    };
    return map[status] ?? 'attendance-status-closed';
  }

  fallbackMessageLabel(message: AttendanceConversationMessage): string {
    const map: Record<string, string> = {
      IMAGE: '[Imagem]',
      DOCUMENT: '[Documento]',
      AUDIO: '[Audio]',
      VIDEO: '[Video]',
      TEMPLATE: '[Template]',
      SYSTEM_EVENT: '[Evento do sistema]',
      NOTE: '[Nota interna]',
    };
    return map[message.type] ?? '[Mensagem]';
  }

  deliveryIcon(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'schedule',
      SENDING: 'schedule',
      SENT: 'check',
      DELIVERED: 'done_all',
      READ: 'done_all',
      FAILED: 'error_outline',
    };
    return map[status] ?? 'check';
  }

  deliveryIconClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'text-gray-400',
      SENDING: 'text-gray-400',
      SENT: 'text-gray-400',
      DELIVERED: 'text-blue-400',
      READ: 'text-blue-500',
      FAILED: 'text-red-400',
    };
    return map[status] ?? 'text-gray-400';
  }

  private loadData(showToast = false): void {
    this.loading.set(true);

    this.attendanceService.getGroups().subscribe({      
      next: groups => this.groups.set(groups),
      error: () => this.toast.error('Erro ao carregar grupos de atendimento.'),
    });

    this.attendanceService.getConversations().subscribe({
      next: conversations => {
        this.conversations.set(conversations);
        this.loading.set(false);

        const selectedId = this.selectedConversationId();
        const firstId = selectedId && conversations.some(item => item.id === selectedId)
          ? selectedId
          : conversations[0]?.id ?? null;

        if (firstId) {
          this.selectConversation(firstId);
        } else {
          this.selectedConversationId.set(null);
          this.selectedConversation.set(null);
        }

        if (showToast) {
          this.toast.success('Central de atendimento atualizada!');
        }
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Erro ao carregar conversas de atendimento.');
      },
    });
  }
}
