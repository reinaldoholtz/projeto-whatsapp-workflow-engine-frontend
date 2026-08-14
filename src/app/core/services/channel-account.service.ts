import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ChannelAccount, CreateChannelAccountRequest, UpdateChannelAccountRequest } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class ChannelAccountService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/channel-accounts`;

  getAll()                                             { return this.http.get<ChannelAccount[]>(this.base); }
  getAllActive()                                       { return this.http.get<ChannelAccount[]>(`${this.base}/active`); }
  getById(id: number)                                  { return this.http.get<ChannelAccount>(`${this.base}/${id}`); }
  create(req: CreateChannelAccountRequest)             { return this.http.post<ChannelAccount>(this.base, req); }
  update(id: number, req: UpdateChannelAccountRequest) { return this.http.put<ChannelAccount>(`${this.base}/${id}`, req); }
  toggleActive(id: number)                             { return this.http.patch<ChannelAccount>(`${this.base}/${id}/toggle-active`, {}); }
  delete(id: number)                                   { return this.http.delete<void>(`${this.base}/${id}`); }
}
