import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { CashSummary as CashData, METHOD_LABELS, PaymentMethod } from '../data/financial.model';
import { FinancialService } from '../data/financial.service';

/** Caixa do dia: total recebido por meio de pagamento e lista de recibos. */
@Component({
  selector: 'app-cash-summary',
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe],
  template: `
    <section class="page narrow">
      <a class="btn-link back no-print" routerLink="/financial">← Financeiro</a>
      <header class="page-header">
        <div>
          <h1>Caixa do dia</h1>
        </div>
        <div class="header-actions no-print">
          <label class="field"
            ><span>Dia</span
            ><input type="date" name="date" [(ngModel)]="date" (ngModelChange)="load()"
          /></label>
          <button class="btn btn-secondary" type="button" (click)="print()">Imprimir</button>
        </div>
      </header>
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      @if (data(); as d) {
        <div class="card">
          <p class="total">
            {{ d.date | date: 'dd/MM/yyyy' }} — <strong>{{ d.total | currency: 'AOA' }}</strong> em
            {{ d.receipts }} recebimento(s)
          </p>
          <dl class="methods">
            @for (m of methodKeys; track m) {
              @if (d.byMethod[m]; as v) {
                <dt>{{ methods[m] }}</dt>
                <dd>{{ v | currency: 'AOA' }}</dd>
              }
            }
          </dl>
        </div>
        <div class="card table-card">
          <div class="table-scroll">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Hora</th>
                  <th scope="col">Recibo</th>
                  <th scope="col">Meio</th>
                  <th scope="col" class="num">Valor</th>
                  <th scope="col">Recebido por</th>
                </tr>
              </thead>
              <tbody>
                @for (p of d.payments; track p.id) {
                  <tr>
                    <td>{{ p.receivedAt | date: 'HH:mm' }}</td>
                    <td>
                      <code>{{ p.receiptNumber }}</code>
                    </td>
                    <td>{{ methods[p.method] }}</td>
                    <td class="num">{{ p.amount | currency: 'AOA' }}</td>
                    <td>{{ p.receivedByName }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty">Sem recebimentos neste dia.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .card {
      margin-bottom: var(--space-4);
    }
    .total {
      font-size: 1.1rem;
      margin: 0 0 var(--space-3);
    }
    .methods {
      display: grid;
      grid-template-columns: max-content auto;
      gap: var(--space-1) var(--space-4);
      margin: 0;
    }
    .methods dd {
      margin: 0;
      text-align: right;
    }
    .num {
      text-align: right;
    }
    @media print {
      .no-print {
        display: none !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashSummary implements OnInit {
  private readonly financial = inject(FinancialService);

  protected readonly methods = METHOD_LABELS;
  protected readonly methodKeys = Object.keys(METHOD_LABELS) as PaymentMethod[];
  protected readonly data = signal<CashData | null>(null);
  protected readonly error = signal<string | null>(null);
  protected date = '';

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.financial.cash(this.date || undefined).subscribe({
      next: (d) => {
        this.data.set(d);
        this.date = d.date;
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected print(): void {
    window.print();
  }
}
