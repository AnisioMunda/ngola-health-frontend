import { CurrencyPipe } from '@angular/common';
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
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { PatientPicker } from '../../../shared/patient-picker/patient-picker';
import { PatientService } from '../../patients/data/patient.service';
import {
  CATEGORY_LABELS,
  DocumentType,
  InvoiceRequest,
  ServicePrice,
  TYPE_LABELS,
  previewLine,
  round2,
} from '../data/financial.model';
import { FinancialService } from '../data/financial.service';

/** Linha em edição: do catálogo (preço fixo) ou livre. */
interface DraftLine {
  price: ServicePrice | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
  vatExemptionReason: string;
}

/**
 * Rascunho de documento (/financial/new?patientId=…&episodeId=… ou /financial/invoices/:id/edit).
 * Os valores mostrados são uma pré-visualização; o servidor recalcula ao gravar.
 */
@Component({
  selector: 'app-invoice-form',
  imports: [FormsModule, RouterLink, PatientPicker, CurrencyPipe],
  templateUrl: './invoice-form.html',
  styles: `
    .card + .card {
      margin-top: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
    .lines input {
      width: 100%;
      min-width: 4.5rem;
    }
    .num {
      text-align: right;
      white-space: nowrap;
    }
    .add {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      align-items: flex-end;
      margin-top: var(--space-3);
    }
    .totals {
      margin: var(--space-3) 0 0 auto;
      max-width: 20rem;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--space-1) var(--space-4);
    }
    .totals dd {
      margin: 0;
      text-align: right;
    }
    .totals .grand {
      font-weight: 700;
      font-size: 1.1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceForm implements OnInit {
  private readonly financial = inject(FinancialService);
  private readonly patients = inject(PatientService);
  private readonly router = inject(Router);

  /** Edição de rascunho. */
  readonly id = input<string>();
  readonly patientId = input<string>();
  readonly episodeId = input<string>();

  protected readonly types = TYPE_LABELS;
  protected readonly categories = CATEGORY_LABELS;
  protected readonly catalog = signal<ServicePrice[]>([]);
  protected readonly patient = signal<{
    id: string;
    fullName: string;
    recordNumber: string;
  } | null>(null);
  protected readonly lines = signal<DraftLine[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected documentType: DocumentType = 'FR';
  protected episode: string | null = null;
  protected customerName = '';
  protected customerTaxId = '';
  protected customerAddress = '';
  protected dueDate = '';
  protected notes = '';
  protected version: number | null = null;
  protected pick = '';

  protected readonly totals = computed(() => {
    let net = 0;
    let vat = 0;
    for (const l of this.lines()) {
      const p = this.preview(l);
      net += p.net;
      vat += p.vat;
    }
    return { net: round2(net), vat: round2(vat), gross: round2(net + vat) };
  });

  ngOnInit(): void {
    this.financial.prices({ active: true }).subscribe({
      next: (list) => this.catalog.set(list),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
    const id = this.id();
    if (id) {
      this.financial.invoice(id).subscribe({
        next: (inv) => {
          this.documentType = inv.documentType;
          this.episode = inv.episodeId;
          this.customerName = inv.customerName;
          this.customerTaxId = inv.customerTaxId ?? '';
          this.customerAddress = inv.customerAddress ?? '';
          this.dueDate = inv.dueDate ?? '';
          this.notes = inv.notes ?? '';
          this.version = inv.version;
          this.patient.set({
            id: inv.patientId,
            fullName: inv.patientName,
            recordNumber: inv.patientRecordNumber,
          });
          this.lines.set(
            inv.items.map((i) => ({
              price: i.servicePriceId
                ? ({
                    id: i.servicePriceId,
                    code: i.code,
                    description: i.description,
                  } as ServicePrice)
                : null,
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discountPercent: i.discountPercent,
              vatRate: i.vatRate,
              vatExemptionReason: i.vatExemptionReason ?? '',
            })),
          );
        },
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
      return;
    }
    this.episode = this.episodeId() ?? null;
    const patientId = this.patientId();
    if (patientId) {
      this.patients.view(patientId).subscribe({
        next: (p) => this.setPatient(p),
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
    }
  }

  protected setPatient(p: { id: string; fullName: string; recordNumber: string } | null): void {
    this.patient.set(p);
    if (p && !this.customerName) this.customerName = p.fullName;
  }

  protected addFromCatalog(): void {
    const price = this.catalog().find((p) => p.id === this.pick);
    if (!price) return;
    this.lines.update((ls) => [
      ...ls,
      {
        price,
        description: price.description,
        quantity: 1,
        unitPrice: price.unitPrice,
        discountPercent: 0,
        vatRate: price.vatRate,
        vatExemptionReason: price.vatExemptionReason ?? '',
      },
    ]);
    this.pick = '';
  }

  protected addFree(): void {
    this.lines.update((ls) => [
      ...ls,
      {
        price: null,
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        vatRate: 14,
        vatExemptionReason: '',
      },
    ]);
  }

  protected remove(index: number): void {
    this.lines.update((ls) => ls.filter((_, i) => i !== index));
  }

  /** Força o recálculo dos totais depois de editar um campo de uma linha. */
  protected touch(): void {
    this.lines.update((ls) => [...ls]);
  }

  protected preview(l: DraftLine) {
    return previewLine(
      Number(l.quantity) || 0,
      Number(l.unitPrice) || 0,
      Number(l.discountPercent) || 0,
      Number(l.vatRate) || 0,
    );
  }

  protected save(): void {
    const patient = this.patient();
    if (!patient) {
      this.error.set('Seleccione o paciente.');
      return;
    }
    if (this.lines().length === 0) {
      this.error.set('Acrescente pelo menos uma linha.');
      return;
    }
    const request: InvoiceRequest = {
      documentType: this.documentType,
      patientId: patient.id,
      episodeId: this.episode,
      customerName: this.customerName.trim() || null,
      customerTaxId: this.customerTaxId.trim() || null,
      customerAddress: this.customerAddress.trim() || null,
      dueDate: this.documentType === 'FT' && this.dueDate ? this.dueDate : null,
      notes: this.notes.trim() || null,
      lines: this.lines().map((l) =>
        l.price
          ? {
              servicePriceId: l.price.id,
              description: null,
              quantity: Number(l.quantity),
              unitPrice: null,
              discountPercent: Number(l.discountPercent) || 0,
              vatRate: null,
              vatExemptionReason: null,
            }
          : {
              servicePriceId: null,
              description: l.description.trim(),
              quantity: Number(l.quantity),
              unitPrice: Number(l.unitPrice),
              discountPercent: Number(l.discountPercent) || 0,
              vatRate: Number(l.vatRate),
              vatExemptionReason: l.vatExemptionReason.trim() || null,
            },
      ),
      version: this.version,
    };
    this.saving.set(true);
    this.error.set(null);
    const id = this.id();
    (id ? this.financial.update(id, request) : this.financial.create(request)).subscribe({
      next: (inv) => void this.router.navigate(['/financial/invoices', inv.id]),
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }
}
