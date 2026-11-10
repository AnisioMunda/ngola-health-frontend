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
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import { Hospital } from '../../hospitals/data/hospital.model';
import { HospitalService } from '../../hospitals/data/hospital.service';
import { changeRows, dayStartIso, isEdit } from '../data/audit-format';
import {
  ACTION_LABELS,
  AuditAction,
  AuditEntityType,
  AuditEvent,
  AuditOutcome,
  ENTITY_LABELS,
  OUTCOME_LABELS,
} from '../data/audit.model';
import { AuditService } from '../data/audit.service';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-audit-list',
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditList implements OnInit {
  private readonly audit = inject(AuditService);
  private readonly hospitalService = inject(HospitalService);
  private readonly auth = inject(AuthService);
  private request?: Subscription;

  /** Filtros vindos do URL (ex.: "Ver histórico" de um utilizador). */
  readonly entityType = input<AuditEntityType>();
  readonly entityId = input<string>();

  protected readonly actionLabels = ACTION_LABELS;
  protected readonly entityLabels = ENTITY_LABELS;
  protected readonly outcomeLabels = OUTCOME_LABELS;
  protected readonly actions = Object.keys(ACTION_LABELS) as AuditAction[];
  protected readonly entityTypes = Object.keys(ENTITY_LABELS) as AuditEntityType[];
  protected readonly outcomes = Object.keys(OUTCOME_LABELS) as AuditOutcome[];
  protected readonly changeRows = changeRows;
  protected readonly isEdit = isEdit;

  protected readonly isSuperAdmin = computed(() => this.auth.hasAnyRole(['SUPER_ADMIN']));
  protected readonly hospitals = signal<Hospital[]>([]);
  protected readonly result = signal<Page<AuditEvent> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly expanded = signal<string | null>(null);

  protected filters = {
    search: '',
    action: '' as AuditAction | '',
    entityType: '' as AuditEntityType | '',
    entityId: '',
    outcome: '' as AuditOutcome | '',
    hospitalId: '',
    from: '',
    to: '',
  };
  private page = 0;

  ngOnInit(): void {
    this.filters.entityType = this.entityType() ?? '';
    this.filters.entityId = this.entityId() ?? '';
    if (this.isSuperAdmin()) {
      this.hospitalService.findActive().subscribe({ next: (list) => this.hospitals.set(list) });
    }
    this.load();
  }

  protected applyFilters(): void {
    this.page = 0;
    this.load();
  }

  protected clearEntity(): void {
    this.filters.entityId = '';
    this.applyFilters();
  }

  protected goToPage(page: number): void {
    this.page = page;
    this.load();
  }

  protected toggle(event: AuditEvent): void {
    this.expanded.update((id) => (id === event.id ? null : event.id));
  }

  protected load(): void {
    const f = this.filters;
    if (f.from && f.to && f.to < f.from) {
      this.error.set('A data final não pode ser anterior à data inicial.');
      return;
    }
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.audit
      .search({
        search: f.search,
        action: f.action || undefined,
        entityType: f.entityType || undefined,
        entityId: f.entityId || undefined,
        outcome: f.outcome || undefined,
        hospitalId: f.hospitalId || undefined,
        from: f.from ? dayStartIso(f.from) : undefined,
        to: f.to ? dayStartIso(f.to, true) : undefined,
        page: this.page,
        size: PAGE_SIZE,
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
