import { CurrencyPipe } from '@angular/common';
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
import {
  CATEGORY_LABELS,
  ServiceCategory,
  ServicePrice,
  ServicePriceRequest,
} from '../data/financial.model';
import { FinancialService } from '../data/financial.service';

/** Tabela de preços; editar um preço não altera documentos já feitos. */
@Component({
  selector: 'app-price-catalog',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/financial">← Financeiro</a>
          <h1>Tabela de preços</h1>
          <p class="muted">Alterar um preço não altera documentos já feitos.</p>
        </div>
      </header>
      @if (message(); as m) {
        <div class="alert alert-success" role="status">{{ m }}</div>
      }
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }
      @if (canManage()) {
        <form class="card" (ngSubmit)="save()">
          <h2>{{ editing() ? 'Editar preço' : 'Novo preço' }}</h2>
          <div class="grid">
            <label class="field"
              ><span>Código</span><input name="code" [(ngModel)]="form.code" maxlength="30"
            /></label>
            <label class="field span-2"
              ><span>Descrição</span
              ><input name="description" [(ngModel)]="form.description" maxlength="300"
            /></label>
            <label class="field"
              ><span>Categoria</span>
              <select name="category" [(ngModel)]="form.category">
                @for (c of categoryKeys; track c) {
                  <option [value]="c">{{ categories[c] }}</option>
                }
              </select>
            </label>
            <label class="field"
              ><span>Preço (AOA)</span
              ><input
                type="number"
                name="unitPrice"
                min="0"
                step="0.01"
                [(ngModel)]="form.unitPrice"
            /></label>
            <label class="field"
              ><span>IVA (%)</span
              ><input type="number" name="vatRate" min="0" max="100" [(ngModel)]="form.vatRate"
            /></label>
            @if (+form.vatRate === 0) {
              <label class="field span-2"
                ><span>Motivo da isenção de IVA</span
                ><input name="exemption" [(ngModel)]="form.vatExemptionReason" maxlength="200"
              /></label>
            }
          </div>
          <div class="form-actions">
            @if (editing()) {
              <button class="btn btn-secondary" type="button" (click)="reset()">Cancelar</button>
            }
            <button class="btn btn-primary" type="submit" [disabled]="busy()">
              {{ editing() ? 'Guardar' : 'Criar preço' }}
            </button>
          </div>
        </form>
      }
      <div class="filters card">
        <label class="field"
          ><span>Pesquisar</span><input name="search" [(ngModel)]="search" (ngModelChange)="load()"
        /></label>
      </div>
      <div class="card table-card">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Descrição</th>
                <th scope="col">Categoria</th>
                <th scope="col" class="num">Preço</th>
                <th scope="col" class="num">IVA</th>
                <th scope="col"><span class="visually-hidden">Acções</span></th>
              </tr>
            </thead>
            <tbody>
              @for (p of prices(); track p.id) {
                <tr [class.inactive]="!p.active">
                  <td>
                    <code>{{ p.code }}</code>
                  </td>
                  <td>{{ p.description }}</td>
                  <td>{{ categories[p.category] }}</td>
                  <td class="num">{{ p.unitPrice | currency: 'AOA' }}</td>
                  <td class="num" [title]="p.vatExemptionReason ?? ''">{{ p.vatRate }}%</td>
                  <td class="actions">
                    @if (canManage()) {
                      <button class="btn btn-small btn-secondary" type="button" (click)="edit(p)">
                        Editar
                      </button>
                      <button
                        class="btn btn-small btn-secondary"
                        type="button"
                        [disabled]="busy()"
                        (click)="toggle(p)"
                      >
                        {{ p.active ? 'Desactivar' : 'Activar' }}
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">Nenhum preço.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: `
    .card {
      margin-bottom: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
    .num {
      text-align: right;
      white-space: nowrap;
    }
    .inactive {
      opacity: 0.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceCatalog implements OnInit {
  private readonly financial = inject(FinancialService);
  private readonly auth = inject(AuthService);

  protected readonly categories = CATEGORY_LABELS;
  protected readonly categoryKeys = Object.keys(CATEGORY_LABELS) as ServiceCategory[];
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.priceManage));
  protected readonly prices = signal<ServicePrice[]>([]);
  protected readonly editing = signal<ServicePrice | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected search = '';
  protected form = this.empty();

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.financial.prices({ search: this.search }).subscribe({
      next: (list) => this.prices.set(list),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected edit(p: ServicePrice): void {
    this.editing.set(p);
    this.form = {
      code: p.code,
      description: p.description,
      category: p.category,
      unitPrice: p.unitPrice,
      vatRate: p.vatRate,
      vatExemptionReason: p.vatExemptionReason ?? '',
    };
  }

  protected reset(): void {
    this.editing.set(null);
    this.form = this.empty();
  }

  protected save(): void {
    const editing = this.editing();
    const request: ServicePriceRequest = {
      ...this.form,
      unitPrice: Number(this.form.unitPrice),
      vatRate: Number(this.form.vatRate),
      vatExemptionReason: this.form.vatExemptionReason.trim() || null,
      version: editing?.version ?? null,
    };
    this.busy.set(true);
    this.error.set(null);
    (editing
      ? this.financial.updatePrice(editing.id, request)
      : this.financial.createPrice(request)
    ).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set(editing ? 'Preço guardado.' : 'Preço criado.');
        this.reset();
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }

  protected toggle(p: ServicePrice): void {
    this.busy.set(true);
    this.financial.setPriceActive(p.id, !p.active).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }

  private empty() {
    return {
      code: '',
      description: '',
      category: 'CONSULTATION' as ServiceCategory,
      unitPrice: 0,
      vatRate: 0,
      vatExemptionReason: '',
    };
  }
}
