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
import { LEAVE_LABELS, LEAVE_STATUS_LABELS, Leave, LeaveType, toIso } from '../data/hr.model';
import { HrService } from '../data/hr.service';

/** Os meus pedidos de ausência e, para gestores, os pedidos por decidir. */
@Component({
  selector: 'app-leaves',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './leaves.html',
  styles: `
    .card {
      margin-bottom: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
    .table-card h2 {
      padding: var(--space-3) var(--space-4) 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Leaves implements OnInit {
  private readonly hr = inject(HrService);
  private readonly auth = inject(AuthService);

  protected readonly types = LEAVE_LABELS;
  protected readonly typeKeys = Object.keys(LEAVE_LABELS) as LeaveType[];
  protected readonly statuses = LEAVE_STATUS_LABELS;
  protected readonly isManager = computed(() => this.auth.hasAnyRole(ACCESS.hrManage));
  protected readonly myId = computed(() => this.auth.user()?.id);
  protected readonly mine = signal<Leave[]>([]);
  protected readonly pending = signal<Leave[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  /** Pedido que precisa de confirmação para cancelar turnos. */
  protected readonly conflict = signal<Leave | null>(null);
  protected readonly today = toIso(new Date());

  protected form = { type: 'VACATION' as LeaveType, startDate: '', endDate: '', reason: '' };
  protected notes: Record<string, string> = {};

  ngOnInit(): void {
    this.load();
  }

  protected request(): void {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    this.hr.requestLeave({ ...this.form, reason: this.form.reason.trim() || null }).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Pedido enviado. Será avisado da decisão.');
        this.form = { type: 'VACATION', startDate: '', endDate: '', reason: '' };
        this.load();
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  protected cancel(l: Leave): void {
    this.busy.set(true);
    this.hr.cancelLeave(l.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set('Pedido cancelado.');
        this.load();
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  protected decide(l: Leave, approve: boolean, cancelConflictingShifts = false): void {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    this.hr
      .decide(l.id, { approve, note: this.notes[l.id]?.trim() || null, cancelConflictingShifts })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.conflict.set(null);
          this.message.set(approve ? 'Ausência aprovada.' : 'Ausência recusada.');
          this.load();
        },
        error: (err: unknown) => {
          const apiError = toApiError(err);
          if (apiError.code === 'LEAVE_SHIFT_CONFLICT') {
            this.busy.set(false);
            this.conflict.set(l);
            this.error.set(apiError.message);
            return;
          }
          this.fail(err);
        },
      });
  }

  protected canCancel(l: Leave): boolean {
    return l.status === 'PENDING' || (l.status === 'APPROVED' && l.startDate > this.today);
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(toApiError(err).message);
  }

  private load(): void {
    this.hr.myLeaves().subscribe({ next: (p) => this.mine.set(p.content) });
    if (this.isManager()) {
      this.hr.leaves({ status: 'PENDING' }).subscribe({
        next: (p) => this.pending.set(p.content),
      });
    }
  }
}
