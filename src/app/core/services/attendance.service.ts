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

export interface SendMessageRequest {
  text?: string;
  type?: string;
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

export interface SendMessageResponse {
  id: number;
  externalMessageId: string | null;
  status: string;
  createdAt: string;
}

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

  openConversation(id: number) {
    return this.http.put<AttendanceConversationDetail>(
      `${this.base}/conversations/${id}/open`,
      {}
    );
  }

  createConversation(payload: CreateAttendanceConversationRequest) {
    return this.http.post<AttendanceConversation>(`${this.base}/conversations`, payload);
  }

  getMessages(conversationId: number) {
    return this.http.get<AttendanceConversationMessage[]>(`${this.base}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: number, payload: SendMessageRequest) {
    return this.http.post<SendMessageResponse>(`${this.base}/conversations/${conversationId}/messages`, payload);
  }

  uploadMedia(conversationId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ mediaUrl: string; mimeType: string; fileName: string; fileSize: number }>(
      `${this.base}/conversations/${conversationId}/media`, formData
    );
  }

  getNotes(conversationId: number) {
    return this.http.get<AttendanceConversationNote[]>(`${this.base}/conversations/${conversationId}/notes`);
  }

  addNote(conversationId: number, payload: CreateConversationNoteRequest) {
    return this.http.post<AttendanceConversationNote>(`${this.base}/conversations/${conversationId}/notes`, payload);
  }

  closeConversation(conversationId: number) {
    return this.http.patch<AttendanceConversation>(`${this.base}/conversations/${conversationId}/close`, {});
  }

  transferConversation(conversationId: number, targetGroupId: number) {
    return this.http.patch<AttendanceConversation>(`${this.base}/conversations/${conversationId}/transfer`, { targetGroupId });
  }

  sendTypingIndicator(conversationId: number, typing: boolean) {
    return this.http.post(`${this.base}/conversations/${conversationId}/typing`, { typing });
  }
}
