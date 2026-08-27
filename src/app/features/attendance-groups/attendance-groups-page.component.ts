import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AttendanceAdminService } from '@core/services/attendance-admin.service';
import { UserService } from '@core/services/user.service';
import { ToastService } from '@core/services/toast.service';

import {
  AttendanceGroup,
  AttendanceGroupMember,
  User,
} from '@shared/models';

@Component({
  selector: 'app-attendance-groups-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="p-6 space-y-6">

      <!-- Título -->
      <div>
        <h1 class="text-2xl font-bold">
          Grupos de Atendimento
        </h1>

        <p class="text-sm text-slate-500">
          Defina as áreas e os usuários com acesso às conversas.
        </p>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">

        <!-- ========================= -->
        <!-- GRUPOS -->
        <!-- ========================= -->
        <section class="lg:col-span-2 space-y-4">

          <!-- Formulário -->
          <form
            [formGroup]="form"
            (ngSubmit)="save()"
            class="grid md:grid-cols-3 gap-3 p-4 rounded-xl border bg-white dark:bg-slate-900"
          >

            <input
              formControlName="name"
              placeholder="Nome do grupo"
              class="input"
            />

            <input
              formControlName="description"
              placeholder="Descrição"
              class="input"
            />

            <label class="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                formControlName="active"
              />

              Ativo
            </label>

            <button
              type="submit"
              class="btn-primary md:col-span-3"
              [disabled]="form.invalid"
            >
              {{ editing() ? 'Salvar grupo' : 'Criar grupo' }}
            </button>

          </form>

          <!-- Lista de grupos -->
          <div class="rounded-xl border overflow-hidden">

            <table class="w-full text-sm">

              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                @for (group of groups(); track group.id) {

                  <tr>

                    <td>
                      <b>{{ group.name }}</b>

                      <div class="text-slate-500">
                        {{ group.description }}
                      </div>
                    </td>

                    <td>
                      {{ group.active ? 'Ativo' : 'Inativo' }}
                    </td>

                    <td>

                      <button
                        type="button"
                        class="link"
                        (click)="edit(group)"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        class="link"
                        (click)="select(group)"
                      >
                        Membros
                      </button>

                    </td>

                  </tr>

                }

              </tbody>

            </table>

          </div>

        </section>

        <!-- ========================= -->
        <!-- MEMBROS -->
        <!-- ========================= -->
        <section
          class="rounded-xl border p-4 space-y-3 bg-white dark:bg-slate-900"
        >

          <h2 class="font-semibold">
            {{ selected()?.name || 'Membros do grupo' }}
          </h2>

          @if (selected()) {

            <!-- Adicionar membro -->
            <form
              [formGroup]="memberForm"
              (ngSubmit)="addMember()"
              class="space-y-2"
            >

              <select
                formControlName="userId"
                class="input"
              >
                <option [ngValue]="null">
                  Selecione o usuário
                </option>

                @for (user of users(); track user.id) {

                  <option [ngValue]="user.id">
                    {{ user.name }}
                  </option>

                }

              </select>

              <select
                formControlName="role"
                class="input"
              >
                <option value="MEMBER">
                  Membro
                </option>

                <option value="MANAGER">
                  Gerente
                </option>
              </select>

              <button
                type="submit"
                class="btn-primary w-full"
                [disabled]="memberForm.invalid"
              >
                Adicionar
              </button>

            </form>

            <!-- Lista de membros -->
            <div class="divide-y">

              @for (member of members(); track member.id) {

                <div class="py-2 flex justify-between">

                  <span>
                    {{ member.userName }}

                    <small class="text-slate-500">
                      {{ member.role }}
                    </small>
                  </span>

                  <button
                    type="button"
                    class="link text-red-600"
                    (click)="removeMember(member)"
                  >
                    Remover
                  </button>

                </div>

              }

            </div>

          } @else {

            <p class="text-sm text-slate-500">
              Selecione um grupo para administrar seus membros.
            </p>

          }

        </section>

      </div>

    </div>
  `,

  styles: [`
    .input {
      width: 100%;
      padding: .55rem .7rem;
      border: 1px solid #cbd5e1;
      border-radius: .5rem;
      background: transparent;
    }

    .btn-primary {
      padding: .55rem .8rem;
      border-radius: .5rem;
      background: #2563eb;
      color: white;
    }

    .link {
      color: #2563eb;
      font-size: .8rem;
    }

    th,
    td {
      padding: .75rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
  `],
})
export class AttendanceGroupsPageComponent implements OnInit {

  // ============================================================
  // Services
  // ============================================================

  private api = inject(AttendanceAdminService);
  private usersApi = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  // ============================================================
  // State
  // ============================================================

  groups = signal<AttendanceGroup[]>([]);
  users = signal<User[]>([]);
  members = signal<AttendanceGroupMember[]>([]);

  selected = signal<AttendanceGroup | null>(null);
  editing = signal<AttendanceGroup | null>(null);

  // ============================================================
  // Forms
  // ============================================================

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    active: [true],
  });

  memberForm = this.fb.group({
    userId: [
      null as number | null,
      Validators.required,
    ],
    role: [
      'MEMBER' as 'MEMBER' | 'MANAGER',
      Validators.required,
    ],
  });

  // ============================================================
  // Lifecycle
  // ============================================================

  ngOnInit(): void {
    this.load();
    this.loadUsers();
  }

  // ============================================================
  // Loading
  // ============================================================

  load(): void {
    this.api.groups().subscribe({
      next: (groups) => {
        this.groups.set(groups);
      },

      error: () => {
        this.toast.error(
          'Erro ao carregar grupos'
        );
      },
    });
  }

  loadUsers(): void {
    this.usersApi.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
      },

      error: () => {
        this.toast.error(
          'Erro ao carregar usuários'
        );
      },
    });
  }

  loadMembers(): void {
    const group = this.selected();

    if (!group) {
      return;
    }

    this.api.groupMembers(group.id).subscribe({
      next: (members) => {
        this.members.set(members);
      },

      error: () => {
        this.toast.error(
          'Erro ao carregar membros'
        );
      },
    });
  }

  // ============================================================
  // Group
  // ============================================================

  edit(group: AttendanceGroup): void {
    this.editing.set(group);

    this.form.reset({
      name: group.name,
      description: group.description || '',
      active: group.active,
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const current = this.editing();

    const request = {
      name: value.name!,
      description: value.description || undefined,
      active: value.active ?? true,
    };

    const call = current
      ? this.api.updateGroup(current.id, request)
      : this.api.createGroup(request);

    call.subscribe({
      next: () => {
        this.toast.success('Grupo salvo');

        this.form.reset({
          name: '',
          description: '',
          active: true,
        });

        this.editing.set(null);

        this.load();
      },

      error: (error) => {
        this.toast.error(
          error.error?.message ||
          'Não foi possível salvar o grupo'
        );
      },
    });
  }

  select(group: AttendanceGroup): void {
    this.selected.set(group);
    this.loadMembers();
  }

  // ============================================================
  // Members
  // ============================================================

  addMember(): void {
    const group = this.selected();
    const value = this.memberForm.getRawValue();

    if (!group || !value.userId) {
      return;
    }

    this.api
      .addGroupMember(
        group.id,
        value.userId,
        value.role!
      )
      .subscribe({
        next: () => {
          this.memberForm.reset({
            userId: null,
            role: 'MEMBER',
          });

          this.loadMembers();
        },

        error: (error) => {
          this.toast.error(
            error.error?.message ||
            'Erro ao adicionar membro'
          );
        },
      });
  }

  removeMember(
    member: AttendanceGroupMember
  ): void {

    const group = this.selected();

    if (!group) {
      return;
    }

    this.api
      .removeGroupMember(
        group.id,
        member.id
      )
      .subscribe({
        next: () => {
          this.loadMembers();
        },

        error: () => {
          this.toast.error(
            'Erro ao remover membro'
          );
        },
      });
  }
}