import { CurrencyPipe, DatePipe } from '@angular/common';
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
import {
  DocumentType,
  InvoiceStatus,
  InvoiceSummary,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../data/financial.model';
import { FinancialService } from '../data/financial.service';

/** Documentos de facturação com filtros e paginação. */
@Component({
  selector: 'app-invoice-list',
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Financeiro</h1>
          <p class="muted">Facturas, facturas-recibo e notas de crédito.</p>
        </div>
        <div class="header-actions">
          <a class="btn btn-secondary" routerLink="cash">Caixa do dia</a>
          <a class="btn btn-secondary" routerLink="prices">Tabela de preços</a>
          @if (canBill()) {
            <a class="btn btn-primary" routerLink="new">Novo documento</a>
          }
        </div>
      </header>
      <form class="filters card" role="search" (ngSubmit)="load(0)">
        <label class="field"
          ><span>Número</span
          ><input name="number" [(ngModel)]="number" placeholder="FT 2026/000123"
        /></label>
        <label class="field"
          ><span>Tipo</span>
          <select name="type" [(ngModel)]="type" (ngModelChange)="load(0)">
            <option value="">Todos</option>
            @for (t of typeKeys; track t) {
              <option [value]="t">{{ types[t] }}</option>
            }
          </select>
        </label>
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
          ><span>De</span
          ><input type="date" name="from" [(ngModel)]="from" (ngModelChange)="load(0)"
        /></label>
        <label class="field"
          ><span>Até</span><input type="date" name="to" [(ngModel)]="to" (ngModelChange)="load(0)"
        /></label>
        <button class="btn btn-secondary" type="submit">Pesquisar</button>
      </form>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      <div class="card table-card">
        @if (result(); as page) {
          @if (page.content.length === 0) {
            <p class="empty">Nenhum documento.</p>
          } @else {
            <div class="table-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Documento</th>
                    <th scope="col">Cliente</th>
                    <th scope="col" class="num">Total</th>
                    <th scope="col" class="num">Em dívida</th>
                    <th scope="col">Estado</th>
                    <th scope="col"><span class="visually-hidden">Acções</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (i of page.content; track i.id) {
                    <tr>
                      <td>
                        @if (i.number) {
                          <code>{{ i.number }}</code>
                        } @else {
                          <em>{{ types[i.documentType] }} (rascunho)</em>
                        }
                        <span class="subtext">{{
                          i.issuedAt ?? i.createdAt | date: 'dd/MM/yyyy'
                        }}</span>
                      </td>
                      <td>
                        {{ i.customerName
                        }}<span class="subtext">Processo {{ i.patientRecordNumber }}</span>
                      </td>
                      <td class="num">{{ i.grossTotal | currency: 'AOA' }}</td>
                      <td class="num">
                        {{ i.balance | currency: 'AOA' }}
                        @if (i.overdue) {
                          <span class="badge badge-danger">Vencida</span>
                        }
                      </td>
                      <td>
                        <span class="badge inv-{{ i.status }}">{{ statuses[i.status] }}</span>
                      </td>
                      <td class="actions">
                        <a class="btn btn-small btn-secondary" [routerLink]="['invoices', i.id]"
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
            <p class="muted total">{{ page.totalElements }} documento(s).</p>
          }
        } @else if (!error()) {
          <p class="empty" role="status">A carregar…</p>
        }
      </div>
    </section>
  `,
  styles: `
    .num {
      text-align: right;
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceList implements OnInit {
  private readonly financial = inject(FinancialService);
  private readonly auth = inject(AuthService);

  protected readonly types = TYPE_LABELS;
  protected readonly typeKeys = Object.keys(TYPE_LABELS) as DocumentType[];
  protected readonly statuses = STATUS_LABELS;
  protected readonly statusKeys = Object.keys(STATUS_LABELS) as InvoiceStatus[];
  protected readonly canBill = computed(() => this.auth.hasAnyRole(ACCESS.billing));
  protected readonly result = signal<Page<InvoiceSummary> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected number = '';
  protected type: DocumentType | '' = '';
  protected status: InvoiceStatus | '' = '';
  protected from = '';
  protected to = '';

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.error.set(null);
    this.financial
      .invoices({
        number: this.number,
        type: this.type || null,
        status: this.status || null,
        from: this.from,
        to: this.to,
        page,
      })
      .subscribe({
        next: (p) => this.result.set(p),
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
  }
}
