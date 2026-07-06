import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { AppointmentService } from '@core/services/appointment.service';
import { ToastService } from '@core/services/toast.service';
import { UserService } from '@core/services/user.service';
import {
  Appointment,
  AppointmentStatus,
  AvailabilityDayOfWeek,
  User,
  UserAvailability,
  UserAvailabilityRequest,
} from '@shared/models';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

type AgendaTab = 'appointments' | 'availability';

const DAY_OPTIONS: { value: AvailabilityDayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Segunda-feira' },
  { value: 'TUESDAY', label: 'Terça-feira' },
  { value: 'WEDNESDAY', label: 'Quarta-feira' },
  { value: 'THURSDAY', label: 'Quinta-feira' },
  { value: 'FRIDAY', label: 'Sexta-feira' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

const DAY_ORDER: AvailabilityDayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    ReactiveFormsModule,
    MatMenuModule,
    MatTableModule,
    SkeletonComponent,
  ],
  template: `
    <div class="space-y-5">
      <div class="page-header">
        <div>
          <h1>Agenda</h1>
          <p>Acompanhe agendamentos do WhatsApp e configure a disponibilidade dos corretores.</p>
        </div>
        <button (click)="refreshCurrentTab()" [disabled]="loadingCurrentTab()" class="btn-secondary">
          <span class="material-icons-round text-base" [class.animate-spin]="loadingCurrentTab()">refresh</span>
          Atualizar
        </button>
      </div>

      <div class="card p-2">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            (click)="activeTab.set('appointments')"
            class="agenda-tab-button"
            [ngClass]="activeTab() === 'appointments' ? 'agenda-tab-button-active' : 'agenda-tab-button-idle'"
          >
            <span class="material-icons-round text-base">event_note</span>
            Agendamentos
          </button>
          <button
            type="button"
            (click)="activeTab.set('availability')"
            class="agenda-tab-button"
            [ngClass]="activeTab() === 'availability' ? 'agenda-tab-button-active' : 'agenda-tab-button-idle'"
          >
            <span class="material-icons-round text-base">schedule</span>
            Disponibilidade
          </button>
        </div>
      </div>

      @if (activeTab() === 'appointments') {
        <section class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div class="card p-5">
              <p class="text-sm text-gray-500 dark:text-gray-400">Agendamentos Hoje</p>
              <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{{ summary().today }}</p>
            </div>
            <div class="card p-5">
              <p class="text-sm text-gray-500 dark:text-gray-400">Confirmados</p>
              <p class="mt-2 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">{{ summary().confirmed }}</p>
            </div>
            <div class="card p-5">
              <p class="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
              <p class="mt-2 text-3xl font-semibold text-amber-600 dark:text-amber-400">{{ summary().pending }}</p>
            </div>
            <div class="card p-5">
              <p class="text-sm text-gray-500 dark:text-gray-400">Cancelados</p>
              <p class="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">{{ summary().cancelled }}</p>
            </div>
          </div>

          <div class="card p-4">
            <form [formGroup]="appointmentFilters" class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <select formControlName="userId" class="agenda-input-field">
                <option value="">Todos os corretores</option>
                @for (broker of brokers(); track broker.id) {
                  <option [value]="broker.id">{{ broker.name }}</option>
                }
              </select>

              <input formControlName="date" type="date" class="agenda-input-field" />

              <select formControlName="status" class="agenda-input-field">
                <option value="">Todos os status</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="PENDING">Pendente</option>
                <option value="CANCELLED">Cancelado</option>
              </select>

              <button type="button" (click)="appointmentFilters.reset({ userId: '', date: '', status: '' })" class="btn-secondary justify-center">
                <span class="material-icons-round text-base">clear</span>
                Limpar
              </button>
            </form>
          </div>

          <div class="card overflow-hidden">
            @if (loadingAppointments()) {
              <div class="p-6"><app-skeleton [rows]="8" /></div>
            } @else {
              <div class="overflow-x-auto">
                <table mat-table [dataSource]="filteredAppointments()" class="w-full">
                  <ng-container matColumnDef="client">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head">Cliente</th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                          <span class="text-primary-600 dark:text-primary-300 font-semibold text-sm">
                            {{ clientLabel(appointment).charAt(0).toUpperCase() }}
                          </span>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ clientLabel(appointment) }}</p>
                          <p class="text-xs text-gray-400">{{ appointment.leadPhoneNumber }}</p>
                        </div>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="workflow">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head">Workflow</th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ appointment.workflowName || '-' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="broker">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head">Corretor</th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ appointment.userName || '-' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head">Data</th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ appointment.appointmentDate | date:'dd/MM/yyyy' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="time">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head">Horário</th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatTime(appointment.appointmentTime) }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head">Status</th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <span class="badge" [ngClass]="statusClass(appointment.status)">
                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="statusDotClass(appointment.status)"></span>
                        {{ statusLabel(appointment.status) }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="origin">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head">Origem</th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <span class="text-sm text-gray-700 dark:text-gray-300">WhatsApp</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="createdAt">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head">Criado em</th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <span class="text-sm text-gray-500">{{ appointment.createdAt | date:'dd/MM/yy HH:mm' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="agenda-table-head w-24"></th>
                    <td mat-cell *matCellDef="let appointment" class="agenda-table-cell">
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          (click)="openAppointmentDetails(appointment.id)"
                          class="agenda-icon-button"
                          title="Visualizar detalhes"
                        >
                          <span class="material-icons-round text-base">visibility</span>
                        </button>

                        <button
                          [matMenuTriggerFor]="appointmentMenu"
                          class="agenda-icon-button"
                          title="Mais ações"
                        >
                          <span class="material-icons-round text-base">more_vert</span>
                        </button>

                        <mat-menu #appointmentMenu="matMenu">
                          <button mat-menu-item (click)="openAppointmentDetails(appointment.id)">
                            <span class="material-icons-round text-base mr-2 text-primary-500">visibility</span>
                            Visualizar detalhes
                          </button>
                          <button
                            mat-menu-item
                            [disabled]="appointment.status === 'CANCELLED'"
                            (click)="openCancelDialog(appointment)"
                          >
                            <span class="material-icons-round text-base mr-2 text-red-500">event_busy</span>
                            Cancelar agendamento
                          </button>
                        </mat-menu>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="appointmentColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: appointmentColumns;" class="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"></tr>

                  <tr *matNoDataRow>
                    <td [colSpan]="appointmentColumns.length" class="py-16 text-center text-gray-400">
                      <span class="material-icons-round text-5xl block mb-2 opacity-30">event_busy</span>
                      Nenhum agendamento encontrado
                    </td>
                  </tr>
                </table>
              </div>
            }
          </div>
        </section>
      } @else {
        <section class="space-y-5">
          <div class="card p-4">
            <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,300px)_1fr] gap-3 items-end">
              <div>
                <label class="agenda-form-label">Corretor</label>
                <select [value]="selectedBrokerId() ?? ''" (change)="selectBroker($any($event.target).value)" class="agenda-input-field">
                  <option value="">Selecione um corretor</option>
                  @for (broker of brokers(); track broker.id) {
                    <option [value]="broker.id">{{ broker.name }}</option>
                  }
                </select>
              </div>

              <div class="flex flex-wrap gap-3">
                <button type="button" class="btn-primary" [disabled]="!selectedBrokerId()" (click)="openAvailabilityForm()">
                  <span class="material-icons-round text-base">add</span>
                  Adicionar disponibilidade
                </button>
                <button type="button" class="btn-secondary" [disabled]="!selectedBrokerId() || loadingAvailabilities()" (click)="reloadAvailabilities()">
                  <span class="material-icons-round text-base" [class.animate-spin]="loadingAvailabilities()">refresh</span>
                  Atualizar disponibilidade
                </button>
              </div>
            </div>
          </div>        

          <div class="card overflow-hidden">
            @if (!selectedBrokerId()) {
              <div class="py-16 text-center text-gray-400">
                <span class="material-icons-round text-5xl block mb-2 opacity-30">schedule</span>
                Selecione um corretor para visualizar a disponibilidade
              </div>
            } @else if (loadingAvailabilities()) {
              <div class="p-6"><app-skeleton [rows]="6" /></div>
            } @else {
              <div class="divide-y divide-gray-100 dark:divide-slate-700">
                @for (group of availabilityGroups(); track group.dayOfWeek) {
                  <div class="p-5">
                    <div class="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ group.label }}</h3>
                        <p class="text-xs text-gray-400">{{ group.items.length }} faixa(s) cadastrada(s)</p>
                      </div>
                    </div>

                    <div class="space-y-3">
                      @for (availability of group.items; track availability.id) {
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60">
                          <div>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">
                              {{ formatTime(availability.startTime) }} às {{ formatTime(availability.endTime) }}
                            </p>
                            <p class="text-xs text-gray-400 mt-1">
                              {{ availability.active ? 'Disponível para agendamento' : 'Faixa desativada' }}
                            </p>
                          </div>

                          <div class="flex items-center gap-2">
                            <span class="badge" [ngClass]="availability.active ? 'badge-active' : 'badge-paused'">
                              <span class="w-1.5 h-1.5 rounded-full" [ngClass]="availability.active ? 'bg-emerald-500' : 'bg-gray-500'"></span>
                              {{ availability.active ? 'Ativa' : 'Inativa' }}
                            </span>

                            <button type="button" (click)="openAvailabilityForm(availability)" class="agenda-icon-button" title="Editar disponibilidade">
                              <span class="material-icons-round text-base">edit</span>
                            </button>

                            <button
                              type="button"
                              (click)="toggleAvailability(availability)"
                              class="agenda-icon-button"
                              [title]="availability.active ? 'Desativar disponibilidade' : 'Ativar disponibilidade'"
                            >
                              <span class="material-icons-round text-base">{{ availability.active ? 'toggle_on' : 'toggle_off' }}</span>
                            </button>
                          </div>
                        </div>
                      } @empty {
                        <div class="p-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 text-sm text-gray-400">
                          Nenhuma faixa cadastrada para este dia.
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </section>
      }

      @if (showDetails()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-in">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">Detalhes do Agendamento</h2>
                <p class="text-xs text-gray-400">Criado automaticamente pelo fluxo do WhatsApp</p>
              </div>
              <button type="button" (click)="closeDetails()" class="agenda-icon-button">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <div class="p-6">
              @if (loadingDetails()) {
                <app-skeleton [rows]="5" />
              } @else if (selectedAppointment()) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="agenda-detail-card">
                    <p class="agenda-detail-label">Cliente</p>
                    <p class="agenda-detail-value">{{ clientLabel(selectedAppointment()!) }}</p>
                  </div>
                  <div class="agenda-detail-card">
                    <p class="agenda-detail-label">Telefone</p>
                    <p class="agenda-detail-value">{{ selectedAppointment()!.leadPhoneNumber }}</p>
                  </div>
                  <div class="agenda-detail-card">
                    <p class="agenda-detail-label">Workflow</p>
                    <p class="agenda-detail-value">{{ selectedAppointment()!.workflowName || '-' }}</p>
                  </div>
                  <div class="agenda-detail-card">
                    <p class="agenda-detail-label">Corretor</p>
                    <p class="agenda-detail-value">{{ selectedAppointment()!.userName || '-' }}</p>
                  </div>
                  <div class="agenda-detail-card">
                    <p class="agenda-detail-label">Data</p>
                    <p class="agenda-detail-value">{{ selectedAppointment()!.appointmentDate | date:'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="agenda-detail-card">
                    <p class="agenda-detail-label">Horário</p>
                    <p class="agenda-detail-value">{{ formatTime(selectedAppointment()!.appointmentTime) }}</p>
                  </div>
                  <div class="agenda-detail-card">
                    <p class="agenda-detail-label">Status</p>
                    <p class="agenda-detail-value">{{ statusLabel(selectedAppointment()!.status) }}</p>
                  </div>
                  <div class="agenda-detail-card">
                    <p class="agenda-detail-label">Origem</p>
                    <p class="agenda-detail-value">WhatsApp</p>
                  </div>
                  <div class="agenda-detail-card md:col-span-2">
                    <p class="agenda-detail-label">Criado em</p>
                    <p class="agenda-detail-value">{{ selectedAppointment()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                </div>
              } @else {
                <p class="text-sm text-gray-400">Detalhes indisponíveis no momento.</p>
              }
            </div>
          </div>
        </div>
      }

      @if (appointmentToCancel()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-in text-center">
            <div class="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="material-icons-round text-red-600 text-2xl">event_busy</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Cancelar agendamento?</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {{ clientLabel(appointmentToCancel()!) }} em {{ appointmentToCancel()!.appointmentDate | date:'dd/MM/yyyy' }}
              às {{ formatTime(appointmentToCancel()!.appointmentTime) }}.
            </p>
            <div class="flex gap-3">
              <button type="button" (click)="appointmentToCancel.set(null)" class="btn-secondary flex-1 justify-center">Voltar</button>
              <button type="button" (click)="cancelAppointment()" [disabled]="savingCancel()" class="btn-danger flex-1 justify-center">
                @if (savingCancel()) {
                  <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                }
                Cancelar
              </button>
            </div>
          </div>
        </div>
      }

      @if (showAvailabilityForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in overflow-y-auto">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg my-4 animate-slide-in">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ editingAvailability() ? 'Editar Disponibilidade' : 'Nova Disponibilidade' }}
                </h2>
                <p class="text-xs text-gray-400">
                  {{ selectedBrokerName() || 'Corretor selecionado' }}
                </p>
              </div>
              <button type="button" (click)="closeAvailabilityForm()" class="agenda-icon-button">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="availabilityForm" (ngSubmit)="saveAvailability()" class="p-6 space-y-4">
              <div>
                <label class="agenda-form-label">Dia da semana</label>
                <select formControlName="dayOfWeek" class="agenda-input-field">
                  @for (day of dayOptions; track day.value) {
                    <option [value]="day.value">{{ day.label }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="agenda-form-label">Hora inicial</label>
                  <input formControlName="startTime" type="time" class="agenda-input-field" />
                </div>
                <div>
                  <label class="agenda-form-label">Hora final</label>
                  <input formControlName="endTime" type="time" class="agenda-input-field" />
                </div>
              </div>

              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <div>
                  <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Faixa ativa</p>
                  <p class="text-xs text-gray-400">Disponível para o fluxo automático do WhatsApp</p>
                </div>
                <button
                  type="button"
                  (click)="toggleAvailabilityFormActive()"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                  [ngClass]="availabilityForm.get('active')!.value ? 'bg-primary-600' : 'bg-gray-300 dark:bg-slate-600'"
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                    [ngClass]="availabilityForm.get('active')!.value ? 'translate-x-6' : 'translate-x-1'"
                  ></span>
                </button>
              </div>

              @if (availabilityForm.invalid && availabilityForm.touched) {
                <p class="text-sm text-red-500">Preencha dia, hora inicial e hora final corretamente.</p>
              }

              <div class="flex gap-3 pt-2">
                <button type="button" (click)="closeAvailabilityForm()" class="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" [disabled]="savingAvailability()" class="btn-primary flex-1 justify-center">
                  @if (savingAvailability()) {
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  }
                  {{ editingAvailability() ? 'Salvar alterações' : 'Adicionar disponibilidade' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class AppointmentsPageComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  activeTab = signal<AgendaTab>('appointments');

  loadingAppointments = signal(true);
  loadingDetails = signal(false);
  loadingUsers = signal(true);
  savingCancel = signal(false);

  loadingAvailabilities = signal(false);
  savingAvailability = signal(false);

  appointments = signal<Appointment[]>([]);
  users = signal<User[]>([]);
  availabilities = signal<UserAvailability[]>([]);

  selectedAppointment = signal<Appointment | null>(null);
  showDetails = signal(false);
  appointmentToCancel = signal<Appointment | null>(null);

  selectedBrokerId = signal<number | null>(null);
  showAvailabilityForm = signal(false);
  editingAvailability = signal<UserAvailability | null>(null);

  appointmentColumns = ['client', 'workflow', 'broker', 'date', 'time', 'status', 'origin', 'createdAt', 'actions'];
  dayOptions = DAY_OPTIONS;

  appointmentFilters = this.fb.group({
    userId: [''],
    date: [''],
    status: [''],
  });

  availabilityForm = this.fb.group({
    dayOfWeek: ['MONDAY' as AvailabilityDayOfWeek, Validators.required],
    startTime: ['08:00', Validators.required],
    endTime: ['18:00', Validators.required],
    active: [true],
  });

  private appointmentFilterValues = toSignal(
    this.appointmentFilters.valueChanges.pipe(startWith(this.appointmentFilters.getRawValue())),
    { initialValue: this.appointmentFilters.getRawValue() }
  );

  brokers = computed(() =>
    this.users().filter(user =>
      user.active && ['ADMIN', 'CORRETOR', 'MASTER'].includes(user.role)
    )
  );

  filteredAppointments = computed(() => {
    const filters = this.appointmentFilterValues();

    return [...this.appointments()]
      .filter(appointment => {
        const matchBroker = !filters.userId || appointment.userId === Number(filters.userId);
        const matchDate = !filters.date || appointment.appointmentDate === filters.date;
        const matchStatus = !filters.status || appointment.status === filters.status;
        return matchBroker && matchDate && matchStatus;
      })
      .sort((a, b) => {
        const left = `${a.appointmentDate} ${a.appointmentTime}`;
        const right = `${b.appointmentDate} ${b.appointmentTime}`;
        return right.localeCompare(left);
      });
  });

  summary = computed(() => {
    const today = this.todayIso();
    const appointments = this.appointments();
    return {
      today: appointments.filter(item => item.appointmentDate === today && item.status !== 'CANCELLED').length,
      confirmed: appointments.filter(item => item.status === 'CONFIRMED').length,
      pending: appointments.filter(item => item.status === 'PENDING').length,
      cancelled: appointments.filter(item => item.status === 'CANCELLED').length,
    };
  });

  selectedBrokerName = computed(() =>
    this.brokers().find(user => user.id === this.selectedBrokerId())?.name ?? ''
  );

  availabilityGroups = computed(() =>
    DAY_ORDER.map(dayOfWeek => ({
      dayOfWeek,
      label: this.dayLabel(dayOfWeek),
      items: this.availabilities()
        .filter(item => item.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
  );

  ngOnInit(): void {
    this.loadAppointments();
    this.loadUsers();
  }

  loadingCurrentTab(): boolean {
    return this.activeTab() === 'appointments' ? this.loadingAppointments() : this.loadingAvailabilities();
  }

  refreshCurrentTab(): void {
    if (this.activeTab() === 'appointments') {
      this.loadAppointments(true);
      return;
    }

    this.reloadAvailabilities(true);
  }

  loadAppointments(showToast = false): void {
    this.loadingAppointments.set(true);
    this.appointmentService.getAll().subscribe({
      next: appointments => {
        this.appointments.set(appointments);
        this.loadingAppointments.set(false);
        if (showToast) {
          this.toast.success('Agendamentos atualizados com sucesso!');
        }
      },
      error: () => {
        this.loadingAppointments.set(false);
        this.toast.error('Erro ao carregar agendamentos.');
      },
    });
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.userService.getAll().subscribe({
      next: users => {
        this.users.set(users);
        this.loadingUsers.set(false);
      },
      error: () => {
        this.loadingUsers.set(false);
        this.toast.error('Erro ao carregar corretores.');
      },
    });
  }

  openAppointmentDetails(id: number): void {
    this.showDetails.set(true);
    this.loadingDetails.set(true);
    this.selectedAppointment.set(null);

    this.appointmentService.getById(id).subscribe({
      next: appointment => {
        this.selectedAppointment.set(appointment);
        this.loadingDetails.set(false);
      },
      error: () => {
        this.loadingDetails.set(false);
        this.toast.error('Erro ao carregar detalhes do agendamento.');
        this.closeDetails();
      },
    });
  }

  closeDetails(): void {
    this.showDetails.set(false);
    this.selectedAppointment.set(null);
  }

  openCancelDialog(appointment: Appointment): void {
    this.appointmentToCancel.set(appointment);
  }

  cancelAppointment(): void {
    const appointment = this.appointmentToCancel();
    if (!appointment) {
      return;
    }

    this.savingCancel.set(true);
    this.appointmentService.cancel(appointment.id).subscribe({
      next: updated => {
        this.appointments.update(items =>
          items.map(item => item.id === updated.id ? updated : item)
        );
        if (this.selectedAppointment()?.id === updated.id) {
          this.selectedAppointment.set(updated);
        }
        this.savingCancel.set(false);
        this.appointmentToCancel.set(null);
        this.toast.success('Agendamento cancelado com sucesso!');
      },
      error: () => {
        this.savingCancel.set(false);
        this.toast.error('Erro ao cancelar agendamento.');
      },
    });
  }

  selectBroker(value: string): void {
    const userId = value ? Number(value) : null;
    this.selectedBrokerId.set(userId);
    this.availabilities.set([]);

    if (userId) {
      this.loadAvailabilities(userId);
    }
  }

  reloadAvailabilities(showToast = false): void {
    const userId = this.selectedBrokerId();
    if (!userId) {
      return;
    }

    this.loadAvailabilities(userId, showToast);
  }

  loadAvailabilities(userId: number, showToast = false): void {
    this.loadingAvailabilities.set(true);
    this.appointmentService.getAvailabilities(userId).subscribe({
      next: availabilities => {
        this.availabilities.set(availabilities);
        this.loadingAvailabilities.set(false);
        if (showToast) {
          this.toast.success('Disponibilidades atualizadas com sucesso!');
        }
      },
      error: () => {
        this.loadingAvailabilities.set(false);
        this.toast.error('Erro ao carregar disponibilidades.');
      },
    });
  }

  openAvailabilityForm(availability?: UserAvailability): void {
    if (!this.selectedBrokerId()) {
      this.toast.warning('Selecione um corretor antes de cadastrar a disponibilidade.');
      return;
    }

    this.editingAvailability.set(availability ?? null);
    this.availabilityForm.reset({
      dayOfWeek: availability?.dayOfWeek ?? 'MONDAY',
      startTime: this.formatTime(availability?.startTime ?? '08:00'),
      endTime: this.formatTime(availability?.endTime ?? '18:00'),
      active: availability?.active ?? true,
    });
    this.showAvailabilityForm.set(true);
  }

  closeAvailabilityForm(): void {
    this.showAvailabilityForm.set(false);
    this.editingAvailability.set(null);
  }

  toggleAvailabilityFormActive(): void {
    const control = this.availabilityForm.get('active');
    control?.setValue(!control.value);
  }

  saveAvailability(): void {
    if (this.availabilityForm.invalid || !this.selectedBrokerId()) {
      this.availabilityForm.markAllAsTouched();
      return;
    }

    const payload = this.availabilityForm.getRawValue() as UserAvailabilityRequest;
    const wasEditing = !!this.editingAvailability();
    this.savingAvailability.set(true);

    const request$ = this.editingAvailability()
      ? this.appointmentService.updateAvailability(this.editingAvailability()!.id, payload)
      : this.appointmentService.createAvailability(this.selectedBrokerId()!, payload);

    request$.subscribe({
      next: availability => {
        this.savingAvailability.set(false);
        this.closeAvailabilityForm();
        this.upsertAvailability(availability);
        this.toast.success(wasEditing ? 'Disponibilidade atualizada!' : 'Disponibilidade adicionada!');
        this.reloadAvailabilities();
      },
      error: (error: any) => {
        this.savingAvailability.set(false);
        this.toast.error(error?.error?.message ?? 'Erro ao salvar disponibilidade.');
      },
    });
  }

  toggleAvailability(availability: UserAvailability): void {
    const payload: UserAvailabilityRequest = {
      dayOfWeek: availability.dayOfWeek,
      startTime: this.formatTime(availability.startTime),
      endTime: this.formatTime(availability.endTime),
      active: !availability.active,
    };

    this.appointmentService.updateAvailability(availability.id, payload).subscribe({
      next: updated => {
        this.upsertAvailability(updated);
        this.toast.success(updated.active ? 'Disponibilidade ativada!' : 'Disponibilidade desativada!');
      },
      error: (error: any) => {
        this.toast.error(error?.error?.message ?? 'Erro ao atualizar disponibilidade.');
      },
    });
  }

  upsertAvailability(availability: UserAvailability): void {
    this.availabilities.update(items => {
      const exists = items.some(item => item.id === availability.id);
      if (!exists) {
        return [...items, availability];
      }
      return items.map(item => item.id === availability.id ? availability : item);
    });
  }

  clientLabel(appointment: Appointment): string {
    return appointment.leadProfileName || appointment.leadPhoneNumber;
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      CONFIRMED: 'Confirmado',
      PENDING: 'Pendente',
      CANCELLED: 'Cancelado',
    };
    return map[status];
  }

  statusClass(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      CONFIRMED: 'badge-active',
      PENDING: 'badge-handoff',
      CANCELLED: 'badge-leave',
    };
    return map[status];
  }

  statusDotClass(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      CONFIRMED: 'bg-emerald-500',
      PENDING: 'bg-amber-500',
      CANCELLED: 'bg-red-500',
    };
    return map[status];
  }

  dayLabel(dayOfWeek: AvailabilityDayOfWeek): string {
    return DAY_OPTIONS.find(day => day.value === dayOfWeek)?.label ?? dayOfWeek;
  }

  formatTime(value: string): string {
    return value?.slice(0, 5) ?? '';
  }

  todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
