import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ApiService } from '../../services/api';
import { VisitFormComponent } from '../../components/visit-form/visit-form';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-visits',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FullCalendarModule,
    MatSnackBarModule
  ],
  templateUrl: './visits.html',
  styleUrl: './visits.css'
})
export class VisitsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    themeSystem: 'standard',
    height: 'auto',
    allDaySlot: false,
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    eventClick: this.handleEventClick.bind(this),
    events: []
  });

  ngOnInit(): void {
    this.fetchVisits();
  }

  fetchVisits() {
    this.api.getVisits().subscribe({
      next: (res) => {
        const visits = Array.isArray(res) ? res : (res.data || []);
        const events = visits.map((v: any) => ({
          id: v.id,
          title: `${v.clientName} - ${v.title}`,
          start: v.visitDate,
          extendedProps: { ...v },
          backgroundColor: this.getEventColor(v.status),
          borderColor: 'transparent'
        }));
        
        this.calendarOptions.update(options => ({
          ...options,
          events: events
        }));
      },
      error: (err) => console.error('Failed to fetch visits', err)
    });
  }

  getEventColor(status: string): string {
    switch (status) {
      case 'Scheduled': return '#6366f1';
      case 'Completed': return '#10b981';
      case 'Cancelled': return '#ef4444';
      case 'No Show': return '#f59e0b';
      default: return '#6366f1';
    }
  }

  handleEventClick(arg: EventClickArg) {
    const visit = arg.event.extendedProps;
    this.openVisitForm(visit);
  }

  openVisitForm(visit?: any) {
    const dialogRef = this.dialog.open(VisitFormComponent, {
      width: '600px',
      data: { visit }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (visit && visit.id) {
          this.updateVisit(visit.id, result);
        } else {
          this.createVisit(result);
        }
      }
    });
  }

  createVisit(data: any) {
    this.api.createVisit(data).subscribe({
      next: () => {
        this.snackBar.open('Visit scheduled successfully', 'Close', { duration: 3000 });
        this.fetchVisits();
      },
      error: (err) => this.snackBar.open('Failed to schedule visit', 'Close', { duration: 3000 })
    });
  }

  updateVisit(id: string, data: any) {
    this.api.updateVisit(id, data).subscribe({
      next: () => {
        this.snackBar.open('Visit updated successfully', 'Close', { duration: 3000 });
        this.fetchVisits();
      },
      error: (err) => this.snackBar.open('Failed to update visit', 'Close', { duration: 3000 })
    });
  }
}
