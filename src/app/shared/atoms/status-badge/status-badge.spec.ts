import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge';

describe('StatusBadgeComponent', () => {
  it('creates with the canonical class for a known status', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentInstance.status = 'Available';
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(el.textContent).toContain('Available');
    expect(el.className).toContain('badge-success');
  });

  it('falls back to badge-primary for unknown statuses', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentInstance.status = 'Something New';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.status-badge').className).toContain(
      'badge-primary'
    );
  });
});
