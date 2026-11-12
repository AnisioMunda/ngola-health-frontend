import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { toApiError } from '../../core/http/api-error';
import { PatientSummary } from '../../features/patients/data/patient.model';
import { PatientService } from '../../features/patients/data/patient.service';

/** Pesquisa de pacientes activos do hospital, para escolher um. */
@Component({
  selector: 'app-patient-picker',
  imports: [FormsModule],
  template: `
    <div class="picker">
      <label class="field grow">
        <span>Pesquisar paciente</span>
        <input
          name="patientSearch"
          [(ngModel)]="term"
          (keydown.enter)="$event.preventDefault(); search()"
          placeholder="Nome, processo, BI ou telefone"
        />
      </label>
      <button class="btn btn-secondary" type="button" (click)="search()">Pesquisar</button>
    </div>
    @if (error(); as message) {
      <small class="field-error">{{ message }}</small>
    }
    @if (results(); as list) {
      @if (list.length === 0) {
        <p class="muted">Nenhum paciente encontrado.</p>
      } @else {
        <ul class="candidates">
          @for (p of list; track p.id) {
            <li>
              <button class="btn-link" type="button" (click)="pick(p)">{{ p.fullName }}</button>
              — processo {{ p.recordNumber }}, {{ p.age }} anos
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
export class PatientPicker {
  private readonly patients = inject(PatientService);

  readonly picked = output<PatientSummary>();

  protected term = '';
  protected readonly results = signal<PatientSummary[] | null>(null);
  protected readonly error = signal<string | null>(null);

  search(): void {
    if (!this.term.trim()) return;
    this.error.set(null);
    this.patients.search({ search: this.term, active: true, size: 10 }).subscribe({
      next: (page) => this.results.set(page.content),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected pick(p: PatientSummary): void {
    this.results.set(null);
    this.term = '';
    this.picked.emit(p);
  }
}
