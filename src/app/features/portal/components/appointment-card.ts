import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { APPOINTMENT_STATUS, APPOINTMENT_TYPE, PortalAppointment } from '../data/portal.model';

/** Uma consulta: data, hora, médico e estado. */
@Component({
  selector: 'app-appointment-card',
  imports: [DatePipe],
  template: `
    @let a = appointment();
    <div class="when">
      <strong>{{ a.date | date: 'EEEE, d MMMM' }}</strong>
      <span>{{ a.startTime.slice(0, 5) }}–{{ a.endTime.slice(0, 5) }}</span>
    </div>
    <div class="what">
      {{ types[a.type] }} com {{ a.doctorName }}
      <span class="muted">{{ a.reason }}</span>
    </div>
    <span class="badge appt-{{ a.status }}">{{ statuses[a.status] }}</span>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2) var(--space-4);
    }
    .when {
      display: flex;
      flex-direction: column;
      min-width: 11rem;
    }
    .when strong::first-letter {
      text-transform: uppercase;
    }
    .what {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentCard {
  readonly appointment = input.required<PortalAppointment>();
  protected readonly statuses = APPOINTMENT_STATUS;
  protected readonly types = APPOINTMENT_TYPE;
}
