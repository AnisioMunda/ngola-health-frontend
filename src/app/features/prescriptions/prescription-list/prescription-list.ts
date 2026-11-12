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
import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import { PRESCRIPTION_STATUS_LABELS, Prescription } from '../data/prescription.model';
import { PrescriptionService } from '../data/prescription.service';

/** Lista de prescrições; para o farmacêutico, por omissão as que estão por dispensar. */
@Component({
  selector: 'app-prescription-list',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Prescrições</h1>
          <p class="muted">As prescrições emitem-se dentro de um episódio em curso.</p>
        </div>
      </header>
      <form class="filters card" role="search" (ngSubmit)="applyFilters()">
        <label class="field">
          <span>Número</span>
          <input name="number" [(ngModel)]="number" placeholder="RX-2026-000123" />
        </label>
        <label class="check-inline">
          <input
            type="checkbox"
            name="open"
            [(ngModel)]="onlyOpen"
            (ngModelChange)="applyFilters()"
          />
          Só por dispensar
        </label>
        <button class="btn btn-secondary" type="submit">Pesquisar</button>
      </form>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="card table-card">
        @if (result(); as page) {
          @if (page.content.length === 0) {
            <p class="empty">Nenhuma prescrição encontrada.</p>
          } @else {
            <div class="table-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Número</th>
                    <th scope="col">Paciente</th>
                    <th scope="col">Medicamentos</th>
                    <th scope="col">Emitida</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span class="visually-hidden">Acções</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of page.content; track p.id) {
                    <tr>
                      <td>
                        <code>{{ p.number }}</code>
                      </td>
                      <td>
                        {{ p.patientName }}
                        <span class="subtext">Processo {{ p.patientRecordNumber }}</span>
                      </td>
                      <td>{{ summary(p) }}</td>
                      <td>
                        {{ p.issuedAt | date: 'dd/MM/yyyy' }}
                        <span class="subtext"
                          >{{ p.prescriberName }} · válida até
                          {{ p.validUntil | date: 'dd/MM/yyyy' }}</span
                        >
                      </td>
                      <td>
                        <span class="badge rx-{{ p.effectiveStatus }}">{{
                          labels[p.effectiveStatus]
                        }}</span>
                      </td>
                      <td class="actions">
                        <a class="btn btn-small btn-secondary" [routerLink]="p.id">Abrir</a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="muted total">{{ page.totalElements }} prescrição(ões).</p>
          }
        } @else {
          <p class="empty" role="status">A carregar…</p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionList implements OnInit {
  private readonly prescriptions = inject(PrescriptionService);
  private readonly auth = inject(AuthService);

  protected readonly labels = PRESCRIPTION_STATUS_LABELS;
  protected readonly isPharmacist = computed(() => this.auth.hasAnyRole(['PHARMACIST']));
  protected readonly result = signal<Page<Prescription> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected number = '';
  protected onlyOpen = false;

  ngOnInit(): void {
    this.onlyOpen = this.isPharmacist();
    this.applyFilters();
  }

  protected applyFilters(): void {
    this.prescriptions.search({ open: this.onlyOpen, number: this.number, size: 50 }).subscribe({
      next: (page) => this.result.set(page),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected summary(p: Prescription): string {
    return p.items.map((i) => `${i.medicationName} ×${i.quantity}`).join(', ');
  }
}
