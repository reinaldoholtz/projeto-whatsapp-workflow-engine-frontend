import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@env/environment';
import { LeadSession, LeadDetail, LeadStatus } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class LeadService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/leads`;

  getAll(status?: LeadStatus) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<LeadSession[]>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<LeadDetail>(`${this.base}/${id}`);
  }

  pause(id: number) {
    return this.http.post<void>(`${this.base}/${id}/pause`, {});
  }

  resume(id: number) {
    return this.http.post<void>(`${this.base}/${id}/resume`, {});
  }

  handoff(id: number) {
    return this.http.post<void>(`${this.base}/${id}/handoff`, {});
  }

  generatePdf(id: number) {
    return this.http.post<void>(`${this.base}/${id}/generate-pdf`, {});
  }
}
