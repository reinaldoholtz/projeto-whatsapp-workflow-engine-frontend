import { Injectable, inject } from '@angular/core';
import { ChannelAccountService } from './channel-account.service';
import { CreateChannelAccountRequest, UpdateChannelAccountRequest } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class MetaPhoneService {
  private service = inject(ChannelAccountService);

  getAll()                                             { return this.service.getAll(); }
  getAllActive()                                       { return this.service.getAllActive(); }
  getById(id: number)                                  { return this.service.getById(id); }
  create(req: CreateChannelAccountRequest)             { return this.service.create(req); }
  update(id: number, req: UpdateChannelAccountRequest) { return this.service.update(id, req); }
  toggleActive(id: number)                             { return this.service.toggleActive(id); }
  delete(id: number)                                   { return this.service.delete(id); }
}
