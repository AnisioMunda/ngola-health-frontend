import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { MedicationPicker } from '../medication-picker/medication-picker';
import { Medication, medicationLabel } from '../data/pharmacy.model';
import { PharmacyService } from '../data/pharmacy.service';

@Component({
  selector: 'app-receive-stock',
  imports: [ReactiveFormsModule, RouterLink, MedicationPicker],
  template: `
    <section class="page narrow">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/pharmacy">← Farmácia</a>
          <h1>Receber lote</h1>
        </div>
      </header>
      <fieldset class="card">
        <legend>Medicamento</legend>
        @if (medication(); as m) {
          <p class="chosen">
            <strong>{{ label(m) }}</strong> · stock actual {{ m.stockAvailable }}
            {{ m.dispensingUnit }}
            <button class="btn-link" type="button" (click)="medication.set(null)">Trocar</button>
          </p>
        } @else {
          <app-medication-picker (picked)="medication.set($event)" />
        }
      </fieldset>
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <fieldset class="card">
          <legend>Lote</legend>
          <div class="grid">
            <label class="field"
              ><span>Número do lote *</span><input formControlName="batchNumber" maxlength="50"
            /></label>
            <label class="field"
              ><span>Validade *</span><input formControlName="expiryDate" type="date"
            /></label>
            <label class="field"
              ><span>Quantidade *</span><input formControlName="quantity" type="number" min="1"
            /></label>
            <label class="field"
              ><span>Custo unitário (AOA)</span
              ><input formControlName="unitCost" type="number" min="0" step="0.01"
            /></label>
            <label class="field span-2"
              ><span>Fornecedor</span><input formControlName="supplier" maxlength="200"
            /></label>
          </div>
        </fieldset>
        @if (error(); as message) {
          <div class="alert alert-error" role="alert">{{ message }}</div>
        }
        <div class="form-actions">
          <a class="btn btn-secondary" routerLink="/pharmacy">Cancelar</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'A registar…' : 'Registar entrada' }}
          </button>
        </div>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiveStock implements OnInit {
  private readonly pharmacy = inject(PharmacyService);
  private readonly router = inject(Router);

  readonly medicationId = input<string>();

  protected readonly label = medicationLabel;
  protected readonly medication = signal<Medication | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).group({
    batchNumber: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    expiryDate: ['', Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    unitCost: [null as number | null, Validators.min(0)],
    supplier: ['', Validators.maxLength(200)],
  });

  ngOnInit(): void {
    const id = this.medicationId();
    if (id) this.pharmacy.medication(id).subscribe({ next: (m) => this.medication.set(m) });
  }

  submit(): void {
    const m = this.medication();
    if (!m || this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(m ? 'Corrija os campos assinalados.' : 'Seleccione o medicamento.');
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.pharmacy
      .receive({
        medicationId: m.id,
        batchNumber: v.batchNumber!.trim(),
        expiryDate: v.expiryDate!,
        quantity: v.quantity!,
        unitCost: v.unitCost,
        supplier: v.supplier?.trim() || null,
      })
      .subscribe({
        next: () => void this.router.navigate(['/pharmacy/medications', m.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(toApiError(err).message);
        },
      });
  }
}
