import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { toApiError } from '../../../core/http/api-error';
import { Episode } from '../../episodes/data/episode.model';
import { EpisodeService } from '../../episodes/data/episode.service';
import { Patient } from '../../patients/data/patient.model';
import { PatientService } from '../../patients/data/patient.service';
import { MedicationPicker } from '../../pharmacy/medication-picker/medication-picker';
import { Medication, medicationLabel } from '../../pharmacy/data/pharmacy.model';
import { NewItem, ROUTE_LABELS, Route } from '../data/prescription.model';
import { PrescriptionService } from '../data/prescription.service';

interface Line extends NewItem {
  medication: Medication;
}

/** Prescrever num episódio em curso (/prescriptions/new?episodeId=…). */
@Component({
  selector: 'app-prescription-form',
  imports: [FormsModule, RouterLink, MedicationPicker],
  templateUrl: './prescription-form.html',
  styleUrl: './prescription-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionForm implements OnInit {
  private readonly prescriptions = inject(PrescriptionService);
  private readonly episodes = inject(EpisodeService);
  private readonly patients = inject(PatientService);
  private readonly router = inject(Router);

  readonly episodeId = input.required<string>();

  protected readonly routes = Object.entries(ROUTE_LABELS) as [Route, string][];
  protected readonly label = medicationLabel;
  protected readonly episode = signal<Episode | null>(null);
  protected readonly patient = signal<Patient | null>(null);
  protected readonly lines = signal<Line[]>([]);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected validityDays = 30;
  protected notes = '';

  ngOnInit(): void {
    this.episodes.view(this.episodeId()).subscribe({
      next: (e) => {
        this.episode.set(e);
        if (e.status !== 'IN_PROGRESS') {
          this.error.set('Só se prescreve num episódio em curso.');
        }
        this.patients.view(e.patientId).subscribe({ next: (p) => this.patient.set(p) });
      },
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected add(m: Medication): void {
    if (this.lines().some((l) => l.medicationId === m.id)) {
      this.error.set(`${medicationLabel(m)} já está na prescrição.`);
      return;
    }
    this.error.set(null);
    this.lines.update((list) => [
      ...list,
      {
        medication: m,
        medicationId: m.id,
        quantity: 1,
        dosage: `1 ${m.dispensingUnit}`,
        frequency: 'de 8 em 8 horas',
        durationDays: 7,
        route: 'ORAL',
        instructions: null,
      },
    ]);
  }

  protected remove(index: number): void {
    this.lines.update((list) => list.filter((_, i) => i !== index));
  }

  submit(): void {
    if (this.saving()) return;
    const lines = this.lines();
    if (lines.length === 0) {
      this.error.set('Adicione pelo menos um medicamento.');
      return;
    }
    const invalid = lines.find(
      (l) => !l.quantity || l.quantity < 1 || !l.dosage.trim() || !l.frequency.trim(),
    );
    if (invalid) {
      this.error.set(
        `Complete a quantidade, a dose e a frequência de ${medicationLabel(invalid.medication)}.`,
      );
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.prescriptions
      .create({
        episodeId: this.episodeId(),
        validityDays: this.validityDays || null,
        notes: this.notes.trim() || null,
        items: lines.map(({ medication: _m, ...item }) => ({
          ...item,
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          instructions: item.instructions?.trim() || null,
        })),
      })
      .subscribe({
        next: (p) => void this.router.navigate(['/prescriptions', p.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          const e = toApiError(err);
          const fields = Object.values(e.fieldErrors);
          this.error.set(fields.length ? `${e.message} ${fields.join(' ')}` : e.message);
        },
      });
  }
}
