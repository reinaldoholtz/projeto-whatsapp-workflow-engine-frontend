import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { Tenant, CreateTenantRequest } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/master/tenants`;

  getAll()                              { return this.http.get<Tenant[]>(this.base); }
  getById(id: number)                   { return this.http.get<Tenant>(`${this.base}/${id}`); }
  create(req: CreateTenantRequest)      { return this.http.post<Tenant>(this.base, req); }
  activate(id: number)                  { return this.http.patch<Tenant>(`${this.base}/${id}/activate`, {}); }
  deactivate(id: number)                { return this.http.patch<void>(`${this.base}/${id}/deactivate`, {}); }
}
