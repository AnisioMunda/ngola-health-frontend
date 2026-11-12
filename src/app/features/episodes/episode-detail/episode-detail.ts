import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Doctor, Episode, STATUS_LABELS, TYPE_LABELS, Vitals } from '../data/episode.model';
import { EpisodeService } from '../data/episode.service';

const range = (min: number, max: number) => [Validators.min(min), Validators.max(max)];

/** Ecrã do episódio: as acções disponíveis dependem do estado e do perfil. */
@Component({
  selector: 'app-episode-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, ReactiveFormsModule],
  templateUrl: './episode-detail.html',
  styleUrl: './episode-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeDetail implements OnInit {
  private readonly episodes = inject(EpisodeService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly id = input.required<string>();

  protected readonly typeLabels = TYPE_LABELS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly episode = signal<Episode | null>(null);
  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editing = signal<'vitals' | 'notes' | null>(null);

  private readonly isScheduler = computed(() => this.auth.hasAnyRole(ACCESS.episodesSchedule));
  private readonly isCare = computed(() => this.auth.hasAnyRole(ACCESS.episodesCare));
  private readonly isDoctor = computed(() => this.auth.hasAnyRole(ACCESS.episodesDoctor));
  private readonly status = computed(() => this.episode()?.status);
  protected readonly canAudit = computed(() => this.auth.hasAnyRole(ACCESS.audit));
  protected readonly canStart = computed(() => this.status() === 'SCHEDULED' && this.isCare());
  protected readonly inProgress = computed(() => this.status() === 'IN_PROGRESS');
  protected readonly canEditVitals = computed(() => this.inProgress() && this.isCare());
  protected readonly canEditNotes = computed(() => this.inProgress() && this.isDoctor());
  protected readonly canComplete = computed(() => this.inProgress() && this.isDoctor());
  protected readonly canCancel = computed(
    () =>
      (this.status() === 'SCHEDULED' && this.isScheduler()) ||
      (this.status() === 'IN_PROGRESS' && this.isDoctor()),
  );
  protected readonly canAssignDoctor = computed(
    () => (this.status() === 'SCHEDULED' || this.inProgress()) && this.isScheduler(),
  );

  readonly vitalsForm = this.fb.group({
    systolicBp: [null as number | null, range(40, 300)],
    diastolicBp: [null as number | null, range(20, 200)],
    heartRate: [null as number | null, range(20, 250)],
    respiratoryRate: [null as number | null, range(4, 80)],
    temperature: [null as number | null, range(30, 45)],
    oxygenSaturation: [null as number | null, range(50, 100)],
    weightKg: [null as number | null, range(0.3, 500)],
    heightCm: [null as number | null, range(20, 250)],
  });

  readonly notesForm = this.fb.nonNullable.group({
    symptoms: ['', Validators.maxLength(10000)],
    diagnosis: ['', Validators.maxLength(4000)],
    clinicalNotes: ['', Validators.maxLength(10000)],
  });

  ngOnInit(): void {
    this.episodes.view(this.id()).subscribe({
      next: (e) => {
        this.episode.set(e);
        this.loading.set(false);
        if (this.canAssignDoctor()) {
          this.episodes.doctors().subscribe({ next: (list) => this.doctors.set(list) });
        }
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected editVitals(): void {
    const v = this.episode()?.vitals;
    this.vitalsForm.reset({
      systolicBp: v?.systolicBp ?? null,
      diastolicBp: v?.diastolicBp ?? null,
      heartRate: v?.heartRate ?? null,
      respiratoryRate: v?.respiratoryRate ?? null,
      temperature: v?.temperature ?? null,
      oxygenSaturation: v?.oxygenSaturation ?? null,
      weightKg: v?.weightKg ?? null,
      heightCm: v?.heightCm ?? null,
    });
    this.editing.set('vitals');
  }

  protected editNotes(): void {
    const e = this.episode();
    this.notesForm.reset({
      symptoms: e?.symptoms ?? '',
      diagnosis: e?.diagnosis ?? '',
      clinicalNotes: e?.clinicalNotes ?? '',
    });
    this.editing.set('notes');
  }

  saveVitals(): void {
    const e = this.episode();
    if (!e || this.vitalsForm.invalid) {
      this.vitalsForm.markAllAsTouched();
      return;
    }
    this.run(this.episodes.recordVitals(e.id, this.vitalsForm.getRawValue() as Vitals, e.version));
  }

  saveNotes(): void {
    const e = this.episode();
    if (!e || this.notesForm.invalid) return;
    const v = this.notesForm.getRawValue();
    this.run(
      this.episodes.recordClinicalNotes(
        e.id,
        {
          symptoms: blank(v.symptoms),
          diagnosis: blank(v.diagnosis),
          clinicalNotes: blank(v.clinicalNotes),
        },
        e.version,
      ),
    );
  }

  start(): void {
    this.run(this.episodes.start(this.id()));
  }

  complete(): void {
    if (!confirm('Concluir o episódio? Depois de concluído deixa de poder ser alterado.')) return;
    this.run(this.episodes.complete(this.id()));
  }

  cancel(): void {
    const reason = prompt('Motivo do cancelamento:');
    if (reason === null) return;
    if (!reason.trim()) {
      this.error.set('Indique o motivo do cancelamento.');
      return;
    }
    this.run(this.episodes.cancel(this.id(), reason.trim()));
  }

  protected assignDoctor(doctorId: string): void {
    this.run(this.episodes.assignDoctor(this.id(), doctorId || null));
  }

  protected bmi(): number | null {
    const v = this.episode()?.vitals;
    if (!v?.weightKg || !v.heightCm) return null;
    const m = v.heightCm / 100;
    return v.weightKg / (m * m);
  }

  private run(action: Observable<Episode>): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    action.subscribe({
      next: (updated) => {
        this.episode.set(updated);
        this.editing.set(null);
        this.busy.set(false);
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

function blank(value: string): string | null {
  return value.trim() ? value.trim() : null;
}
