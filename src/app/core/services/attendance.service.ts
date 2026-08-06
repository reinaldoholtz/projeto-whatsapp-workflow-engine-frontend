import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  AttendanceConversation,
  AttendanceConversationDetail,
  AttendanceConversationMessage,
  AttendanceConversationNote,
  AttendanceGroup,
  CreateAttendanceConversationRequest,
  CreateAttendanceGroupRequest,
  CreateConversationNoteRequest,
} from '@shared/models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/attendance`;

  getGroups() {
    return this.http.get<AttendanceGroup[]>(`${this.base}/groups`);
  }

  createGroup(payload: CreateAttendanceGroupRequest) {
    return this.http.post<AttendanceGroup>(`${this.base}/groups`, payload);
  }

  getConversations() {
    return this.http.get<AttendanceConversation[]>(`${this.base}/conversations`);
  }

  getConversation(id: number) {
    return this.http.get<AttendanceConversationDetail>(`${this.base}/conversations/${id}`);
  }

  createConversation(payload: CreateAttendanceConversationRequest) {
    return this.http.post<AttendanceConversation>(`${this.base}/conversations`, payload);
  }

  getMessages(conversationId: number) {
    return this.http.get<AttendanceConversationMessage[]>(`${this.base}/conversations/${conversationId}/messages`);
  }

  getNotes(conversationId: number) {
    return this.http.get<AttendanceConversationNote[]>(`${this.base}/conversations/${conversationId}/notes`);
  }

  addNote(conversationId: number, payload: CreateConversationNoteRequest) {
    return this.http.post<AttendanceConversationNote>(`${this.base}/conversations/${conversationId}/notes`, payload);
  }
}
