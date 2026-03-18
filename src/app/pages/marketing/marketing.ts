import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-marketing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './marketing.html',
  styleUrl: './marketing.css'
})
export class MarketingComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  properties: any[] = [];
  selectedProperty: any = null;

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

  socialPlatforms = ['Facebook', 'Instagram', 'LinkedIn'];

  ngOnInit() {
    this.fetchProperties();
  }

  fetchProperties() {
    this.api.getProperties().subscribe({
      next: (data) => {
        this.properties = data && data.length > 0 ? data : this.getMockProperties();
      },
      error: (err) => {
        console.error('Failed to fetch properties', err);
        this.properties = this.getMockProperties();
      }
    });
  }

  selectProperty(property: any) {
    this.selectedProperty = property;
    this.content = {
      description: '',
      social_post: '',
      ads_copy: '',
      captions_hashtags: ''
    };
  }

  generate(type: 'description' | 'social_post' | 'ads_copy' | 'captions_hashtags') {
    if (!this.selectedProperty) {
      this.snackBar.open('Please select a property first', 'Close', { duration: 3000 });
      return;
    }

    this.loading[type] = true;
    this.api.generateMarketingContent({ 
      propertyId: this.selectedProperty.id, 
      contentType: type 
    }).subscribe({
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
    this.snackBar.open(`Opening ${platform} sharing...`, 'Close', { duration: 2000 });
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
        this.snackBar.open('Instagram requires mobile app. Copy the text and hashtags manually.', 'Close', { duration: 5000 });
        return;
    }
    if (url) window.open(url, '_blank');
  }

  private getMockProperties() {
    return [
      {
        id: '1',
        title: 'Penthouse with Panoramic City View',
        price: 1250000,
        address: 'Downtown Avenue',
        city: 'Dubai',
        country: 'UAE',
        bedrooms: 4,
        bathrooms: 3,
        area: 320,
        type: 'Apartment',
        status: 'Available'
      },
      {
        id: '2',
        title: 'Ultra Luxury Beachfront Villa',
        price: 4500000,
        address: 'Palm Jumeirah',
        city: 'Dubai',
        country: 'UAE',
        bedrooms: 6,
        bathrooms: 7,
        area: 850,
        type: 'Villa',
        status: 'Reserved'
      }
    ];
  }
}
