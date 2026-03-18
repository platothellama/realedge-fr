import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-marketing-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './marketing-generator.html',
  styleUrl: './marketing-generator.css'
})
export class MarketingGeneratorComponent implements OnInit {
  @Input() propertyId!: string;

  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = {
    description: false,
    social_post: false,
    ads_copy: false,
    captions_hashtags: false
  };

  content = {
    description: '',
    social_post: '',
    ads_copy: '',
    captions_hashtags: ''
  };

  ngOnInit(): void {}

  generate(type: 'description' | 'social_post' | 'ads_copy' | 'captions_hashtags') {
    this.loading[type] = true;
    this.api.generateMarketingContent({ propertyId: this.propertyId, contentType: type }).subscribe({
      next: (res) => {
        this.content[type] = res.content;
        this.loading[type] = false;
        this.snackBar.open('Content generated successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Generation error', err);
        this.loading[type] = false;
        this.snackBar.open('Failed to generate content. Please check your OpenAI API key.', 'Close', { duration: 5000 });
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  exportToSocial(platform: string, text: string) {
    // Basic export simulation
    this.snackBar.open(`Exporting to ${platform}...`, 'Close', { duration: 2000 });
    // In a real app, this would use Social Media APIs or specialized sharing links
    const encodedText = encodeURIComponent(text);
    let url = '';
    switch (platform) {
      case 'Facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${encodedText}`;
        break;
      case 'LinkedIn':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`;
        break;
      case 'Instagram':
        // Instagram doesn't support direct text sharing via URL like others
        this.snackBar.open('Instagram sharing requires mobile app. Copy the text and hashtags manually.', 'Close', { duration: 5000 });
        return;
    }
    if (url) window.open(url, '_blank');
  }
}
