import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  DisparoPreviewResponse, DisparoStartRequest,
  DisparoResultResponse, LeadBatchSummary, LeadBatchDetail
} from '@shared/models';

@Injectable({ providedIn: 'root' })
export class LeadDisparoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/lead-disparo`;

  preview(file: File, workflowId: number) {
    const form = new FormData();
    form.append('file', file);
    form.append('workflowId', String(workflowId));
    return this.http.post<DisparoPreviewResponse>(`${this.base}/preview`, form);
  }

  start(req: DisparoStartRequest) {
    return this.http.post<{ batchId: number; runId: string; status: string; scheduled: boolean; message: string }>(
      `${this.base}/start`, req
    );
  }

  getResult(runId: string) {
    return this.http.get<DisparoResultResponse>(`${this.base}/result/${runId}`);
  }

  // ── Histórico ─────────────────────────────────────────────────────────────
  listBatches() {
    return this.http.get<LeadBatchSummary[]>(`${this.base}/batches`);
  }

  getBatch(batchId: number) {
    return this.http.get<LeadBatchDetail>(`${this.base}/batches/${batchId}`);
  }
}
