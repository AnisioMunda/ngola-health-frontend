import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ACCESS } from '../../core/auth/roles';

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
        @if (canPatients()) {
          <a class="card tile" routerLink="/patients">
            <strong>Pacientes</strong>
            <span class="muted">Pesquisar, registar e consultar fichas.</span>
          </a>
        }
        @if (canPatients()) {
          <a class="card tile" routerLink="/triage">
            <strong>Triagem</strong>
            <span class="muted">Fila da urgência por prioridade (Manchester).</span>
          </a>
          <a class="card tile" routerLink="/episodes">
            <strong>Episódios</strong>
            <span class="muted">Lista de trabalho: consultas, urgências e exames.</span>
          </a>
        }
        @if (canHospitals()) {
          <a class="card tile" routerLink="/hospitals">
            <strong>Hospitais</strong>
            <span class="muted">Instituições registadas na plataforma.</span>
          </a>
        }
        @if (canUsers()) {
          <a class="card tile" routerLink="/users">
            <strong>Utilizadores</strong>
            <span class="muted">Contas, perfis e senhas.</span>
          </a>
        }
        @if (canAudit()) {
          <a class="card tile" routerLink="/audit">
            <strong>Auditoria</strong>
            <span class="muted">Quem fez o quê, e quando.</span>
          </a>
        }
        @if (!canPatients() && !canHospitals() && !canUsers()) {
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
  protected readonly canPatients = computed(() => this.auth.hasAnyRole(ACCESS.patientsRead));
  protected readonly canHospitals = computed(() => this.auth.hasAnyRole(ACCESS.hospitals));
  protected readonly canUsers = computed(() => this.auth.hasAnyRole(ACCESS.usersRead));
  protected readonly canAudit = computed(() => this.auth.hasAnyRole(ACCESS.audit));
}
