import { DatePipe } from '@angular/common';
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
import { Observable } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { PRESCRIPTION_STATUS_LABELS, Prescription, ROUTE_LABELS } from '../data/prescription.model';
import { PrescriptionService } from '../data/prescription.service';

@Component({
  selector: 'app-prescription-detail',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './prescription-detail.html',
  styleUrl: './prescription-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionDetail implements OnInit {
  private readonly prescriptions = inject(PrescriptionService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly statusLabels = PRESCRIPTION_STATUS_LABELS;
  protected readonly routeLabels = ROUTE_LABELS;
  protected readonly prescription = signal<Prescription | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  /** Quantidades a dispensar por linha (id → quantidade). */
  protected toDispense: Record<string, number> = {};

  private readonly open = computed(() => {
    const s = this.prescription()?.effectiveStatus;
    return s === 'ACTIVE' || s === 'PARTIALLY_DISPENSED';
  });
  protected readonly canDispense = computed(
    () => this.open() && this.auth.hasAnyRole(ACCESS.pharmacist),
  );
  protected readonly canCancel = computed(
    () => this.open() && this.auth.hasAnyRole(ACCESS.prescribe),
  );
  protected readonly canAudit = computed(() => this.auth.hasAnyRole(ACCESS.audit));

  ngOnInit(): void {
    this.prescriptions.view(this.id()).subscribe({
      next: (p) => this.set(p),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  dispense(): void {
    const p = this.prescription();
    if (!p) return;
    const lines = p.items
      .map((i) => ({ itemId: i.id, quantity: Number(this.toDispense[i.id]) || 0 }))
      .filter((l) => l.quantity > 0);
    if (lines.length === 0) {
      this.error.set('Indique a quantidade a dispensar em pelo menos uma linha.');
      return;
    }
    this.run(this.prescriptions.dispense(p.id, lines), 'Dispensa registada.');
  }

  cancel(): void {
    const reason = prompt('Motivo do cancelamento:');
    if (reason === null) return;
    if (!reason.trim()) {
      this.error.set('Indique o motivo do cancelamento.');
      return;
    }
    this.run(this.prescriptions.cancel(this.id(), reason.trim()), 'Prescrição cancelada.');
  }

  print(): void {
    window.print();
  }

  private set(p: Prescription): void {
    this.prescription.set(p);
    this.toDispense = Object.fromEntries(
      p.items.map((i) => [i.id, Math.min(i.remaining, Math.max(i.stockAvailable, 0))]),
    );
  }

  private run(action: Observable<Prescription>, success: string): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);
    action.subscribe({
      next: (p) => {
        this.set(p);
        this.notice.set(success);
        this.busy.set(false);
      },
      error: (err: unknown) => {
        const e = toApiError(err);
        const fields = Object.values(e.fieldErrors);
        this.error.set(fields.length ? `${e.message} ${fields.join(' ')}` : e.message);
        this.busy.set(false);
      },
    });
  }
}
