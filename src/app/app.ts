import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { SystemStatusService } from './core/system/system-status.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Indicador provisório da fundação; será substituído pelo layout no módulo de autenticação.
  protected readonly backendStatus = toSignal(inject(SystemStatusService).checkBackend());
}
