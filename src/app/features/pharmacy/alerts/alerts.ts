import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { StockAlerts } from '../data/pharmacy.model';
import { PharmacyService } from '../data/pharmacy.service';

@Component({
  selector: 'app-stock-alerts',
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/pharmacy">← Farmácia</a>
          <h1>Alertas de stock</h1>
        </div>
        <label class="field">
          <span>Validade nos próximos</span>
          <select [(ngModel)]="days" name="days" (ngModelChange)="load()">
            <option [ngValue]="30">30 dias</option>
            <option [ngValue]="90">90 dias</option>
            <option [ngValue]="180">180 dias</option>
          </select>
        </label>
      </header>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      @if (alerts(); as a) {
        <div class="card">
          <h2>Expirados com saldo ({{ a.expired.length }})</h2>
          @if (a.expired.length === 0) {
            <p class="muted">Nenhum.</p>
          } @else {
            <ul>
              @for (b of a.expired; track b.id) {
                <li>
                  <a [routerLink]="['/pharmacy/medications', b.medicationId]">{{
                    b.medicationName
                  }}</a>
                  — lote <code>{{ b.batchNumber }}</code
                  >, expirou {{ b.expiryDate | date: 'dd/MM/yyyy' }}, saldo
                  {{ b.quantityAvailable }}
                </li>
              }
            </ul>
          }
        </div>
        <div class="card">
          <h2>A expirar ({{ a.expiringSoon.length }})</h2>
          @if (a.expiringSoon.length === 0) {
            <p class="muted">Nenhum.</p>
          } @else {
            <ul>
              @for (b of a.expiringSoon; track b.id) {
                <li>
                  <a [routerLink]="['/pharmacy/medications', b.medicationId]">{{
                    b.medicationName
                  }}</a>
                  — lote <code>{{ b.batchNumber }}</code
                  >, {{ b.expiryDate | date: 'dd/MM/yyyy' }} ({{ b.daysToExpiry }} dias), saldo
                  {{ b.quantityAvailable }}
                </li>
              }
            </ul>
          }
        </div>
        <div class="card">
          <h2>Abaixo do stock mínimo ({{ a.lowStock.length }})</h2>
          @if (a.lowStock.length === 0) {
            <p class="muted">Nenhum.</p>
          } @else {
            <ul>
              @for (m of a.lowStock; track m.id) {
                <li>
                  <a [routerLink]="['/pharmacy/medications', m.id]"
                    >{{ m.name }}{{ m.strength ? ' ' + m.strength : '' }}</a
                  >
                  — {{ m.stockAvailable }} {{ m.dispensingUnit }} (mínimo {{ m.minStockLevel }})
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .card + .card {
      margin-top: var(--space-4);
    }
    h2 {
      margin: 0 0 var(--space-2);
      font-size: 1.0625rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockAlertsPage implements OnInit {
  private readonly pharmacy = inject(PharmacyService);

  protected readonly alerts = signal<StockAlerts | null>(null);
  protected readonly error = signal<string | null>(null);
  protected days = 90;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.pharmacy.alerts(this.days).subscribe({
      next: (a) => this.alerts.set(a),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
