import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  AttendanceMenu,
  MenuOption,
  CreateAttendanceMenuRequest,
  UpdateAttendanceMenuRequest,
  CreateMenuOptionRequest,
} from '@shared/models';

@Injectable({ providedIn: 'root' })
export class AttendanceMenuService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/attendance/menus`;

  listMenus() {
    return this.http.get<AttendanceMenu[]>(this.base);
  }

  getMenu(id: number) {
    return this.http.get<AttendanceMenu>(`${this.base}/${id}`);
  }

  createMenu(payload: CreateAttendanceMenuRequest) {
    return this.http.post<AttendanceMenu>(this.base, payload);
  }

  updateMenu(id: number, payload: UpdateAttendanceMenuRequest) {
    return this.http.put<AttendanceMenu>(`${this.base}/${id}`, payload);
  }

  deleteMenu(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getActiveMenuByChannelAccount(channelAccountId: number) {
    return this.http.get<AttendanceMenu>(`${this.base}/channel-account/${channelAccountId}`);
  }

  addOption(menuId: number, payload: CreateMenuOptionRequest) {
    return this.http.post<MenuOption>(`${this.base}/${menuId}/options`, payload);
  }

  updateOption(menuId: number, optionId: number, payload: CreateMenuOptionRequest) {
    return this.http.put<MenuOption>(`${this.base}/${menuId}/options/${optionId}`, payload);
  }

  deleteOption(menuId: number, optionId: number) {
    return this.http.delete<void>(`${this.base}/${menuId}/options/${optionId}`);
  }

  reorderOptions(menuId: number, optionIds: number[]) {
    return this.http.put<AttendanceMenu>(`${this.base}/${menuId}/options/reorder`, { optionIds });
  }

  // Fetch active queues for the current tenant (used by menu option UI)
  getQueues() {
    return this.http.get<{ id: number; tenantId: number; name: string; groupId: number | null }[]>(`/api/attendance/queues`);
  }
}

