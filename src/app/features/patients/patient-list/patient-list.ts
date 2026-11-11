import { DatePipe } from '@angular/common';
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
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import { GENDER_LABELS, PatientSummary } from '../data/patient.model';
import { PatientService } from '../data/patient.service';

type StatusFilter = 'active' | 'inactive' | 'all';

@Component({
  selector: 'app-patient-list',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './patient-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientList implements OnInit {
  private readonly patients = inject(PatientService);
  private readonly auth = inject(AuthService);
  private request?: Subscription;

  protected readonly genderLabels = GENDER_LABELS;
  protected readonly canWrite = computed(() => this.auth.hasAnyRole(ACCESS.patientsWrite));
  protected readonly isAdmin = computed(() => this.auth.hasAnyRole(ACCESS.patientsAdmin));
  protected readonly result = signal<Page<PatientSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected searchTerm = '';
  protected status: StatusFilter = 'active';
  private page = 0;

  ngOnInit(): void {
    this.load();
  }

  protected applyFilters(): void {
    this.page = 0;
    this.load();
  }

  protected goToPage(page: number): void {
    this.page = page;
    this.load();
  }

  protected load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.patients
      .search({
        search: this.searchTerm,
        active: this.status === 'all' ? undefined : this.status === 'active',
        page: this.page,
        size: 20,
      })
      .subscribe({
        next: (page) => {
          this.result.set(page);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(toApiError(err).message);
          this.loading.set(false);
        },
      });
  }
}
