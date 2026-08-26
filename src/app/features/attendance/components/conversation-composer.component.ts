import { Component, EventEmitter, inject, Input, OnDestroy, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AttendanceService, SendMessageRequest } from '@core/services/attendance.service';
import { ToastService } from '@core/services/toast.service';
import { WebSocketService } from '@core/services/websocket.service';
import { AttendanceConversationMessage } from '@shared/models';
import { AuthService } from '@core/auth/auth.service';

export type MessageDeliveryStatus = 'PENDING' | 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface ConversationMessage extends AttendanceConversationMessage {
  deliveryStatus?: MessageDeliveryStatus;
}

@Component({
  selector: 'app-conversation-composer',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="composer">
      @if (sending()) {
        <div class="composer-sending-overlay">
          <div class="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      }

      <!-- <div class="composer-toolbar">
        <button type="button" (click)="triggerFileUpload()" class="composer-btn" title="Anexar arquivo">
          <span class="material-icons-round text-xl">attach_file</span>
        </button>
        <button type="button" (click)="triggerImageUpload()" class="composer-btn" title="Enviar imagem">
          <span class="material-icons-round text-xl">image</span>
        </button>
        <button type="button" (click)="toggleEmojiPicker()" class="composer-btn" title="Emoji">
          <span class="material-icons-round text-xl">sentiment_satisfied_alt</span>
        </button>
        <button type="button" (click)="openTemplatesModal()" class="composer-btn" title="Templates">
          <span class="material-icons-round text-xl">description</span>
        </button>
      </div> -->

      @if (showEmojiPicker()) {
        <div class="composer-emoji-picker">
          @for (emoji of commonEmojis; track emoji) {
            <button type="button" (click)="insertEmoji(emoji)" class="composer-emoji-btn">
              {{ emoji }}
            </button>
          }
        </div>
      }

      <form [formGroup]="messageForm" (ngSubmit)="sendMessage()" class="composer-form">
        <div class="composer-input-wrapper">
          <textarea
            #messageInput
            formControlName="text"
            class="composer-input"
            placeholder="Digite sua mensagem..."
            rows="1"
            (keydown)="handleKeyDown($event)"
            (input)="autoResize()"
            (focus)="onFocus()"
            (blur)="onBlur()"
          ></textarea>
        </div>
        <button
          type="submit"
          [disabled]="messageForm.invalid || sending() || (!messageForm.value.text?.trim() && !pendingMedia())"
          class="composer-send-btn"
        >
          <span class="material-icons-round text-xl">send</span>
        </button>
      </form>

      @if (pendingMedia()) {
        <div class="composer-media-preview">
          <div class="composer-media-item">
            <span class="material-icons-round text-2xl text-gray-400">{{ mediaIcon() }}</span>
            <span class="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{{ pendingMedia()!.name }}</span>
            <button type="button" (click)="clearMedia()" class="composer-media-remove">
              <span class="material-icons-round text-base">close</span>
            </button>
          </div>
        </div>
      }

      <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
      <input #imageInput type="file" class="hidden" (change)="onImageSelected($event)" accept="image/*" />
    </div>
  `,
  styles: [`
    .composer {
      @apply relative bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 p-3;
    }

    .composer-sending-overlay {
      @apply absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center z-10 backdrop-blur-sm;
    }

    .composer-toolbar {
      @apply flex items-center gap-1 mb-2;
    }

    .composer-btn {
      @apply w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400
             hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400
             transition-colors;
    }

    .composer-emoji-picker {
      @apply absolute bottom-full left-3 mb-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg
             border border-gray-100 dark:border-slate-700 grid grid-cols-8 gap-1 z-20;
    }

    .composer-emoji-btn {
      @apply w-8 h-8 flex items-center justify-center text-xl rounded-lg
             hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors;
    }

    .composer-form {
      @apply flex items-end gap-2;
    }

    .composer-input-wrapper {
      @apply flex-1 relative;
    }

    .composer-input {
      @apply w-full rounded-2xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50
             px-4 py-3 text-sm text-gray-800 dark:text-gray-100 resize-none
             focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 dark:focus:border-primary-700
             max-h-36 overflow-y-auto;
    }

    .composer-send-btn {
      @apply w-11 h-11 rounded-2xl bg-primary-600 text-white flex items-center justify-center
             hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
    }

    .composer-media-preview {
      @apply mt-2 p-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/30;
    }

    .composer-media-item {
      @apply flex items-center gap-2;
    }

    .composer-media-remove {
      @apply w-7 h-7 rounded-lg flex items-center justify-center text-gray-400
             hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-red-500 transition-colors;
    }
  `]
})
export class ConversationComposerComponent implements OnDestroy {
  @Input() conversationId: number | null = null;
  @Input() channelCapabilities = { supportsAudio: true, supportsTemplates: true, supportsFlows: true };
  @Output() messageSent = new EventEmitter<ConversationMessage>();
  @Output() typingStarted = new EventEmitter<void>();
  @Output() typingStopped = new EventEmitter<void>();

  private attendanceService = inject(AttendanceService);
  private toast = inject(ToastService);
  private ws = inject(WebSocketService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);

  sending = signal(false);
  showEmojiPicker = signal(false);
  pendingMedia = signal<File | null>(null);

  messageForm = this.fb.group({
    text: ['', [Validators.maxLength(4096)]]
  });

  commonEmojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '👍', '👎', '👏', '🙌', '🤝', '❤️', '💔', '💯', '✅', '❌', '⚡', '🔥', '💡', '📌', '📎', '✉️', '📞', '📱', '💬', '💭'];

  private typingTimeout: any = null;
  private isTyping = false;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  sendMessage(): void {
    
    if (!this.conversationId || this.sending() || this.messageForm.invalid) {
      return;
    }

    const text = this.messageForm.value.text?.trim();
    console.log('sendMessage:', text);
    const hasMedia = !!this.pendingMedia();

    if (!text && !hasMedia) {
      return;
    }

    this.sending.set(true);
    this.stopTyping();

    const operatorName = this.getOperatorName();

    const outboundText = text
      ? `*${operatorName}*\n${text}`
      : text;

    const payload: SendMessageRequest = {
      text: outboundText
    };    

    if (hasMedia) {
      this.sendMediaMessage(payload);
    } else {
      this.sendTextMessage(payload);
    }
  }

  private sendTextMessage(payload: SendMessageRequest): void {
    console.log('Sending message:', payload);
    this.attendanceService.sendMessage(this.conversationId!, payload).subscribe({
      next: response => {
        this.emitNewMessage(response, payload.text || '');
        this.messageForm.reset({ text: '' });
        this.sending.set(false);
        this.toast.success('Mensagem enviada!');
      },
      error: () => {
        this.sending.set(false);
        this.toast.error('Erro ao enviar mensagem.');
      }
    });
  }

  private sendMediaMessage(payload: SendMessageRequest): void {
    const file = this.pendingMedia()!;
    this.attendanceService.uploadMedia(this.conversationId!, file).subscribe({
      next: media => {
        payload.mediaUrl = media.mediaUrl;
        payload.mimeType = media.mimeType;
        payload.fileName = media.fileName;
        this.sendTextMessage(payload);
        this.clearMedia();
      },
      error: () => {
        this.sending.set(false);
        this.toast.error('Erro ao enviar arquivo.');
      }
    });
  }

  private emitNewMessage(response: any, text: string): void {
    const msg: ConversationMessage = {
      id: response.id,
      direction: 'OUTBOUND',
      senderType: 'OPERATOR',
      senderUserId: null,
      externalMessageId: response.externalMessageId,
      type: 'TEXT',
      text: text,
      mediaId: null,
      mimeType: null,
      fileName: null,
      fileSize: null,
      storageUrl: null,
      status: response.status || 'SENT',
      readAt: null,
      deliveredAt: null,
      createdAt: response.createdAt || new Date().toISOString(),
      deliveryStatus: 'PENDING'
    };
    this.messageSent.emit(msg);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(): void {
    const textarea = document.querySelector('.composer-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 144) + 'px';
    }
  }

  onFocus(): void {
    this.startTyping();
  }

  onBlur(): void {
    this.stopTyping();
  }

  private startTyping(): void {
    if (!this.isTyping && this.conversationId) {
      this.isTyping = true;
      this.typingStarted.emit();
      this.ws.sendTypingStarted(this.conversationId);
    }
    this.resetTypingTimeout();
  }

  private stopTyping(): void {
    if (this.isTyping && this.conversationId) {
      this.isTyping = false;
      this.typingStopped.emit();
      this.ws.sendTypingStopped(this.conversationId);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  private resetTypingTimeout(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = setTimeout(() => this.stopTyping(), 3000);
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker.update(v => !v);
  }

  insertEmoji(emoji: string): void {
    const current = this.messageForm.value.text || '';
    this.messageForm.patchValue({ text: current + emoji });
    this.showEmojiPicker.set(false);
  }

  triggerFileUpload(): void {
    const input = document.querySelector('.composer input[type="file"]') as HTMLInputElement;
    input?.click();
  }

  triggerImageUpload(): void {
    const inputs = document.querySelectorAll('.composer input[type="file"]');
    if (inputs.length > 1) {
      (inputs[1] as HTMLInputElement).click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.pendingMedia.set(input.files[0]);
    }
    input.value = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.pendingMedia.set(input.files[0]);
    }
    input.value = '';
  }

  clearMedia(): void {
    this.pendingMedia.set(null);
  }

  mediaIcon(): string {
    const file = this.pendingMedia();
    if (!file) return 'insert_drive_file';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'videocam';
    if (file.type.startsWith('audio/')) return 'audiotrack';
    return 'insert_drive_file';
  }

  openTemplatesModal(): void {
    this.toast.info('Seleção de templates em desenvolvimento.');
  }

  private getOperatorName(): string {
    const user = this.authService.user();
    console.log('Operator name:', user?.name);

    return user?.name || user?.email || 'Operador';
  }
  
}
