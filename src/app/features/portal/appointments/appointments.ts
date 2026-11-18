import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { toApiError } from '../../../core/http/api-error';
import { AppointmentCard } from '../components/appointment-card';
import { PortalAppointment } from '../data/portal.model';
import { PortalService } from '../data/portal.service';

/** As minhas consultas: próximas (com cancelamento) e anteriores. */
@Component({
  selector: 'app-portal-appointments',
  imports: [FormsModule, AppointmentCard],
  template: `
    <section class="page narrow">
      <h1>As minhas consultas</h1>
      <p class="muted">Para marcar ou mudar uma consulta, contacte a recepção do hospital.</p>
      @if (message(); as m) {
        <div class="alert alert-success" role="status">{{ m }}</div>
      }
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      <h2>Próximas</h2>
      @for (a of upcoming(); track a.id) {
        <div class="card item">
          <app-appointment-card [appointment]="a" />
          @if (cancelling() === a.id) {
            <form class="cancel" (ngSubmit)="cancel(a)">
              <label class="field">
                <span>Motivo do cancelamento</span>
                <input name="reason" [(ngModel)]="reason" maxlength="300" />
              </label>
              <button
                class="btn btn-secondary btn-small"
                type="button"
                (click)="cancelling.set(null)"
              >
                Voltar
              </button>
              <button
                class="btn btn-danger btn-small"
                type="submit"
                [disabled]="busy() || !reason.trim()"
              >
                Cancelar consulta
              </button>
            </form>
          } @else {
            <button
              class="btn btn-secondary btn-small"
              type="button"
              (click)="cancelling.set(a.id); reason = ''"
            >
              Não posso ir
            </button>
          }
        </div>
      } @empty {
        <p class="muted">Sem consultas marcadas.</p>
      }
      <h2>Anteriores</h2>
      @for (a of past(); track a.id) {
        <div class="card item"><app-appointment-card [appointment]="a" /></div>
      } @empty {
        <p class="muted">Sem consultas anteriores.</p>
      }
    </section>
  `,
  styles: `
    h2 {
      font-size: 1.05rem;
      margin: var(--space-4) 0 var(--space-2);
    }
    .item {
      display: grid;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
      justify-items: start;
    }
    .cancel {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      align-items: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalAppointments implements OnInit {
  private readonly portal = inject(PortalService);

  protected readonly all = signal<PortalAppointment[]>([]);
  protected readonly upcoming = computed(() =>
    this.all()
      .filter((a) => a.cancellable)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
  );
  protected readonly past = computed(() => this.all().filter((a) => !a.cancellable));
  protected readonly cancelling = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected reason = '';

  ngOnInit(): void {
    this.load();
  }

  protected cancel(a: PortalAppointment): void {
    this.busy.set(true);
    this.error.set(null);
    this.portal.cancelAppointment(a.id, this.reason.trim()).subscribe({
      next: () => {
        this.busy.set(false);
        this.cancelling.set(null);
        this.message.set('Consulta cancelada. O hospital foi avisado.');
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }

  private load(): void {
    this.portal.appointments().subscribe({
      next: (a) => this.all.set(a),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
