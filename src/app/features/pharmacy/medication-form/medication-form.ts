import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { DosageForm, FORM_LABELS, Medication } from '../data/pharmacy.model';
import { PharmacyService } from '../data/pharmacy.service';

@Component({
  selector: 'app-medication-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './medication-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationForm implements OnInit {
  private readonly pharmacy = inject(PharmacyService);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly forms = Object.entries(FORM_LABELS) as [DosageForm, string][];
  protected readonly original = signal<Medication | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    genericName: ['', Validators.maxLength(200)],
    dosageForm: ['TABLET' as DosageForm, Validators.required],
    strength: ['', Validators.maxLength(50)],
    dispensingUnit: [
      'comprimido',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)],
    ],
    requiresPrescription: [true],
    minStockLevel: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.pharmacy.medication(id).subscribe({
      next: (m) => {
        this.original.set(m);
        this.form.setValue({
          name: m.name,
          genericName: m.genericName ?? '',
          dosageForm: m.dosageForm,
          strength: m.strength ?? '',
          dispensingUnit: m.dispensingUnit,
          requiresPrescription: m.requiresPrescription,
          minStockLevel: m.minStockLevel,
        });
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Corrija os campos assinalados.');
      return;
    }
    const v = this.form.getRawValue();
    const request = {
      name: v.name.trim(),
      genericName: v.genericName.trim() || null,
      dosageForm: v.dosageForm,
      strength: v.strength.trim() || null,
      dispensingUnit: v.dispensingUnit.trim(),
      requiresPrescription: v.requiresPrescription,
      minStockLevel: v.minStockLevel,
      version: this.original()?.version ?? null,
    };
    const id = this.id();
    this.saving.set(true);
    this.error.set(null);
    (id ? this.pharmacy.update(id, request) : this.pharmacy.create(request)).subscribe({
      next: (m) => void this.router.navigate(['/pharmacy/medications', m.id]),
      error: (err: unknown) => {
        this.saving.set(false);
        const e = toApiError(err);
        const fields = Object.values(e.fieldErrors);
        this.error.set(fields.length ? `${e.message} ${fields.join(' ')}` : e.message);
      },
    });
  }
}
