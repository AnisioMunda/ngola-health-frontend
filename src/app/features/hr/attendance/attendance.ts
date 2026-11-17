import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { Attendance, StaffMember, addDaysIso, hours, toIso } from '../data/hr.model';
import { HrService } from '../data/hr.service';

/** Registos de ponto (gestores): consulta por período e correcção com motivo. */
@Component({
  selector: 'app-attendance',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/hr">← Recursos humanos</a>
          <h1>Registos de ponto</h1>
        </div>
      </header>
      <form class="filters card" (ngSubmit)="load()">
        <label class="field"
          ><span>De</span><input type="date" name="from" [(ngModel)]="from"
        /></label>
        <label class="field"
          ><span>Até</span><input type="date" name="to" [(ngModel)]="to"
        /></label>
        <label class="field"
          ><span>Profissional</span>
          <select name="user" [(ngModel)]="userId">
            <option value="">Todos</option>
            @for (p of staff(); track p.id) {
              <option [value]="p.id">{{ p.fullName }}</option>
            }
          </select>
        </label>
        <button class="btn btn-secondary" type="submit">Ver</button>
      </form>
      @if (message(); as m) {
        <div class="alert alert-success" role="status">{{ m }}</div>
      }
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      @if (editing(); as r) {
        <form class="card" (ngSubmit)="saveCorrection()">
          <h2>Corrigir ponto de {{ r.userName }}</h2>
          <div class="grid">
            <label class="field"
              ><span>Entrada</span><input type="datetime-local" name="in" [(ngModel)]="fix.clockIn"
            /></label>
            <label class="field"
              ><span>Saída</span><input type="datetime-local" name="out" [(ngModel)]="fix.clockOut"
            /></label>
            <label class="field span-2"
              ><span>Motivo</span><input name="reason" [(ngModel)]="fix.reason" maxlength="300"
            /></label>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" (click)="editing.set(null)">
              Cancelar
            </button>
            <button class="btn btn-primary" type="submit" [disabled]="busy() || !fix.reason.trim()">
              Guardar correcção
            </button>
          </div>
        </form>
      }
      <div class="card table-card">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Profissional</th>
                <th scope="col">Entrada</th>
                <th scope="col">Saída</th>
                <th scope="col">Trabalhado</th>
                <th scope="col">Atraso</th>
                <th scope="col">Extra</th>
                <th scope="col"><span class="visually-hidden">Acções</span></th>
              </tr>
            </thead>
            <tbody>
              @for (r of records(); track r.id) {
                <tr>
                  <td>
                    {{ r.userName }}
                    @if (!r.shiftId) {
                      <span class="subtext">sem turno</span>
                    }
                    @if (r.correctionReason) {
                      <span class="subtext">Corrigido: {{ r.correctionReason }}</span>
                    }
                  </td>
                  <td>{{ r.clockIn | date: 'dd/MM HH:mm' }}</td>
                  <td>{{ r.clockOut ? (r.clockOut | date: 'dd/MM HH:mm') : 'em serviço' }}</td>
                  <td>{{ hours(r.minutesWorked) }}</td>
                  <td>{{ r.lateMinutes ? r.lateMinutes + ' min' : '—' }}</td>
                  <td>{{ r.overtimeMinutes ? hours(r.overtimeMinutes) : '—' }}</td>
                  <td class="actions">
                    <button class="btn btn-small btn-secondary" type="button" (click)="edit(r)">
                      Corrigir
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty">Sem registos no período.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: `
    .card {
      margin-bottom: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendancePage implements OnInit {
  private readonly hr = inject(HrService);

  protected readonly hours = hours;
  protected readonly staff = signal<StaffMember[]>([]);
  protected readonly records = signal<Attendance[]>([]);
  protected readonly editing = signal<Attendance | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected to = toIso(new Date());
  protected from = addDaysIso(this.to, -6);
  protected userId = '';
  protected fix = { clockIn: '', clockOut: '', reason: '' };

  ngOnInit(): void {
    this.hr.staff().subscribe({ next: (s) => this.staff.set(s) });
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.hr.attendance(this.from, this.to, this.userId || null).subscribe({
      next: (r) => this.records.set(r),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected edit(r: Attendance): void {
    this.editing.set(r);
    this.fix = {
      clockIn: local(r.clockIn),
      clockOut: r.clockOut ? local(r.clockOut) : '',
      reason: '',
    };
  }

  protected saveCorrection(): void {
    const r = this.editing();
    if (!r) return;
    this.busy.set(true);
    this.error.set(null);
    this.hr
      .correct(r.id, {
        clockIn: new Date(this.fix.clockIn).toISOString(),
        clockOut: this.fix.clockOut ? new Date(this.fix.clockOut).toISOString() : null,
        reason: this.fix.reason.trim(),
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.editing.set(null);
          this.message.set('Registo corrigido.');
          this.load();
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.error.set(toApiError(err).message);
        },
      });
  }
}

/** Instante ISO → valor de um input datetime-local (hora local do navegador). */
function local(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${toIso(d)}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
