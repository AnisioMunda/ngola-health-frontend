import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { Ward } from '../../inpatient/data/inpatient.model';
import { InpatientService } from '../../inpatient/data/inpatient.service';
import {
  CATEGORY_LABELS,
  CRITICALITY_LABELS,
  Criticality,
  EquipmentCategory,
  EquipmentRequest,
} from '../data/equipment.model';
import { EquipmentService } from '../data/equipment.service';

/** Registo e edição de um equipamento (/equipment/new ou /equipment/:id/edit). */
@Component({
  selector: 'app-equipment-form',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page narrow">
      <a class="btn-link back" routerLink="/equipment">← Equipamentos</a>
      <h1>{{ id() ? 'Editar equipamento' : 'Novo equipamento' }}</h1>
      <form class="card" (ngSubmit)="save()">
        <h2>Identificação</h2>
        <div class="grid">
          <label class="field"
            ><span>Código (inventário)</span><input name="code" [(ngModel)]="f.code" maxlength="50"
          /></label>
          <label class="field span-2"
            ><span>Nome</span><input name="name" [(ngModel)]="f.name" maxlength="200"
          /></label>
          <label class="field">
            <span>Categoria</span>
            <select name="category" [(ngModel)]="f.category">
              @for (c of categoryKeys; track c) {
                <option [value]="c">{{ categories[c] }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Criticidade</span>
            <select name="criticality" [(ngModel)]="f.criticality">
              @for (c of criticalityKeys; track c) {
                <option [value]="c">{{ criticality[c] }}</option>
              }
            </select>
          </label>
          <label class="field"
            ><span>Marca</span><input name="brand" [(ngModel)]="f.brand" maxlength="100"
          /></label>
          <label class="field"
            ><span>Modelo</span><input name="model" [(ngModel)]="f.model" maxlength="100"
          /></label>
          <label class="field"
            ><span>N.º de série</span
            ><input name="serial" [(ngModel)]="f.serialNumber" maxlength="100"
          /></label>
        </div>
        <p class="muted small">
          Criticidade alta: uma avaria põe o equipamento logo fora de serviço.
        </p>

        <h2>Localização e aquisição</h2>
        <div class="grid">
          <label class="field">
            <span>Enfermaria</span>
            <select name="ward" [(ngModel)]="f.wardId">
              <option [ngValue]="null">—</option>
              @for (w of wards(); track w.id) {
                <option [ngValue]="w.id">{{ w.name }}</option>
              }
            </select>
          </label>
          <label class="field"
            ><span>Outra localização</span
            ><input name="location" [(ngModel)]="f.location" maxlength="200"
          /></label>
          <label class="field"
            ><span>Data de compra</span
            ><input type="date" name="purchaseDate" [(ngModel)]="f.purchaseDate"
          /></label>
          <label class="field"
            ><span>Valor (AOA)</span
            ><input type="number" min="0" step="0.01" name="price" [(ngModel)]="f.purchasePrice"
          /></label>
          <label class="field"
            ><span>Garantia até</span
            ><input type="date" name="warranty" [(ngModel)]="f.warrantyUntil"
          /></label>
        </div>

        <h2>Manutenção</h2>
        <div class="grid">
          <label class="field"
            ><span>Manutenção a cada (dias)</span
            ><input type="number" min="1" name="mInt" [(ngModel)]="f.maintenanceIntervalDays"
          /></label>
          <label class="field"
            ><span>Próxima manutenção</span
            ><input type="date" name="mNext" [(ngModel)]="f.nextMaintenanceDate"
          /></label>
          <label class="field"
            ><span>Calibração a cada (dias)</span
            ><input type="number" min="1" name="cInt" [(ngModel)]="f.calibrationIntervalDays"
          /></label>
          <label class="field"
            ><span>Próxima calibração</span
            ><input type="date" name="cNext" [(ngModel)]="f.nextCalibrationDate"
          /></label>
          <label class="field span-2"
            ><span>Notas</span
            ><textarea name="notes" [(ngModel)]="f.notes" rows="2" maxlength="1000"></textarea>
          </label>
        </div>
        <p class="muted small">Sem data, a próxima é calculada a partir de hoje.</p>

        @if (error(); as e) {
          <div class="alert alert-error" role="alert">{{ e }}</div>
        }
        <div class="form-actions">
          <a class="btn btn-secondary" routerLink="/equipment">Cancelar</a>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">Gravar</button>
        </div>
      </form>
    </section>
  `,
  styles: `
    h2 {
      font-size: 1rem;
      margin: var(--space-4) 0 var(--space-2);
    }
    h2:first-child {
      margin-top: 0;
    }
    .small {
      font-size: 0.85rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentForm implements OnInit {
  private readonly equipment = inject(EquipmentService);
  private readonly inpatient = inject(InpatientService);
  private readonly router = inject(Router);

  readonly id = input<string>();

  protected readonly categories = CATEGORY_LABELS;
  protected readonly categoryKeys = Object.keys(CATEGORY_LABELS) as EquipmentCategory[];
  protected readonly criticality = CRITICALITY_LABELS;
  protected readonly criticalityKeys = Object.keys(CRITICALITY_LABELS) as Criticality[];
  protected readonly wards = signal<Ward[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected f: EquipmentRequest = {
    code: '',
    name: '',
    category: 'MONITORING',
    criticality: 'MEDIUM',
    brand: null,
    model: null,
    serialNumber: null,
    wardId: null,
    location: null,
    purchaseDate: null,
    purchasePrice: null,
    warrantyUntil: null,
    maintenanceIntervalDays: null,
    nextMaintenanceDate: null,
    calibrationIntervalDays: null,
    nextCalibrationDate: null,
    notes: null,
    version: null,
  };

  ngOnInit(): void {
    this.inpatient
      .wards()
      .subscribe({ next: (w) => this.wards.set(w), error: () => this.wards.set([]) });
    const id = this.id();
    if (id) {
      this.equipment.view(id).subscribe({
        next: (e) => {
          // Só os campos do pedido (a resposta traz também histórico e campos calculados).
          const keys = Object.keys(this.f) as (keyof EquipmentRequest)[];
          this.f = Object.fromEntries(
            keys.map((k) => [k, (e as unknown as Record<string, unknown>)[k] ?? null]),
          ) as unknown as EquipmentRequest;
        },
        error: (err: unknown) => this.error.set(toApiError(err).message),
      });
    }
  }

  protected save(): void {
    const blank = (v: unknown) => (v === '' || v === undefined ? null : v);
    const request = Object.fromEntries(
      Object.entries(this.f).map(([k, v]) => [k, blank(v)]),
    ) as unknown as EquipmentRequest;
    this.saving.set(true);
    this.error.set(null);
    const id = this.id();
    (id ? this.equipment.update(id, request) : this.equipment.create(request)).subscribe({
      next: (e) => void this.router.navigate(['/equipment', e.id]),
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }
}
