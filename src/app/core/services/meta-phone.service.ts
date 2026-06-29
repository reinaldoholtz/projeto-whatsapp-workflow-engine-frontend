import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { MetaPhone, CreateMetaPhoneRequest, UpdateMetaPhoneRequest } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class MetaPhoneService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/meta-phones`;

  /** Lista todos — MASTER vê todos os tenants, ADMIN vê só o próprio */
  getAll()                                          { return this.http.get<MetaPhone[]>(this.base); }

  /** Lista apenas ativos — usado no select de Workflow */
  getAllActive()                                     { return this.http.get<MetaPhone[]>(`${this.base}/active`); }

  getById(id: number)                               { return this.http.get<MetaPhone>(`${this.base}/${id}`); }

  /** Apenas MASTER */
  create(req: CreateMetaPhoneRequest)               { return this.http.post<MetaPhone>(this.base, req); }

  /** Apenas MASTER */
  update(id: number, req: UpdateMetaPhoneRequest)   { return this.http.put<MetaPhone>(`${this.base}/${id}`, req); }

  /** Apenas MASTER */
  toggleActive(id: number)                          { return this.http.patch<MetaPhone>(`${this.base}/${id}/toggle-active`, {}); }

  /** Apenas MASTER */
  delete(id: number)                                { return this.http.delete<void>(`${this.base}/${id}`); }
}
