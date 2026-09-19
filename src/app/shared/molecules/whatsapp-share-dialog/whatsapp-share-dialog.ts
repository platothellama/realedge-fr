import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ShareService, ShareMediaItem, PropertyShareData } from '../../../services/share/share.service';

export interface WhatsappShareDialogData {
  property: PropertyShareData & { id?: string };
  photos?: string[];
  videos?: { url: string; label: string }[];
  tours?: string[];
  documents?: string[];
  preselectedUrls?: string[];
}

interface PickableItem extends ShareMediaItem {
  selected: boolean;
}

@Component({
  selector: 'app-whatsapp-share-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './whatsapp-share-dialog.html',
  styleUrl: './whatsapp-share-dialog.css',
})
export class WhatsappShareDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<WhatsappShareDialogComponent>);
  private share = inject(ShareService);
  private snackBar = inject(MatSnackBar);
  data: WhatsappShareDialogData = inject(MAT_DIALOG_DATA);

  items: PickableItem[] = [];
  phone = '';
  customMessage = '';
  includeDetailsLink = true;
  sharing = false;

  get canNativeShare(): boolean {
    return this.share.canNativeShare;
  }

  ngOnInit(): void {
    const d = this.data || ({} as WhatsappShareDialogData);
    const pre = new Set(d.preselectedUrls || []);
    const push = (kind: PickableItem['kind'], url: string, label: string) => {
      if (!url) return;
      this.items.push({ kind, url, label, selected: pre.size ? pre.has(url) : true });
    };
    (d.photos || []).filter(Boolean).forEach((url, i) => push('image', url, `Photo ${i + 1}`));
    (d.videos || []).filter((v) => !!v?.url).forEach((v) => push('video', v.url, v.label || 'Video'));
    (d.tours || []).filter(Boolean).forEach((url, i) => push('tour', url, `Virtual tour ${i + 1}`));
    (d.documents || []).filter(Boolean).forEach((url) => push('document', url, this.share.fileNameFromUrl(url)));
    // If nothing preselected-explicit, default-select first 5 to keep message short.
    if (!pre.size && this.items.length > 8) {
      this.items.forEach((it, idx) => (it.selected = idx < 8));
    }
  }

  get selectedItems(): PickableItem[] {
    return this.items.filter((i) => i.selected);
  }

  get grouped() {
    const groups: { kind: string; title: string; icon: string; items: PickableItem[] }[] = [];
    const defs: Record<string, { title: string; icon: string }> = {
      image: { title: 'Images', icon: 'photo_library' },
      video: { title: 'Videos', icon: 'videocam' },
      tour: { title: 'Virtual tours', icon: '360' },
      document: { title: 'Documents', icon: 'description' },
      link: { title: 'Links', icon: 'link' },
    };
    for (const kind of ['image', 'video', 'tour', 'document', 'link']) {
      const items = this.items.filter((i) => i.kind === kind);
      if (items.length) groups.push({ kind, ...defs[kind], items });
    }
    return groups;
  }

  get messagePreview(): string {
    const propertyUrl = this.includeDetailsLink ? this.propertyUrl() : undefined;
    return this.share.buildPropertyMessage(
      { ...this.data.property, propertyUrl },
      this.selectedItems,
      this.customMessage
    );
  }

  get selectedCount(): number {
    return this.selectedItems.length;
  }

  propertyUrl(): string | undefined {
    const id = (this.data.property as any)?.id;
    if (!id) return undefined;
    try {
      return `${window.location.origin}/properties/${id}`;
    } catch {
      return undefined;
    }
  }

  toggleAll(group: { items: PickableItem[] }, checked: boolean): void {
    group.items.forEach((i) => (i.selected = checked));
  }

  isAllSelected(group: { items: PickableItem[] }): boolean {
    return group.items.length > 0 && group.items.every((i) => i.selected);
  }

  absoluteUrl(url: string): string {
    return this.share.toAbsoluteUrl(url);
  }

  thumbFor(item: PickableItem): string | null {
    if (item.kind === 'image') return this.absoluteUrl(item.url);
    return null;
  }

  openWhatsApp(): void {
    if (!this.selectedCount) {
      this.snackBar.open('Select at least one photo, video or document', 'Close', { duration: 3000 });
      return;
    }
    this.share.sharePropertyViaWhatsApp(
      { ...this.data.property, propertyUrl: this.includeDetailsLink ? this.propertyUrl() : undefined },
      this.selectedItems,
      { phone: this.phone, message: this.customMessage }
    );
    this.dialogRef.close({ shared: true, channel: 'whatsapp' });
  }

  async nativeShare(): Promise<void> {
    if (!this.selectedCount) {
      this.snackBar.open('Select at least one item first', 'Close', { duration: 3000 });
      return;
    }
    this.sharing = true;
    try {
      const text = this.messagePreview;
      const urls = this.selectedItems.map((i) => i.url);
      const opened = await this.share.nativeShareMedia(this.data.property.title || 'Property', text, urls);
      if (opened) {
        this.dialogRef.close({ shared: true, channel: 'native' });
      } else {
        // Fallback to WhatsApp text share
        this.openWhatsApp();
      }
    } finally {
      this.sharing = false;
    }
  }

  copyMessage(): void {
    navigator.clipboard.writeText(this.messagePreview).then(
      () => this.snackBar.open('Message copied — paste it in WhatsApp', 'Close', { duration: 3000 }),
      () => this.snackBar.open('Copy failed — select the preview text manually', 'Close', { duration: 3000 })
    );
  }

  close(): void {
    this.dialogRef.close();
  }
}
