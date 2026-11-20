import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { areasFor } from '../../core/navigation/navigation';

@Component({
  selector: 'app-home',
  template: `
    @if (areas().length === 0) {
      <section class="empty-home">
        <span class="empty-home__icon" aria-hidden="true">+</span>
        <h1>Bem-vindo ao Ngola Health</h1>
        <p>Os módulos do seu perfil ainda não estão disponíveis.</p>
      </section>
    } @else {
      <section class="loading-home" aria-live="polite">
        <span class="loading-home__spinner" aria-hidden="true"></span>
        <p>A abrir {{ areas()[0].label }}...</p>
      </section>
    }
  `,
  styles: `
    .empty-home,
    .loading-home {
      display: grid;
      min-height: 55vh;
      align-content: center;
      justify-items: center;
      text-align: center;
    }

    .empty-home__icon {
      display: grid;
      width: 3rem;
      height: 3rem;
      place-items: center;
      color: #087264;
      background: #e7f4f1;
      border-radius: 1rem;
      font-size: 2rem;
      font-weight: 400;
      line-height: 1;
    }

    h1 {
      margin: 1.1rem 0 0.4rem;
      color: #172b35;
      font-size: 1.5rem;
    }

    p {
      margin: 0;
      color: #74828a;
    }

    .loading-home {
      grid-auto-rows: max-content;
      align-content: center;
      gap: 0.8rem;
    }

    .loading-home__spinner {
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid #d5eae5;
      border-top-color: #0e8979;
      border-radius: 50%;
      animation: spin 700ms linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly areas = computed(() => areasFor((roles) => this.auth.hasAnyRole(roles)));

  ngOnInit(): void {
    const firstArea = this.areas()[0];
    if (firstArea) void this.router.navigateByUrl(firstArea.path, { replaceUrl: true });
  }
}
