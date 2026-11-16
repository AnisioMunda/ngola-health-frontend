import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import { toApiError } from '../../../core/http/api-error';
import { DayAvailability, SLOT_STATE_LABELS, Slot, hhmm } from '../data/scheduling.model';
import { SchedulingService } from '../data/scheduling.service';

/** Vagas de um médico num dia; só as livres se podem escolher. */
@Component({
  selector: 'app-slot-picker',
  template: `
    @if (!doctorId() || !date()) {
      <p class="muted">Escolha o médico e a data para ver as vagas.</p>
    } @else if (error(); as message) {
      <div class="alert alert-error" role="alert">{{ message }}</div>
    } @else if (day(); as d) {
      @if (d.slots.length === 0) {
        <p class="muted">{{ d.doctorName }} não tem consultas neste dia.</p>
      } @else {
        <p class="muted">{{ d.freeSlots }} vaga(s) livre(s) com {{ d.doctorName }}.</p>
        <div class="slots" role="radiogroup" aria-label="Vagas">
          @for (s of d.slots; track s.startTime) {
            <button
              type="button"
              role="radio"
              class="slot slot-{{ s.state }}"
              [class.selected]="selected() === s.startTime"
              [attr.aria-checked]="selected() === s.startTime"
              [disabled]="s.state !== 'FREE'"
              [title]="title(s)"
              (click)="selected.set(s.startTime)"
            >
              {{ hhmm(s.startTime) }}
              <small>{{
                s.state === 'FREE' ? s.booked + '/' + s.capacity : labels[s.state]
              }}</small>
            </button>
          }
        </div>
        @for (b of d.blocks; track b.id) {
          <p class="muted">
            Ausência {{ b.allDay ? 'todo o dia' : hhmm(b.startTime) + '–' + hhmm(b.endTime) }}:
            {{ b.reason }}
          </p>
        }
      }
    } @else {
      <p class="muted" role="status">A carregar vagas…</p>
    }
  `,
  styles: `
    .slots {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
      gap: var(--space-2);
      margin: var(--space-2) 0;
    }
    .slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-text);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .slot small {
      font-weight: 400;
      color: var(--color-muted);
    }
    .slot:disabled {
      cursor: not-allowed;
      background: var(--color-bg);
      color: var(--color-muted);
    }
    .slot.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-soft);
      color: var(--color-primary);
      outline: 2px solid var(--color-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotPicker {
  private readonly scheduling = inject(SchedulingService);

  readonly doctorId = input<string | null>(null);
  readonly date = input<string | null>(null);
  /** Hora escolhida ("09:00:00"); limpa-se quando o médico ou a data mudam. */
  readonly selected = model<string | null>(null);

  protected readonly day = signal<DayAvailability | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly labels = SLOT_STATE_LABELS;
  protected readonly hhmm = hhmm;

  constructor() {
    effect(() => {
      const doctorId = this.doctorId();
      const date = this.date();
      this.day.set(null);
      this.error.set(null);
      this.selected.set(null);
      if (!doctorId || !date) return;
      this.scheduling.availability(doctorId, date).subscribe({
        next: (d) => this.day.set(d),
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
    });
  }

  protected title(s: Slot): string {
    return `${hhmm(s.startTime)}–${hhmm(s.endTime)}: ${this.labels[s.state]} (${s.booked}/${s.capacity})`;
  }
}
