// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  role: string;
}

export interface AuthUser {
  email: string;
  role: 'ADMIN' | 'CORRETOR' | 'OPERADOR';
  name?: string;
}

// ── Leads ─────────────────────────────────────────────────────────────────
export type LeadStatus = 'ACTIVE' | 'HUMAN_HANDOFF' | 'COMPLETED' | 'LEAVE' | 'PAUSED';

export interface LeadSession {
  id: number;
  phoneNumber: string;
  profileName: string | null;
  status: LeadStatus;
  currentStep: string | null;
  workflow: string | null;
  lastInteraction: string | null;
  createdAt: string;
}

export interface LeadAnswer {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
  workflowStep?: { id: number; name: string } | null;
}

export interface LeadDocument {
  id: number;
  documentKey: string;
  documentName: string | null;
  mimeType: string | null;
  storageUrl: string | null;
  storageProvider: string | null;
  sharepointFolderWebUrl: string | null;
  uploadedAt: string;
}

export interface LeadDetail {
  session: LeadSession;
  answers: LeadAnswer[];
  documents: LeadDocument[];
}

// ── Workflows ─────────────────────────────────────────────────────────────
export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowStep {
  id: number;
  name: string;
  stepOrder: number;
  question: string;
  confirmationMessage: string | null;
  errorMessage: string | null;
  responseType: ResponseType;
  validationRegex: string | null;
  validOptions: string[] | null;
  allowsSpecialist: boolean;
  allowsReset: boolean;
  active: boolean;
  nextStep?: { id: number; name: string } | null;
}

export type ResponseType =
  | 'TEXT' | 'NUMBER' | 'OPTION' | 'DOCUMENT'
  | 'MULTI_DOCUMENT' | 'EMAIL' | 'PHONE' | 'DATE' | 'CPF' | 'CNPJ';

export interface WorkflowRequiredDocument {
  id: number;
  documentName: string;
  documentKey: string;
  docOrder: number;
  allowedMimeTypes: string[];
  maxSizeMb: number;
  required: boolean;
  active: boolean;
}

// ── Requests ──────────────────────────────────────────────────────────────
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
}

export interface CreateStepRequest {
  name: string;
  stepOrder: number;
  question: string;
  confirmationMessage?: string;
  errorMessage?: string;
  responseType: ResponseType;
  validationRegex?: string;
  validOptions?: string[];
  allowsSpecialist: boolean;
  allowsReset: boolean;
}

export interface CreateDocumentRequest {
  documentName: string;
  documentKey: string;
  docOrder?: number;
  allowedMimeTypes?: string[];
  maxSizeMb?: number;
  required?: boolean;
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  handoffLeads: number;
  pausedLeads: number;
  activeWorkflows: number;
  totalDocuments: number;
  conversionRate: number;
}

// ── Pagination ────────────────────────────────────────────────────────────
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ── Toast ─────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
