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
  LabTest,
  LabTestRequest,
  ResultType,
  SAMPLE_LABELS,
  SampleType,
  TestCategory,
  referenceLabel,
} from '../data/lab.model';
import { LabService } from '../data/lab.service';

const EMPTY: LabTestRequest = {
  code: '',
  name: '',
  category: 'HEMATOLOGY',
  sampleType: 'BLOOD',
  resultType: 'NUMERIC',
  unit: null,
  referenceLow: null,
  referenceHigh: null,
  referenceText: null,
  turnaroundHours: 24,
  version: null,
};

/** Catálogo de exames (edição para técnicos de laboratório e ADMIN). */
@Component({
  selector: 'app-lab-catalog',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <a class="btn-link back" routerLink="/lab">← Laboratório</a>
          <h1>Catálogo de exames</h1>
          <p class="muted">
            Alterar um exame não altera pedidos já feitos (guardam os valores de referência da
            altura).
          </p>
        </div>
        @if (canManage() && !editing()) {
          <button class="btn btn-primary" type="button" (click)="edit(null)">Novo exame</button>
        }
      </header>
      @if (error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
      }
      @if (editing()) {
        <div class="card form">
          <div class="grid">
            <label class="field"
              ><span>Código *</span><input [(ngModel)]="draft.code" name="code" maxlength="30"
            /></label>
            <label class="field span-2"
              ><span>Nome *</span><input [(ngModel)]="draft.name" name="name" maxlength="200"
            /></label>
            <label class="field"
              ><span>Categoria</span>
              <select [(ngModel)]="draft.category" name="category">
                @for (c of categoryOptions; track c[0]) {
                  <option [value]="c[0]">{{ c[1] }}</option>
                }
              </select>
            </label>
            <label class="field"
              ><span>Amostra</span>
              <select [(ngModel)]="draft.sampleType" name="sampleType">
                @for (s of sampleOptions; track s[0]) {
                  <option [value]="s[0]">{{ s[1] }}</option>
                }
              </select>
            </label>
            <label class="field"
              ><span>Tipo de resultado</span>
              <select [(ngModel)]="draft.resultType" name="resultType">
                <option value="NUMERIC">Numérico</option>
                <option value="QUALITATIVE">Qualitativo</option>
              </select>
            </label>
            @if (draft.resultType === 'NUMERIC') {
              <label class="field"
                ><span>Unidade</span><input [(ngModel)]="draft.unit" name="unit" maxlength="30"
              /></label>
              <label class="field"
                ><span>Ref. mínimo</span
                ><input type="number" step="any" [(ngModel)]="draft.referenceLow" name="low"
              /></label>
              <label class="field"
                ><span>Ref. máximo</span
                ><input type="number" step="any" [(ngModel)]="draft.referenceHigh" name="high"
              /></label>
            } @else {
              <label class="field span-2"
                ><span>Referência</span
                ><input [(ngModel)]="draft.referenceText" name="refText" placeholder="Negativo"
              /></label>
            }
            <label class="field"
              ><span>Prazo (horas)</span
              ><input type="number" min="1" [(ngModel)]="draft.turnaroundHours" name="tat"
            /></label>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" (click)="editing.set(false)">
              Cancelar
            </button>
            <button class="btn btn-primary" type="button" [disabled]="busy()" (click)="save()">
              Guardar
            </button>
          </div>
        </div>
      }
      <div class="card table-card">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Exame</th>
                <th scope="col">Categoria</th>
                <th scope="col">Amostra</th>
                <th scope="col">Referência</th>
                <th scope="col">Prazo</th>
                @if (canManage()) {
                  <th scope="col"><span class="visually-hidden">Acções</span></th>
                }
              </tr>
            </thead>
            <tbody>
              @for (t of tests(); track t.id) {
                <tr [class.inactive]="!t.active">
                  <td>
                    <strong>{{ t.name }}</strong
                    ><span class="subtext">{{ t.code }}{{ t.active ? '' : ' · desactivado' }}</span>
                  </td>
                  <td>{{ categories[t.category] }}</td>
                  <td>{{ samples[t.sampleType] }}</td>
                  <td>{{ reference(t) }}</td>
                  <td>{{ t.turnaroundHours }} h</td>
                  @if (canManage()) {
                    <td class="actions">
                      <button class="btn btn-small btn-secondary" type="button" (click)="edit(t)">
                        Editar
                      </button>
                      <button class="btn btn-small btn-secondary" type="button" (click)="toggle(t)">
                        {{ t.active ? 'Desactivar' : 'Reactivar' }}
                      </button>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">Catálogo vazio.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: `
    .form {
      margin-bottom: var(--space-4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabCatalog implements OnInit {
  private readonly lab = inject(LabService);
  private readonly auth = inject(AuthService);

  protected readonly categories = CATEGORY_LABELS;
  protected readonly samples = SAMPLE_LABELS;
  protected readonly categoryOptions = Object.entries(CATEGORY_LABELS) as [TestCategory, string][];
  protected readonly sampleOptions = Object.entries(SAMPLE_LABELS) as [SampleType, string][];
  protected readonly reference = referenceLabel;
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.labCatalog));
  protected readonly tests = signal<LabTest[]>([]);
  protected readonly editing = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected draft: LabTestRequest = { ...EMPTY };
  private editingId: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.lab.tests().subscribe({
      next: (list) => this.tests.set(list),
      error: (e: unknown) => this.error.set(toApiError(e).message),
    });
  }

  protected edit(t: LabTest | null): void {
    this.editingId = t?.id ?? null;
    this.draft = t ? { ...t, version: t.version } : { ...EMPTY };
    this.editing.set(true);
  }

  save(): void {
    if (!this.draft.code.trim() || !this.draft.name.trim()) {
      this.error.set('Indique o código e o nome.');
      return;
    }
    const request: LabTestRequest = {
      ...this.draft,
      resultType: this.draft.resultType as ResultType,
      unit: this.draft.unit?.trim() || null,
      referenceText: this.draft.referenceText?.trim() || null,
    };
    this.busy.set(true);
    this.error.set(null);
    (this.editingId
      ? this.lab.updateTest(this.editingId, request)
      : this.lab.createTest(request)
    ).subscribe({
      next: () => {
        this.busy.set(false);
        this.editing.set(false);
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        const e = toApiError(err);
        const fields = Object.values(e.fieldErrors);
        this.error.set(fields.length ? `${e.message} ${fields.join(' ')}` : e.message);
      },
    });
  }

  protected toggle(t: LabTest): void {
    this.lab.setTestActive(t.id, !t.active).subscribe({
      next: () => this.load(),
      error: (e: unknown) => this.error.set(toApiError(e).message),
    });
  }
}
