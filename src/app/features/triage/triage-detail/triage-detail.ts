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
import { PatientPicker } from '../../../shared/patient-picker/patient-picker';
import { Doctor } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import { GENDER_LABELS, PatientSummary } from '../../patients/data/patient.model';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TRIAGE_STATUS_LABELS,
  Triage,
  TriagePriority,
} from '../data/triage.model';
import { TriageService } from '../data/triage.service';

@Component({
  selector: 'app-triage-detail',
  imports: [RouterLink, DatePipe, FormsModule, PatientPicker],
  templateUrl: './triage-detail.html',
  styleUrl: './triage-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TriageDetail implements OnInit {
  private readonly triage = inject(TriageService);
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly statusLabels = TRIAGE_STATUS_LABELS;
  protected readonly genderLabels = GENDER_LABELS;
  protected readonly record = signal<Triage | null>(null);
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly retriaging = signal(false);

  private readonly isStaff = computed(() => this.auth.hasAnyRole(ACCESS.triageStaff));
  private readonly status = computed(() => this.record()?.status);
  protected readonly canAudit = computed(() => this.auth.hasAnyRole(ACCESS.audit));
  protected readonly canRetriage = computed(() => this.status() === 'WAITING' && this.isStaff());
  protected readonly canCall = computed(() => this.status() === 'WAITING' && this.isStaff());
  protected readonly canLeave = computed(
    () => this.status() === 'WAITING' && this.auth.hasAnyRole(ACCESS.triageDesk),
  );
  protected readonly canIdentify = computed(
    () => !!this.record() && !this.record()!.identified && this.isStaff(),
  );
  protected readonly canClose = computed(() => this.status() === 'IN_PROGRESS' && this.isStaff());

  protected newPriority: TriagePriority | '' = '';
  protected reason = '';
  protected doctorId = '';

  ngOnInit(): void {
    this.triage.view(this.id()).subscribe({
      next: (t) => {
        this.record.set(t);
        this.loading.set(false);
        if (this.isStaff()) {
          this.episodes.doctors().subscribe({ next: (list) => this.doctors.set(list) });
        }
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  saveRetriage(): void {
    if (!this.newPriority || !this.reason.trim()) {
      this.error.set('Seleccione a nova prioridade e indique o motivo.');
      return;
    }
    this.run(this.triage.changePriority(this.id(), this.newPriority, this.reason.trim()), () => {
      this.retriaging.set(false);
      this.newPriority = '';
      this.reason = '';
    });
  }

  protected identify(p: PatientSummary): void {
    if (!confirm(`Confirmar que o doente é ${p.fullName} (processo ${p.recordNumber})?`)) return;
    this.run(this.triage.identify(this.id(), p.id));
  }

  call(): void {
    this.run(this.triage.call(this.id()));
  }

  openEpisode(): void {
    this.run(this.triage.openEpisode(this.id(), this.doctorId || null));
  }

  complete(): void {
    if (
      !confirm('Concluir a triagem sem abrir episódio (ex.: doente orientado para outro serviço)?')
    )
      return;
    this.run(this.triage.complete(this.id()));
  }

  left(): void {
    if (!confirm('O doente saiu sem ser atendido?')) return;
    this.run(this.triage.left(this.id()));
  }

  private run(action: Observable<Triage>, after?: () => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    action.subscribe({
      next: (t) => {
        this.record.set(t);
        this.busy.set(false);
        after?.();
      },
      error: (err: unknown) => {
        const apiError = toApiError(err);
        const fields = Object.values(apiError.fieldErrors);
        this.error.set(
          fields.length ? `${apiError.message} ${fields.join(' ')}` : apiError.message,
        );
        this.busy.set(false);
      },
    });
  }
}
