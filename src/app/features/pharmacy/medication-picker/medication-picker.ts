import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { toApiError } from '../../../core/http/api-error';
import { FORM_LABELS, Medication } from '../data/pharmacy.model';
import { PharmacyService } from '../data/pharmacy.service';

/** Pesquisa de medicamentos activos do catálogo (usado pela farmácia e pelas prescrições). */
@Component({
  selector: 'app-medication-picker',
  imports: [FormsModule],
  template: `
    <div class="picker">
      <label class="field grow">
        <span>{{ label() }}</span>
        <input
          name="medicationSearch"
          [(ngModel)]="term"
          (keydown.enter)="$event.preventDefault(); search()"
          placeholder="Nome ou DCI"
        />
      </label>
      <button class="btn btn-secondary" type="button" (click)="search()">Pesquisar</button>
    </div>
    @if (error(); as message) {
      <small class="field-error">{{ message }}</small>
    }
    @if (results(); as list) {
      @if (list.length === 0) {
        <p class="muted">Nenhum medicamento encontrado.</p>
      } @else {
        <ul class="candidates">
          @for (m of list; track m.id) {
            <li>
              <button class="btn-link" type="button" (click)="pick(m)">
                {{ m.name }}{{ m.strength ? ' ' + m.strength : '' }}
              </button>
              — {{ forms[m.dosageForm] }} · stock {{ m.stockAvailable }} {{ m.dispensingUnit }}
              @if (m.requiresPrescription) {
                <span class="badge">Receita</span>
              }
            </li>
          }
        </ul>
      }
    }
  `,
  styles: `
    .picker {
      display: flex;
      align-items: flex-end;
      gap: var(--space-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationPicker {
  private readonly pharmacy = inject(PharmacyService);

  readonly label = input('Pesquisar medicamento');
  /** Se definido, só mostra medicamentos com este valor de "exige receita". */
  readonly requiresPrescription = input<boolean | undefined>(undefined);
  readonly picked = output<Medication>();

  protected readonly forms = FORM_LABELS;
  protected term = '';
  protected readonly results = signal<Medication[] | null>(null);
  protected readonly error = signal<string | null>(null);

  search(): void {
    if (!this.term.trim()) return;
    this.error.set(null);
    this.pharmacy.search({ search: this.term, active: true, size: 15 }).subscribe({
      next: (page) => {
        const filter = this.requiresPrescription();
        this.results.set(
          filter === undefined
            ? page.content
            : page.content.filter((m) => m.requiresPrescription === filter),
        );
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected pick(m: Medication): void {
    this.results.set(null);
    this.term = '';
    this.picked.emit(m);
  }
}
