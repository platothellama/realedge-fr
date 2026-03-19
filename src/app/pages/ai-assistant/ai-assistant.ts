import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  time: string;
  data?: any;
}

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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css'
})
export class AiAssistantComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  messages: Message[] = [];
  userInput = '';
  loading = false;

  suggestions = [
    { label: 'Properties under $1M', query: 'Show me properties under 1 million dollars' },
    { label: '3 bedroom apartments', query: 'Find 3 bedroom apartments' },
    { label: 'Hot leads', query: 'Show hot leads' },
    { label: 'Open deals', query: 'Show open deals' },
    { label: 'Revenue summary', query: 'Show revenue summary' },
    { label: 'Available listings', query: 'List available properties' }
  ];

  ngOnInit() {
    this.welcomeMessage();
  }

  private welcomeMessage() {
    this.messages.push({
      sender: 'ai',
      text: `Welcome to your AI Real Estate Assistant! I can help you:

• Search properties by price, bedrooms, location, type
• Analyze leads and identify hot prospects
• Review deal pipeline and commissions
• Generate insights from your CRM data

Try asking:
• "Show apartments under $500K in Beirut"
• "Find 3 bedroom villas"
• "List hot leads"
• "What is my revenue this month?"`,
      time: this.formatTime(new Date())
    });
  }

  onSendMessage() {
    if (!this.userInput.trim() || this.loading) return;

    const userMessage = this.userInput.trim();
    this.messages.push({
      sender: 'user',
      text: userMessage,
      time: this.formatTime(new Date())
    });
    this.userInput = '';
    this.loading = true;

    this.api.aiAssistant(userMessage).subscribe({
      next: (res) => {
        this.messages.push({
          sender: 'ai',
          text: res.response || 'I processed your request but have no specific results.',
          time: this.formatTime(new Date()),
          data: res.data
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('AI Assistant error:', err);
        this.messages.push({
          sender: 'ai',
          text: 'I encountered an error. Please try again. Make sure the backend is running and the OpenAI API key is configured.',
          time: this.formatTime(new Date())
        });
        this.loading = false;
      }
    });
  }

  useSuggestion(query: string) {
    this.userInput = query;
    this.onSendMessage();
  }

  viewProperty(propertyId: string) {
    this.router.navigate(['/properties', propertyId]);
  }

  viewAllProperties() {
    this.router.navigate(['/properties']);
  }

  viewLeads() {
    this.router.navigate(['/crm']);
  }

  viewDeals() {
    this.router.navigate(['/deals']);
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getProperties(msg: Message): any[] {
    return (msg.data?.properties?.properties || []).slice(0, 5);
  }

  hasProperties(msg: Message): boolean {
    return !!(msg.data?.properties?.count > 0);
  }

  hasLeads(msg: Message): boolean {
    return !!(msg.data?.leads?.total > 0);
  }

  hasDeals(msg: Message): boolean {
    return !!(msg.data?.deals?.total > 0);
  }

  hasRevenue(msg: Message): boolean {
    return !!(msg.data?.revenue?.totalIncome);
  }

  hasSummary(msg: Message): boolean {
    return !!(msg.data?.summary?.properties?.total > 0);
  }

  getLeadStatusKeys(msg: Message): string[] {
    const byStatus = msg.data?.leads?.byStatus;
    return byStatus ? Object.keys(byStatus) : [];
  }

  getLeadStatusValue(msg: Message, key: string): number {
    return msg.data?.leads?.byStatus?.[key] || 0;
  }

  clearChat() {
    this.messages = [];
    this.welcomeMessage();
  }
}
