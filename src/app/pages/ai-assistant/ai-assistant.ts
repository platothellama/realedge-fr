import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>AI Assistant</h1>
        <p class="subtitle">Ask questions about your real estate business</p>
      </div>

      <mat-card class="chat-card">
        <mat-card-content>
          <div class="chat-messages">
            @for (msg of messages; track msg) {
              <div class="message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
                <div class="message-content">{{ msg.content }}</div>
              </div>
            }
            @if (loading) {
              <div class="message assistant">
                <div class="message-content">Thinking...</div>
              </div>
            }
          </div>
          
          <div class="chat-input">
            <mat-form-field appearance="outline" class="input-field">
              <input matInput [(ngModel)]="userMessage" (keyup.enter)="sendMessage()" 
                placeholder="Ask me anything about your business...">
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="sendMessage()" [disabled]="loading || !userMessage.trim()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0 0 4px 0; font-size: 28px; font-weight: 500; }
    .subtitle { margin: 0; color: #666; }
    .chat-card { height: calc(100vh - 200px); display: flex; flex-direction: column; }
    .chat-card mat-card-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .message { max: 80%; }
    .message.user { align-self: flex-end; }
    .message.assistant { align-self: flex-start; }
    .message-content { padding: 12px 16px; border-radius: 12px; }
    .user .message-content { background: #1976d2; color: white; }
    .assistant .message-content { background: #f5f5f5; color: #333; }
    .chat-input { display: flex; gap: 12px; padding: 16px; border-top: 1px solid #eee; }
    .input-field { flex: 1; }
  `]
})
export class AiAssistant {
  messages: any[] = [];
  userMessage = '';
  loading = false;

  constructor(private apiService: ApiService, private snackBar: MatSnackBar) {}

  sendMessage() {
    if (!this.userMessage.trim() || this.loading) return;

    const userMsg = this.userMessage;
    this.messages.push({ role: 'user', content: userMsg });
    this.userMessage = '';
    this.loading = true;

    this.apiService.naturalLanguageSearch({ query: userMsg }).subscribe({
      next: (data) => {
        const response = data.results?.length > 0 
          ? `I found ${data.results.length} properties that might interest you. Would you like me to show you the details?`
          : "I can help you with property searches, lead management, and more. Try asking about properties in a specific area or with certain features.";
        this.messages.push({ role: 'assistant', content: response });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: "I'm here to help! Try asking about properties, leads, or your business metrics." });
        this.loading = false;
      }
    });
  }
}
