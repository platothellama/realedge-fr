import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="chart-wrapper">
      @if (loading) {
        <div class="chart-loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="donut-container">
          <svg viewBox="0 0 100 100" class="donut">
            @for (segment of segments; track $index) {
              <circle
                class="donut-segment"
                [attr.stroke]="segment.color"
                [attr.stroke-dasharray]="segment.dashArray"
                [attr.stroke-dashoffset]="segment.offset"
                [style.animation-delay]="$index * 0.1 + 's'"
              />
            }
            <circle class="donut-hole" cx="50" cy="50" r="35" />
          </svg>
          <div class="donut-center">
            <span class="center-value">{{ total }}</span>
            <span class="center-label">{{ label }}</span>
          </div>
        </div>
        <div class="chart-legend">
          @for (item of data; track item.label) {
            <div class="legend-item">
              <span class="legend-color" [style.background]="item.color"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-value">{{ item.value }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-wrapper { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .chart-loading { padding: 40px; display: flex; justify-content: center; }
    .donut-container { position: relative; width: 160px; height: 160px; }
    .donut { transform: rotate(-90deg); }
    .donut-segment { fill: none; stroke-width: 20; cx: 50; cy: 50; r: 40; transition: stroke-dasharray 0.5s ease; animation: fadeIn 0.5s ease forwards; opacity: 0; }
    .donut-hole { fill: var(--bg-card, #1a1a2e); }
    @keyframes fadeIn { to { opacity: 1; } }
    .donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
    .center-value { display: block; font-size: 24px; font-weight: 700; color: var(--text-primary); }
    .center-label { display: block; font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
    .chart-legend { width: 100%; display: flex; flex-direction: column; gap: 8px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .legend-color { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .legend-label { flex: 1; color: var(--text-secondary); }
    .legend-value { font-weight: 600; color: var(--text-primary); }
  `]
})
export class DonutChartComponent implements OnChanges {
  @Input() data: { label: string; value: number; color: string }[] = [];
  @Input() label = 'Total';
  @Input() loading = false;

  segments: { dashArray: string; offset: string; color: string }[] = [];
  total = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data?.length) {
      this.calculateChart();
    }
  }

  calculateChart() {
    this.total = this.data.reduce((sum, d) => sum + d.value, 0);
    const circumference = 2 * Math.PI * 40;
    let currentOffset = 0;

    this.segments = this.data.map(item => {
      const percentage = this.total > 0 ? item.value / this.total : 0;
      const dashLength = circumference * percentage;
      const offset = -currentOffset;
      currentOffset += dashLength;
      return {
        dashArray: `${dashLength} ${circumference - dashLength}`,
        offset: String(offset),
        color: item.color
      };
    });
  }
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="chart-wrapper">
      @if (loading) {
        <div class="chart-loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="bar-container">
          @for (bar of bars; track bar.label; let i = $index) {
            <div class="bar-item">
              <div class="bar-label">{{ bar.label }}</div>
              <div class="bar-track">
                <div 
                  class="bar-fill" 
                  [style.width.%]="bar.percentage"
                  [style.background]="bar.color"
                  [style.animation-delay]="i * 0.05 + 's'"
                ></div>
              </div>
              <div class="bar-value">{{ bar.formatted }}</div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-wrapper { width: 100%; }
    .chart-loading { padding: 40px; display: flex; justify-content: center; }
    .bar-container { display: flex; flex-direction: column; gap: 12px; }
    .bar-item { display: flex; align-items: center; gap: 12px; }
    .bar-label { width: 80px; font-size: 13px; color: var(--text-secondary); text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 24px; background: var(--bg-elevated); border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 6px; animation: slideIn 0.5s ease forwards; width: 0; }
    @keyframes slideIn { to { width: var(--target-width); } }
    .bar-value { width: 70px; font-size: 13px; font-weight: 600; color: var(--text-primary); flex-shrink: 0; }
  `]
})
export class BarChartComponent implements OnChanges {
  @Input() data: { label: string; value: number; color: string }[] = [];
  @Input() loading = false;
  @Input() formatValue: (v: number) => string = (v) => v.toString();

  bars: { label: string; value: number; percentage: number; color: string; formatted: string }[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data?.length) {
      this.calculateBars();
    }
  }

  calculateBars() {
    const max = Math.max(...this.data.map(d => d.value));
    this.bars = this.data.map(item => ({
      ...item,
      percentage: max > 0 ? (item.value / max) * 100 : 0,
      formatted: this.formatValue(item.value)
    }));
  }
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="chart-wrapper">
      @if (loading) {
        <div class="chart-loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="line-container">
          <svg viewBox="0 0 300 100" preserveAspectRatio="none" class="line-svg">
            <defs>
              <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
              </linearGradient>
            </defs>
            @if (points.length > 1) {
              <path [attr.d]="areaPath" [attr.fill]="'url(#' + gradientId + ')'" class="area" />
              <path [attr.d]="linePath" stroke="var(--primary)" stroke-width="2" fill="none" class="line" />
              @for (point of points; track $index) {
                <circle [attr.cx]="point.x" [attr.cy]="point.y" r="4" class="point" [style.animation-delay]="$index * 0.05 + 's'" />
              }
            }
          </svg>
          <div class="line-labels">
            @for (label of labels; track label) {
              <span>{{ label }}</span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-wrapper { width: 100%; }
    .chart-loading { padding: 40px; display: flex; justify-content: center; }
    .line-container { display: flex; flex-direction: column; gap: 8px; }
    .line-svg { width: 100%; height: 100px; }
    .line { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: draw 1s ease forwards; }
    .area { opacity: 0; animation: fadeIn 0.5s 0.5s ease forwards; }
    .point { fill: var(--primary); opacity: 0; animation: popIn 0.3s ease forwards; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes fadeIn { to { opacity: 1; } }
    @keyframes popIn { to { opacity: 1; } }
    .line-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
  `]
})
export class LineChartComponent implements OnChanges {
  @Input() data: number[] = [];
  @Input() labels: string[] = [];
  @Input() loading = false;
  
  gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  points: { x: number; y: number }[] = [];
  linePath = '';
  areaPath = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data?.length) {
      this.calculatePath();
    }
  }

  calculatePath() {
    const width = 300;
    const height = 100;
    const padding = 5;
    const max = Math.max(...this.data);
    const min = Math.min(...this.data);
    const range = max - min || 1;

    this.points = this.data.map((value, index) => ({
      x: padding + (index / (this.data.length - 1)) * (width - padding * 2),
      y: height - padding - ((value - min) / range) * (height - padding * 2)
    }));

    if (this.points.length > 1) {
      this.linePath = this.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const areaPoints = [...this.points.map(p => `${p.x},${p.y}`), `${this.points[this.points.length - 1].x},${height}`, `${this.points[0].x},${height}`];
      this.areaPath = `M ${this.points.map(p => `${p.x},${p.y}`).join(' L ')} L ${this.points[this.points.length - 1].x},${height} L ${this.points[0].x},${height} Z`;
    }
  }
}

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton" [class]="variant" [style.width]="width" [style.height]="height"></div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    .skeleton.circle { border-radius: 50%; }
    .skeleton.text { height: 16px; }
    .skeleton.card { min-height: 200px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `]
})
export class SkeletonComponent {
  @Input() variant: 'text' | 'circle' | 'card' | '' = '';
  @Input() width = '100%';
  @Input() height = '100%';
}
