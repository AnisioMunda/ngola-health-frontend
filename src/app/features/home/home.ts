import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { areasFor } from '../../core/navigation/navigation';

/** Página inicial: um cartão por área a que o perfil tem acesso (mesma fonte do menu). */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Olá, {{ user()?.fullName }}</h1>
          <p class="muted">{{ user()?.hospitalName ?? 'Administração da plataforma' }}</p>
        </div>
      </header>
      <div class="tiles">
        @for (area of areas(); track area.path) {
          <a class="card tile" [routerLink]="area.path">
            <strong>{{ area.label }}</strong>
            <span class="muted">{{ area.description }}</span>
          </a>
        } @empty {
          <p class="card muted">Os módulos do seu perfil ficarão disponíveis aqui.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: var(--space-4);
    }
    .tile {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      color: inherit;
      text-decoration: none;
      &:hover {
        border-color: var(--color-primary);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
  protected readonly areas = computed(() => areasFor((roles) => this.auth.hasAnyRole(roles)));
}
