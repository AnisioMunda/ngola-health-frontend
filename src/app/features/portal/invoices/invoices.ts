import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { toApiError } from '../../../core/http/api-error';
import { DOCUMENT_LABELS, INVOICE_STATUS, PortalInvoice } from '../data/portal.model';
import { PortalService } from '../data/portal.service';

/** As minhas facturas e o que falta pagar. */
@Component({
  selector: 'app-portal-invoices',
  imports: [DatePipe, CurrencyPipe],
  template: `
    <section class="page narrow">
      <h1>As minhas facturas</h1>
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      <div class="card table-card">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Documento</th>
                <th scope="col">Data</th>
                <th scope="col" class="num">Total</th>
                <th scope="col" class="num">Por pagar</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (i of invoices(); track i.id) {
                <tr>
                  <td>
                    {{ types[i.documentType]
                    }}<span class="subtext"
                      ><code>{{ i.number }}</code></span
                    >
                  </td>
                  <td>{{ i.issuedAt | date: 'dd/MM/yyyy' }}</td>
                  <td class="num">{{ i.total | currency: 'AOA' }}</td>
                  <td class="num">{{ i.balance | currency: 'AOA' }}</td>
                  <td>
                    <span class="badge inv-{{ i.status }}">{{
                      statuses[i.status] ?? i.status
                    }}</span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty">Sem facturas.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <p class="muted">
        Pagamentos: na tesouraria do hospital (numerário, TPA ou Multicaixa Express).
      </p>
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
export class PortalInvoices implements OnInit {
  private readonly portal = inject(PortalService);
  protected readonly types = DOCUMENT_LABELS;
  protected readonly statuses = INVOICE_STATUS;
  protected readonly invoices = signal<PortalInvoice[]>([]);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.portal.invoices().subscribe({
      next: (i) => this.invoices.set(i),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
