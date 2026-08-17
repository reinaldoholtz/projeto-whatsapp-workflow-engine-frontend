import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AttendanceMenuService } from '@core/services/attendance-menu.service';
import { ChannelAccountService } from '@core/services/channel-account.service';
import { ToastService } from '@core/services/toast.service';
import {
  AttendanceMenu,
  MenuOption,
  ChannelAccount,
  MenuActionType,
  CreateAttendanceMenuRequest,
  CreateMenuOptionRequest,
} from '@shared/models';

@Component({
  selector: 'app-attendance-menus-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white">Menus de Atendimento</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Configure menus interativos do WhatsApp por conta de canal
          </p>
        </div>
        <button
          (click)="openCreateMenuModal()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
        >
          <span class="material-icons-round text-base">add</span>
          Novo Menu
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (menu of menus(); track menu.id) {
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <h3 class="font-semibold text-slate-800 dark:text-white text-lg truncate">{{ menu.name }}</h3>
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  [ngClass]="menu.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
                >
                  {{ menu.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Conta de Canal ID: <span class="font-mono">{{ menu.channelAccountId }}</span>
              </p>

              <div class="mt-4 space-y-2">
                <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Opções ({{ menu.options.length }})</p>
                <div class="space-y-1 max-h-36 overflow-y-auto pr-1">
                  @for (opt of menu.options; track opt.id) {
                    <div class="flex items-center justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/50">
                      <span class="truncate font-medium text-slate-700 dark:text-slate-300">{{ opt.position }}. {{ opt.label }}</span>
                      <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold"
                        [ngClass]="{
                          'bg-blue-100 text-blue-800': opt.actionType === 'QUEUE',
                          'bg-purple-100 text-purple-800': opt.actionType === 'APPOINTMENT',
                          'bg-amber-100 text-amber-800': opt.actionType === 'HUMAN',
                          'bg-indigo-100 text-indigo-800': opt.actionType === 'SUBMENU',
                          'bg-teal-100 text-teal-800': opt.actionType === 'MESSAGE'
                        }">
                        {{ opt.actionType }}
                      </span>
                    </div>
                  }
                  @if (menu.options.length === 0) {
                    <p class="text-xs text-slate-400 italic">Nenhuma opção cadastrada</p>
                  }
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                (click)="openPreviewModal(menu)"
                class="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600"
              >
                <span class="material-icons-round text-sm">visibility</span> Preview
              </button>
              <div class="flex items-center gap-1">
                <button
                  (click)="openEditMenuModal(menu)"
                  class="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Editar Menu & Opções"
                >
                  <span class="material-icons-round text-base">edit</span>
                </button>
                <button
                  (click)="deleteMenu(menu)"
                  class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Excluir Menu"
                >
                  <span class="material-icons-round text-base">delete</span>
                </button>
              </div>
            </div>
          </div>
        }
        @if (menus().length === 0) {
          <div class="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
            <span class="material-icons-round text-4xl text-slate-400 mb-2">menu_open</span>
            <p class="text-slate-600 dark:text-slate-300 font-medium">Nenhum menu de atendimento encontrado</p>
            <p class="text-xs text-slate-400 mt-1">Clique em "Novo Menu" para configurar um menu para uma conta de canal.</p>
          </div>
        }
      </div>

      @if (showMenuModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-6 shadow-xl my-8">
            <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 class="text-lg font-bold text-slate-800 dark:text-white">
                {{ selectedMenu() ? 'Editar Menu: ' + selectedMenu()?.name : 'Novo Menu de Atendimento' }}
              </h2>
              <button (click)="closeMenuModal()" class="text-slate-400 hover:text-slate-600">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="menuForm" (ngSubmit)="saveMenu()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome do Menu</label>
                <input
                  type="text"
                  formControlName="name"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Menu Principal de Vendas"
                />
              </div>

              @if (!selectedMenu()) {
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Conta de Canal</label>
                  <select
                    formControlName="channelAccountId"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option [value]="null">Selecione uma conta...</option>
                    @for (acc of channelAccounts(); track acc.id) {
                      <option [value]="acc.id">{{ acc.accountName }} (ID: {{ acc.id }} - {{ acc.channel }})</option>
                    }
                  </select>
                </div>
              }

              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  formControlName="active"
                  class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label for="activeCheck" class="text-xs font-medium text-slate-700 dark:text-slate-300">Menu Ativo</label>
              </div>

              @if (selectedMenu()) {
                <div class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold text-sm text-slate-800 dark:text-white">Opções do Menu</h4>
                    <button
                      type="button"
                      (click)="openAddOptionModal()"
                      class="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium rounded transition-colors"
                    >
                      <span class="material-icons-round text-sm">add</span> Adicionar Opção
                    </button>
                  </div>

                  <div class="space-y-2">
                    @for (option of selectedMenu()?.options || []; track option.id; let idx = $index) {
                      <div class="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                        <div class="flex items-center gap-3">
                          <span class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                            {{ option.position }}
                          </span>
                          <div>
                            <p class="text-xs font-semibold text-slate-800 dark:text-white">{{ option.label }}</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">Tipo: <span class="font-mono uppercase">{{ option.actionType }}</span></p>
                          </div>
                        </div>
                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            (click)="moveOptionUp(idx)"
                            [disabled]="idx === 0"
                            class="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <span class="material-icons-round text-sm">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            (click)="moveOptionDown(idx)"
                            [disabled]="idx === (selectedMenu()?.options?.length || 0) - 1"
                            class="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            <span class="material-icons-round text-sm">arrow_downward</span>
                          </button>
                          <button
                            type="button"
                            (click)="openEditOptionModal(option)"
                            class="p-1 text-slate-500 hover:text-primary-600"
                          >
                            <span class="material-icons-round text-sm">edit</span>
                          </button>
                          <button
                            type="button"
                            (click)="deleteOption(option)"
                            class="p-1 text-slate-500 hover:text-red-600"
                          >
                            <span class="material-icons-round text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <div class="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  (click)="closeMenuModal()"
                  class="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="menuForm.invalid"
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showOptionModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 class="font-bold text-slate-800 dark:text-white">
                {{ editingOption() ? 'Editar Opção' : 'Nova Opção de Menu' }}
              </h3>
              <button (click)="closeOptionModal()" class="text-slate-400 hover:text-slate-600">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <form [formGroup]="optionForm" (ngSubmit)="saveOption()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Rótulo / Texto da Opção</label>
                <input
                  type="text"
                  formControlName="label"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg text-xs"
                  placeholder="Ex: Comprar imóvel"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo de Ação (actionType)</label>
                <select
                  formControlName="actionType"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg text-xs"
                >
                  <option value="QUEUE">QUEUE (Fila de Atendimento)</option>
                  <option value="APPOINTMENT">APPOINTMENT (Agendamento)</option>
                  <option value="HUMAN">HUMAN (Atendente Humano)</option>
                  <option value="SUBMENU">SUBMENU (Submenu)</option>
                  <option value="MESSAGE">MESSAGE (Mensagem Fixa)</option>
                </select>
              </div>

              @if (optionForm.get('actionType')?.value === 'QUEUE') {
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Fila Alvo (Queue ID)</label>
                  <input
                    type="number"
                    formControlName="queueId"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg text-xs"
                    placeholder="ID da fila de atendimento"
                  />
                </div>
              }

              @if (optionForm.get('actionType')?.value === 'APPOINTMENT') {
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo de Agendamento (Appointment Type ID)</label>
                  <input
                    type="number"
                    formControlName="appointmentTypeId"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg text-xs"
                    placeholder="ID opcional do tipo de agendamento"
                  />
                </div>
              }

              @if (optionForm.get('actionType')?.value === 'SUBMENU') {
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Submenu Alvo</label>
                  <select
                    formControlName="targetMenuId"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg text-xs"
                  >
                    <option [value]="null">Selecione o submenu...</option>
                    @for (m of menus(); track m.id) {
                      <option [value]="m.id">{{ m.name }} (ID: {{ m.id }})</option>
                    }
                  </select>
                </div>
              }

              @if (optionForm.get('actionType')?.value === 'MESSAGE') {
                <div>
                  <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Mensagem a enviar</label>
                  <textarea
                    formControlName="message"
                    rows="3"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg text-xs"
                    placeholder="Digite a mensagem pré-definida que será enviada ao cliente..."
                  ></textarea>
                </div>
              }

              <div class="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="enabledCheck"
                  formControlName="enabled"
                  class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label for="enabledCheck" class="text-xs font-medium text-slate-700 dark:text-slate-300">Opção Habilitada</label>
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  (click)="closeOptionModal()"
                  class="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="optionForm.invalid"
                  class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium disabled:opacity-50"
                >
                  Salvar Opção
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showPreviewModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 class="font-bold text-slate-800 dark:text-white text-sm">Visualização do Menu (WhatsApp)</h3>
              <button (click)="closePreviewModal()" class="text-slate-400 hover:text-slate-600">
                <span class="material-icons-round">close</span>
              </button>
            </div>

            <div class="bg-emerald-50 dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-slate-700 font-sans text-xs space-y-2 text-slate-800 dark:text-slate-200 shadow-inner">
              <p class="font-bold">*{{ previewMenu()?.name }}*</p>
              <div class="space-y-1">
                @for (opt of previewMenu()?.options || []; track opt.id) {
                  @if (opt.enabled !== false) {
                    <p>{{ opt.position }}. {{ opt.label }}</p>
                  }
                }
              </div>
              <p class="text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700 italic">
                ➡️ Responda apenas com o número da opção desejada.
              </p>
            </div>

            <div class="flex justify-end">
              <button
                (click)="closePreviewModal()"
                class="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-xs font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AttendanceMenusPageComponent implements OnInit {
  private menuService = inject(AttendanceMenuService);
  private channelAccountService = inject(ChannelAccountService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  menus = signal<AttendanceMenu[]>([]);
  channelAccounts = signal<ChannelAccount[]>([]);

  showMenuModal = signal(false);
  selectedMenu = signal<AttendanceMenu | null>(null);

  showOptionModal = signal(false);
  editingOption = signal<MenuOption | null>(null);

  showPreviewModal = signal(false);
  previewMenu = signal<AttendanceMenu | null>(null);

  menuForm = this.fb.group({
    name: ['', [Validators.required]],
    channelAccountId: [null as number | null, [Validators.required]],
    active: [true],
  });

  optionForm = this.fb.group({
    label: ['', [Validators.required]],
    actionType: ['QUEUE' as MenuActionType, [Validators.required]],
    queueId: [null as number | null],
    appointmentTypeId: [null as number | null],
    targetMenuId: [null as number | null],
    message: [''],
    enabled: [true],
  });

  ngOnInit(): void {
    this.loadMenus();
    this.loadChannelAccounts();
  }

  loadMenus(): void {
    this.menuService.listMenus().subscribe({
      next: (res: AttendanceMenu[]) => this.menus.set(res),
      error: () => this.toast.error('Erro ao carregar menus de atendimento'),
    });
  }

  loadChannelAccounts(): void {
    this.channelAccountService.getAllActive().subscribe({
      next: (res: ChannelAccount[]) => this.channelAccounts.set(res),
      error: () => this.toast.error('Erro ao carregar contas de canais'),
    });
  }

  openCreateMenuModal(): void {
    this.selectedMenu.set(null);
    this.menuForm.reset({ active: true, name: '', channelAccountId: null });
    this.showMenuModal.set(true);
  }

  openEditMenuModal(menu: AttendanceMenu): void {
    this.selectedMenu.set(menu);
    this.menuForm.patchValue({
      name: menu.name,
      channelAccountId: menu.channelAccountId,
      active: menu.active,
    });
    this.showMenuModal.set(true);
  }

  closeMenuModal(): void {
    this.showMenuModal.set(false);
    this.selectedMenu.set(null);
  }

  saveMenu(): void {
    if (this.menuForm.invalid) return;

    const val = this.menuForm.value;
    const current = this.selectedMenu();

    if (current) {
      this.menuService.updateMenu(current.id, { name: val.name!, active: val.active ?? true }).subscribe({
        next: () => {
          this.toast.success('Menu atualizado com sucesso');
          this.loadMenus();
          this.closeMenuModal();
        },
        error: (err: { error?: { message?: string } }) => this.toast.error(err.error?.message || 'Erro ao atualizar menu'),
      });
    } else {
      const payload: CreateAttendanceMenuRequest = {
        channelAccountId: Number(val.channelAccountId),
        name: val.name!,
        active: val.active ?? true,
      };
      this.menuService.createMenu(payload).subscribe({
        next: () => {
          this.toast.success('Menu criado com sucesso');
          this.loadMenus();
          this.closeMenuModal();
        },
        error: (err: { error?: { message?: string } }) => this.toast.error(err.error?.message || 'Erro ao criar menu'),
      });
    }
  }

  deleteMenu(menu: AttendanceMenu): void {
    if (!confirm(`Deseja realmente remover o menu "${menu.name}"?`)) return;

    this.menuService.deleteMenu(menu.id).subscribe({
      next: () => {
        this.toast.success('Menu excluído');
        this.loadMenus();
      },
      error: () => this.toast.error('Erro ao excluir menu'),
    });
  }

  openAddOptionModal(): void {
    this.editingOption.set(null);
    this.optionForm.reset({ actionType: 'QUEUE', enabled: true, label: '' });
    this.showOptionModal.set(true);
  }

  openEditOptionModal(option: MenuOption): void {
    this.editingOption.set(option);
    this.optionForm.patchValue({
      label: option.label,
      actionType: option.actionType,
      queueId: option.queueId,
      appointmentTypeId: option.appointmentTypeId,
      targetMenuId: option.targetMenuId,
      message: option.message,
      enabled: option.enabled ?? true,
    });
    this.showOptionModal.set(true);
  }

  closeOptionModal(): void {
    this.showOptionModal.set(false);
    this.editingOption.set(null);
  }

  saveOption(): void {
    if (this.optionForm.invalid || !this.selectedMenu()) return;

    const menuId = this.selectedMenu()!.id;
    const val = this.optionForm.value;
    const optPayload: CreateMenuOptionRequest = {
      label: val.label!,
      actionType: val.actionType!,
      queueId: val.queueId ? Number(val.queueId) : null,
      appointmentTypeId: val.appointmentTypeId ? Number(val.appointmentTypeId) : null,
      targetMenuId: val.targetMenuId ? Number(val.targetMenuId) : null,
      message: val.message,
      enabled: val.enabled ?? true,
    };

    const opt = this.editingOption();
    if (opt && opt.id) {
      this.menuService.updateOption(menuId, opt.id, optPayload).subscribe({
        next: () => {
          this.toast.success('Opção atualizada');
          this.refreshSelectedMenu(menuId);
          this.closeOptionModal();
        },
        error: () => this.toast.error('Erro ao atualizar opção'),
      });
    } else {
      this.menuService.addOption(menuId, optPayload).subscribe({
        next: () => {
          this.toast.success('Opção adicionada');
          this.refreshSelectedMenu(menuId);
          this.closeOptionModal();
        },
        error: () => this.toast.error('Erro ao adicionar opção'),
      });
    }
  }

  deleteOption(option: MenuOption): void {
    if (!this.selectedMenu() || !option.id) return;
    const menuId = this.selectedMenu()!.id;

    this.menuService.deleteOption(menuId, option.id).subscribe({
      next: () => {
        this.toast.success('Opção removida');
        this.refreshSelectedMenu(menuId);
      },
      error: () => this.toast.error('Erro ao remover opção'),
    });
  }

  moveOptionUp(index: number): void {
    const menu = this.selectedMenu();
    if (!menu || index <= 0) return;

    const ids = menu.options.map(o => o.id!);
    const temp = ids[index];
    ids[index] = ids[index - 1];
    ids[index - 1] = temp;

    this.menuService.reorderOptions(menu.id, ids).subscribe({
      next: (res: AttendanceMenu) => {
        this.selectedMenu.set(res);
        this.loadMenus();
      },
    });
  }

  moveOptionDown(index: number): void {
    const menu = this.selectedMenu();
    if (!menu || index >= menu.options.length - 1) return;

    const ids = menu.options.map(o => o.id!);
    const temp = ids[index];
    ids[index] = ids[index + 1];
    ids[index + 1] = temp;

    this.menuService.reorderOptions(menu.id, ids).subscribe({
      next: (res: AttendanceMenu) => {
        this.selectedMenu.set(res);
        this.loadMenus();
      },
    });
  }

  refreshSelectedMenu(menuId: number): void {
    this.menuService.getMenu(menuId).subscribe({
      next: (res: AttendanceMenu) => {
        this.selectedMenu.set(res);
        this.loadMenus();
      },
    });
  }

  openPreviewModal(menu: AttendanceMenu): void {
    this.previewMenu.set(menu);
    this.showPreviewModal.set(true);
  }

  closePreviewModal(): void {
    this.showPreviewModal.set(false);
    this.previewMenu.set(null);
  }
}
