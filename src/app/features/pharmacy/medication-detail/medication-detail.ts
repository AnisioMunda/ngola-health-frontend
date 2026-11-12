import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { Page } from '../../../core/http/page';
import {
  ADJUSTMENT_LABELS,
  AdjustmentKind,
  Batch,
  FORM_LABELS,
  MOVEMENT_LABELS,
  Medication,
  Movement,
} from '../data/pharmacy.model';
import { PharmacyService } from '../data/pharmacy.service';

@Component({
  selector: 'app-medication-detail',
  imports: [RouterLink, DatePipe, CurrencyPipe, FormsModule],
  templateUrl: './medication-detail.html',
  styleUrl: './medication-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationDetail implements OnInit {
  private readonly pharmacy = inject(PharmacyService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly forms = FORM_LABELS;
  protected readonly movementLabels = MOVEMENT_LABELS;
  protected readonly adjustmentKinds = Object.entries(ADJUSTMENT_LABELS) as [
    AdjustmentKind,
    string,
  ][];
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.catalogManage));
  protected readonly isPharmacist = computed(() => this.auth.hasAnyRole(ACCESS.pharmacist));
  protected readonly medication = signal<Medication | null>(null);
  protected readonly batches = signal<Batch[]>([]);
  protected readonly movements = signal<Page<Movement> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  /** Lote em acerto (formulário aberto). */
  protected readonly adjusting = signal<Batch | null>(null);

  protected adjustKind: AdjustmentKind = 'COUNT_SHORTAGE';
  protected adjustQuantity = 1;
  protected adjustReason = '';

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    const id = this.id();
    this.pharmacy.medication(id).subscribe({
      next: (m) => this.medication.set(m),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
    this.pharmacy.batches(id).subscribe({ next: (b) => this.batches.set(b) });
    this.pharmacy.movements(id).subscribe({ next: (p) => this.movements.set(p) });
  }

  protected toggleActive(): void {
    const m = this.medication();
    if (!m) return;
    if (m.active && !confirm(`Desactivar ${m.name}? Deixa de poder ser prescrito e dispensado.`))
      return;
    this.act(() => this.pharmacy.setActive(m.id, !m.active));
  }

  protected startAdjust(b: Batch): void {
    this.adjusting.set(b);
    this.adjustKind = 'COUNT_SHORTAGE';
    this.adjustQuantity = 1;
    this.adjustReason = '';
  }

  saveAdjust(): void {
    const b = this.adjusting();
    if (!b) return;
    if (!this.adjustReason.trim() || this.adjustQuantity < 1) {
      this.error.set('Indique a quantidade e o motivo do acerto.');
      return;
    }
    this.act(() =>
      this.pharmacy.adjust(b.id, this.adjustKind, this.adjustQuantity, this.adjustReason.trim()),
    );
  }

  protected writeOff(b: Batch): void {
    if (!confirm(`Abater ${b.quantityAvailable} unidade(s) do lote expirado ${b.batchNumber}?`))
      return;
    this.act(() => this.pharmacy.writeOffExpired(b.id));
  }

  private act(action: () => Observable<unknown>): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    action().subscribe({
      next: () => {
        this.busy.set(false);
        this.adjusting.set(null);
        this.reload();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const e = toApiError(err);
        const fields = Object.values(e.fieldErrors);
        this.error.set(fields.length ? `${e.message} ${fields.join(' ')}` : e.message);
      },
    });
  }
}
