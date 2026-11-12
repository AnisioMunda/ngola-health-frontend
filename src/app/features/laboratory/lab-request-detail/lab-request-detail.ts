import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import {
  FLAG_LABELS,
  ITEM_STATUS_LABELS,
  LAB_STATUS_LABELS,
  LabItem,
  LabRequest,
  referenceLabel,
} from '../data/lab.model';
import { LabService } from '../data/lab.service';

interface Draft {
  numericValue: number | null;
  textValue: string;
  abnormal: boolean;
  notes: string;
  reason: string;
}

/** Pedido de exames: colheita, análise, resultados, validação e correcções, conforme o perfil. */
@Component({
  selector: 'app-lab-request-detail',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './lab-request-detail.html',
  styleUrl: './lab-request-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabRequestDetail implements OnInit {
  private readonly lab = inject(LabService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly statusLabels = LAB_STATUS_LABELS;
  protected readonly itemLabels = ITEM_STATUS_LABELS;
  protected readonly flagLabels = FLAG_LABELS;
  protected readonly reference = referenceLabel;
  protected readonly request = signal<LabRequest | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Item em correcção (formulário com motivo aberto). */
  protected readonly amending = signal<string | null>(null);
  protected drafts: Record<string, Draft> = {};
  protected collectionNotes = '';

  private readonly isTech = computed(() => this.auth.hasAnyRole(ACCESS.labTechnician));
  private readonly status = computed(() => this.request()?.status);
  protected readonly canCollect = computed(
    () => this.status() === 'PENDING' && this.auth.hasAnyRole(ACCESS.labCollect),
  );
  protected readonly canStart = computed(() => this.status() === 'COLLECTED' && this.isTech());
  protected readonly canEnterResults = computed(
    () => this.status() === 'IN_ANALYSIS' && this.isTech(),
  );
  protected readonly canAmend = computed(() => this.status() !== 'CANCELLED' && this.isTech());
  protected readonly canCancel = computed(() => {
    const s = this.status();
    return !!s && s !== 'COMPLETED' && s !== 'CANCELLED' && this.auth.hasAnyRole(ACCESS.labRequest);
  });
  protected readonly canAudit = computed(() => this.auth.hasAnyRole(ACCESS.audit));

  ngOnInit(): void {
    this.lab.view(this.id()).subscribe({
      next: (r) => this.set(r),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  collect(): void {
    this.run(this.lab.collect(this.id(), this.collectionNotes.trim() || null));
  }

  start(): void {
    this.run(this.lab.start(this.id()));
  }

  saveResult(item: LabItem): void {
    const d = this.drafts[item.id];
    if (!this.complete(item, d)) return;
    this.run(this.lab.result(this.id(), item.id, this.input(item, d)));
  }

  validate(item: LabItem): void {
    this.run(this.lab.validate(this.id(), item.id));
  }

  saveAmendment(item: LabItem): void {
    const d = this.drafts[item.id];
    if (!this.complete(item, d)) return;
    if (!d.reason.trim()) {
      this.error.set('Indique o motivo da correcção.');
      return;
    }
    this.run(
      this.lab.amend(this.id(), item.id, { ...this.input(item, d), reason: d.reason.trim() }),
    );
  }

  cancel(): void {
    const reason = prompt('Motivo do cancelamento:');
    if (reason === null) return;
    if (!reason.trim()) {
      this.error.set('Indique o motivo do cancelamento.');
      return;
    }
    this.run(this.lab.cancel(this.id(), reason.trim()));
  }

  print(): void {
    window.print();
  }

  protected canEdit(item: LabItem): boolean {
    return this.canEnterResults() && (item.status === 'PENDING' || item.status === 'RESULTED');
  }

  private complete(item: LabItem, d: Draft): boolean {
    const ok =
      item.resultType === 'NUMERIC'
        ? d.numericValue !== null && `${d.numericValue}` !== ''
        : !!d.textValue.trim();
    if (!ok) this.error.set(`Indique o resultado de ${item.testName}.`);
    return ok;
  }

  private input(item: LabItem, d: Draft) {
    return {
      numericValue: item.resultType === 'NUMERIC' ? Number(d.numericValue) : null,
      textValue: item.resultType === 'QUALITATIVE' ? d.textValue.trim() : null,
      abnormal: d.abnormal,
      notes: d.notes.trim() || null,
    };
  }

  private set(r: LabRequest): void {
    this.request.set(r);
    this.amending.set(null);
    this.drafts = Object.fromEntries(
      r.items.map((i) => [
        i.id,
        {
          numericValue: i.numericValue,
          textValue: i.textValue ?? '',
          abnormal: i.flag === 'ABNORMAL',
          notes: i.resultNotes ?? '',
          reason: '',
        },
      ]),
    );
  }

  private run(action: Observable<LabRequest>): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    action.subscribe({
      next: (r) => {
        this.set(r);
        this.busy.set(false);
      },
      error: (err: unknown) => {
        const e = toApiError(err);
        const fields = Object.values(e.fieldErrors);
        this.error.set(fields.length ? `${e.message} ${fields.join(' ')}` : e.message);
        this.busy.set(false);
      },
    });
  }
}
