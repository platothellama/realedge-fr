import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GlobalLoader } from './global-loader';
import { LoadingService } from '../../../services/loading/loading.service';

describe('GlobalLoader', () => {
  let loader: LoadingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalLoader],
    }).compileComponents();
    loader = TestBed.inject(LoadingService);
    loader.reset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    loader.reset();
  });

  it('creates hidden by default', () => {
    const fixture = TestBed.createComponent(GlobalLoader);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;
    expect(cmp.visible()).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-testid="global-loader"]')).toBeNull();
  });

  it('becomes visible after the debounce delay while loading', () => {
    const fixture = TestBed.createComponent(GlobalLoader);
    fixture.detectChanges();
    loader.show();
    fixture.detectChanges();
    // Not yet visible before the delay.
    expect(fixture.componentInstance.visible()).toBe(false);
    vi.advanceTimersByTime(GlobalLoader.SHOW_DELAY_MS + 50);
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="global-loader"]'),
    ).not.toBeNull();
  });

  it('stays hidden if loading finishes before the delay (no flicker)', () => {
    const fixture = TestBed.createComponent(GlobalLoader);
    fixture.detectChanges();
    loader.show();
    fixture.detectChanges();
    loader.hide();
    vi.advanceTimersByTime(GlobalLoader.SHOW_DELAY_MS + 50);
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBe(false);
  });
});
