import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { MedicationPicker } from '../medication-picker/medication-picker';
import { DispenseResult, Medication, medicationLabel } from '../data/pharmacy.model';
import { PharmacyService } from '../data/pharmacy.service';

/** Dispensa ao balcão: só medicamentos de venda livre (os outros saem pela prescrição). */
@Component({
  selector: 'app-dispense',
  imports: [FormsModule, RouterLink, MedicationPicker, DatePipe],
  template: `
    <section class="page narrow">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/pharmacy">← Farmácia</a>
          <h1>Dispensa ao balcão</h1>
          <p class="muted">
            Apenas medicamentos de venda livre. Os sujeitos a receita dispensam-se a partir da
            prescrição.
          </p>
        </div>
      </header>
      <div class="card">
        @if (medication(); as m) {
          <p class="chosen">
            <strong>{{ label(m) }}</strong> · disponível {{ m.stockAvailable }}
            {{ m.dispensingUnit }}
            <button class="btn-link" type="button" (click)="reset()">Trocar</button>
          </p>
          <div class="grid">
            <label class="field"
              ><span>Quantidade *</span
              ><input type="number" min="1" [(ngModel)]="quantity" name="quantity"
            /></label>
            <label class="field span-2"
              ><span>Observação</span><input [(ngModel)]="reason" name="reason" maxlength="500"
            /></label>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="button" [disabled]="busy()" (click)="dispense()">
              Dispensar
            </button>
          </div>
        } @else {
          <app-medication-picker
            [requiresPrescription]="false"
            label="Medicamento de venda livre"
            (picked)="choose($event)"
          />
        }
      </div>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      @if (result(); as r) {
        <div class="alert alert-success" role="status">
          <span
            >Dispensadas {{ r.quantity }} unidade(s) de {{ r.medicationName }}. Restam
            {{ r.remaining }}.</span
          >
          <span
            >Lotes (FEFO):
            @for (l of r.lines; track l.batchId) {
              <code>{{ l.batchNumber }}</code> ×{{ l.quantity }} (val.
              {{ l.expiryDate | date: 'dd/MM/yyyy' }}){{ $last ? '' : ', ' }}
            }
          </span>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dispense {
  private readonly pharmacy = inject(PharmacyService);

  protected readonly label = medicationLabel;
  protected readonly medication = signal<Medication | null>(null);
  protected readonly result = signal<DispenseResult | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected quantity = 1;
  protected reason = '';

  protected choose(m: Medication): void {
    this.medication.set(m);
    this.result.set(null);
  }

  protected reset(): void {
    this.medication.set(null);
    this.quantity = 1;
    this.reason = '';
  }

  dispense(): void {
    const m = this.medication();
    if (!m || this.busy()) return;
    if (!this.quantity || this.quantity < 1) {
      this.error.set('Indique a quantidade.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.pharmacy
      .dispense({ medicationId: m.id, quantity: this.quantity, reason: this.reason.trim() || null })
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.busy.set(false);
          this.reset();
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.error.set(toApiError(err).message);
        },
      });
  }
}
