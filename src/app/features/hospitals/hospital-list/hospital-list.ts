import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import { HOSPITAL_TYPE_LABELS, Hospital } from '../data/hospital.model';
import { HospitalService } from '../data/hospital.service';

export type StatusFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-hospital-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './hospital-list.html',
  styleUrl: './hospital-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalList implements OnInit {
  private readonly hospitals = inject(HospitalService);
  private request?: Subscription;

  protected readonly typeLabels = HOSPITAL_TYPE_LABELS;
  protected readonly result = signal<Page<Hospital> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  /** Mensagem de sucesso vinda do formulário (via history.state). */
  protected readonly notice = signal<string | null>(readNotice());
  /** Id do hospital cujo estado está a ser alterado (desactiva o botão). */
  protected readonly busyId = signal<string | null>(null);

  protected searchTerm = '';
  protected status: StatusFilter = 'all';
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
    this.request = this.hospitals
      .search({
        search: this.searchTerm,
        active: this.status === 'all' ? undefined : this.status === 'active',
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

  protected toggleStatus(hospital: Hospital): void {
    const activate = !hospital.active;
    if (
      !activate &&
      !confirm(
        `Desactivar "${hospital.name}"? Os utilizadores deste hospital deixam de o poder seleccionar. ` +
          'Os registos existentes são preservados.',
      )
    ) {
      return;
    }
    this.busyId.set(hospital.id);
    this.notice.set(null);
    this.hospitals.setActive(hospital.id, activate).subscribe({
      next: (updated) => {
        this.result.update(
          (page) =>
            page && {
              ...page,
              content: page.content.map((h) => (h.id === updated.id ? updated : h)),
            },
        );
        this.notice.set(`${updated.name} foi ${activate ? 'activado' : 'desactivado'}.`);
        this.busyId.set(null);
      },
      error: (err: unknown) => {
        this.error.set(toApiError(err).message);
        this.busyId.set(null);
      },
    });
  }
}

function readNotice(): string | null {
  const state: unknown = typeof history === 'undefined' ? null : history.state;
  if (state && typeof state === 'object' && 'notice' in state && typeof state.notice === 'string') {
    return state.notice;
  }
  return null;
}
