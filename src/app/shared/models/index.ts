// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string; }

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  role: string;
  tenantId?: number | null;
  databaseName?: string | null;
  adminMode?: boolean | null;
  executionContext?: 'ADMIN_DB' | 'TENANT' | null;
  executionMode?: 'STANDARD' | 'MASTER_ADMIN' | 'MASTER_TENANT' | null;
  tenantName?: string | null;
}

export interface AuthUser {
  email: string;
  role: 'MASTER' | 'ADMIN' | 'CORRETOR' | 'OPERADOR';
  name?: string;
  tenantId?: number | null;
  databaseName?: string | null;
  adminMode?: boolean | null;
  executionContext?: 'ADMIN_DB' | 'TENANT' | null;
  executionMode?: 'STANDARD' | 'MASTER_ADMIN' | 'MASTER_TENANT' | null;
  tenantName?: string | null;
}

// ── Users ─────────────────────────────────────────────────────────────────
export type UserRole = 'MASTER' | 'ADMIN' | 'CORRETOR' | 'OPERADOR';

export interface User {
  id: number;
  tenantId: number | null;
  tenantName: string | null;
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
/**
 * Reflete MetaPhoneSummaryResponse / MetaPhoneDetailResponse do backend.
 * MetaPhone agora vive exclusivamente no admin_db.
 * accessToken NÃO é retornado pelo backend (segurança) — apenas indicado via hasToken.
 */
export type ChannelType = 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER' | 'TELEGRAM';

export interface ChannelAccount {
  id: number;
  tenantId: number;
  tenantName: string;
  channel: ChannelType;
  provider: string;
  accountName: string;
  externalAccountId: string;
  credentials?: string | null;
  configuration?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  name?: string;
  displayPhoneNumber?: string;
  phoneNumberId?: string;
  businessAccountId?: string | null;
}

export interface CreateChannelAccountRequest {
  tenantId?: number;
  channel?: ChannelType;
  provider?: string;
  accountName?: string;
  externalAccountId?: string;
  credentials?: string;
  configuration?: string;
  name?: string;
  displayPhoneNumber?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
}

export interface UpdateChannelAccountRequest {
  accountName?: string;
  channel?: ChannelType;
  provider?: string;
  externalAccountId?: string;
  credentials?: string;
  configuration?: string;
  active?: boolean;
  tenantId?: number;
  name?: string;
  displayPhoneNumber?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
}

export type MetaPhone = ChannelAccount;
export type CreateMetaPhoneRequest = CreateChannelAccountRequest;
export type UpdateMetaPhoneRequest = UpdateChannelAccountRequest;

// Templates WhatsApp
export type WhatsAppTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type WhatsAppTemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED';
export type WhatsAppTemplateQuality = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
export type WhatsAppTemplateVariableType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'CURRENCY' | 'DATE_TIME';

export interface WhatsAppTemplateVariable {
  name: string;
  type: WhatsAppTemplateVariableType | string;
  example?: string | null;
  position?: number | null;
}

export interface WhatsAppTemplateHeader {
  type: string | null;
  format: string | null;
  text: string | null;
}

export interface WhatsAppTemplateButton {
  type: string | null;
  text: string | null;
}

export interface WhatsAppTemplate {
  id: number;
  tenantId: number;
  tenantName: string | null;
  channelAccountId?: number; metaPhoneId: number;
  channelAccountName?: string | null; metaPhoneName: string | null;
  providerTemplateId: string;
  name: string;
  category: WhatsAppTemplateCategory;
  language: string;
  status: WhatsAppTemplateStatus;
  quality: WhatsAppTemplateQuality;
  parameterFormat?: string | null;
  disableIosAutofill?: boolean | null;
  primaryDeviceDeliveryOnly?: boolean | null;
  content: string | null;
  body?: string | null;
  header?: WhatsAppTemplateHeader | null;
  footer?: string | null;
  buttons?: WhatsAppTemplateButton[] | null;
  variables: WhatsAppTemplateVariable[] | null;
  metaJson?: string | null;
  active: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
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

// Attendance
export type ConversationStatus =
  | 'NEW'
  | 'UNREAD'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'SCHEDULED'
  | 'CLOSED';

export type ConversationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type ConversationMessageDirection = 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
export type ConversationSenderType = 'CUSTOMER' | 'OPERATOR' | 'SYSTEM';
export type ConversationMessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'DOCUMENT'
  | 'AUDIO'
  | 'VIDEO'
  | 'TEMPLATE'
  | 'SYSTEM_EVENT'
  | 'NOTE';

export interface AttendanceGroup {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  active: boolean;
}

export interface AttendanceConversation {
  id: number;
  tenantId: number;
  channel: string;
  provider: string;
  contactDisplayName: string | null;
  contactPhoneNumber: string;
  status: ConversationStatus;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastInteractionAt: string | null;
  assignedGroupId: number | null;
  assignedOperatorId: number | null;
  priority: ConversationPriority;
}

export interface AttendanceConversationMessage {
  id: number;
  direction: ConversationMessageDirection;
  senderType: ConversationSenderType;
  senderUserId: number | null;
  externalMessageId: string | null;
  type: ConversationMessageType;
  text: string | null;
  mediaId: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  storageUrl: string | null;
  status: string;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface AttendanceConversationNote {
  id: number;
  authorUserId: number;
  content: string;
  createdAt: string;
}

export interface AttendanceConversationDetail {
  conversation: AttendanceConversation;
  messages: AttendanceConversationMessage[];
  notes: AttendanceConversationNote[];
}

export interface CreateAttendanceGroupRequest {
  name: string;
  description?: string;
}

export interface CreateAttendanceConversationRequest {
  channel: string;
  provider: string;
  channelAccountId: string;
  contactId: string;
  contactDisplayName?: string;
  contactPhoneNumber: string;
  assignedGroupId?: number | null;
  assignedOperatorId?: number | null;
}

export interface CreateConversationNoteRequest {
  content: string;
}

// Appointment / Agenda
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Appointment {
  id: number;
  leadSessionId: number;
  leadPhoneNumber: string;
  leadProfileName: string | null;
  workflowId: number | null;
  workflowName: string | null;
  userId: number;
  userName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentAvailabilityResponse {
  appointmentDate: string;
  availableTimes: string[];
}

export type AvailabilityDayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface UserAvailability {
  id: number;
  userId: number;
  userName: string | null;
  dayOfWeek: AvailabilityDayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAvailabilityRequest {
  dayOfWeek: AvailabilityDayOfWeek;
  startTime: string;
  endTime: string;
  active?: boolean;
}

// ── Workflows ─────────────────────────────────────────────────────────────
export interface Workflow {
  id: number; name: string; description: string | null; active: boolean;
  userId?: number | null; userName?: string | null;
  channelAccountId?: number | null; channelAccountName?: string | null; metaPhoneId?: number | null; metaPhoneName?: string | null;
  metaPhoneDisplay?: string | null;
  whatsappTemplateId?: number | null; whatsappTemplateName?: string | null;
  createdAt?: string; updatedAt?: string;
}

export interface WorkflowStep {
  id: number; name: string; stepOrder: number; question: string;
  confirmationMessage: string | null; errorMessage: string | null;
  responseType: ResponseType; validationRegex: string | null;
  validOptions: string[] | null; allowsSpecialist: boolean;
  allowsReset: boolean; allowsAppointment: boolean; active: boolean;
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
  name: string; description?: string; userId?: number; channelAccountId?: number; metaPhoneId?: number; whatsappTemplateId?: number;
}

export interface CreateStepRequest {
  name: string; stepOrder: number; question: string;
  confirmationMessage?: string; errorMessage?: string;
  responseType: ResponseType; validationRegex?: string;
  validOptions?: string[]; allowsSpecialist: boolean; allowsReset: boolean; allowsAppointment: boolean;
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
  workflowId: number; runId: string; fileName: string;
  batchSize: number; intervalMinutes: number; scheduledAt?: string | null;
}

export interface DisparoStartResponse {
  batchId: number;
  runId: string;
  status: string;
  scheduled: boolean;
  message: string;
}
export interface DisparoItemResponse {
  id: number;

  leadName: string;
  phoneNumber: string;

  status: DisparoStatus;

  errorSummary?: string;

  errorDetail?: string;

  metaErrorCode?: number;
  metaErrorTitle?: string;
  metaErrorDetail?: string;

  whatsappMessageId?: string;

  processedAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface DisparoResultResponse {
  runId: string; workflowId: number; workflowName: string; total: number;
  enviados: number; erros: number; duplicados: number; naoTemWhatsapp: number;
  items: DisparoItemResponse[];
}

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
  id: number; 
  leadName: string | null; 
  phoneNumber: string;
  status: string; 
  errorDetail: string | null; 
  whatsappMessageId: string | null;
  errorSummary: string | null;
  processedAt: string; 
  deliveredAt: string | null; 
  readAt: string | null;
  metaErrorCode: string | null;
  metaErrorTitle: string | null;
  metaErrorDetail: string | null;
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
