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

import { AuthService } from '../../../core/auth/auth.service';
import { ACCESS } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import {
  CATEGORY_LABELS,
  CRITICALITY_LABELS,
  EquipmentCategory,
  EquipmentOverview,
  EquipmentStatus,
  EquipmentSummary,
  Fault,
  STATUS_LABELS,
} from '../data/equipment.model';
import { EquipmentService } from '../data/equipment.service';

type Tab = 'all' | 'due' | 'faults';

/** Inventário com três vistas: todos, manutenções a vencer e avarias em aberto. */
@Component({
  selector: 'app-equipment-list',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './equipment-list.html',
  styles: `
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }
    .tile {
      display: flex;
      flex-direction: column;
    }
    .tile .value {
      font-size: 1.6rem;
      font-weight: 700;
    }
    .tabs {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }
    .tabs button[aria-selected='true'] {
      background: var(--color-primary-soft);
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentList implements OnInit {
  private readonly equipment = inject(EquipmentService);
  private readonly auth = inject(AuthService);

  /** ?due=true (ligação da notificação) abre a vista "A vencer". */
  readonly due = input<string>();

  protected readonly categories = CATEGORY_LABELS;
  protected readonly categoryKeys = Object.keys(CATEGORY_LABELS) as EquipmentCategory[];
  protected readonly criticality = CRITICALITY_LABELS;
  protected readonly statuses = STATUS_LABELS;
  protected readonly statusKeys = Object.keys(STATUS_LABELS) as EquipmentStatus[];
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.equipmentManage));
  protected readonly tab = signal<Tab>('all');
  protected readonly overview = signal<EquipmentOverview | null>(null);
  protected readonly items = signal<EquipmentSummary[] | null>(null);
  protected readonly total = signal(0);
  protected readonly faults = signal<Fault[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected search = '';
  protected status: EquipmentStatus | '' = '';
  protected category: EquipmentCategory | '' = '';

  ngOnInit(): void {
    this.equipment.overview().subscribe({ next: (o) => this.overview.set(o) });
    this.select(this.due() === 'true' ? 'due' : 'all');
  }

  protected select(tab: Tab): void {
    this.tab.set(tab);
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    const fail = (err: unknown) => this.error.set(toApiError(err).message);
    switch (this.tab()) {
      case 'all':
        this.items.set(null);
        this.equipment
          .search({
            search: this.search,
            status: this.status || null,
            category: this.category || null,
            includeRetired: this.status === 'RETIRED',
          })
          .subscribe({
            next: (p) => {
              this.items.set(p.content);
              this.total.set(p.totalElements);
            },
            error: fail,
          });
        break;
      case 'due':
        this.items.set(null);
        this.equipment.due(30).subscribe({
          next: (list) => {
            this.items.set(list);
            this.total.set(list.length);
          },
          error: fail,
        });
        break;
      case 'faults':
        this.equipment.openFaults().subscribe({ next: (f) => this.faults.set(f), error: fail });
        break;
    }
  }
}
