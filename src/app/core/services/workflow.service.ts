import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  Workflow, WorkflowStep, WorkflowRequiredDocument,
  CreateWorkflowRequest, CreateStepRequest, CreateDocumentRequest
} from '@shared/models';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/workflows`;

  // ── Workflows ─────────────────────────────────────────────────────────────
  getAll()                   { return this.http.get<Workflow[]>(this.base); }
  getById(id: number)        { return this.http.get<Workflow>(`${this.base}/${id}`); }
  create(req: CreateWorkflowRequest) { return this.http.post<Workflow>(this.base, req); }
  update(id: number, req: CreateWorkflowRequest) { return this.http.put<Workflow>(`${this.base}/${id}`, req); }
  delete(id: number)         { return this.http.delete<void>(`${this.base}/${id}`); }

  // ── Steps ─────────────────────────────────────────────────────────────────
  getSteps(workflowId: number) {
    return this.http.get<WorkflowStep[]>(`${this.base}/${workflowId}/steps`);
  }
  createStep(workflowId: number, req: CreateStepRequest) {
    return this.http.post<WorkflowStep>(`${this.base}/${workflowId}/steps`, req);
  }
  updateStep(workflowId: number, stepId: number, req: CreateStepRequest) {
    return this.http.put<WorkflowStep>(`${this.base}/${workflowId}/steps/${stepId}`, req);
  }
  deleteStep(workflowId: number, stepId: number) {
    return this.http.delete<void>(`${this.base}/${workflowId}/steps/${stepId}`);
  }

  // ── Required Documents ────────────────────────────────────────────────────
  getDocuments(workflowId: number) {
    return this.http.get<WorkflowRequiredDocument[]>(`${this.base}/${workflowId}/documents`);
  }
  createDocument(workflowId: number, req: CreateDocumentRequest) {
    return this.http.post<WorkflowRequiredDocument>(`${this.base}/${workflowId}/documents`, req);
  }
}
