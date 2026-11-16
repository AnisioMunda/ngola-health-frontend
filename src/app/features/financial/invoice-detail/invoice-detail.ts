import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import {
  Invoice,
  METHOD_LABELS,
  PaymentMethod,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../data/financial.model';
import { FinancialService } from '../data/financial.service';

type Panel = 'issue' | 'pay' | 'cancel' | 'credit' | null;

/** Documento (pronto a imprimir) e acções: emitir, receber, anular, nota de crédito. */
@Component({
  selector: 'app-invoice-detail',
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetail {
  private readonly financial = inject(FinancialService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly types = TYPE_LABELS;
  protected readonly statuses = STATUS_LABELS;
  protected readonly methods = METHOD_LABELS;
  protected readonly methodKeys = Object.keys(METHOD_LABELS) as PaymentMethod[];
  protected readonly inv = signal<Invoice | null>(null);
  protected readonly panel = signal<Panel>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected readonly canBill = computed(() => this.auth.hasAnyRole(ACCESS.billing));
  protected readonly canSupervise = computed(() => this.auth.hasAnyRole(ACCESS.financeSupervise));
  protected readonly isDraft = computed(() => this.inv()?.status === 'DRAFT');
  protected readonly payable = computed(() => {
    const s = this.inv()?.status;
    return this.inv()?.documentType === 'FT' && (s === 'ISSUED' || s === 'PARTIALLY_PAID');
  });
  protected readonly cancellable = computed(() => {
    const i = this.inv();
    return !!i && i.documentType !== 'NC' && i.status === 'ISSUED' && i.paidTotal === 0;
  });
  protected readonly creditable = computed(() => {
    const i = this.inv();
    return (
      !!i &&
      i.documentType !== 'NC' &&
      (i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID' || i.status === 'PAID')
    );
  });
  /** Isenções distintas, para a nota no rodapé do documento. */
  protected readonly exemptions = computed(() => [
    ...new Set(
      (this.inv()?.items ?? [])
        .filter((i) => i.vatRate === 0 && i.vatExemptionReason)
        .map((i) => i.vatExemptionReason as string),
    ),
  ]);

  protected method: PaymentMethod = 'CASH';
  protected reference = '';
  protected amount = 0;
  protected reason = '';

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  protected open(panel: Panel): void {
    this.error.set(null);
    this.message.set(null);
    this.reason = '';
    this.reference = '';
    this.amount = this.inv()?.balance ?? 0;
    this.panel.set(panel);
  }

  protected issue(): void {
    const i = this.inv();
    if (!i) return;
    this.act(
      this.financial.issue(
        i.id,
        i.documentType === 'FR'
          ? { paymentMethod: this.method, reference: this.reference.trim() || null }
          : null,
      ),
      'Documento emitido.',
    );
  }

  protected pay(): void {
    this.act(
      this.financial.pay(this.id(), {
        amount: Number(this.amount),
        method: this.method,
        reference: this.reference.trim() || null,
      }),
      'Pagamento registado.',
    );
  }

  protected cancel(): void {
    this.act(this.financial.cancel(this.id(), this.reason.trim()), 'Documento anulado.');
  }

  protected credit(): void {
    this.busy.set(true);
    this.financial.creditNote(this.id(), this.reason.trim()).subscribe({
      next: (nc) => {
        this.busy.set(false);
        void this.router.navigate(['/financial/invoices', nc.id]);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  protected deleteDraft(): void {
    this.busy.set(true);
    this.financial.deleteDraft(this.id()).subscribe({
      next: () => void this.router.navigate(['/financial']),
      error: (err: unknown) => this.fail(err),
    });
  }

  protected print(): void {
    window.print();
  }

  private act(request: Observable<Invoice>, success: string): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: (i) => {
        this.busy.set(false);
        this.panel.set(null);
        this.inv.set(i);
        this.message.set(success);
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(toApiError(err).message);
  }

  private load(id: string): void {
    this.inv.set(null);
    this.panel.set(null);
    this.financial.invoice(id).subscribe({
      next: (i) => this.inv.set(i),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
