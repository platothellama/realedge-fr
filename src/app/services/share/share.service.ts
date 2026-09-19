import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ShareMediaItem {
  kind: 'image' | 'video' | 'document' | 'tour' | 'link';
  url: string;
  label: string;
}

export interface PropertyShareData {
  title?: string;
  price?: number | string;
  listingType?: string;
  address?: string;
  city?: string;
  country?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

/**
 * Central helper for sharing property media via WhatsApp.
 *
 * WhatsApp has no public "attach file" URL API — `wa.me/?text=` only accepts
 * text + public URLs. So the strategy is:
 *  1. Build a nicely formatted message with absolute URLs for each media item.
 *  2. Open `https://wa.me/<phone>?text=<encoded>` (or without phone for picker).
 *  3. Where the Web Share API with files is supported (mobile Chrome/Safari),
 *     offer native share which CAN attach the actual binary to WhatsApp.
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  /** Turn a possibly-relative upload path into a public absolute URL. */
  toAbsoluteUrl(url: string): string {
    if (!url) return url;
    if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url;
    const base = (environment.apiUrl || '').replace(/\/api\/?$/, '') || window.location.origin;
    const clean = url.startsWith('/') ? url : `/uploads/${url.replace(/^\/*/, '')}`;
    // Already an /uploads/... path
    if (clean.startsWith('/uploads/')) return `${base}${clean}`;
    return `${base}${clean}`;
  }

  buildWhatsAppUrl(text: string, phone?: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    return digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  /** Open WhatsApp (new tab) with prefilled text. Returns the URL for testing. */
  shareTextViaWhatsApp(text: string, phone?: string): string {
    const url = this.buildWhatsAppUrl(text, phone);
    window.open(url, '_blank', 'noopener');
    return url;
  }

  buildPropertyMessage(property: PropertyShareData, media: ShareMediaItem[], extraMessage?: string): string {
    const lines: string[] = [];
    if (property.title) lines.push(`*${property.title}*`);
    const specs: string[] = [];
    if (property.price) {
      const priceNum = Number(property.price);
      specs.push(`Price: $${isNaN(priceNum) ? property.price : priceNum.toLocaleString()}${property.listingType === 'Rent' ? '/mo' : ''}`);
    }
    if (property.bedrooms != null) specs.push(`${property.bedrooms} bd`);
    if (property.bathrooms != null) specs.push(`${property.bathrooms} ba`);
    if (property.area != null) specs.push(`${property.area} sqm`);
    if (specs.length) lines.push(specs.join(' | '));
    const location = [property.address, property.city, property.country].filter(Boolean).join(', ');
    if (location) lines.push(`Location: ${location}`);
    if (extraMessage?.trim()) {
      lines.push('');
      lines.push(extraMessage.trim());
    }
    const grouped: Record<string, ShareMediaItem[]> = {};
    for (const m of media) {
      (grouped[m.kind] ||= []).push(m);
    }
    const labelFor: Record<string, string> = {
      image: 'Photos',
      video: 'Videos',
      tour: 'Virtual tours',
      document: 'Documents',
      link: 'Links',
    };
    for (const kind of ['image', 'video', 'tour', 'document', 'link']) {
      const items = grouped[kind];
      if (!items?.length) continue;
      lines.push('');
      lines.push(`${labelFor[kind]}:`);
      items.forEach((item, i) => {
        lines.push(`${i + 1}. ${this.toAbsoluteUrl(item.url)}`);
      });
    }
    return lines.join('\n');
  }

  sharePropertyViaWhatsApp(property: PropertyShareData, media: ShareMediaItem[], opts?: { phone?: string; message?: string }): string {
    const text = this.buildPropertyMessage(property, media, opts?.message);
    return this.shareTextViaWhatsApp(text, opts?.phone);
  }

  // ---- Native Web Share API (can attach real files to WhatsApp on mobile) ----

  get canNativeShare(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }

  canShareFiles(files: File[]): boolean {
    try {
      return this.canNativeShare && !!((navigator as any).canShare?.({ files }));
    } catch {
      return false;
    }
  }

  async fetchAsFile(url: string, filename?: string): Promise<File | null> {
    try {
      const absolute = this.toAbsoluteUrl(url);
      const res = await fetch(absolute);
      if (!res.ok) return null;
      const blob = await res.blob();
      const name = filename || this.fileNameFromUrl(url) || 'media';
      return new File([blob], name, { type: blob.type || 'application/octet-stream' });
    } catch {
      return null;
    }
  }

  /**
   * Try native share with downloaded files (works best on mobile).
   * Returns true if the native sheet was opened, false if caller should fall back to wa.me.
   */
  async nativeShareMedia(title: string, text: string, urls: string[]): Promise<boolean> {
    if (!this.canNativeShare) return false;
    try {
      const files: File[] = [];
      // Only attempt file attach for a reasonable count to avoid OOM.
      for (const url of urls.slice(0, 5)) {
        const file = await this.fetchAsFile(url);
        if (file) files.push(file);
      }
      if (files.length && this.canShareFiles(files)) {
        await (navigator as any).share({ title, text, files });
        return true;
      }
      await (navigator as any).share({ title, text, url: urls[0] });
      return true;
    } catch (err: any) {
      // AbortError = user dismissed sheet — treat as handled.
      if (err?.name === 'AbortError') return true;
      return false;
    }
  }

  fileNameFromUrl(url: string): string {
    try {
      const clean = url.split('?')[0].split('#')[0];
      const parts = clean.split('/');
      return decodeURIComponent(parts[parts.length - 1] || url);
    } catch {
      return url;
    }
  }
}
