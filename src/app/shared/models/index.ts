// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string; }

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  role: string;
  /** ID do tenant no admin_db — null para usuários legados */
  tenantId?: number | null;
  /** Nome do banco PostgreSQL do tenant */
  databaseName?: string | null;
  adminMode?: boolean | null;
  tenantName?: string | null;
}

export interface AuthUser {
  email: string;
  role: 'MASTER' | 'ADMIN' | 'CORRETOR' | 'OPERADOR';
  name?: string;
  /** ID do tenant no admin_db */
  tenantId?: number | null;
  /** Nome do banco PostgreSQL do tenant */
  databaseName?: string | null;
  adminMode?: boolean | null;
  tenantName?: string | null;
}

// ── Users ─────────────────────────────────────────────────────────────────
export type UserRole = 'MASTER' | 'ADMIN' | 'CORRETOR' | 'OPERADOR';

export interface User {
  id: number;
  tenantId: number | null;
  name: string;
  phoneNumber: string | null;
  whatsappPhone: string | null;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  tenantId?: number | null;
  phoneNumber?: string;
  whatsappPhone?: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  tenantId?: number | null;
  phoneNumber?: string;
  whatsappPhone?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  active?: boolean;
}

// ── Tenants (admin_db) ────────────────────────────────────────────────────
export interface Tenant {
  id: number;
  name: string;
  databaseName: string;
  schemaVersion: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  databaseName: string;
}

// ── MetaPhone ─────────────────────────────────────────────────────────────
export interface MetaPhone {
  id: number; name: string; displayPhoneNumber: string;
  phoneNumberId: string; businessAccountId: string | null;
  accessToken: string | null; active: boolean;
  createdAt: string; updatedAt: string;
}

export interface CreateMetaPhoneRequest {
  name: string; displayPhoneNumber: string; phoneNumberId: string;
  businessAccountId?: string; accessToken?: string;
}

export interface UpdateMetaPhoneRequest {
  name?: string; displayPhoneNumber?: string; phoneNumberId?: string;
  businessAccountId?: string; accessToken?: string; active?: boolean;
}

// ── Leads ─────────────────────────────────────────────────────────────────
export type LeadStatus = 'ACTIVE' | 'HUMAN_HANDOFF' | 'COMPLETED' | 'LEAVE' | 'PAUSED';

export interface LeadSession {
  id: number; phoneNumber: string; profileName: string | null;
  leadName: string | null;
  status: LeadStatus; currentStep: string | null; workflow: string | null;
  lastInteraction: string | null; createdAt: string;
}

export interface LeadAnswer {
  id: number; question: string; answer: string; createdAt: string;
  workflowStep?: { id: number; name: string } | null;
}

export interface LeadDocument {
  id: number; documentKey: string; documentName: string | null;
  mimeType: string | null; storageUrl: string | null;
  storageProvider: string | null; sharepointFolderWebUrl: string | null;
  uploadedAt: string;
}

export interface LeadDetail {
  session: LeadSession; answers: LeadAnswer[]; documents: LeadDocument[];
}

// ── Workflows ─────────────────────────────────────────────────────────────
export interface Workflow {
  id: number; name: string; description: string | null; active: boolean;
  userId?: number | null; userName?: string | null;
  metaPhoneId?: number | null; metaPhoneName?: string | null;
  metaPhoneDisplay?: string | null;
  createdAt?: string; updatedAt?: string;
}

export interface WorkflowStep {
  id: number; name: string; stepOrder: number; question: string;
  confirmationMessage: string | null; errorMessage: string | null;
  responseType: ResponseType; validationRegex: string | null;
  validOptions: string[] | null; allowsSpecialist: boolean;
  allowsReset: boolean; active: boolean;
  nextStep?: { id: number; name: string } | null;
}

export type ResponseType =
  | 'TEXT' | 'NUMBER' | 'OPTION' | 'DOCUMENT'
  | 'MULTI_DOCUMENT' | 'EMAIL' | 'PHONE' | 'DATE' | 'CPF' | 'CNPJ';

export interface WorkflowRequiredDocument {
  id: number; documentName: string; documentKey: string; docOrder: number;
  allowedMimeTypes: string[]; maxSizeMb: number; required: boolean; active: boolean;
}

export interface CreateWorkflowRequest {
  name: string; description?: string; userId?: number; metaPhoneId?: number;
}

export interface CreateStepRequest {
  name: string; stepOrder: number; question: string;
  confirmationMessage?: string; errorMessage?: string;
  responseType: ResponseType; validationRegex?: string;
  validOptions?: string[]; allowsSpecialist: boolean; allowsReset: boolean;
}

export interface CreateDocumentRequest {
  documentName: string; documentKey: string; docOrder?: number;
  allowedMimeTypes?: string[]; maxSizeMb?: number; required?: boolean;
}

// ── Lead Disparo ───────────────────────────────────────────────────────────
export type DisparoStatus =
  | 'PENDENTE' | 'ENVIADO' | 'ENTREGUE' | 'LIDO'
  | 'NUMERO_INVALIDO' | 'NAO_POSSUI_WHATSAPP' | 'DUPLICADO' | 'ERRO';

export type BatchStatus =
  | 'PENDENTE' | 'AGENDADO' | 'PROCESSANDO' | 'FINALIZADO' | 'ERRO' | 'CANCELADO';

export interface LeadPreviewItem {
  line: number; name: string; phone: string; valid: boolean; error?: string;
}

export interface DisparoPreviewResponse {
  runId: string; totalRecords: number; validRecords: number;
  invalidRecords: number; leads: LeadPreviewItem[]; errors: string[];
}

export interface DisparoStartRequest {
  workflowId: number;
  runId: string;
  fileName: string;
  batchSize: number;
  intervalMinutes: number;
  scheduledAt?: string | null;
}

export interface DisparoItemResponse {
  id: number; leadName: string; phoneNumber: string;
  status: DisparoStatus; errorDetail: string | null; processedAt: string;
}

export interface DisparoResultResponse {
  runId: string; workflowId: number; workflowName: string; total: number;
  enviados: number; erros: number; duplicados: number; naoTemWhatsapp: number;
  items: DisparoItemResponse[];
}

// ── Lead Batch (Histórico) ────────────────────────────────────────────────
export interface LeadBatchSummary {
  id: number; fileName: string; runId: string;
  workflowId: number | null; workflowName: string | null;
  status: BatchStatus;
  totalRecords: number; processedRecords: number;
  successRecords: number; errorRecords: number;
  batchSize: number; intervalMinutes: number;
  scheduledAt: string | null; startedAt: string | null; finishedAt: string | null;
  createdAt: string; progressPct: number;
}

export interface DisparoItemSummary {
  id: number; leadName: string | null; phoneNumber: string;
  status: string; errorDetail: string | null; whatsappMessageId: string | null;
  processedAt: string; deliveredAt: string | null; readAt: string | null;
}

export interface LeadBatchDetail {
  batch: LeadBatchSummary;
  items: DisparoItemSummary[];
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalLeads: number; activeLeads: number; completedLeads: number;
  handoffLeads: number; pausedLeads: number; activeWorkflows: number;
  totalDocuments: number; conversionRate: number;
}

// ── Pagination ────────────────────────────────────────────────────────────
export interface Page<T> {
  content: T[]; totalElements: number; totalPages: number;
  size: number; number: number;
}

// ── Toast ─────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: string; type: ToastType; message: string; duration?: number; }



