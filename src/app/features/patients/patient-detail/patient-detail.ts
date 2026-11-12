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
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { EpisodeSummary, STATUS_LABELS, TYPE_LABELS } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import { GENDER_LABELS, Patient } from '../data/patient.model';
import { PatientService } from '../data/patient.service';

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetail implements OnInit {
  private readonly patients = inject(PatientService);
  private readonly auth = inject(AuthService);
  private readonly episodeService = inject(EpisodeService);

  readonly id = input.required<string>();

  protected readonly genderLabels = GENDER_LABELS;
  protected readonly canWrite = computed(() => this.auth.hasAnyRole(ACCESS.patientsWrite));
  protected readonly isAdmin = computed(() => this.auth.hasAnyRole(ACCESS.patientsAdmin));
  protected readonly canAudit = computed(() => this.auth.hasAnyRole(ACCESS.audit));
  protected readonly canOpenEpisode = computed(() => this.auth.hasAnyRole(ACCESS.episodesSchedule));
  protected readonly episodes = signal<EpisodeSummary[]>([]);
  protected readonly episodeTotal = signal(0);
  protected readonly typeLabels = TYPE_LABELS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly patient = signal<Patient | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(readNotice());
  protected readonly place = computed(() => {
    const p = this.patient();
    return p ? [p.municipality, p.province].filter((v) => !!v).join(', ') : '';
  });

  ngOnInit(): void {
    this.patients.view(this.id()).subscribe({
      next: (p) => {
        this.patient.set(p);
        this.loading.set(false);
        this.episodeService.search({ patientId: p.id, order: 'desc', size: 10 }).subscribe({
          next: (page) => {
            this.episodes.set(page.content);
            this.episodeTotal.set(page.totalElements);
          },
        });
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected toggleActive(): void {
    const p = this.patient();
    if (!p || this.busy()) return;
    const activate = !p.active;
    if (
      !activate &&
      !confirm(`Inactivar ${p.fullName}? A ficha clínica é preservada e pode ser reactivada.`)
    ) {
      return;
    }
    this.busy.set(true);
    this.patients.setActive(p.id, activate).subscribe({
      next: (updated) => {
        this.patient.set(updated);
        this.notice.set(activate ? 'Paciente reactivado.' : 'Paciente inactivado.');
        this.busy.set(false);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.busy.set(false);
      },
    });
  }
}

function readNotice(): string | null {
  const state: unknown = typeof history === 'undefined' ? null : history.state;
  return state && typeof state === 'object' && 'notice' in state && typeof state.notice === 'string'
    ? state.notice
    : null;
}
