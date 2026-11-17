import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import {
  SHIFT_DEFAULT_HOURS,
  SHIFT_LABELS,
  Shift,
  ShiftType,
  StaffMember,
  addDaysIso,
  mondayOf,
  toIso,
} from '../data/hr.model';
import { HrService } from '../data/hr.service';

/** Escala semanal: uma linha por profissional, uma coluna por dia. */
@Component({
  selector: 'app-schedule',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Schedule implements OnInit {
  private readonly hr = inject(HrService);
  private readonly auth = inject(AuthService);

  protected readonly labels = SHIFT_LABELS;
  protected readonly typeKeys = Object.keys(SHIFT_LABELS) as ShiftType[];
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.hrManage));
  protected readonly week = signal(mondayOf(toIso(new Date())));
  protected readonly days = computed(() =>
    Array.from({ length: 7 }, (_, i) => addDaysIso(this.week(), i)),
  );
  protected readonly staff = signal<StaffMember[]>([]);
  protected readonly shifts = signal<Shift[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly skipped = signal<string[]>([]);
  protected readonly onlyScheduled = signal(true);

  /** Linhas: só quem tem turnos na semana (ou todos, para marcar). */
  protected readonly rows = computed(() => {
    const byUser = new Map<string, Shift[]>();
    for (const s of this.shifts()) {
      byUser.set(s.userId, [...(byUser.get(s.userId) ?? []), s]);
    }
    const people = this.onlyScheduled()
      ? this.staff().filter((p) => byUser.has(p.id))
      : this.staff();
    return people.map((p) => ({
      person: p,
      cells: this.days().map((d) => (byUser.get(p.id) ?? []).filter((s) => s.date === d)),
    }));
  });

  protected form = {
    userId: '',
    type: 'MORNING' as ShiftType,
    date: toIso(new Date()),
    startTime: SHIFT_DEFAULT_HOURS.MORNING[0],
    endTime: SHIFT_DEFAULT_HOURS.MORNING[1],
    notes: '',
  };

  ngOnInit(): void {
    this.hr.staff().subscribe({
      next: (s) => this.staff.set(s),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
    this.load();
  }

  protected shift(weeks: number): void {
    this.week.set(addDaysIso(this.week(), weeks * 7));
    this.load();
  }

  protected setType(type: ShiftType): void {
    this.form.type = type;
    [this.form.startTime, this.form.endTime] = SHIFT_DEFAULT_HOURS[type];
  }

  protected prefill(userId: string, date: string): void {
    if (!this.canManage()) return;
    this.form.userId = userId;
    this.form.date = date;
    this.onlyScheduled.set(false);
  }

  protected create(): void {
    this.run(
      () =>
        this.hr.createShift({
          ...this.form,
          wardId: null,
          department: null,
          notes: this.form.notes.trim() || null,
        }),
      'Turno marcado.',
    );
  }

  protected cancel(s: Shift): void {
    const reason = prompt(`Motivo do cancelamento do turno de ${s.userName}:`);
    if (!reason?.trim()) return;
    this.run(() => this.hr.cancelShift(s.id, reason.trim()), 'Turno cancelado.');
  }

  protected copyToNextWeek(): void {
    this.busy.set(true);
    this.error.set(null);
    this.hr.copyWeek(this.week(), addDaysIso(this.week(), 7)).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.message.set(`${r.created} turno(s) copiado(s) para a semana seguinte.`);
        this.skipped.set(r.skipped);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  private run(action: () => import('rxjs').Observable<unknown>, success: string): void {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    this.skipped.set([]);
    action().subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set(success);
        this.load();
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(toApiError(err).message);
  }

  private load(): void {
    this.hr.shifts(this.week(), addDaysIso(this.week(), 6)).subscribe({
      next: (s) => this.shifts.set(s),
      error: (err: unknown) => this.fail(err),
    });
  }
}
