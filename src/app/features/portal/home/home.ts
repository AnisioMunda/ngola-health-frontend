import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { AppointmentCard } from '../components/appointment-card';
import { ResultRow } from '../components/result-row';
import {
  PortalAppointment,
  PortalInvoice,
  PortalLabRequest,
  PortalPrescription,
  PortalProfile,
} from '../data/portal.model';
import { PortalService } from '../data/portal.service';

/** Início do portal: próxima consulta, últimos resultados, receitas por levantar e contas por pagar. */
@Component({
  selector: 'app-portal-home',
  imports: [RouterLink, DatePipe, CurrencyPipe, AppointmentCard, ResultRow],
  template: `
    <section class="page">
      @if (profile(); as p) {
        <header class="page-header">
          <div>
            <h1>Olá, {{ firstName() }}</h1>
            <p class="muted">{{ p.hospitalName }} · processo {{ p.recordNumber }}</p>
          </div>
        </header>
      }
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      <div class="grid-cards">
        <section class="card">
          <h2>Próxima consulta</h2>
          @if (next(); as a) {
            <app-appointment-card [appointment]="a" />
          } @else {
            <p class="muted">Sem consultas marcadas.</p>
          }
          <a routerLink="appointments">Ver todas</a>
        </section>
        <section class="card">
          <h2>Últimos resultados</h2>
          @if (latest(); as r) {
            <p class="muted">{{ r.number }} · {{ r.requestedAt | date: 'dd/MM/yyyy' }}</p>
            @for (res of r.results; track res.testName) {
              <app-result-row [result]="res" />
            }
            @if (r.pending > 0) {
              <p class="muted">{{ r.pending }} exame(s) ainda por concluir.</p>
            }
          } @else {
            <p class="muted">Sem resultados disponíveis.</p>
          }
          <a routerLink="results">Ver todos</a>
        </section>
        <section class="card">
          <h2>Receitas por levantar</h2>
          <p class="big">{{ toCollect() }}</p>
          <a routerLink="prescriptions">Ver receitas</a>
        </section>
        <section class="card">
          <h2>Por pagar</h2>
          <p class="big">{{ owed() | currency: 'AOA' }}</p>
          <a routerLink="invoices">Ver facturas</a>
        </section>
      </div>
    </section>
  `,
  styles: `
    .grid-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
      gap: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
    .big {
      font-size: 1.6rem;
      font-weight: 600;
      margin: 0 0 var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalHome implements OnInit {
  private readonly portal = inject(PortalService);

  protected readonly profile = signal<PortalProfile | null>(null);
  protected readonly appointments = signal<PortalAppointment[]>([]);
  protected readonly results = signal<PortalLabRequest[]>([]);
  protected readonly prescriptions = signal<PortalPrescription[]>([]);
  protected readonly invoices = signal<PortalInvoice[]>([]);
  protected readonly error = signal<string | null>(null);

  protected readonly firstName = computed(() => this.profile()?.fullName.split(' ')[0] ?? '');
  /** A mais próxima das que ainda vão acontecer. */
  protected readonly next = computed(
    () =>
      this.appointments()
        .filter((a) => a.cancellable)
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0],
  );
  protected readonly latest = computed(() => this.results().find((r) => r.results.length > 0));
  protected readonly toCollect = computed(
    () =>
      this.prescriptions().filter(
        (p) => p.status === 'ACTIVE' || p.status === 'PARTIALLY_DISPENSED',
      ).length,
  );
  protected readonly owed = computed(() =>
    this.invoices()
      .filter((i) => i.documentType === 'FT')
      .reduce((sum, i) => sum + i.balance, 0),
  );

  ngOnInit(): void {
    const fail = (err: unknown) => this.error.set(toApiError(err).message);
    this.portal.me().subscribe({ next: (p) => this.profile.set(p), error: fail });
    this.portal.appointments().subscribe({ next: (a) => this.appointments.set(a), error: fail });
    this.portal.labResults().subscribe({ next: (r) => this.results.set(r), error: fail });
    this.portal.prescriptions().subscribe({ next: (p) => this.prescriptions.set(p), error: fail });
    this.portal.invoices().subscribe({ next: (i) => this.invoices.set(i), error: fail });
  }
}
