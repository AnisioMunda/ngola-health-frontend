import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import { ADMISSION_STATUS_LABELS, Admission, AdmissionStatus, Ward } from '../data/inpatient.model';
import { InpatientService } from '../data/inpatient.service';

/** Internamentos (por omissão, os activos), filtráveis por enfermaria e estado. */
@Component({
  selector: 'app-admission-list',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/inpatient">← Internamento</a>
          <h1>Internamentos</h1>
        </div>
      </header>
      <div class="filters card">
        <label class="field"
          ><span>Estado</span>
          <select name="status" [(ngModel)]="status" (ngModelChange)="load(0)">
            <option value="">Todos</option>
            @for (s of statusKeys; track s) {
              <option [value]="s">{{ statuses[s] }}</option>
            }
          </select>
        </label>
        <label class="field"
          ><span>Enfermaria</span>
          <select name="ward" [(ngModel)]="wardId" (ngModelChange)="load(0)">
            <option value="">Todas</option>
            @for (w of wards(); track w.id) {
              <option [value]="w.id">{{ w.name }}</option>
            }
          </select>
        </label>
      </div>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="card table-card">
        @if (result(); as page) {
          @if (page.content.length === 0) {
            <p class="empty">Nenhum internamento.</p>
          } @else {
            <div class="table-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Internamento</th>
                    <th scope="col">Doente</th>
                    <th scope="col">Local</th>
                    <th scope="col">Médico</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span class="visually-hidden">Acções</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of page.content; track a.id) {
                    <tr>
                      <td>
                        <code>{{ a.number }}</code
                        ><span class="subtext"
                          >{{ a.admittedAt | date: 'dd/MM/yyyy' }} ·
                          {{ a.lengthOfStayDays }} dia(s)</span
                        >
                      </td>
                      <td>
                        {{ a.patientName
                        }}<span class="subtext">Processo {{ a.patientRecordNumber }}</span>
                      </td>
                      <td>{{ a.wardName }}, cama {{ a.bedCode }}</td>
                      <td>{{ a.responsibleDoctorName }}</td>
                      <td>
                        <span class="badge adm-{{ a.status }}">{{ statuses[a.status] }}</span>
                      </td>
                      <td class="actions">
                        <a
                          class="btn btn-small btn-secondary"
                          [routerLink]="['..', 'admissions', a.id]"
                          >Abrir</a
                        >
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (page.totalPages > 1) {
              <nav class="pagination" aria-label="Paginação">
                <button
                  class="btn btn-small btn-secondary"
                  type="button"
                  [disabled]="page.page === 0"
                  (click)="load(page.page - 1)"
                >
                  Anterior
                </button>
                <span>Página {{ page.page + 1 }} de {{ page.totalPages }}</span>
                <button
                  class="btn btn-small btn-secondary"
                  type="button"
                  [disabled]="page.page + 1 >= page.totalPages"
                  (click)="load(page.page + 1)"
                >
                  Seguinte
                </button>
              </nav>
            }
            <p class="muted total">{{ page.totalElements }} internamento(s).</p>
          }
        } @else if (!error()) {
          <p class="empty" role="status">A carregar…</p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionList implements OnInit {
  private readonly inpatient = inject(InpatientService);

  protected readonly statuses = ADMISSION_STATUS_LABELS;
  protected readonly statusKeys = Object.keys(ADMISSION_STATUS_LABELS) as AdmissionStatus[];
  protected readonly wards = signal<Ward[]>([]);
  protected readonly result = signal<Page<Admission> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected status: AdmissionStatus | '' = 'ACTIVE';
  protected wardId = '';

  ngOnInit(): void {
    this.inpatient.wards(true).subscribe({ next: (w) => this.wards.set(w) });
    this.load(0);
  }

  protected load(page: number): void {
    this.error.set(null);
    this.inpatient
      .admissions({ status: this.status || null, wardId: this.wardId || null, page })
      .subscribe({
        next: (p) => this.result.set(p),
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
  }
}
