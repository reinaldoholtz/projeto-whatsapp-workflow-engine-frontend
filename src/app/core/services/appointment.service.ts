import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  Appointment,
  AppointmentAvailabilityResponse,
  UserAvailability,
  UserAvailabilityRequest,
} from '@shared/models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/appointments`;

  getAll() {
    return this.http.get<Appointment[]>(this.base);
  }

  getById(id: number) {
    return this.http.get<Appointment>(`${this.base}/${id}`);
  }

  cancel(id: number) {
    return this.http.post<Appointment>(`${this.base}/${id}/cancel`, {});
  }

  getAvailabilities(userId: number) {
    return this.http.get<UserAvailability[]>(`${this.base}/users/${userId}/availabilities`);
  }

  createAvailability(userId: number, req: UserAvailabilityRequest) {
    return this.http.post<UserAvailability>(`${this.base}/users/${userId}/availabilities`, req);
  }

  updateAvailability(availabilityId: number, req: UserAvailabilityRequest) {
    return this.http.put<UserAvailability>(`${this.base}/availabilities/${availabilityId}`, req);
  }

  getAvailabilityOptions(userId: number, date: string) {
    return this.http.get<AppointmentAvailabilityResponse>(
      `${this.base}/users/${userId}/availability-options`,
      { params: { date } }
    );
  }
}
