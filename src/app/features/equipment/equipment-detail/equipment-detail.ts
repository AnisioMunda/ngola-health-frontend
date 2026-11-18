import { CurrencyPipe, DatePipe } from '@angular/common';
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
  CATEGORY_LABELS,
  CRITICALITY_LABELS,
  Equipment,
  FAULT_STATUS_LABELS,
  MAINTENANCE_LABELS,
  MaintenanceResult,
  MaintenanceType,
  STATUS_LABELS,
} from '../data/equipment.model';
import { EquipmentService } from '../data/equipment.service';

type Panel = 'fault' | 'maintenance' | 'retire' | null;

/** Ficha do equipamento: dados, avarias, histórico de manutenção e acções. */
@Component({
  selector: 'app-equipment-detail',
  imports: [FormsModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './equipment-detail.html',
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
    }
    .history {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .history li {
      padding: var(--space-2) 0;
      border-top: 1px solid var(--color-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentDetail implements OnInit {
  private readonly equipment = inject(EquipmentService);
  private readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly categories = CATEGORY_LABELS;
  protected readonly criticality = CRITICALITY_LABELS;
  protected readonly statuses = STATUS_LABELS;
  protected readonly faultStatuses = FAULT_STATUS_LABELS;
  protected readonly types = MAINTENANCE_LABELS;
  protected readonly typeKeys = Object.keys(MAINTENANCE_LABELS) as MaintenanceType[];
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.equipmentManage));
  protected readonly e = signal<Equipment | null>(null);
  protected readonly panel = signal<Panel>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly openFaults = computed(() =>
    (this.e()?.faults ?? []).filter((f) => f.status === 'OPEN'),
  );
  protected readonly retired = computed(() => this.e()?.status === 'RETIRED');

  protected fault = { description: '', outOfService: false };
  protected m = {
    type: 'PREVENTIVE' as MaintenanceType,
    performedOn: new Date().toISOString().slice(0, 10),
    performedBy: '',
    description: '',
    partsReplaced: '',
    cost: null as number | null,
    result: 'PASSED' as MaintenanceResult,
    faultId: '' as string,
  };
  protected retireReason = '';

  ngOnInit(): void {
    this.equipment.view(this.id()).subscribe({
      next: (e) => this.e.set(e),
      error: (err: unknown) => this.error.set(toApiError(err).message),
    });
  }

  protected open(panel: Panel): void {
    this.error.set(null);
    this.message.set(null);
    this.panel.set(panel);
    if (panel === 'maintenance' && this.openFaults().length > 0) {
      this.m.type = 'CORRECTIVE';
      this.m.faultId = this.openFaults()[0].id;
    }
  }

  protected reportFault(): void {
    this.act(
      this.equipment.reportFault(this.id(), this.fault.description.trim(), this.fault.outOfService),
      'Avaria reportada. A direcção foi avisada.',
    );
    this.fault = { description: '', outOfService: false };
  }

  protected recordMaintenance(): void {
    this.act(
      this.equipment.recordMaintenance(this.id(), {
        type: this.m.type,
        performedOn: this.m.performedOn,
        performedBy: this.m.performedBy.trim(),
        description: this.m.description.trim(),
        partsReplaced: this.m.partsReplaced.trim() || null,
        cost: this.m.cost === null || (this.m.cost as unknown) === '' ? null : Number(this.m.cost),
        result: this.m.result,
        faultId: this.m.type === 'CORRECTIVE' && this.m.faultId ? this.m.faultId : null,
      }),
      'Manutenção registada.',
    );
  }

  protected sendToMaintenance(): void {
    this.act(this.equipment.sendToMaintenance(this.id()), 'Equipamento enviado para manutenção.');
  }

  protected dismiss(faultId: string): void {
    const reason = prompt('Motivo para descartar a avaria:');
    if (!reason?.trim()) return;
    this.act(this.equipment.dismissFault(faultId, reason.trim()), 'Avaria descartada.');
  }

  protected retire(): void {
    this.act(this.equipment.retire(this.id(), this.retireReason.trim()), 'Equipamento abatido.');
  }

  private act(request: Observable<Equipment>, success: string): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: (e) => {
        this.busy.set(false);
        this.e.set(e);
        this.panel.set(null);
        this.message.set(success);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }
}
