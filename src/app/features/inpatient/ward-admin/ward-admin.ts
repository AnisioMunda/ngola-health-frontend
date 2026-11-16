import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { toApiError } from '../../../core/http/api-error';
import {
  BED_STATUS_LABELS,
  BED_TYPE_LABELS,
  Bed,
  BedType,
  GENDER_POLICY_LABELS,
  GenderPolicy,
  WARD_TYPE_LABELS,
  Ward,
  WardType,
} from '../data/inpatient.model';
import { InpatientService } from '../data/inpatient.service';

/** Gestão de enfermarias e camas (administração e direcção). */
@Component({
  selector: 'app-ward-admin',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/inpatient">← Internamento</a>
          <h1>Enfermarias e camas</h1>
        </div>
      </header>
      @if (message(); as m) {
        <div class="alert alert-success" role="status">{{ m }}</div>
      }
      @if (error(); as e) {
        <div class="alert alert-error" role="alert">{{ e }}</div>
      }

      <form class="card" (ngSubmit)="saveWard()">
        <h2>{{ editing() ? 'Editar enfermaria' : 'Nova enfermaria' }}</h2>
        <div class="grid">
          <label class="field"
            ><span>Código</span><input name="code" [(ngModel)]="form.code" maxlength="20"
          /></label>
          <label class="field"
            ><span>Nome</span><input name="name" [(ngModel)]="form.name" maxlength="100"
          /></label>
          <label class="field"
            ><span>Tipo</span>
            <select name="type" [(ngModel)]="form.type">
              @for (t of wardTypeKeys; track t) {
                <option [value]="t">{{ wardTypes[t] }}</option>
              }
            </select>
          </label>
          <label class="field"
            ><span>Doentes</span>
            <select name="gender" [(ngModel)]="form.genderPolicy">
              @for (g of genderKeys; track g) {
                <option [value]="g">{{ genders[g] }}</option>
              }
            </select>
          </label>
          <label class="field"
            ><span>Piso</span><input name="floor" [(ngModel)]="form.floor" maxlength="20"
          /></label>
        </div>
        <div class="form-actions">
          @if (editing()) {
            <button class="btn btn-secondary" type="button" (click)="resetForm()">Cancelar</button>
          }
          <button class="btn btn-primary" type="submit" [disabled]="busy()">
            {{ editing() ? 'Guardar' : 'Criar enfermaria' }}
          </button>
        </div>
      </form>

      @for (w of wards(); track w.id) {
        <div class="card ward" [class.inactive]="!w.active">
          <div class="ward-head">
            <h2>
              {{ w.name }} <code>{{ w.code }}</code>
              @if (!w.active) {
                <span class="badge">Desactivada</span>
              }
            </h2>
            <div class="actions">
              <button class="btn btn-small btn-secondary" type="button" (click)="edit(w)">
                Editar
              </button>
              <button
                class="btn btn-small btn-secondary"
                type="button"
                [disabled]="busy()"
                (click)="toggleWard(w)"
              >
                {{ w.active ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
          </div>
          <p class="muted">
            {{ wardTypes[w.type] }} · {{ genders[w.genderPolicy] }} · {{ w.beds }} cama(s)
          </p>
          <ul class="bed-list">
            @for (b of beds()[w.id] ?? []; track b.id) {
              <li [class.inactive]="!b.active">
                Cama {{ b.code }} · {{ bedTypes[b.type] }} · {{ bedStatuses[b.status] }}
                <button
                  class="btn btn-small btn-secondary"
                  type="button"
                  [disabled]="busy() || b.status === 'OCCUPIED'"
                  (click)="toggleBed(w, b)"
                >
                  {{ b.active ? 'Desactivar' : 'Activar' }}
                </button>
              </li>
            }
          </ul>
          @if (w.active) {
            <form class="add-bed" (ngSubmit)="addBed(w)">
              <label class="field"
                ><span>Nova cama</span
                ><input
                  [name]="'bed-' + w.id"
                  [(ngModel)]="newBed[w.id]"
                  maxlength="10"
                  placeholder="Nº"
              /></label>
              <label class="field"
                ><span>Tipo</span>
                <select [name]="'bedType-' + w.id" [(ngModel)]="newBedType[w.id]">
                  @for (t of bedTypeKeys; track t) {
                    <option [value]="t">{{ bedTypes[t] }}</option>
                  }
                </select>
              </label>
              <button
                class="btn btn-small btn-secondary"
                type="submit"
                [disabled]="busy() || !newBed[w.id]"
              >
                Adicionar
              </button>
            </form>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .card {
      margin-bottom: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0;
    }
    form.card h2 {
      margin-bottom: var(--space-3);
    }
    .ward-head,
    .bed-list li,
    .add-bed {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }
    .add-bed {
      justify-content: flex-start;
      align-items: flex-end;
    }
    .bed-list {
      list-style: none;
      margin: var(--space-2) 0;
      padding: 0;
    }
    .bed-list li {
      padding: var(--space-1) 0;
      border-top: 1px solid var(--color-border);
    }
    .inactive {
      opacity: 0.6;
    }
    .actions {
      display: flex;
      gap: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WardAdmin implements OnInit {
  private readonly inpatient = inject(InpatientService);

  protected readonly wardTypes = WARD_TYPE_LABELS;
  protected readonly wardTypeKeys = Object.keys(WARD_TYPE_LABELS) as WardType[];
  protected readonly genders = GENDER_POLICY_LABELS;
  protected readonly genderKeys = Object.keys(GENDER_POLICY_LABELS) as GenderPolicy[];
  protected readonly bedTypes = BED_TYPE_LABELS;
  protected readonly bedTypeKeys = Object.keys(BED_TYPE_LABELS) as BedType[];
  protected readonly bedStatuses = BED_STATUS_LABELS;
  protected readonly wards = signal<Ward[]>([]);
  protected readonly beds = signal<Record<string, Bed[]>>({});
  protected readonly editing = signal<Ward | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly newBed: Record<string, string> = {};
  protected readonly newBedType: Record<string, BedType> = {};
  protected form = this.emptyForm();

  ngOnInit(): void {
    this.load();
  }

  protected edit(w: Ward): void {
    this.editing.set(w);
    this.form = {
      code: w.code,
      name: w.name,
      type: w.type,
      genderPolicy: w.genderPolicy,
      floor: w.floor ?? '',
    };
  }

  protected resetForm(): void {
    this.editing.set(null);
    this.form = this.emptyForm();
  }

  protected saveWard(): void {
    const editing = this.editing();
    const request = {
      ...this.form,
      floor: this.form.floor.trim() || null,
      notes: editing?.notes ?? null,
      version: editing?.version ?? null,
    };
    this.run(
      editing ? this.inpatient.updateWard(editing.id, request) : this.inpatient.createWard(request),
      editing ? 'Enfermaria guardada.' : 'Enfermaria criada.',
      () => this.resetForm(),
    );
  }

  protected toggleWard(w: Ward): void {
    this.run(
      this.inpatient.setWardActive(w.id, !w.active),
      w.active ? 'Enfermaria desactivada.' : 'Enfermaria activada.',
    );
  }

  protected addBed(w: Ward): void {
    this.run(
      this.inpatient.createBed(w.id, this.newBed[w.id].trim(), this.newBedType[w.id] ?? 'STANDARD'),
      'Cama adicionada.',
      () => (this.newBed[w.id] = ''),
    );
  }

  protected toggleBed(w: Ward, b: Bed): void {
    this.run(
      this.inpatient.setBedActive(b.id, !b.active),
      b.active ? 'Cama desactivada.' : 'Cama activada.',
    );
  }

  private run(request: Observable<unknown>, success: string, after?: () => void): void {
    this.busy.set(true);
    this.error.set(null);
    this.message.set(null);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set(success);
        after?.();
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }

  private load(): void {
    this.inpatient.wards(true).subscribe({
      next: (list) => {
        this.wards.set(list);
        for (const w of list) {
          this.inpatient.map(w.id, true).subscribe({
            next: (m) => this.beds.update((all) => ({ ...all, [w.id]: m.beds })),
          });
        }
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  private emptyForm() {
    return {
      code: '',
      name: '',
      type: 'GENERAL' as WardType,
      genderPolicy: 'MIXED' as GenderPolicy,
      floor: '',
    };
  }
}
