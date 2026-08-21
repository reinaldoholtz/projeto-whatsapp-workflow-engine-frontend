import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { AttendanceGroup, AttendanceGroupMember, AttendanceGroupRole, UpdateAttendanceGroupRequest, AttendanceQueue, CreateAttendanceQueueRequest, UpdateAttendanceQueueRequest, QueueMember, UpsertQueueMemberRequest } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class AttendanceAdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/attendance`;
  groups() { return this.http.get<AttendanceGroup[]>(`${this.base}/groups`); }
  createGroup(payload: { name: string; description?: string }) { return this.http.post<AttendanceGroup>(`${this.base}/groups`, payload); }
  updateGroup(id: number, payload: UpdateAttendanceGroupRequest) { return this.http.put<AttendanceGroup>(`${this.base}/groups/${id}`, payload); }
  groupMembers(id: number) { return this.http.get<AttendanceGroupMember[]>(`${this.base}/groups/${id}/members`); }
  addGroupMember(id: number, userId: number, role: AttendanceGroupRole) { return this.http.post<void>(`${this.base}/groups/${id}/members`, { userId, role }); }
  removeGroupMember(id: number, memberId: number) { return this.http.delete<void>(`${this.base}/groups/${id}/members/${memberId}`); }
  queues(activeOnly = false) { return this.http.get<AttendanceQueue[]>(`${this.base}/queues`, { params: { activeOnly } }); }
  createQueue(payload: CreateAttendanceQueueRequest) { return this.http.post<AttendanceQueue>(`${this.base}/queues`, payload); }
  updateQueue(id: number, payload: UpdateAttendanceQueueRequest) { return this.http.put<AttendanceQueue>(`${this.base}/queues/${id}`, payload); }
  queueMembers(id: number) { return this.http.get<QueueMember[]>(`${this.base}/queues/${id}/members`); }
  upsertQueueMember(id: number, payload: UpsertQueueMemberRequest) { return this.http.put<QueueMember>(`${this.base}/queues/${id}/members`, payload); }
  removeQueueMember(id: number, memberId: number) { return this.http.delete<void>(`${this.base}/queues/${id}/members/${memberId}`); }
}
