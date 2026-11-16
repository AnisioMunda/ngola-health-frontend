import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { Doctor } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import { DaySummary, isoDate } from '../data/scheduling.model';
import { SchedulingService } from '../data/scheduling.service';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** Calendário mensal com vagas livres e marcações por dia; um clique abre a agenda do dia. */
@Component({
  selector: 'app-month-calendar',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="..">← Agenda</a>
          <h1>Calendário</h1>
        </div>
      </header>
      <div class="filters card">
        <button
          class="btn btn-secondary btn-small"
          type="button"
          (click)="shift(-1)"
          aria-label="Mês anterior"
        >
          ←
        </button>
        <h2 class="month" aria-live="polite">{{ title() }}</h2>
        <button
          class="btn btn-secondary btn-small"
          type="button"
          (click)="shift(1)"
          aria-label="Mês seguinte"
        >
          →
        </button>
        <label class="field"
          ><span>Médico</span>
          <select name="doctor" [ngModel]="doctor()" (ngModelChange)="doctor.set($event); load()">
            <option value="">Todos</option>
            @for (d of doctors(); track d.id) {
              <option [value]="d.id">{{ d.fullName }}</option>
            }
          </select>
        </label>
      </div>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="card">
        <div class="calendar" role="grid" [attr.aria-label]="title()">
          @for (w of weekdays; track w) {
            <div class="weekday" role="columnheader">{{ w }}</div>
          }
          @for (cell of cells(); track $index) {
            @if (cell; as d) {
              <a
                role="gridcell"
                class="day"
                [class.today]="d.date === today"
                [class.past]="d.date < today"
                [class.blocked]="d.blockedAllDay"
                routerLink=".."
                [queryParams]="{ date: d.date, doctorId: doctor() || null }"
                [attr.aria-label]="label(d)"
              >
                <span class="number">{{ +d.date.slice(8) }}</span>
                @if (d.blockedAllDay) {
                  <span class="badge">Ausência</span>
                } @else if (d.totalSlots > 0) {
                  <span class="free" [class.none]="d.freeSlots === 0"
                    >{{ d.freeSlots }} livre(s)</span
                  >
                }
                @if (d.appointments > 0) {
                  <span class="booked">{{ d.appointments }} marc.</span>
                }
              </a>
            } @else {
              <div class="day empty-cell" aria-hidden="true"></div>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .month {
      margin: 0;
      min-width: 12rem;
      text-align: center;
      font-size: 1.125rem;
    }
    .calendar {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: var(--space-1);
    }
    .weekday {
      text-align: center;
      font-weight: 600;
      color: var(--color-muted);
      padding: var(--space-1);
    }
    .day {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-height: 5rem;
      padding: var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      color: var(--color-text);
      text-decoration: none;
      font-size: 0.8rem;
    }
    a.day:hover,
    a.day:focus-visible {
      border-color: var(--color-primary);
    }
    .day.today {
      border: 2px solid var(--color-primary);
    }
    .day.past {
      background: var(--color-bg);
      color: var(--color-muted);
    }
    .day.blocked {
      background: var(--color-warning-soft);
    }
    .empty-cell {
      border: 0;
    }
    .number {
      font-weight: 700;
      font-size: 0.95rem;
    }
    .free {
      color: var(--color-success);
    }
    .free.none {
      color: var(--color-danger);
    }
    .booked {
      color: var(--color-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthCalendar implements OnInit {
  private readonly scheduling = inject(SchedulingService);
  private readonly episodes = inject(EpisodeService);

  readonly doctorId = input<string>();
  readonly month = input<string>();

  protected readonly today = isoDate(new Date());
  protected readonly weekdays = WEEKDAYS;
  protected readonly current = signal(this.today.slice(0, 7));
  protected readonly doctor = signal('');
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly days = signal<DaySummary[]>([]);
  protected readonly error = signal<string | null>(null);

  protected readonly title = computed(() => {
    const [y, m] = this.current().split('-').map(Number);
    return `${MONTHS[m - 1]} de ${y}`;
  });

  /** Células da grelha: vazias antes do dia 1 para alinhar com segunda-feira. */
  protected readonly cells = computed<(DaySummary | null)[]>(() => {
    const days = this.days();
    if (days.length === 0) return [];
    const [y, m, d] = days[0].date.split('-').map(Number);
    const offset = (new Date(y, m - 1, d).getDay() + 6) % 7;
    return [...Array<null>(offset).fill(null), ...days];
  });

  ngOnInit(): void {
    if (this.month()) this.current.set(this.month()!);
    this.doctor.set(this.doctorId() ?? '');
    this.episodes.doctors().subscribe({
      next: (list) => this.doctors.set(list),
      error: () => this.doctors.set([]),
    });
    this.load();
  }

  protected shift(months: number): void {
    const [y, m] = this.current().split('-').map(Number);
    const next = new Date(y, m - 1 + months, 1);
    this.current.set(isoDate(next).slice(0, 7));
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.scheduling.calendar(this.current(), this.doctor() || null).subscribe({
      next: (days) => this.days.set(days),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected label(d: DaySummary): string {
    const parts = [d.date.split('-').reverse().join('/')];
    if (d.blockedAllDay) parts.push('ausência');
    else if (d.totalSlots > 0) parts.push(`${d.freeSlots} vagas livres de ${d.totalSlots}`);
    else parts.push('sem consultas');
    if (d.appointments > 0) parts.push(`${d.appointments} marcações`);
    return parts.join(', ');
  }
}
