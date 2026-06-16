import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { MetaPhone, CreateMetaPhoneRequest, UpdateMetaPhoneRequest } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class MetaPhoneService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/meta-phones`;

  getAll()                                         { return this.http.get<MetaPhone[]>(this.base); }
  getAllActive()                                    { return this.http.get<MetaPhone[]>(`${this.base}/active`); }
  getById(id: number)                              { return this.http.get<MetaPhone>(`${this.base}/${id}`); }
  create(req: CreateMetaPhoneRequest)              { return this.http.post<MetaPhone>(this.base, req); }
  update(id: number, req: UpdateMetaPhoneRequest) { return this.http.put<MetaPhone>(`${this.base}/${id}`, req); }
  toggleActive(id: number)                         { return this.http.patch<MetaPhone>(`${this.base}/${id}/toggle-active`, {}); }
  delete(id: number)                               { return this.http.delete<void>(`${this.base}/${id}`); }
}
