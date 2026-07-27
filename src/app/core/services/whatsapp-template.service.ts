import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { WhatsAppTemplate } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class WhatsAppTemplateService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/whatsapp-templates`;

  getAll() {
    return this.http.get<WhatsAppTemplate[]>(this.base);
  }

  getAllActive() {
    return this.http.get<WhatsAppTemplate[]>(`${this.base}/active`);
  }

  getById(id: number) {
    return this.http.get<WhatsAppTemplate>(`${this.base}/${id}`);
  }
}
