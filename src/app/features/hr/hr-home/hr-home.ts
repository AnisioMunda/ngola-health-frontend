import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import {
  Attendance,
  DailyPresence,
  Overview,
  PRESENCE_LABELS,
  SHIFT_LABELS,
  Shift,
  addDaysIso,
  hours,
  toIso,
} from '../data/hr.model';
import { HrService } from '../data/hr.service';

/** O meu ponto e os meus próximos turnos; para gestores, o painel e a assiduidade do dia. */
@Component({
  selector: 'app-hr-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './hr-home.html',
  styleUrl: './hr-home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrHome implements OnInit {
  private readonly hr = inject(HrService);
  private readonly auth = inject(AuthService);

  protected readonly shiftLabels = SHIFT_LABELS;
  protected readonly presenceLabels = PRESENCE_LABELS;
  protected readonly hours = hours;
  protected readonly isManager = computed(() => this.auth.hasAnyRole(ACCESS.hrManage));
  protected readonly current = signal<Attendance | null | undefined>(undefined);
  protected readonly lastClosed = signal<Attendance | null>(null);
  protected readonly myShifts = signal<Shift[]>([]);
  protected readonly overview = signal<Overview | null>(null);
  protected readonly daily = signal<DailyPresence[] | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const today = toIso(new Date());
    this.hr.current().subscribe({
      next: (a) => this.current.set(a ?? null),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
    this.hr.myShifts(today, addDaysIso(today, 7)).subscribe({
      next: (list) => this.myShifts.set(list),
    });
    if (this.isManager()) {
      this.hr.overview().subscribe({ next: (o) => this.overview.set(o) });
      this.hr.daily().subscribe({ next: (d) => this.daily.set(d) });
    }
  }

  protected clockIn(): void {
    this.busy.set(true);
    this.error.set(null);
    this.hr.clockIn().subscribe({
      next: (a) => {
        this.busy.set(false);
        this.current.set(a);
        this.lastClosed.set(null);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  protected clockOut(): void {
    this.busy.set(true);
    this.error.set(null);
    this.hr.clockOut().subscribe({
      next: (a) => {
        this.busy.set(false);
        this.current.set(null);
        this.lastClosed.set(a);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(toApiError(err).message);
  }
}
