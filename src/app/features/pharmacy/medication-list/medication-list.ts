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
import { FORM_LABELS, Medication, StockAlerts } from '../data/pharmacy.model';
import { PharmacyService } from '../data/pharmacy.service';

@Component({
  selector: 'app-medication-list',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './medication-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationList implements OnInit {
  private readonly pharmacy = inject(PharmacyService);
  private readonly auth = inject(AuthService);
  private request?: Subscription;

  protected readonly forms = FORM_LABELS;
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.catalogManage));
  protected readonly isPharmacist = computed(() => this.auth.hasAnyRole(ACCESS.pharmacist));
  protected readonly result = signal<Page<Medication> | null>(null);
  protected readonly alerts = signal<StockAlerts | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected searchTerm = '';
  protected status: 'active' | 'inactive' | 'all' = 'active';
  private page = 0;

  ngOnInit(): void {
    this.load();
    this.pharmacy.alerts().subscribe({ next: (a) => this.alerts.set(a) });
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
    this.request = this.pharmacy
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
