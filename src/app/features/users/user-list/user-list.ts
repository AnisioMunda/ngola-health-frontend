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
import { ACCESS, ROLE_LABELS, Role, STAFF_ROLES } from '../../../core/auth/roles';
import { toApiError } from '../../../core/http/api-error';
import { Page } from '../../../core/http/page';
import { Hospital } from '../../hospitals/data/hospital.model';
import { HospitalService } from '../../hospitals/data/hospital.service';
import { User, UserStatus } from '../data/user.model';
import { UserService } from '../data/user.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-user-list',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './user-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserList implements OnInit {
  private readonly users = inject(UserService);
  private readonly hospitalService = inject(HospitalService);
  private readonly auth = inject(AuthService);
  private request?: Subscription;

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly isSuperAdmin = computed(() => this.auth.hasAnyRole(['SUPER_ADMIN']));
  protected readonly canManage = computed(() => this.auth.hasAnyRole(ACCESS.usersManage));
  protected readonly roleOptions = computed<Role[]>(() =>
    this.isSuperAdmin() ? ['SUPER_ADMIN', ...STAFF_ROLES] : STAFF_ROLES,
  );
  protected readonly hospitals = signal<Hospital[]>([]);
  protected readonly result = signal<Page<User> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(readNotice());
  protected readonly busyId = signal<string | null>(null);
  protected readonly currentUserId = computed(() => this.auth.user()?.id);

  protected searchTerm = '';
  protected role: Role | '' = '';
  protected status: UserStatus | '' = '';
  protected hospitalId = '';
  private page = 0;

  ngOnInit(): void {
    if (this.isSuperAdmin()) {
      this.hospitalService.findActive().subscribe({ next: (list) => this.hospitals.set(list) });
    }
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
    this.request = this.users
      .search({
        search: this.searchTerm,
        role: this.role || undefined,
        status: this.status || undefined,
        hospitalId: this.hospitalId || undefined,
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

  protected rolesOf(user: User): string {
    return user.roles.map((r) => ROLE_LABELS[r]).join(', ');
  }

  protected isLocked(user: User): boolean {
    return !!user.lockedUntil && new Date(user.lockedUntil) > new Date();
  }

  protected toggleStatus(user: User): void {
    const activate = user.status !== 'ACTIVE';
    if (
      !activate &&
      !confirm(
        `Desactivar ${user.fullName}? As sessões abertas deste utilizador terminam de imediato.`,
      )
    ) {
      return;
    }
    this.busyId.set(user.id);
    this.notice.set(null);
    this.users.setActive(user.id, activate).subscribe({
      next: (updated) => {
        this.result.update(
          (page) =>
            page && {
              ...page,
              content: page.content.map((u) => (u.id === updated.id ? updated : u)),
            },
        );
        this.notice.set(`${updated.fullName} foi ${activate ? 'activado' : 'desactivado'}.`);
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
  return state && typeof state === 'object' && 'notice' in state && typeof state.notice === 'string'
    ? state.notice
    : null;
}
