import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { User, CreateUserRequest, UpdateUserRequest } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/users`;

  getAll()                             { return this.http.get<User[]>(this.base); }
  getById(id: number)                  { return this.http.get<User>(`${this.base}/${id}`); }
  getRoles()                           { return this.http.get<string[]>(`${this.base}/roles`); }
  create(req: CreateUserRequest)       { return this.http.post<User>(this.base, req); }
  update(id: number, req: UpdateUserRequest) { return this.http.put<User>(`${this.base}/${id}`, req); }
  toggleActive(id: number)             { return this.http.patch<User>(`${this.base}/${id}/toggle-active`, {}); }
  delete(id: number)                   { return this.http.delete<void>(`${this.base}/${id}`); }
}
