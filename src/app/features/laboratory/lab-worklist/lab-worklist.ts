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
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import { LAB_STATUS_LABELS, LabRequest } from '../data/lab.model';
import { LabService } from '../data/lab.service';

/** Lista de trabalho: pedidos por concluir, urgentes primeiro. */
@Component({
  selector: 'app-lab-worklist',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Laboratório</h1>
          <p class="muted">Pedidos de exames — os urgentes aparecem primeiro.</p>
        </div>
        <div class="header-actions">
          <a class="btn btn-secondary" routerLink="tests">Catálogo de exames</a>
        </div>
      </header>
      <form class="filters card" role="search" (ngSubmit)="load()">
        <label class="field"
          ><span>Número</span
          ><input name="number" [(ngModel)]="number" placeholder="LAB-2026-000123"
        /></label>
        <label class="check-inline">
          <input type="checkbox" name="open" [(ngModel)]="onlyOpen" (ngModelChange)="load()" /> Só
          por concluir
        </label>
        <button class="btn btn-secondary" type="submit">Pesquisar</button>
      </form>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="card table-card">
        @if (result(); as page) {
          @if (page.content.length === 0) {
            <p class="empty">Nenhum pedido.</p>
          } @else {
            <div class="table-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Pedido</th>
                    <th scope="col">Paciente</th>
                    <th scope="col">Exames</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span class="visually-hidden">Acções</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of page.content; track r.id) {
                    <tr>
                      <td>
                        <code>{{ r.number }}</code>
                        @if (r.priority === 'URGENT') {
                          <span class="badge badge-danger">Urgente</span>
                        }
                        <span class="subtext"
                          >{{ r.requestedAt | date: 'dd/MM HH:mm' }} · {{ r.requestedByName }}</span
                        >
                      </td>
                      <td>
                        {{ r.patientName
                        }}<span class="subtext">Processo {{ r.patientRecordNumber }}</span>
                      </td>
                      <td>{{ tests(r) }}</td>
                      <td>
                        <span class="badge lab-{{ r.status }}">{{ labels[r.status] }}</span>
                        @if (r.hasAbnormal) {
                          <span class="badge badge-warning">Alterado</span>
                        }
                      </td>
                      <td class="actions">
                        <a class="btn btn-small btn-secondary" [routerLink]="['requests', r.id]"
                          >Abrir</a
                        >
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="muted total">{{ page.totalElements }} pedido(s).</p>
          }
        } @else {
          <p class="empty" role="status">A carregar…</p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabWorklist implements OnInit {
  private readonly lab = inject(LabService);
  private readonly auth = inject(AuthService);

  protected readonly labels = LAB_STATUS_LABELS;
  protected readonly isLabStaff = computed(() => this.auth.hasAnyRole(ACCESS.labCollect));
  protected readonly result = signal<Page<LabRequest> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected number = '';
  protected onlyOpen = false;

  ngOnInit(): void {
    this.onlyOpen = this.isLabStaff();
    this.load();
  }

  protected load(): void {
    this.lab.requests({ open: this.onlyOpen, number: this.number }).subscribe({
      next: (page) => this.result.set(page),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected tests(r: LabRequest): string {
    return r.items.map((i) => i.testCode).join(', ');
  }
}
