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
import { Doctor } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import {
  ADMISSION_STATUS_LABELS,
  Admission,
  Bed,
  CONDITION_LABELS,
  DischargeCondition,
  Ward,
  canStillCancel,
} from '../data/inpatient.model';
import { InpatientService } from '../data/inpatient.service';

type Panel = 'transfer' | 'discharge' | 'cancel' | 'doctor' | null;

/** Internamento: dados, histórico de camas e acções (transferir, alta, anular, médico). */
@Component({
  selector: 'app-admission-detail',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './admission-detail.html',
  styles: `
    .card {
      margin-bottom: var(--space-4);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--space-3);
    }
    .details {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--space-2) var(--space-4);
      margin: 0;
    }
    dt {
      color: var(--color-muted);
    }
    dd {
      margin: 0;
      white-space: pre-line;
    }
    .transfers {
      margin: 0;
      padding-left: var(--space-4);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionDetail implements OnInit {
  private readonly inpatient = inject(InpatientService);
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly statuses = ADMISSION_STATUS_LABELS;
  protected readonly conditions = CONDITION_LABELS;
  protected readonly conditionKeys = Object.keys(CONDITION_LABELS) as DischargeCondition[];
  protected readonly a = signal<Admission | null>(null);
  protected readonly panel = signal<Panel>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly wards = signal<Ward[]>([]);
  protected readonly beds = signal<Bed[]>([]);
  protected readonly doctors = signal<Doctor[]>([]);

  protected readonly isDoctor = computed(() => this.auth.hasAnyRole(ACCESS.admit));
  protected readonly canTransfer = computed(() => this.auth.hasAnyRole(ACCESS.bedTransfer));
  protected readonly active = computed(() => this.a()?.status === 'ACTIVE');
  protected readonly cancellable = computed(() => {
    const a = this.a();
    return !!a && canStillCancel(a);
  });
  protected readonly freeBeds = computed(() =>
    this.beds().filter((b) => b.active && b.status === 'AVAILABLE'),
  );

  // Formulários dos painéis
  protected transferWard = '';
  protected transferBed = '';
  protected transferReason = '';
  protected condition: DischargeCondition = 'IMPROVED';
  protected diagnosis = '';
  protected summary = '';
  protected cancelReason = '';
  protected newDoctor = '';
  protected expected = '';

  ngOnInit(): void {
    this.load();
  }

  protected open(panel: Panel): void {
    this.error.set(null);
    this.message.set(null);
    this.panel.set(panel);
    if (panel === 'transfer' && this.wards().length === 0) {
      this.inpatient.wards().subscribe({ next: (w) => this.wards.set(w) });
    }
    if (panel === 'doctor' && this.doctors().length === 0) {
      this.episodes.doctors().subscribe({ next: (d) => this.doctors.set(d) });
    }
  }

  protected selectTransferWard(wardId: string): void {
    this.transferWard = wardId;
    this.transferBed = '';
    this.beds.set([]);
    if (wardId) this.inpatient.map(wardId).subscribe({ next: (m) => this.beds.set(m.beds) });
  }

  protected transfer(): void {
    this.act(
      this.inpatient.transfer(this.id(), this.transferBed, this.transferReason.trim()),
      'Doente transferido. A cama anterior ficou para limpeza.',
    );
  }

  protected discharge(): void {
    this.act(
      this.inpatient.discharge(this.id(), {
        condition: this.condition,
        diagnosis: this.diagnosis.trim(),
        summary: this.summary.trim() || null,
      }),
      'Alta registada: o episódio foi concluído e a cama ficou para limpeza.',
    );
  }

  protected cancel(): void {
    this.act(this.inpatient.cancel(this.id(), this.cancelReason.trim()), 'Internamento anulado.');
  }

  protected assignDoctor(): void {
    this.act(
      this.inpatient.assignDoctor(this.id(), this.newDoctor),
      'Médico responsável alterado.',
    );
  }

  protected saveExpected(): void {
    this.act(
      this.inpatient.setExpectedDischarge(this.id(), this.expected || null),
      'Alta prevista actualizada.',
    );
  }

  private act(request: Observable<Admission>, success: string): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: (a) => {
        this.busy.set(false);
        this.a.set(a);
        this.panel.set(null);
        this.message.set(success);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }

  private load(): void {
    this.inpatient.admission(this.id()).subscribe({
      next: (a) => {
        this.a.set(a);
        this.expected = a.expectedDischargeDate ?? '';
        this.newDoctor = a.responsibleDoctorId;
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }
}
